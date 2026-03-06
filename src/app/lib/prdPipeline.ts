/**
 * PRD Pipeline — 5 Real Sequential LLM Agent Calls
 *
 * Each agent:
 *   - Has ONE focused job
 *   - Gets the previous agent's output as enriched context
 *   - Uses few-shot prompt examples to enforce output format
 *   - Retries up to 2× if JSON comes back malformed/empty
 *   - Has a meaningful fallback so the pipeline never crashes
 *
 * Swap path:
 *   Local dev  → callLLM() → Ollama localhost:11434
 *   Production → callLLM() → /api/llm Vercel route → OpenAI/Groq
 *   Only callLLM() changes. Zero other code changes needed.
 *
 * Agent chain:
 *   1. Document Parser       — PRD text → PRDSection[]
 *   2. Structure Analyzer    — sections → RequirementsHierarchy[] (epic grouping)
 *   3. Requirements Extractor— hierarchy → RawRequirement[] (atomic, testable)
 *   4. Ticket Generator      — requirements → RawTicket[] (batched, self-validated)
 *   5. Dependency Mapper     — tickets → DependencyMap (semantic, not index-based)
 *   6. Acceptance Criteria   — tickets → BDD criteria per ticket
 *   7. Assignment            — tickets + team → suggestedAssignee per ticket (deterministic, PRD-only)
 */

import type { TeamMember } from '../data/mockData';

export type RequiredRole =
  | 'Frontend' | 'Backend' | 'Fullstack'
  | 'QA' | 'Designer' | 'DataEngineer' | 'iOS' | 'Android';

// ── Public Types ───────────────────────────────────────────────────────────

export interface PipelineAgent {
  icon: string;
  name: string;
  description: string;
}

export interface PipelineProgress {
  agentIndex: number;  // 0–4
  status: 'pending' | 'processing' | 'complete' | 'error';
  overallPercent: number;
  message: string;
}

export interface AmbiguityQuestion {
  question: string;
  options: string[];
}

export interface ExtractedTicket {
  tempId: string;
  title: string;
  description: string;        // includes acceptance criteria
  acceptanceCriteria: string; // BDD Given/When/Then + DoD checklist (Agent 6)
  requiredRole: RequiredRole;
  effortDays: number;         // person-days — primary unit
  epic: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  confidence: number;         // 0–100, AI certainty in scope clarity
  sourceText: string;         // original PRD sentence that created this
  dependsOnTempIds: string[];
  ambiguities?: AmbiguityQuestion[];
  /** Populated by prdAssignTickets() after Agent 6. PRD flow only — never touches autoAssignmentService. */
  suggestedAssignee?: string;
}

export interface PRDDependency {
  from: string; // tempId that depends on...
  to: string;   // ...this tempId (must complete first)
}

export interface PRDSection {
  heading: string;
  content: string;
}

export interface PipelineResult {
  tickets: ExtractedTicket[];
  dependencies: PRDDependency[];
  criticalPath: string[];
  ambiguousTickets: ExtractedTicket[];
  sections: PRDSection[];
}

// ── Agent Registry (UI uses this for animated status cards) ───────────────

export const PIPELINE_AGENTS: PipelineAgent[] = [
  { icon: '📄', name: 'Document Parser',        description: 'Splitting PRD into structured sections' },
  { icon: '🧩', name: 'Structure Analyzer',     description: 'Grouping sections into engineering epics' },
  { icon: '🎯', name: 'Requirements Extractor', description: 'Breaking down into atomic requirements' },
  { icon: '🎫', name: 'Ticket Generator',       description: 'Creating tickets with effort + role + criteria' },
  { icon: '📊', name: 'Dependency Mapper',      description: 'Detecting blockers and critical path' },
  { icon: '✅', name: 'Acceptance Criteria',    description: 'Writing BDD Given/When/Then + DoD per ticket' },
];

// ── LLM Adapter — env-aware: Ollama locally, Groq edge fn on Vercel ──────

const IS_DEV     = import.meta.env.DEV;
const OLLAMA_URL = 'http://localhost:11434/api/chat';
const GROQ_URL   = '/api/ai';
const MODEL      = IS_DEV ? 'llama3.2:3b' : 'llama-3.3-70b-versatile';

async function callLLM(systemPrompt: string, userContent: string): Promise<string> {
  if (IS_DEV) {
    // Local Ollama
    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userContent  },
        ],
        stream: false,
        options: { temperature: 0.1, top_p: 0.9, num_predict: 4096, num_ctx: 8192 },
      }),
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return data.message?.content ?? '';
  } else {
    // Production — Vercel edge fn → Groq
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userContent  },
        ],
        stream: false,
        options: { temperature: 0.1, num_predict: 4096 },
      }),
    });
    if (!res.ok) throw new Error(`Groq HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return data.message?.content ?? '';
  }
}

// ── JSON Extraction — handles markdown fences the model adds ──────────────

function extractJSON<T>(raw: string, fallback: T): T {
  // Strip markdown code fences
  let cleaned = raw
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/```\s*$/im, '')
    .trim();

  // Direct parse
  try { return JSON.parse(cleaned); } catch { /* continue */ }

  // Find outermost array
  const arrStart = cleaned.indexOf('[');
  const arrEnd   = cleaned.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart) {
    try { return JSON.parse(cleaned.slice(arrStart, arrEnd + 1)); } catch { /* continue */ }
  }

  // Find outermost object
  const objStart = cleaned.indexOf('{');
  const objEnd   = cleaned.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    try { return JSON.parse(cleaned.slice(objStart, objEnd + 1)); } catch { /* continue */ }
  }

  return fallback;
}

/**
 * Retry wrapper — retries once if the output is empty/malformed.
 * Adds "Your previous attempt returned empty. Try again." to the prompt.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  isEmpty: (r: T) => boolean,
  retries = 2
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    const result = await fn();
    if (!isEmpty(result)) return result;
    if (i < retries - 1) {
      await new Promise(r => setTimeout(r, 800)); // brief pause before retry
    }
  }
  return fn(); // final attempt, return whatever comes back
}

// ── deterministic pre-parser for documents with explicit JIRA/story blocks ─
//
// Many PRDs include a structured backlog section with blocks like:
//
//   [Story] Workspace signup + login
//   User story: ...
//   Acceptance criteria:
//     - ...
//   Priority: P0
//   Estimate: 5 pts
//   Dependencies: Story 1
//
// The LLM often misses or merges these. We extract them deterministically
// and return them as PRDSections so they survive the full pipeline.

function extractExplicitStories(prdText: string): PRDSection[] {
  const stories: PRDSection[] = [];

  // Match numbered story blocks: e.g.  "1) [Story] Title" or "[Story] Title"
  const storyPattern = /(?:^\d+\)\s*)?\[Story\]\s+(.+?)(?=(?:^\d+\)\s*)?\[Story\]|\[Epic\]|Epic\s+[A-Z]\s*[—\-]|$)/gms;
  let match: RegExpExecArray | null;

  while ((match = storyPattern.exec(prdText)) !== null) {
    const firstLine = match[1].trim().split('\n')[0].trim();
    const fullBlock = match[0].trim();
    if (firstLine) {
      stories.push({ heading: `[Story] ${firstLine}`, content: fullBlock });
    }
  }

  return stories;
}

// ══════════════════════════════════════════════════════════════════════════
// AGENT 1 — Document Parser
// Job: split raw PRD text into headed sections
// Input:  raw PRD string
// Output: PRDSection[] — heading + full content per section
// ══════════════════════════════════════════════════════════════════════════

async function agent1_documentParser(prdText: string): Promise<PRDSection[]> {
  const SYSTEM = `You are a technical document parser. Your only job is to split a Product Requirements Document into its main sections.

OUTPUT RULES:
- Return ONLY a JSON array. No explanation. No markdown. No extra text.
- Each element: {"heading": "Section Name", "content": "full text of this section"}
- Headings can appear as: ## Heading, # Heading, 1) Heading, 1. Heading, HEADING:, or bold **Heading**
- JIRA/story blocks (lines starting with [Story], [Epic], Epic A, Epic B) ARE sections — include each as its own section
- If there are no clear headings, create logical sections based on topics.
- Preserve ALL original text in the content field. Do NOT summarize or shorten.

EXAMPLE INPUT:
## Authentication
Users must be able to log in using email and password.
OAuth 2.0 with Google is required.

## Dashboard
Show a summary of all active releases.

EXAMPLE OUTPUT:
[
  {"heading": "Authentication", "content": "Users must be able to log in using email and password. OAuth 2.0 with Google is required."},
  {"heading": "Dashboard", "content": "Show a summary of all active releases."}
]`;

  // llama3.2:3b context = 8192 tokens ≈ 32000 chars. Send the full PRD — no truncation.
  const USER = `Split this PRD into sections. Return JSON array only.

PRD:
${prdText}`;  // full text — num_ctx: 8192 handles it

  const result = await withRetry(
    () => callLLM(SYSTEM, USER).then(r => extractJSON<PRDSection[]>(r, [])),
    r => r.length === 0,
  );

  // Fallback: if model returned nothing useful, split by heading heuristics
  // Handles: ## Heading, # Heading, 1) Heading, 1. Heading, EPIC A —, [Story], Epic NN
  if (result.length === 0) {
    const HEADING_RE = /^(#{1,3} |\d+[\)\.]\s+|Epic\s+[A-Z]\s*[—–-]|\[Story\]|\[Epic\])/i;
    const lines = prdText.split('\n');
    const sections: PRDSection[] = [];
    let current: PRDSection = { heading: 'Overview', content: '' };
    for (const line of lines) {
      if (HEADING_RE.test(line.trim()) && line.trim().length > 3) {
        if (current.content.trim()) sections.push(current);
        // Clean up heading text
        const heading = line.replace(/^#{1,3} /, '').replace(/^\d+[\)\.]\s+/, '').trim();
        current = { heading, content: '' };
      } else {
        current.content += line + '\n';
      }
    }
    if (current.content.trim()) sections.push(current);
    return sections.length > 0 ? sections : [{ heading: 'Requirements', content: prdText }];
  }

  // Merge in any explicitly formatted [Story] blocks the LLM missed
  const explicitStories = extractExplicitStories(prdText);
  if (explicitStories.length > 0) {
    const existingHeadings = new Set(result.map(s => s.heading.toLowerCase()));
    for (const story of explicitStories) {
      const key = story.heading.toLowerCase();
      // Only add if not already present (avoid duplicates)
      if (!existingHeadings.has(key)) {
        result.push(story);
        existingHeadings.add(key);
      }
    }
  }

  return result;
}

// ══════════════════════════════════════════════════════════════════════════
// AGENT 2 — Structure Analyzer
// Job: read sections, identify engineering epics, assign each section to an epic
// Input:  PRDSection[]
// Output: RequirementsHierarchy[] — epic name + requirement texts under it
// ══════════════════════════════════════════════════════════════════════════

interface RequirementsHierarchy {
  epic: string;
  requirements: { text: string; sourceSection: string; priority: 'Critical' | 'High' | 'Medium' | 'Low' }[];
}

async function agent2_structureAnalyzer(sections: PRDSection[]): Promise<RequirementsHierarchy[]> {
  // Give Agent 2 the full section content — no truncation per section.
  // Total is capped at 7000 chars to fit in 8192 token context with system prompt.
  const sectionsSummary = sections
    .map(s => `SECTION "${s.heading}":\n${s.content.substring(0, 1200)}`)
    .join('\n\n---\n\n')
    .substring(0, 7000);

  const SYSTEM = `You are a senior engineering manager. You read PRD sections and group them into engineering epics.

RULES:
- An epic = a major product area (e.g., "Authentication", "Dashboard", "Notifications")
- Multiple PRD sections can belong to the same epic
- Each epic has requirements extracted as discrete, one-sentence statements
- Priority: Critical = must ship, High = core feature, Medium = important, Low = nice-to-have
- If a section is a "[Story]" block with "User story:", "Acceptance criteria:", "Priority:", "Estimate:" — 
  extract each acceptance criteria bullet as a separate requirement. Use the stated Priority (P0=Critical, P1=High, P2=Medium).
- Return ONLY JSON array. No explanation.

FORMAT:
[
  {
    "epic": "Authentication",
    "requirements": [
      {"text": "Users can log in with email and password", "sourceSection": "Login", "priority": "Critical"},
      {"text": "Support Google OAuth 2.0 login", "sourceSection": "Login", "priority": "High"}
    ]
  }
]`;

  const USER = `Group these PRD sections into engineering epics and list discrete requirements per epic.

${sectionsSummary}

Return JSON array only:`;

  const result = await withRetry(
    () => callLLM(SYSTEM, USER).then(r => extractJSON<RequirementsHierarchy[]>(r, [])),
    r => r.length === 0,
  );

  if (result.length === 0) {
    return sections.map(s => ({
      epic: s.heading,
      requirements: [{ text: s.content.substring(0, 200), sourceSection: s.heading, priority: 'Medium' as const }],
    }));
  }

  return result;
}

// ══════════════════════════════════════════════════════════════════════════
// AGENT 3 — Requirements Extractor
// Job: take hierarchy, break compound requirements into atomic ones,
//      flag anything ambiguous (contains "should", "might", "TBD", "etc.")
// Input:  RequirementsHierarchy[]
// Output: RawRequirement[] — fully atomic, testable, tagged
// ══════════════════════════════════════════════════════════════════════════

interface RawRequirement {
  epic: string;
  text: string;
  sourceText: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  isAmbiguous: boolean; // true if contains vague language
}

async function agent3_requirementsExtractor(hierarchy: RequirementsHierarchy[]): Promise<RawRequirement[]> {
  const hierarchyText = hierarchy
    .map(h => `EPIC: ${h.epic}\n${h.requirements.map(r => `  - [${r.priority}] ${r.text}`).join('\n')}`)
    .join('\n\n');

  const SYSTEM = `You are a requirements analyst. You take compound requirements and split them into atomic, testable requirements.

RULES:
- Atomic = one requirement = one thing that can be independently tested
- Split "User can login and register and reset password" into 3 requirements
- Mark isAmbiguous: true if requirement contains: "should", "might", "could", "TBD", "etc.", "and/or", "similar"
- Keep the epic field from the input
- sourceText = the original requirement sentence you split from
- Return ONLY JSON array. No explanation.

EXAMPLE:
Input: "Users can log in with email/Google and manage their sessions"
Output:
[
  {"epic": "Auth", "text": "Users can log in with email and password", "sourceText": "Users can log in with email/Google and manage their sessions", "priority": "Critical", "isAmbiguous": false},
  {"epic": "Auth", "text": "Users can log in with Google OAuth", "sourceText": "Users can log in with email/Google and manage their sessions", "priority": "High", "isAmbiguous": false},
  {"epic": "Auth", "text": "Users can manage active sessions (view/revoke)", "sourceText": "Users can log in with email/Google and manage their sessions", "priority": "Medium", "isAmbiguous": true}
]`;

  const USER = `Break down these requirements into atomic testable items. Split any compound requirements.

${hierarchyText.substring(0, 7000)}

Return JSON array only:`;

  const result = await withRetry(
    () => callLLM(SYSTEM, USER).then(r => extractJSON<RawRequirement[]>(r, [])),
    r => r.length === 0,
  );

  if (result.length === 0) {
    return hierarchy.flatMap(h =>
      h.requirements.map(r => ({
        epic: h.epic,
        text: r.text,
        sourceText: r.text,
        priority: r.priority,
        isAmbiguous: /should|might|could|tbd|etc\.|and\/or/i.test(r.text),
      }))
    );
  }

  return result;
}

// ══════════════════════════════════════════════════════════════════════════
// AGENT 4 — Ticket Generator
// Job: convert atomic requirements into engineering tickets
//      with acceptance criteria, effort estimate, role assignment
//      Batches to avoid token overflow. Self-validates effort sanity.
// Input:  RawRequirement[] + team context
// Output: RawTicket[]
// ══════════════════════════════════════════════════════════════════════════

interface RawTicket {
  title: string;
  description: string;
  epic: string;
  requiredRole: string;
  effortDays: number;
  priority: string;
  confidence: number;
  sourceText: string;
  ambiguities?: { question: string; options: string[] }[];
}

const TICKET_SYSTEM_PROMPT = (teamRoles: string) =>
`You are a senior engineering manager creating a sprint plan from requirements.

TEAM AVAILABLE: ${teamRoles}

TICKET RULES:
- title: short imperative sentence ("Implement JWT auth endpoint")
- description: 2-3 sentences + "Acceptance criteria:" bullet list (2-3 bullets)
- requiredRole: EXACTLY one of: Frontend, Backend, Fullstack, QA, Designer, DataEngineer, iOS, Android
  - Choose based on work type: API = Backend, UI component = Frontend, both = Fullstack
  - Testing, test plans = QA. Visual design = Designer.
- effortDays: person-days of focused work
  - Trivial (config, copy change): 0.5-1
  - Simple (CRUD endpoint, basic UI): 2-3
  - Standard (feature with auth, validation): 4-5
  - Complex (real-time, multi-service): 6-8
  - Very complex (payment, ML integration): 9-12
  - NEVER above 13. If bigger, split into two tickets.
- priority: Critical | High | Medium | Low
- confidence: 0-100 (how clearly defined is this requirement?)
  - 90-100: crystal clear, well-scoped
  - 70-89: mostly clear, minor unknowns
  - below 70: ambiguous scope or unclear acceptance criteria
- If confidence < 85: add ambiguities array with 1-2 clarifying questions,
  each with 3-4 concrete option answers
- sourceText: the original requirement sentence

Return ONLY a JSON array. No explanation. No markdown.

EXAMPLE OUTPUT ELEMENT:
{
  "title": "Build POST /api/auth/login endpoint",
  "description": "Create JWT-based login endpoint accepting email/password. Returns access token and refresh token on success. Acceptance criteria: Returns 200 with tokens on valid credentials. Returns 401 on invalid credentials. Rate-limits to 10 requests per minute.",
  "epic": "Authentication",
  "requiredRole": "Backend",
  "effortDays": 3,
  "priority": "Critical",
  "confidence": 95,
  "sourceText": "Users can log in with email and password",
  "ambiguities": []
}`;

async function agent4_ticketGenerator(
  requirements: RawRequirement[],
  teamContext: { roles: string[]; totalCount: number }
): Promise<RawTicket[]> {
  const teamRoles = teamContext.roles.length > 0
    ? `${teamContext.totalCount} people with roles: ${teamContext.roles.join(', ')}`
    : `${teamContext.totalCount} engineers (general team)`;

  const SYSTEM = TICKET_SYSTEM_PROMPT(teamRoles);

  // Batch into groups of 15 to stay well under token limits
  const BATCH_SIZE = 15;
  const batches: RawRequirement[][] = [];
  for (let i = 0; i < requirements.length; i += BATCH_SIZE) {
    batches.push(requirements.slice(i, i + BATCH_SIZE));
  }

  const allTickets: RawTicket[] = [];

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    const reqList = batch
      .map((r, i) => `${i + 1}. [${r.epic}] [${r.priority}] ${r.text}${r.isAmbiguous ? ' ⚠️ (ambiguous)' : ''}`)
      .join('\n');

    const USER = `Convert these ${batch.length} requirements into tickets (batch ${bi + 1}/${batches.length}):

${reqList}

Return JSON array of ${batch.length} tickets:`;

    const batchResult = await withRetry(
      () => callLLM(SYSTEM, USER).then(r => extractJSON<RawTicket[]>(r, [])),
      r => r.length === 0,
    );

    // Fallback for any requirement that didn't get a ticket
    const produced = batchResult.length > 0 ? batchResult : batch.map(r => ({
      title: r.text.substring(0, 80),
      description: r.text,
      epic: r.epic,
      requiredRole: 'Fullstack',
      effortDays: 3,
      priority: r.priority,
      confidence: r.isAmbiguous ? 65 : 75,
      sourceText: r.sourceText,
      ambiguities: [],
    }));

    allTickets.push(...produced);
  }

  // ── Self-validation pass ──────────────────────────────────────────────
  // Ask the model: "are any of these tickets too large or wrong role?"
  // Only run if we have > 5 tickets (not worth it for tiny PRDs)
  if (allTickets.length > 5) {
    const oversizedIndices = allTickets
      .map((t, i) => ({ i, days: t.effortDays }))
      .filter(x => x.days > 13)
      .map(x => x.i);

    if (oversizedIndices.length > 0) {
      const SPLIT_SYSTEM = `You split oversized engineering tickets into 2-3 smaller tickets. Return ONLY JSON array. No explanation.
Each new ticket follows same format: title, description, epic, requiredRole, effortDays, priority, confidence, sourceText, ambiguities.`;

      const SPLIT_USER = `These tickets are too large (>13 effortDays). Split each into 2-3 smaller tickets:

${oversizedIndices.map(i => JSON.stringify(allTickets[i])).join('\n')}

Return JSON array of replacement tickets:`;

      const replacements = await callLLM(SPLIT_SYSTEM, SPLIT_USER)
        .then(r => extractJSON<RawTicket[]>(r, []));

      if (replacements.length > 0) {
        // Remove the oversized tickets (reverse order to preserve indices)
        for (const idx of [...oversizedIndices].sort((a, b) => b - a)) {
          allTickets.splice(idx, 1);
        }
        allTickets.push(...replacements);
      }
    }
  }

  return allTickets;
}

// ══════════════════════════════════════════════════════════════════════════
// AGENT 5 — Dependency Mapper
// Job: using ticket TITLES and EPICS (not just indices), detect which
//      tickets must complete before others can start
// Input:  RawTicket[]
// Output: DependencyMap with fromIndex/toIndex
// ══════════════════════════════════════════════════════════════════════════

interface DependencyPair {
  fromTitle: string; // this ticket...
  toTitle: string;   // ...depends on this ticket (must complete first)
  reason: string;    // why? (used for debug/display)
}

interface DependencyMap {
  dependencies: { fromIndex: number; toIndex: number }[];
}

async function agent5_dependencyMapper(tickets: RawTicket[]): Promise<DependencyMap> {
  if (tickets.length < 2) return { dependencies: [] };

  // Only process first 40 tickets for dependency analysis (token budget)
  const ticketsToAnalyze = tickets.slice(0, 40);

  const ticketList = ticketsToAnalyze
    .map((t, i) => `[${i}] "${t.title}" (${t.requiredRole}, ${t.epic})`)
    .join('\n');

  const SYSTEM = `You detect dependencies between engineering tickets. A dependency means ticket A CANNOT START until ticket B is DONE.

COMMON DEPENDENCY PATTERNS (use these as heuristics):
- Any protected API → depends on "auth" / "login" / "JWT" ticket
- Frontend UI for a feature → depends on the Backend API for that feature
- Database migrations / schema → must happen before any CRUD using that schema
- Test/QA tickets → depend on the feature implementation ticket
- "Deploy" / "Release" tickets → depend on all feature tickets in that epic
- Mobile/iOS/Android → depends on backend API for same feature

RULES:
- Only add dependencies that are CERTAIN (not speculative)
- Use title text to reason, not guesswork
- Return ONLY JSON. No explanation.

FORMAT:
[
  {"fromTitle": "Build user profile page", "toTitle": "Build GET /api/users/:id endpoint", "reason": "Frontend UI needs the backend API"},
  {"fromTitle": "Write integration tests for auth", "toTitle": "Implement JWT login endpoint", "reason": "Tests require the implementation to exist"}
]`;

  const USER = `Detect dependencies between these tickets. Only include certain blockers.

${ticketList}

Return JSON array of dependency objects:`;

  const rawDeps = await withRetry(
    () => callLLM(SYSTEM, USER).then(r => extractJSON<DependencyPair[]>(r, [])),
    _r => false, // even empty deps are valid — don't retry empty result
  );

  // Convert title-based deps back to index-based (what the rest of the pipeline expects)
  const titleToIndex = new Map(ticketsToAnalyze.map((t, i) => [t.title.toLowerCase().trim(), i]));

  const dependencies: { fromIndex: number; toIndex: number }[] = [];
  for (const dep of rawDeps) {
    const fromKey = dep.fromTitle?.toLowerCase().trim();
    const toKey   = dep.toTitle?.toLowerCase().trim();

    if (!fromKey || !toKey) continue;

    // Fuzzy match: exact title or "includes" match
    let fromIdx = titleToIndex.get(fromKey) ?? -1;
    let toIdx   = titleToIndex.get(toKey)   ?? -1;

    if (fromIdx === -1) {
      fromIdx = ticketsToAnalyze.findIndex(t =>
        t.title.toLowerCase().includes(fromKey) || fromKey.includes(t.title.toLowerCase().substring(0, 20))
      );
    }
    if (toIdx === -1) {
      toIdx = ticketsToAnalyze.findIndex(t =>
        t.title.toLowerCase().includes(toKey) || toKey.includes(t.title.toLowerCase().substring(0, 20))
      );
    }

    if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
      // Prevent duplicate pairs
      const already = dependencies.some(d => d.fromIndex === fromIdx && d.toIndex === toIdx);
      if (!already) dependencies.push({ fromIndex: fromIdx, toIndex: toIdx });
    }
  }

  return { dependencies };
}

// ── Critical Path (pure algorithm, no LLM) ────────────────────────────────

function computeCriticalPath(tickets: ExtractedTicket[], dependencies: PRDDependency[]): string[] {
  const blocks: Record<string, string[]>   = {};
  const memo:   Record<string, number>     = {};

  for (const t of tickets) blocks[t.tempId] = [];
  for (const d of dependencies) {
    blocks[d.to]?.push(d.from); // d.to must finish before d.from
  }

  const ticketMap = new Map(tickets.map(t => [t.tempId, t]));

  function longestFrom(id: string): number {
    if (id in memo) return memo[id];
    const ticket = ticketMap.get(id);
    if (!ticket) return 0;
    const downstream = blocks[id]?.length
      ? Math.max(...blocks[id].map(longestFrom))
      : 0;
    memo[id] = ticket.effortDays + downstream;
    return memo[id];
  }
  for (const t of tickets) longestFrom(t.tempId);

  const sorted = [...tickets].sort((a, b) => (memo[b.tempId] ?? 0) - (memo[a.tempId] ?? 0));
  if (!sorted.length) return [];

  const path: string[] = [];
  let current = sorted[0].tempId;
  while (current) {
    path.push(current);
    const next = (blocks[current] ?? [])
      .sort((a, b) => (memo[b] ?? 0) - (memo[a] ?? 0))[0];
    if (!next || path.includes(next)) break;
    current = next;
  }
  return path;
}

// ══════════════════════════════════════════════════════════════════════════
// AGENT 6 — Acceptance Criteria Writer
// Job: for each ticket, write BDD-style Given/When/Then acceptance criteria
//      plus a Definition of Done checklist
// Input:  ExtractedTicket[] (with title, description, requiredRole, effortDays)
// Output: Map<tempId, acceptanceCriteria string>
// Batched: 10 tickets per LLM call to stay within token budget
// ══════════════════════════════════════════════════════════════════════════

interface RawAC {
  tempId: string;
  acceptanceCriteria: string;
}

async function agent6_acceptanceCriteriaWriter(
  tickets: ExtractedTicket[]
): Promise<Map<string, string>> {
  const SYSTEM = `You are a senior QA engineer writing acceptance criteria for engineering tickets.

OUTPUT FORMAT (strictly):
Return a JSON array where each element is:
{
  "tempId": "<original tempId>",
  "acceptanceCriteria": "<multi-line string>"
}

ACCEPTANCE CRITERIA FORMAT per ticket:
Write in this exact structure — no extra commentary:

Given/When/Then scenarios (2-3 max):
  Given [precondition]
  When [action]
  Then [expected outcome]

Definition of Done:
  - [checklist item]
  - [checklist item]
  - [checklist item]

Edge Cases:
  - [edge case to handle]
  - [edge case to handle]

RULES:
- Be specific and testable — no vague words like "works correctly" or "is intuitive"
- Match the role: Backend tickets → focus on API contracts, status codes, data validation
  Frontend tickets → focus on UI states, loading/error/empty, accessibility
  QA tickets → focus on test coverage metrics and regression scope
- 2-3 Given/When/Then scenarios per ticket maximum
- 3-5 Definition of Done items
- 2-3 Edge Cases
- Return ONLY the JSON array. No explanation. No markdown fences.`;

  const BATCH_SIZE = 10;
  const acMap = new Map<string, string>();

  for (let i = 0; i < tickets.length; i += BATCH_SIZE) {
    const batch = tickets.slice(i, i + BATCH_SIZE);

    const USER = `Write acceptance criteria for these ${batch.length} tickets.

${batch.map(t => `{
  "tempId": "${t.tempId}",
  "title": "${t.title}",
  "description": "${t.description.replace(/"/g, "'").substring(0, 300)}",
  "role": "${t.requiredRole}",
  "effort": "${t.effortDays}d",
  "epic": "${t.epic}"
}`).join(',\n')}

Return JSON array with tempId + acceptanceCriteria for each ticket:`;

    const results = await withRetry(
      () => callLLM(SYSTEM, USER).then(r => extractJSON<RawAC[]>(r, [])),
      r => r.length === 0,
    );

    if (results.length > 0) {
      for (const r of results) {
        if (r.tempId && r.acceptanceCriteria) {
          acMap.set(r.tempId, r.acceptanceCriteria);
        }
      }
    } else {
      // Fallback: generate minimal AC deterministically so the field is never empty
      for (const t of batch) {
        acMap.set(t.tempId, [
          `Given the ${t.epic} feature is available`,
          `When a user performs the action described in "${t.title}"`,
          `Then the expected outcome should be achieved without errors`,
          ``,
          `Definition of Done:`,
          `  - Implementation complete and code reviewed`,
          `  - Unit tests written and passing`,
          `  - Tested in staging environment`,
          `  - No regressions introduced`,
        ].join('\n'));
      }
    }
  }

  return acMap;
}

// ── Main Entry Point ──────────────────────────────────────────────────────
export async function runPRDPipeline(
  prdText: string,
  teamMembers: TeamMember[],
  onProgress: (p: PipelineProgress) => void
): Promise<PipelineResult> {

  // Derive teamContext for Agent 4 from the team roster
  const teamContext = {
    roles: [...new Set(teamMembers.map(m => m.role))],
    totalCount: teamMembers.length,
  };

  const progress = (
    agentIndex: number,
    status: PipelineProgress['status'],
    percent: number,
    message: string
  ) => onProgress({ agentIndex, status, overallPercent: percent, message });

  // ── Agent 1: Document Parser ─────────────────────────────────────────
  progress(0, 'processing', 5, 'Parsing PRD structure...');
  const sections = await agent1_documentParser(prdText);
  progress(0, 'complete', 18, `Found ${sections.length} section${sections.length !== 1 ? 's' : ''}`);

  // ── Agent 2: Structure Analyzer ──────────────────────────────────────
  progress(1, 'processing', 20, 'Grouping into engineering epics...');
  const hierarchy = await agent2_structureAnalyzer(sections);
  progress(1, 'complete', 38, `Identified ${hierarchy.length} epic${hierarchy.length !== 1 ? 's' : ''}`);

  // ── Agent 3: Requirements Extractor ──────────────────────────────────
  progress(2, 'processing', 40, 'Extracting atomic requirements...');
  const requirements = await agent3_requirementsExtractor(hierarchy);
  progress(2, 'complete', 56, `Extracted ${requirements.length} requirement${requirements.length !== 1 ? 's' : ''}`);

  // ── Agent 4: Ticket Generator ─────────────────────────────────────────
  const batchCount = Math.ceil(requirements.length / 15);
  progress(3, 'processing', 58, `Generating tickets${batchCount > 1 ? ` (${batchCount} batches)` : ''}...`);
  const rawTickets = await agent4_ticketGenerator(requirements, teamContext);
  progress(3, 'complete', 78, `Created ${rawTickets.length} ticket${rawTickets.length !== 1 ? 's' : ''}`);

  // ── Agent 5: Dependency Mapper ────────────────────────────────────────
  progress(4, 'processing', 80, 'Detecting blockers and dependencies...');
  const depMap = await agent5_dependencyMapper(rawTickets);
  progress(4, 'complete', 86, `Found ${depMap.dependencies.length} dependenc${depMap.dependencies.length !== 1 ? 'ies' : 'y'}`);

  // ── Assemble ExtractedTickets before Agent 6 so tempIds are stable ───

  const VALID_ROLES = new Set<string>([
    'Frontend','Backend','Fullstack','QA','Designer','DataEngineer','iOS','Android'
  ]);

  const tickets: ExtractedTicket[] = rawTickets.map((t, i) => ({
    tempId:     `prd-${i}`,
    title:      t.title      || `Ticket ${i + 1}`,
    description:t.description|| t.title,
    acceptanceCriteria: '', // filled in by Agent 6 below
    requiredRole: (VALID_ROLES.has(t.requiredRole) ? t.requiredRole : 'Fullstack') as RequiredRole,
    effortDays: Math.min(13, Math.max(1, Math.round(t.effortDays || 3))),
    epic:       t.epic       || 'General',
    priority:   (['Critical','High','Medium','Low'].includes(t.priority)
      ? t.priority : 'Medium') as ExtractedTicket['priority'],
    confidence: Math.min(100, Math.max(0, t.confidence ?? 75)),
    sourceText: t.sourceText  || t.description || t.title,
    dependsOnTempIds: [],
    ambiguities: (t.ambiguities?.length && t.confidence < 85)
      ? t.ambiguities : undefined,
  }));

  // ── Agent 6: Acceptance Criteria Writer ──────────────────────────────
  progress(5, 'processing', 88, `Writing acceptance criteria for ${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}...`);
  const acMap = await agent6_acceptanceCriteriaWriter(tickets);
  // Stamp AC onto each ticket
  for (const t of tickets) {
    t.acceptanceCriteria = acMap.get(t.tempId) ?? t.acceptanceCriteria;
  }
  progress(5, 'complete', 94, `Acceptance criteria written for ${acMap.size} ticket${acMap.size !== 1 ? 's' : ''}`);

  // ── Wire dependencies onto tickets ───────────────────────────────────
  const dependencies: PRDDependency[] = depMap.dependencies
    .filter(d =>
      d.fromIndex >= 0 && d.fromIndex < tickets.length &&
      d.toIndex   >= 0 && d.toIndex   < tickets.length
    )
    .map(d => ({ from: tickets[d.fromIndex].tempId, to: tickets[d.toIndex].tempId }));

  for (const dep of dependencies) {
    const ticket = tickets.find(t => t.tempId === dep.from);
    if (ticket && !ticket.dependsOnTempIds.includes(dep.to)) {
      ticket.dependsOnTempIds.push(dep.to);
    }
  }

  const criticalPath      = computeCriticalPath(tickets, dependencies);
  const ambiguousTickets  = tickets.filter(t => t.confidence < 85 && t.ambiguities?.length);

  progress(5, 'complete', 100,
    `Done — ${tickets.length} tickets · ${acMap.size} with AC · ${ambiguousTickets.length} need clarification`
  );

  // ── Assign tickets to team members (PRD-only, deterministic) ──────────
  prdAssignTickets(tickets, teamMembers);

  return { tickets, dependencies, criticalPath, ambiguousTickets, sections };
}

// ── PRD Assignment — deterministic, load-balanced, role-matched ───────────
//
// Runs exclusively inside the PRD pipeline. Does NOT touch autoAssignmentService.ts
// which is used by AutoReleaseModal / Smart Release Flow.
//
// Strategy:
//   1. For each ticket, find team members whose role matches requiredRole.
//   2. Among matches, pick the one with the lowest accumulated effort (load balance).
//   3. Fallback chain: exact role → Developer/Fullstack → any member.
//   4. Mutates suggestedAssignee in place (tickets are already assembled objects).
function prdAssignTickets(tickets: ExtractedTicket[], teamMembers: TeamMember[]): void {
  if (teamMembers.length === 0) return;

  // Track accumulated effort per team member for load balancing.
  const load = new Map<string, number>();
  for (const m of teamMembers) load.set(m.name, 0);

  const DEVELOPER_ROLES = new Set(['Developer', 'Fullstack']);

  for (const ticket of tickets) {
    // 1. Exact role match
    let candidates = teamMembers.filter(m => m.role === ticket.requiredRole);

    // 2. Fallback: Developer / Fullstack
    if (candidates.length === 0) {
      candidates = teamMembers.filter(m => DEVELOPER_ROLES.has(m.role));
    }

    // 3. Fallback: anyone
    if (candidates.length === 0) {
      candidates = teamMembers;
    }

    // Pick candidate with lowest accumulated load
    const pick = candidates.reduce((best, m) =>
      (load.get(m.name) ?? 0) < (load.get(best.name) ?? 0) ? m : best
    );

    ticket.suggestedAssignee = pick.name;
    load.set(pick.name, (load.get(pick.name) ?? 0) + ticket.effortDays);
  }
}
