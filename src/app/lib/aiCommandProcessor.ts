/**
 * AI Command Processor
 *
 * Processes natural language questions against the current release context.
 * Uses the same Ollama / swap-path pattern as prdPipeline.ts.
 *
 * Swap path:
 *   Local dev  → callLLM() → Ollama localhost:11434
 *   Production → callLLM() → /api/llm Vercel route → OpenAI / Groq
 *   Only callLLM() + OLLAMA_URL/MODEL change.  Zero other code needed.
 */

import type { Release, TeamMember } from '../data/mockData';

// ── LLM adapter — env-aware: Ollama locally, Groq edge fn on Vercel ──────

const IS_DEV     = import.meta.env.DEV;
const OLLAMA_URL = 'http://localhost:11434/api/chat';
const GROQ_URL   = '/api/ai';
const MODEL      = IS_DEV ? 'llama3.2:3b' : 'llama-3.1-8b-instant';

async function callLLM(systemPrompt: string, userContent: string): Promise<string> {
  const url = IS_DEV ? OLLAMA_URL : GROQ_URL;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userContent  },
      ],
      stream: false,
      options: { temperature: 0, top_p: 0.9, num_predict: 512, num_ctx: 3000 },
    }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${res.statusText}`);
  const data = await res.json();
  return data.message?.content ?? '';
}

// ── JSON extraction helper ─────────────────────────────────────────────────

function extractJSON<T>(raw: string, fallback: T): T {
  const cleaned = raw
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/```\s*$/im, '')
    .trim();

  try { return JSON.parse(cleaned); } catch { /* continue */ }

  const objStart = cleaned.indexOf('{');
  const objEnd   = cleaned.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    try { return JSON.parse(cleaned.slice(objStart, objEnd + 1)); } catch { /* continue */ }
  }
  return fallback;
}

// ── Public types ──────────────────────────────────────────────────────────

export type CommandType = 'info' | 'risk' | 'workload' | 'sprint_summary' | 'unknown';
export type Severity    = 'green' | 'yellow' | 'red';

export interface CommandResult {
  type:      CommandType;
  headline:  string;
  summary:   string;
  bullets:   string[];
  severity?: Severity;
}

export interface RiskNarrative {
  headline:    string;   // Short summary title (≤ 8 words)
  paragraph:   string;   // 2-3 sentence narrative  
  riskLevel:   'Low' | 'Medium' | 'High' | 'Critical';
  topRisks:    string[]; // up to 3 bullet risks
  greenFlags:  string[]; // up to 2 things that are on track
}

// ── Context builder ────────────────────────────────────────────────────────

function buildContext(release: Release, teamMembers: TeamMember[]): string {
  const allTickets = release.features.flatMap(f => f.tickets);
  const sprints    = release.sprints ?? [];

  // Per-person workload
  const workload: Record<string, number> = {};
  for (const t of allTickets) {
    if (t.assignedTo) {
      workload[t.assignedTo] = (workload[t.assignedTo] ?? 0) + (t.effortDays ?? 1);
    }
  }

  const unassigned  = allTickets.filter(t => !t.assignedTo).length;
  const totalEffort = allTickets.reduce((s, t) => s + (t.effortDays ?? 1), 0);

  const sprintLines = sprints.map(s => {
    const tix    = allTickets.filter(t => {
      const ts = new Date(t.startDate).getTime();
      return ts >= new Date(s.startDate).getTime() && ts <= new Date(s.endDate).getTime();
    });
    const effort = tix.reduce((sum, t) => sum + (t.effortDays ?? 1), 0);
    return `${s.name}: ${tix.length} tickets, ${effort} effort-days`;
  });

  const workloadLines = Object.entries(workload)
    .sort(([, a], [, b]) => b - a)
    .map(([name, days]) => `${name}: ${days} days`);

  const roles = [...new Set(teamMembers.map(m => m.role))].join(', ');

  return `
Release: "${release.name}"
Dates: ${new Date(release.startDate).toLocaleDateString()} – ${new Date(release.endDate).toLocaleDateString()}
Total tickets: ${allTickets.length} | Total effort: ${totalEffort} days | Unassigned: ${unassigned}
Team size: ${teamMembers.length} | Roles: ${roles}

Sprints:
${sprintLines.length ? sprintLines.join('\n') : 'No sprints defined yet'}

Workload per person:
${workloadLines.length ? workloadLines.join('\n') : 'No assignments yet'}
`.trim();
}

// ── Command processor ─────────────────────────────────────────────────────

const COMMAND_SYSTEM_PROMPT = `You are a concise release planning AI assistant. 
You analyze sprint and ticket data and answer questions about a software release.

You MUST always respond with a JSON object in exactly this shape:
{
  "type": "info" | "risk" | "workload" | "sprint_summary" | "unknown",
  "headline": "4–6 word title",
  "summary": "1–2 sentence plain English answer (max 40 words)",
  "bullets": ["point 1", "point 2", "point 3"],
  "severity": "green" | "yellow" | "red"
}

Rules:
- type "risk"          → questions about risks, blockers, what could go wrong
- type "workload"      → team load, who is overloaded, assignments
- type "sprint_summary"→ sprint-specific questions
- type "info"          → general questions
- type "unknown"       → question outside release planning scope
- severity "red" → critical issues, "yellow" → warnings, "green" → healthy
- Keep each bullet under 15 words
- Maximum 4 bullets
- NEVER return plain text — always return valid JSON`;

export async function processCommand(
  command: string,
  release: Release,
  teamMembers: TeamMember[],
): Promise<CommandResult> {
  const context = buildContext(release, teamMembers);
  const raw     = await callLLM(
    COMMAND_SYSTEM_PROMPT,
    `Release context:\n${context}\n\nQuestion: ${command}`,
  );

  const fallback: CommandResult = {
    type:     'unknown',
    headline: 'Could not process',
    summary:  'Try asking about risks, workload, sprint status, or team assignments.',
    bullets:  [],
    severity: 'yellow',
  };

  return extractJSON<CommandResult>(raw, fallback);
}

// ── Release Risk Narrative ────────────────────────────────────────────────

const RISK_SYSTEM_PROMPT = `You are a senior engineering program manager writing a release risk brief.
Analyze the release data and respond ONLY with a JSON object in this exact shape:
{
  "headline":   "Short 6-8 word summary of release health",
  "paragraph":  "2-3 sentence executive summary of the release status and biggest concerns",
  "riskLevel":  "Low" | "Medium" | "High" | "Critical",
  "topRisks":   ["risk 1 (under 15 words)", "risk 2", "risk 3"],
  "greenFlags": ["good thing 1 (under 12 words)", "good thing 2"]
}

Rules:
- Be direct and specific — use actual numbers from the data
- riskLevel "Critical" only if release is clearly unfeasible
- topRisks: maximum 3 items
- greenFlags: maximum 2 items
- NEVER return plain text — always return valid JSON`;

export async function generateRiskNarrative(
  release: Release,
  teamMembers: TeamMember[],
): Promise<RiskNarrative> {
  const context = buildContext(release, teamMembers);
  const raw     = await callLLM(RISK_SYSTEM_PROMPT, `Release context:\n${context}`);

  const fallback: RiskNarrative = {
    headline:   'Release analysis unavailable',
    paragraph:  'Could not generate risk analysis. Check that Ollama is running.',
    riskLevel:  'Medium',
    topRisks:   [],
    greenFlags: [],
  };

  return extractJSON<RiskNarrative>(raw, fallback);
}

// ── PRD Quality Scorer ────────────────────────────────────────────────────

export interface PRDQualityResult {
  score:         number;   // 0–100
  grade:         'A' | 'B' | 'C' | 'D' | 'F';
  present:       string[]; // sections found
  missing:       string[]; // important sections absent
  suggestion:    string;   // one-line coaching tip
}

const PRD_SCORE_SYSTEM_PROMPT = `You are a senior product manager evaluating PRD completeness.
Respond ONLY with a JSON object in exactly this shape:
{
  "score": <number 0-100>,
  "grade": "A" | "B" | "C" | "D" | "F",
  "present": ["section found 1", "section found 2"],
  "missing": ["missing section 1", "missing section 2"],
  "suggestion": "One actionable tip to improve this PRD (max 20 words)"
}

Standard PRD sections to check for:
- Problem statement / Overview
- Goals & success metrics
- User stories / Requirements
- Scope (in scope / out of scope)
- Technical considerations
- Timeline / Milestones
- Risks & mitigations
- Open questions
- Acceptance criteria

Scoring guide:
- 90-100 (A): 7+ sections present, clear and detailed
- 75-89  (B): 5-6 sections, mostly complete
- 60-74  (C): 3-4 sections, significant gaps
- 40-59  (D): 1-2 sections, major gaps
- 0-39   (F): Barely structured

NEVER return plain text — always return valid JSON`;

export async function scorePRDQuality(prdText: string): Promise<PRDQualityResult> {
  const excerpt = prdText.slice(0, 3000); // stay within context
  const raw     = await callLLM(
    PRD_SCORE_SYSTEM_PROMPT,
    `Evaluate this PRD:\n\n${excerpt}`,
  );

  const fallback: PRDQualityResult = {
    score:      50,
    grade:      'C',
    present:    [],
    missing:    ['Could not analyze — check Ollama is running'],
    suggestion: 'Ensure Ollama is running to get a full PRD quality analysis.',
  };

  return extractJSON<PRDQualityResult>(raw, fallback);
}

// ── Conflict AI Explainer ─────────────────────────────────────────────────

export interface ConflictExplanation {
  plainEnglish: string;  // 1-2 sentence explanation of the conflict
  rootCause:    string;  // Why this happened
  suggestion:   string;  // Best resolution recommendation (1 sentence)
}

const CONFLICT_SYSTEM_PROMPT = `You are a release planning expert explaining a scheduling conflict to a product manager.
Respond ONLY with a JSON object in exactly this shape:
{
  "plainEnglish": "1-2 sentence plain explanation of what the conflict is (max 30 words)",
  "rootCause":    "1 sentence explaining why this conflict exists (max 20 words)",
  "suggestion":   "1 sentence with the best way to resolve it (max 20 words)"
}

Use plain non-technical language. Write as if explaining to a PM, not an engineer.
NEVER return plain text — always return valid JSON`;

export async function explainConflict(
  conflictDescription: string,
  ticketTitle: string,
  assignee: string,
): Promise<ConflictExplanation> {
  const raw = await callLLM(
    CONFLICT_SYSTEM_PROMPT,
    `Conflict: ${conflictDescription}\nTicket: "${ticketTitle}"\nAssigned to: ${assignee}`,
  );

  const fallback: ConflictExplanation = {
    plainEnglish: 'This ticket has a scheduling conflict with another ticket.',
    rootCause:    'The same developer is assigned to overlapping work.',
    suggestion:   'Reassign one ticket or shift it to a later date.',
  };

  return extractJSON<ConflictExplanation>(raw, fallback);
}
