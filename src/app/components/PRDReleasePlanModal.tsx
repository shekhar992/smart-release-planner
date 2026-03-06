/**
 * PRD → Release Plan Wizard
 *
 * 8-step flow:
 *   upload → processing → preview → ambiguity* → release_config
 *   → sprint_preview → conflict* → complete
 *
 * (* = conditional, skipped if not needed)
 *
 * DOES NOT touch the planning engine. Uses autoAllocateRelease as a "dry run"
 * by calling it and NOT saving the result until the user confirms.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Upload, FileText, ChevronRight, ChevronLeft,
  CheckCircle2, AlertTriangle, Sparkles, RefreshCw,
  Clock, Users, Layers, Calendar, ArrowRight, SkipForward,
  Zap, TrendingUp, GitBranch, Package, Plus,
} from 'lucide-react';
import { cn } from './ui/utils';
import { AI_ENDPOINT } from '../lib/aiEndpoint';
import {
  runPRDPipeline,
  PIPELINE_AGENTS,
  PipelineProgress,
  PipelineResult,
  ExtractedTicket,
} from '../lib/prdPipeline';
import { scorePRDQuality, type PRDQualityResult } from '../lib/aiCommandProcessor';
import { dryRunRelease } from '../lib/planningBridge';
import { readFileAsText } from '../lib/prdAgentBridge';

import type { TicketInput } from '../../domain/types';
import {
  Release, Ticket, TeamMember, Feature, Holiday, Sprint, Phase, PhaseType,
  mockHolidays, SP_PRESETS,
} from '../data/mockData';

// ── Types ──────────────────────────────────────────────────────────────────

type WizardStep =
  | 'upload'
  | 'processing'
  | 'preview'
  | 'ambiguity'
  | 'release_config'
  | 'sprint_preview'
  | 'conflict'
  | 'complete';

type OverflowResolution = 'extend_window' | 'park_next_release' | 'skip';

// ── Sample PRD Template (MeetingMate) ─────────────────────────────────────
const SAMPLE_PRD_TEXT = `Product: MeetingMate (web app)
Description: Captures meeting audio (or upload), generates transcript, summary, decisions, and action items, then shares/exports to common tools.
Target users: Knowledge workers in mid-to-large organizations who run frequent meetings.

Problem statement:
Teams lose decisions and action items across chats, calendars, and personal notes, causing rework, missed follow-ups, and poor accountability.

Goals (MVP):
- Reduce time spent writing/distributing notes by 50%
- Increase action-item completion rate by 20%
- Produce shareable, searchable meeting artifacts within 5 minutes of meeting end

Functional requirements (MVP):
- Authentication + workspace concept
- Calendar event selection or manual meeting creation
- Audio capture/upload
- Transcription generation
- AI-generated: summary, decisions, action items (with assignees + due dates)
- Notes review/edit before sharing
- Shareable link with permissions
- Export to PDF and plain text
- Notifications for assigned action items

Release plan:
R1: Manual meeting + upload → transcript + summary → share + export
R2: Calendar connect + recording → action items + notifications
R3: Admin controls + retention + audit log

JIRA Backlog (11 stories)

Epic A — Core meeting artifact creation
1) Workspace signup + login
User story: As a user, I want to sign up and log in so I can access my meeting notes.
AC: User can create an account and log in/out. Session persists across refresh. Errors shown for invalid credentials.
Priority: P0 | Estimate: 5 pts

2) Create meeting (manual)
User story: As a meeting organizer, I want to create a meeting record so I can attach audio and generate notes.
AC: Organizer can create meeting with title, date/time, participants. Meeting appears in list. Organizer can open details page.
Priority: P0 | Estimate: 3 pts | Depends: Story 1

3) Upload audio file to meeting
User story: As an organizer, I want to upload an audio file so it can be transcribed.
AC: Supports MP3/WAV. File size limit enforced. Upload progress visible. File linked to meeting.
Priority: P0 | Estimate: 5 pts | Depends: Story 2

4) Processing pipeline job status
User story: As a user, I want to see processing status so I know when notes will be ready.
AC: Meeting shows states: Queued, Processing, Ready, Failed. User can refresh. Failed includes reason and retry.
Priority: P0 | Estimate: 5 pts | Depends: Story 3

5) Generate and display transcript
User story: As a user, I want a transcript so I can reference exact wording.
AC: Transcript renders on meeting page. Timestamped paragraphs. Basic search-in-transcript.
Priority: P1 | Estimate: 8 pts | Depends: Story 4

6) Generate summary, decisions, and action items
User story: As a user, I want structured notes so I can quickly understand outcomes.
AC: Meeting page shows Summary, Decisions, Action Items sections. Each action item has text, assignee, due date.
Priority: P0 | Estimate: 8 pts | Depends: Story 4

Epic B — Review, sharing, and export
7) Edit notes before sharing
User story: As an organizer, I want to edit generated notes so I can correct mistakes.
AC: Organizer can edit summary/decisions/actions. Save creates version timestamp. Non-organizers read-only.
Priority: P0 | Estimate: 5 pts | Depends: Story 6

8) Share meeting notes link with permissions
User story: As an organizer, I want to share notes securely so participants can access them.
AC: Organizer can generate a share link. Access modes: anyone with link / only invited. Organizer can revoke.
Priority: P0 | Estimate: 8 pts | Depends: Stories 2, 7

9) Export notes to PDF and TXT
User story: As a user, I want to export notes so I can store or send them outside the app.
AC: Export includes title/date/participants + summary/decisions/actions. PDF and TXT download. Reflects latest edits.
Priority: P1 | Estimate: 3 pts | Depends: Story 7

Epic C — Action-item follow-through and admin controls
10) Email notifications for assigned action items
User story: As an assignee, I want an email notification so I don't miss my tasks.
AC: Action item assigned/updated → assignee receives email. Email includes meeting title, action, due date, link.
Priority: P1 | Estimate: 5 pts | Depends: Stories 6, 8

11) Admin retention policy + delete meeting
User story: As a workspace admin, I want retention controls so we meet compliance needs.
AC: Admin can set retention period (30/90/180 days). Admin/Organizer can delete meeting. Audit record for deletes.
Priority: P1 | Estimate: 8 pts | Depends: Stories 1, 2
`;

// ── SDLC Templates ─────────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  blue:    { bg: 'bg-blue-100 dark:bg-blue-900/40',    text: 'text-blue-700 dark:text-blue-300',    bar: 'bg-blue-500' },
  indigo:  { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300', bar: 'bg-indigo-500' },
  purple:  { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', bar: 'bg-purple-500' },
  amber:   { bg: 'bg-amber-100 dark:bg-amber-900/40',   text: 'text-amber-700 dark:text-amber-300',   bar: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-500' },
};

type SDLCTemplateId = 'agile' | 'lean' | 'phased';

const SDLC_TEMPLATES: Record<SDLCTemplateId, { name: string; icon: string; desc: string; phases: { name: string; pct: number; color: string }[] }> = {
  agile: {
    name: 'Standard Agile',
    icon: '🏃',
    desc: '2-week sprints with dedicated QA phase',
    phases: [
      { name: 'Discovery & Planning', pct: 0.10, color: 'blue' },
      { name: 'Development', pct: 0.60, color: 'purple' },
      { name: 'QA & Testing', pct: 0.20, color: 'amber' },
      { name: 'Release', pct: 0.10, color: 'emerald' },
    ],
  },
  lean: {
    name: 'Lean / CI-CD',
    icon: '⚡',
    desc: 'Short cycles, test-as-you-build',
    phases: [
      { name: 'Kickoff', pct: 0.05, color: 'blue' },
      { name: 'Build & Test', pct: 0.80, color: 'purple' },
      { name: 'Ship', pct: 0.15, color: 'emerald' },
    ],
  },
  phased: {
    name: 'Phase-Gated',
    icon: '📋',
    desc: 'Formal gates between each phase',
    phases: [
      { name: 'Requirements', pct: 0.15, color: 'blue' },
      { name: 'Design', pct: 0.15, color: 'indigo' },
      { name: 'Development', pct: 0.40, color: 'purple' },
      { name: 'Testing', pct: 0.20, color: 'amber' },
      { name: 'Deployment', pct: 0.10, color: 'emerald' },
    ],
  },
};

// ── Phase type inference ───────────────────────────────────────────────────
// Maps an SDLC template phase name to the closest PhaseType enum value.
function inferPhaseTypeFromName(name: string): PhaseType {
  const l = name.toLowerCase();
  if (l.includes('dev') || l.includes('build')) return 'DevWindow';
  if (l.includes('test') || l.includes('qa') || l.includes('sit') || l.includes('uat')) return 'Testing';
  if (l.includes('deploy')) return 'Deployment';
  if (l.includes('release') || l.includes('launch') || l.includes('ship')) return 'Launch';
  return 'Custom';
}

// ── Seniority helper ────────────────────────────────────────────────────────

function getSeniorityLabel(member: TeamMember): string {
  const vm = member.velocityMultiplier ?? 1;
  if (vm >= 1.4) return 'Senior';
  if (vm >= 1.1) return 'Mid';
  if (vm >= 0.9) return 'Junior';
  return 'Junior';
}

function getSeniorityColor(member: TeamMember): string {
  const vm = member.velocityMultiplier ?? 1;
  if (vm >= 1.4) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  if (vm >= 1.1) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
}

// ── Auto release name (quick LLM call) ─────────────────────────────────────

async function generateReleaseName(prdText: string, productName: string): Promise<string> {
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        messages: [
          {
            role: 'system',
            content: 'You extract a concise release name from a PRD. Return ONLY the release name — nothing else. Format: "ProductName vX.Y" or "ProductName — FeatureName". Max 8 words.',
          },
          {
            role: 'user',
            content: `Product context: "${productName}"\n\nPRD excerpt:\n${prdText.substring(0, 1200)}\n\nGenerate a release name:`,
          },
        ],
        stream: false,
        options: { temperature: 0.2, num_predict: 32 },
      }),
    });
    if (!res.ok) return `${productName} v1.0`;
    const data = await res.json();
    const raw = (data.message?.content ?? '').trim().replace(/^["']|["']$/g, '').trim();
    return raw.length > 2 && raw.length < 80 ? raw : `${productName} v1.0`;
  } catch {
    return `${productName} v1.0`;
  }
}

interface PRDReleasePlanModalProps {
  productId: string;
  productName: string;
  teamMembers: TeamMember[];
  holidays?: Holiday[];
  onClose: () => void;
  /** Called with the fully planned release — parent is responsible for saving */
  onGenerate: (release: Release, parkedFeatureName?: string) => void;
}

// ── Helper: sprint-aware per-developer assignment ────────────────────────
//
// Pass 1 of runSprintPreview uses the planning engine to bin-pack tickets into
// sprints (team-aggregate capacity).  The mapper then needs to schedule each
// developer's tickets sequentially within those sprint calendar windows.
//
// Problem: if a developer is assigned more effort than sprint.workingDays, their
// sequential chain overflows into the next sprint's calendar window → the tooltip
// in the timeline reports "X days over".
//
// This function redistributes tickets within each sprint so that no developer's
// total effort in a sprint exceeds sprint.workingDays, preventing the overflow.

const SPRINT_AWARE_DEV_ROLES = new Set([
  'Developer', 'Fullstack', 'Frontend', 'Backend', 'iOS', 'Android', 'DataEngineer',
]);

function computeSprintAwareAssignments(
  domainSprints: Array<{ workingDays: number; tickets: TicketInput[] }>,
  sourceTickets: ExtractedTicket[],   // indexed parallel to tmp-N ids
  teamMembers: TeamMember[],
): Map<string, string> {              // ticketId → assignee name
  const assignments = new Map<string, string>();

  // Fast lookup: ticket id → required role (from the extracted ticket)
  const roleById = new Map<string, string | undefined>();
  sourceTickets.forEach((t, i) => roleById.set(`tmp-${i}`, t.requiredRole));

  for (const sprint of domainSprints) {
    const cap = sprint.workingDays;   // per-developer capacity ceiling for this sprint
    const devLoad = new Map<string, number>();
    for (const m of teamMembers) devLoad.set(m.name, 0);

    for (const ticket of sprint.tickets) {
      const requiredRole = roleById.get(ticket.id);

      // Candidate priority: exact role match → developer-type fallback → anyone
      let candidates = requiredRole
        ? teamMembers.filter(m => m.role === requiredRole)
        : [];
      if (candidates.length === 0)
        candidates = teamMembers.filter(m => SPRINT_AWARE_DEV_ROLES.has(m.role));
      if (candidates.length === 0)
        candidates = [...teamMembers];

      // Prefer candidates that still fit within this sprint's per-dev capacity ceiling
      const fitting = candidates.filter(
        m => (devLoad.get(m.name) ?? 0) + ticket.effortDays <= cap,
      );
      // Soft fallback: if every candidate would overflow, pick the least-loaded one
      // (better to have a small overflow than to leave a ticket unassigned)
      const pool = fitting.length > 0 ? fitting : candidates;

      const pick = pool.reduce((best, m) =>
        (devLoad.get(m.name) ?? 0) < (devLoad.get(best.name) ?? 0) ? m : best,
      );

      assignments.set(ticket.id, pick.name);
      devLoad.set(pick.name, (devLoad.get(pick.name) ?? 0) + ticket.effortDays);
    }
  }

  return assignments;
}

// ── Helper: build a temporary Release from extracted tickets ──────────────

function buildTempRelease(
  tickets: ExtractedTicket[],
  releaseName: string,
  startDate: Date,
  endDate: Date,
): Release {
  // Group tickets by epic
  const epicMap = new Map<string, Ticket[]>();
  tickets.forEach((t, i) => {
    const appTicket: Ticket = {
      id: `tmp-${i}`,
      title: t.title,
      description: t.description,
      acceptanceCriteria: t.acceptanceCriteria || undefined,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'planned',
      storyPoints: t.effortDays,   // kept for compatibility
      effortDays: t.effortDays,
      assignedTo: t.suggestedAssignee || '',
      requiredRole: t.requiredRole,
      dependencies: t.dependsOnTempIds.length > 0
        ? { blockedBy: t.dependsOnTempIds }
        : undefined,
    };
    if (!epicMap.has(t.epic)) epicMap.set(t.epic, []);
    epicMap.get(t.epic)!.push(appTicket);
  });

  const features: Feature[] = Array.from(epicMap.entries()).map(([name, epicTickets], i) => ({
    id: `f-tmp-${i}`,
    name,
    tickets: epicTickets,
  }));

  return {
    id: `r-tmp-${Date.now()}`,
    name: releaseName,
    startDate,
    endDate,
    features,
    sprints: [],
    milestones: [],
    storyPointMapping: SP_PRESETS.linear,
  };
}

// ── Sub-component: Agent Status Card ─────────────────────────────────────

function AgentCard({ icon, name, description, status }: {
  icon: string; name: string; description: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300',
      status === 'complete'    && 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20',
      status === 'processing'  && 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30 shadow-sm',
      status === 'pending'     && 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/30 opacity-50',
      status === 'error'       && 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20',
    )}>
      <span className="text-xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{description}</p>
      </div>
      <div className="flex-shrink-0">
        {status === 'complete'   && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        {status === 'processing' && <RefreshCw    className="w-4 h-4 text-blue-500 animate-spin" />}
        {status === 'pending'    && <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
        {status === 'error'      && <AlertTriangle className="w-4 h-4 text-red-500" />}
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────

export function PRDReleasePlanModal({
  productName,
  teamMembers,
  holidays = mockHolidays,
  onClose,
  onGenerate,
}: PRDReleasePlanModalProps) {

  // ── Step state ──
  const [step, setStep] = useState<WizardStep>('upload');

  // ── Upload ──
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [prdText, setPrdText] = useState('');

  // ── Processing ──
  const [progress, setProgress] = useState<PipelineProgress>({ agentIndex: 0, status: 'pending', overallPercent: 0, message: '' });
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [pipelineError, setPipelineError] = useState('');
  const processingStartTime = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Tick elapsed time every second while on the processing step.
  useEffect(() => {
    if (step !== 'processing') {
      setElapsedSeconds(0);
      processingStartTime.current = null;
      return;
    }
    if (processingStartTime.current === null) {
      processingStartTime.current = Date.now();
    }
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - processingStartTime.current!) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  // ── Ambiguity ──
  const [ambiguityIndex, setAmbiguityIndex] = useState(0);
  const [ambiguityAnswers, setAmbiguityAnswers] = useState<Record<string, Record<number, string>>>({});
  // Tickets with user clarifications baked into their descriptions (set after ambiguity step)
  const [amendedTickets, setAmendedTickets] = useState<ExtractedTicket[] | null>(null);

  // ── Release Config ──
  const today = new Date();
  const defaultEnd = new Date(today); defaultEnd.setMonth(defaultEnd.getMonth() + 3);
  const [releaseName, setReleaseName] = useState(`${productName} v1.0`);
  const [startDate, setStartDate] = useState(today.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().split('T')[0]);
  const [sprintLengthWeeks, setSprintLengthWeeks] = useState(2);

  // ── Sprint Preview (dry run result) ──
  const [dryRunResult, setDryRunResult] = useState<ReturnType<typeof dryRunRelease> | null>(null);

  // ── Conflict / overflow ──
  const [overflowResolution, setOverflowResolution] = useState<OverflowResolution>('park_next_release');

  // ── SDLC template & phase mode ──
  const [sdlcTemplate, setSdlcTemplate] = useState<SDLCTemplateId>('agile');
  const [phaseMode, setPhaseMode] = useState<'template' | 'custom' | 'skip'>('template');

  // ── Phase boundaries (N+1 dates for N phases, editable) ──
  const computeBoundaries = useCallback((sd: string, ed: string, tid: SDLCTemplateId): string[] => {
    const tpl = SDLC_TEMPLATES[tid];
    const startMs = new Date(sd).getTime();
    const totalMs = new Date(ed).getTime() - startMs;
    const bounds: string[] = [sd];
    let cumPct = 0;
    tpl.phases.forEach((ph, i) => {
      cumPct += ph.pct;
      const ms = i === tpl.phases.length - 1 ? new Date(ed).getTime() : startMs + totalMs * cumPct;
      bounds.push(new Date(ms).toISOString().split('T')[0]);
    });
    return bounds;
  }, []);

  const [phaseBoundaries, setPhaseBoundaries] = useState<string[]>(() =>
    computeBoundaries(
      new Date().toISOString().split('T')[0],
      (() => { const d = new Date(); d.setMonth(d.getMonth() + 3); return d.toISOString().split('T')[0]; })(),
      'agile'
    )
  );

  // Reset boundaries when template or outer dates change
  useEffect(() => {
    if (startDate && endDate) setPhaseBoundaries(computeBoundaries(startDate, endDate, sdlcTemplate));
  }, [sdlcTemplate, startDate, endDate, computeBoundaries]);

  const updateBoundary = (idx: number, value: string) => {
    setPhaseBoundaries(prev => {
      const next = [...prev];
      // clamp so boundary stays between its neighbours
      const lo = new Date(next[idx - 1] ?? next[0]).getTime() + 86400000;
      const hi = new Date(next[idx + 1] ?? next[next.length - 1]).getTime() - 86400000;
      const clamped = Math.min(hi, Math.max(lo, new Date(value).getTime()));
      next[idx] = new Date(clamped).toISOString().split('T')[0];
      return next;
    });
  };

  // ── Release name auto-generation ──
  const [releaseNameLoading, setReleaseNameLoading] = useState(false);

  // ── PRD Quality Score ──
  const [prdQuality, setPrdQuality]       = useState<PRDQualityResult | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);

  // ── AC expand/collapse (preview step) ──
  const [expandedAC, setExpandedAC] = useState<Set<string>>(new Set());
  const toggleAC = (tempId: string) =>
    setExpandedAC(prev => {
      const next = new Set(prev);
      next.has(tempId) ? next.delete(tempId) : next.add(tempId);
      return next;
    });

  // ── Keyboard close ──
  // (handled via button only — no useEffect to avoid stale closure issues)

  // ── File handling ──────────────────────────────────────────────────────

  const runQualityScore = async (text: string) => {
    if (!text.trim()) return;
    setQualityLoading(true);
    setPrdQuality(null);
    try {
      const result = await scorePRDQuality(text);
      setPrdQuality(result);
    } catch {
      // Quality score is best-effort — don't block the user
    } finally {
      setQualityLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setPrdQuality(null);
    readFileAsText(file)
      .then(text => { setPrdText(text); runQualityScore(text); })
      .catch(err => console.error('File read error:', err));
  };

  const handleTextDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setPrdQuality(null);
    readFileAsText(file)
      .then(text => { setPrdText(text); runQualityScore(text); })
      .catch(err => console.error('File read error:', err));
  };

  // ── Processing ─────────────────────────────────────────────────────────

  const startProcessing = async () => {
    if (!prdText.trim()) return;
    setStep('processing');
    setPipelineError('');

    try {
      // Fire LLM auto-name in parallel with pipeline — doesn't block
      setReleaseNameLoading(true);
      generateReleaseName(prdText, productName).then(name => {
        setReleaseName(name);
        setReleaseNameLoading(false);
      });

      const result = await runPRDPipeline(prdText, teamMembers, p => setProgress(p));
      setPipelineResult(result);

      // Auto-compute dates from effort now that we have tickets
      const totalDays = result.tickets.reduce((s, t) => s + t.effortDays, 0);
      const dailyCap  = Math.max(1, teamMembers.length) * 0.8;
      const calWeeks  = Math.ceil(totalDays / (dailyCap * 5));
      const auto_end  = new Date();
      auto_end.setDate(auto_end.getDate() + calWeeks * 7);
      setEndDate(auto_end.toISOString().split('T')[0]);

      setStep('preview');
    } catch (err) {
      setPipelineError(err instanceof Error ? err.message : 'Pipeline failed');
      setProgress(p => ({ ...p, status: 'error', message: 'Processing failed' }));
    }
  };

  // ── Ambiguity answer application ────────────────────────────────────────
  // Bakes user's clarification selections into ticket descriptions so the
  // planning engine and canvas both see the enriched text.
  const applyAmbiguityAnswers = useCallback(() => {
    if (!pipelineResult) return;
    const updated = pipelineResult.tickets.map(t => {
      const answers = ambiguityAnswers[t.tempId];
      if (!answers || Object.keys(answers).length === 0) return t;
      const clarifications = (t.ambiguities ?? [])
        .map((q, qi) => (answers[qi] != null ? `• ${q.question} → ${answers[qi]}` : null))
        .filter((line): line is string => Boolean(line))
        .join('\n');
      if (!clarifications) return t;
      return {
        ...t,
        description: t.description
          ? `${t.description}\n\nClarifications:\n${clarifications}`
          : `Clarifications:\n${clarifications}`,
      };
    });
    setAmendedTickets(updated);
  }, [pipelineResult, ambiguityAnswers]);

  // ── Sprint preview (dry run) ───────────────────────────────────────────
  //
  // Two-pass approach to fix the sprint tooltip "X days over" mismatch:
  //
  // Pass 1 — bin-pack tickets into sprints using team-aggregate capacity.
  //   The planning engine ignores individual assignments when packing, so
  //   the sprint structure produced here is stable regardless of who is
  //   assigned to each ticket.
  //
  // Sprint-aware assignment — for each sprint, redistribute tickets so that
  //   no developer's effort exceeds sprint.workingDays.  This prevents the
  //   sequential mapper in domainToAppMapper from producing calendar dates
  //   that overflow into the next sprint's window.
  //
  // Pass 2 — re-run with sprint-aware assignments.  The bin-packing is
  //   identical to pass 1 (deterministic, same inputs), but now each
  //   developer's chain of tickets stays within their sprint boundary.

  const runSprintPreview = () => {
    if (!pipelineResult) return;
    try {
      // Identify DevWindow phase boundaries (same logic as before)
      const isTemplateMode = phaseMode === 'template' && phaseBoundaries.length > 2;
      let devStart = startDate;
      let devEnd   = endDate;
      if (isTemplateMode) {
        const tpl = SDLC_TEMPLATES[sdlcTemplate];
        const devIdxs = tpl.phases
          .map((ph, i) => (inferPhaseTypeFromName(ph.name) === 'DevWindow' ? i : -1))
          .filter(i => i >= 0);
        const firstDev = devIdxs[0] ?? 1;
        const lastDev  = devIdxs[devIdxs.length - 1] ?? (tpl.phases.length - 2);
        devStart = phaseBoundaries[firstDev]  ?? startDate;
        devEnd   = phaseBoundaries[lastDev + 1] ?? endDate;
      }
      const safeDevStart = devStart < devEnd ? devStart : startDate;
      const safeDevEnd   = safeDevStart < devEnd ? devEnd : endDate;

      const sourceTickets = amendedTickets ?? pipelineResult.tickets;

      // ── Pass 1: determine sprint structure ──────────────────────────────
      const tempReleasePass1 = buildTempRelease(
        sourceTickets,
        releaseName,
        new Date(safeDevStart),
        new Date(safeDevEnd),
      );
      const pass1 = dryRunRelease(tempReleasePass1, teamMembers, holidays, sprintLengthWeeks * 7);
      if (!pass1.success) {
        setDryRunResult(pass1);
        setStep('sprint_preview');
        return;
      }

      // ── Sprint-aware reassignment ────────────────────────────────────────
      // Redistribute tickets within each sprint so no developer's effort
      // exceeds sprint.workingDays.  Tickets not placed in any sprint (overflow)
      // keep their pipeline-assigned suggestedAssignee.
      const sprintAssignments = computeSprintAwareAssignments(
        pass1.plan.sprints,
        sourceTickets,
        teamMembers,
      );
      const reassignedTickets = sourceTickets.map((t, i) => ({
        ...t,
        suggestedAssignee: sprintAssignments.get(`tmp-${i}`) ?? t.suggestedAssignee ?? '',
      }));

      // ── Pass 2: build final release with corrected assignments ───────────
      const tempReleasePass2 = buildTempRelease(
        reassignedTickets,
        releaseName,
        new Date(safeDevStart),
        new Date(safeDevEnd),
      );
      const result = dryRunRelease(tempReleasePass2, teamMembers, holidays, sprintLengthWeeks * 7);
      setDryRunResult(result);
      if (result.success && result.plan.overflowTickets.length > 0) {
        setOverflowResolution('park_next_release');
      }
    } catch (err) {
      setDryRunResult({
        success: false,
        error: err instanceof Error ? err.message : 'Sprint preview failed — please adjust dates and try again.',
      });
    }
    setStep('sprint_preview');
  };

  // ── Commit: generate the real release ─────────────────────────────────

  const handleGenerate = () => {
    if (!dryRunResult || !dryRunResult.success) return;

    const finalRelease = { ...dryRunResult.release };
    finalRelease.id = `r-${crypto.randomUUID()}`;

    // Restore the outer release window.
    // dryRunResult.release was built against the inner dev-window dates
    // (safeDevStart → safeDevEnd).  The committed release must span the full
    // outer window so the timeline renders all phases correctly.
    finalRelease.startDate = new Date(startDate + 'T12:00:00');
    finalRelease.endDate   = new Date(endDate   + 'T12:00:00');

    // Build Phase objects so TimelinePanel never falls back to auto-generating
    // mock phases (which would mis-classify tickets as outside the dev window).
    //
    // Rules that mirror runSprintPreview:
    //   • template mode → one Phase per SDLC phase, derived from phaseBoundaries.
    //     Phases 1 … N-2 (everything except first + last) have allowsWork=true.
    //   • skip / custom → single DevWindow spanning the full outer window.
    if (phaseMode === 'template' && phaseBoundaries.length > 2) {
      const tpl = SDLC_TEMPLATES[sdlcTemplate];
      // Determine which phases are actual coding phases (DevWindow) by name.
      // Only those phases get allowsWork=true; QA/Testing/Release do NOT.
      const devIdxs = tpl.phases
        .map((ph, i) => (inferPhaseTypeFromName(ph.name) === 'DevWindow' ? i : -1))
        .filter(i => i >= 0);
      const lastDevPhaseIdx = devIdxs[devIdxs.length - 1] ?? (tpl.phases.length - 2);
      const lastPhaseIdx    = tpl.phases.length - 1;

      finalRelease.phases = tpl.phases.map((ph, i): Phase => {
        const phStart  = new Date(phaseBoundaries[i]     + 'T12:00:00');
        const nextDate = new Date(phaseBoundaries[i + 1] + 'T12:00:00');
        // The last DevWindow phase and the last overall phase end exactly on their
        // boundary (no -1 day).  The planner schedules tickets up to the
        // DevWindow boundary inclusive, so phEnd must match exactly.
        const phEnd = (i === lastPhaseIdx || i === lastDevPhaseIdx)
          ? nextDate
          : new Date(nextDate.getTime() - 86_400_000);
        return {
          id: `phase-${i}-${finalRelease.id}`,
          releaseId: finalRelease.id,
          name: ph.name,
          type: inferPhaseTypeFromName(ph.name),
          startDate: phStart,
          endDate:   phEnd,
          // allowsWork is true ONLY for phases named as DevWindow (e.g. "Development").
          // QA & Testing, Release, and Discovery phases are not scheduling zones.
          allowsWork: inferPhaseTypeFromName(ph.name) === 'DevWindow',
          order: i + 1,
        };
      });
    } else {
      // No template (skip/custom) → single dev window covering the full window.
      finalRelease.phases = [{
        id: `phase-dev-${finalRelease.id}`,
        releaseId: finalRelease.id,
        name: 'Dev Window',
        type: 'DevWindow' as PhaseType,
        startDate: new Date(startDate + 'T12:00:00'),
        endDate:   new Date(endDate   + 'T12:00:00'),
        allowsWork: true,
        order: 1,
      }];
    }

    // Re-attach description + acceptanceCriteria that the domain planner strips
    // during allocation. buildTempRelease assigns IDs as `tmp-${i}` matching the
    // source tickets array index — walk all features and restore metadata by ID.
    if (pipelineResult) {
      const sourceTickets = amendedTickets ?? pipelineResult.tickets;
      const metaMap = new Map<string, { description: string; acceptanceCriteria?: string }>();
      sourceTickets.forEach((t, i) => {
        metaMap.set(`tmp-${i}`, { description: t.description, acceptanceCriteria: t.acceptanceCriteria });
      });
      finalRelease.features = finalRelease.features.map(feature => ({
        ...feature,
        tickets: feature.tickets.map(ticket => {
          const meta = metaMap.get(ticket.id);
          return meta ? { ...ticket, ...meta } : ticket;
        }),
      }));
    }

    // Handle overflow tickets based on the user's chosen resolution.
    // The planning engine puts them in a "Deferred (Out of Scope)" feature.
    //   park_next_release → keep them, rename to "Parked — Next Release"
    //                        (visible in canvas so user can action them later)
    //   skip              → drop them entirely
    //   extend_window     → routes to "Back to Configure" button, never reaches here
    if (overflowResolution === 'park_next_release') {
      finalRelease.features = finalRelease.features.map(f =>
        f.name === 'Deferred (Out of Scope)'
          ? { ...f, name: 'Parked — Next Release' }
          : f
      );
    } else {
      // skip: exclude overflow tickets from this release
      finalRelease.features = finalRelease.features.filter(
        f => f.name !== 'Deferred (Out of Scope)'
      );
    }

    onGenerate(finalRelease);

    setStep('complete');
  };

  // ── Derived ────────────────────────────────────────────────────────────

  const totalEffortDays = pipelineResult?.tickets.reduce((s, t) => s + t.effortDays, 0) ?? 0;
  const teamDailyCapacity = teamMembers.length * 0.8; // 80% focus factor
  const estimatedSprints = teamDailyCapacity > 0
    ? Math.ceil(totalEffortDays / (teamDailyCapacity * sprintLengthWeeks * 5))
    : 0;

  // Dev Window capacity projection — used in release_config step for early warning.
  // Scope to ONLY the DevWindow-named phases (e.g. "Development"), NOT all middle phases.
  // QA & Testing adds calendar days to phaseBoundaries[N-2] but is NOT a dev-work zone.
  const isTemplatePreview = phaseMode === 'template' && phaseBoundaries.length > 2;
  const _capTpl = isTemplatePreview ? SDLC_TEMPLATES[sdlcTemplate] : null;
  const _capDevIdxs = _capTpl
    ? _capTpl.phases
        .map((ph, i) => (inferPhaseTypeFromName(ph.name) === 'DevWindow' ? i : -1))
        .filter(i => i >= 0)
    : [];
  const _firstCapDev = _capDevIdxs[0] ?? 1;
  const _lastCapDev  = _capDevIdxs[_capDevIdxs.length - 1] ?? (_capTpl ? _capTpl.phases.length - 2 : 1);
  const devWindowStart = isTemplatePreview ? (phaseBoundaries[_firstCapDev]    ?? startDate) : startDate;
  const devWindowEnd   = isTemplatePreview ? (phaseBoundaries[_lastCapDev + 1] ?? endDate)   : endDate;
  const windowCalDays = devWindowStart && devWindowEnd
    ? (new Date(devWindowEnd).getTime() - new Date(devWindowStart).getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const windowWorkingDays = Math.round(windowCalDays * 5 / 7);
  const windowCapacityDays = Math.round(windowWorkingDays * Math.max(1, teamMembers.length) * 0.8);
  const projectedOverflowDays = Math.max(0, totalEffortDays - windowCapacityDays);
  const projectedOverflowTickets = projectedOverflowDays > 0 && pipelineResult
    ? Math.ceil(pipelineResult.tickets.length * (projectedOverflowDays / totalEffortDays))
    : 0;

  const ambiguousTickets = pipelineResult?.ambiguousTickets ?? [];
  const currentAmbiguous = ambiguousTickets[ambiguityIndex];

  // Use exact overflow from planning engine — plan.overflowTickets is authoritative
  const overflowCount = dryRunResult?.success ? dryRunResult.plan.overflowTickets.length : 0;
  const overflowTickets: TicketInput[] = dryRunResult?.success ? dryRunResult.plan.overflowTickets : [];

  // ── Step Labels (progress bar) ─────────────────────────────────────────

  const VISIBLE_STEPS: { key: WizardStep; label: string }[] = [
    { key: 'upload',         label: 'Upload' },
    { key: 'processing',     label: 'Processing' },
    { key: 'preview',        label: 'Preview' },
    { key: 'release_config', label: 'Configure' },
    { key: 'sprint_preview', label: 'Sprint Plan' },
    { key: 'complete',       label: 'Done' },
  ];
  const currentVisibleIndex = VISIBLE_STEPS.findIndex(s =>
    step === s.key ||
    (step === 'ambiguity' && s.key === 'preview') ||
    (step === 'conflict'  && s.key === 'sprint_preview')
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                      w-[720px] max-h-[88vh] flex flex-col
                      bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
                      rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700
                        bg-gradient-to-r from-blue-50/60 to-purple-50/40 dark:from-blue-950/30 dark:to-purple-950/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Plan from PRD</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{productName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Progress Bar */}
        {step !== 'complete' && (
          <div className="px-6 pt-4 pb-2 flex-shrink-0">
            <div className="flex items-center gap-1">
              {VISIBLE_STEPS.map((s, i) => (
                <div key={s.key} className="flex items-center gap-1 flex-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className={cn(
                      'w-full h-1 rounded-full transition-all duration-500',
                      i <= currentVisibleIndex ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                    )} />
                    <span className={cn(
                      'text-[10px] font-medium',
                      i <= currentVisibleIndex ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                    )}>{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── STEP: UPLOAD ─────────────────────────────────────────── */}
          {step === 'upload' && (
            <div className="px-6 py-5 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Upload Your PRD</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Supported: .txt, .md, .pdf, .docx — AI will extract tickets, assign roles, estimate effort
                </p>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleTextDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
                  fileName
                    ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:border-blue-600 dark:hover:bg-blue-950/20'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {fileName ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{fileName}</p>
                    <p className="text-xs text-slate-500">{(prdText.length / 1024).toFixed(1)} KB loaded</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Drop PRD here or click to browse</p>
                      <p className="text-xs text-slate-400 mt-1">.txt, .md, .pdf, .docx files</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sample PRD shortcut */}
              {!fileName && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">or</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                </div>
              )}
              {!fileName && (
                <button
                  type="button"
                  onClick={() => {
                    setPrdText(SAMPLE_PRD_TEXT);
                    setFileName('MeetingMate-sample.md');
                    runQualityScore(SAMPLE_PRD_TEXT);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:border-blue-700 dark:hover:bg-blue-950/20 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Try with sample PRD — MeetingMate
                </button>
              )}

              {/* PRD Quality Score — appears after file is loaded */}
              {(qualityLoading || prdQuality) && (
                <div className={cn(
                  'rounded-xl border p-3 transition-all',
                  qualityLoading && 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40',
                  prdQuality && prdQuality.score >= 75 && 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20',
                  prdQuality && prdQuality.score >= 50 && prdQuality.score < 75 && 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20',
                  prdQuality && prdQuality.score < 50 && 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20',
                )}>
                  {qualityLoading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                      <span className="text-xs text-slate-500">Scoring PRD quality…</span>
                    </div>
                  ) : prdQuality && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{
                            color: prdQuality.score >= 75 ? '#059669' : prdQuality.score >= 50 ? '#d97706' : '#dc2626'
                          }}>
                            {prdQuality.grade}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">PRD Quality Score</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-24 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${prdQuality.score}%`,
                                backgroundColor: prdQuality.score >= 75 ? '#059669' : prdQuality.score >= 50 ? '#d97706' : '#dc2626',
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{prdQuality.score}/100</span>
                        </div>
                      </div>
                      {prdQuality.missing.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {prdQuality.missing.slice(0, 3).map(m => (
                            <span key={m} className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md font-medium">
                              Missing: {m}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">{prdQuality.suggestion}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Team roster */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {teamMembers.length} Team Member{teamMembers.length !== 1 ? 's' : ''} — role-based auto-assignment
                  </span>
                </div>
                {teamMembers.length === 0 ? (
                  <div className="px-3.5 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      <span className="font-semibold">No team configured for this product.</span>{' '}
                      Using shared team members for assignment.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {teamMembers.map(m => {
                      const initials = m.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                      return (
                        <div key={m.id ?? m.name} className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-white">{initials}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{m.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] px-1 py-0 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded font-medium">
                                {m.role}
                              </span>
                              <span className={cn('text-[10px] px-1 py-0 rounded font-medium', getSeniorityColor(m))}>
                                {getSeniorityLabel(m)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP: PROCESSING ─────────────────────────────────────── */}
          {step === 'processing' && (
            <div className="px-6 py-5 space-y-4">
              <div className="text-center mb-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">AI Agents Processing</h4>
                <p className="text-xs text-slate-500 mt-1">{progress.message || 'Starting...'}</p>
              </div>

              {/* Agent cards */}
              <div className="space-y-2">
                {PIPELINE_AGENTS.map((agent, i) => {
                  let status: 'pending' | 'processing' | 'complete' | 'error' = 'pending';
                  if (i < progress.agentIndex) status = 'complete';
                  else if (i === progress.agentIndex) status = progress.status === 'error' ? 'error' : 'processing';
                  return (
                    <AgentCard key={i} {...agent} status={status} />
                  );
                })}
              </div>

              {/* Overall progress bar + ETA */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Overall progress</span>
                  <span>{progress.overallPercent}%</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress.overallPercent}%` }}
                  />
                </div>
                {/* Real-time ETA row */}
                {(() => {
                  // Typical per-agent LLM duration weights (seconds) — purely for ETA estimate.
                  const agentWeights = [8, 12, 20, 30, 10, 18]; // total ~98s
                  const totalWeight  = agentWeights.reduce((s, w) => s + w, 0);
                  const completedWeight = agentWeights.slice(0, progress.agentIndex).reduce((s, w) => s + w, 0);
                  const currentAgentFrac = progress.overallPercent / 100 - completedWeight / totalWeight;
                  const estimatedTotal = completedWeight > 0
                    ? Math.round(elapsedSeconds / (completedWeight / totalWeight + currentAgentFrac))
                    : totalWeight;
                  const remaining = Math.max(0, estimatedTotal - elapsedSeconds);
                  const fmt = (s: number) => s >= 60
                    ? `${Math.floor(s / 60)}m ${s % 60}s`
                    : `${s}s`;
                  return (
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        Elapsed: <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">{fmt(elapsedSeconds)}</span>
                      </span>
                      {progress.status !== 'complete' && progress.status !== 'error' && (
                        <span className="text-[11px] text-slate-400">
                          ETA: <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">~{fmt(remaining)}</span>
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>

              {pipelineError && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300">Pipeline failed</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{pipelineError}</p>
                    <p className="text-xs text-red-500 mt-1">Make sure Ollama is running: <code className="font-mono">ollama serve</code></p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: PREVIEW ────────────────────────────────────────── */}
          {step === 'preview' && pipelineResult && (
            <div className="px-6 py-5 space-y-4">
              {/* AI-generated release name chip */}
              <div className="flex items-center gap-2">
                {releaseNameLoading ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-700 rounded-full">
                    <RefreshCw className="w-3 h-3 text-purple-500 animate-spin" />
                    <span className="text-xs text-purple-600 dark:text-purple-300">Generating release name…</span>
                  </div>
                ) : releaseName ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-700 rounded-full">
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">{releaseName}</span>
                    <span className="text-[10px] text-purple-400 dark:text-purple-500">AI-named</span>
                  </div>
                ) : null}
              </div>

              {/* Auto-calculated timeline — editable */}
              <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Auto-calculated timeline</p>
                  <span className="text-[10px] text-blue-500 dark:text-blue-400 ml-auto">
                    based on {totalEffortDays}d effort · {Math.max(1, teamMembers.length)} devs @ 80%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-1 block uppercase tracking-wide">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-1 block uppercase tracking-wide">Dev Window End</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-blue-500 dark:text-blue-400">
                  Tickets that don&apos;t fit within this window will be flagged as overflow.
                </p>
              </div>

              {/* Summary Row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Layers,    label: 'Tickets',     value: pipelineResult.tickets.length },
                  { icon: Clock,     label: 'Total Effort', value: `${totalEffortDays}d` },
                  { icon: Calendar,  label: 'Est. Sprints', value: estimatedSprints || '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Icon className="w-4 h-4 text-blue-500 mb-1" />
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{value}</span>
                    <span className="text-xs text-slate-500">{label}</span>
                  </div>
                ))}
              </div>

              {/* Ambiguity warning */}
              {ambiguousTickets.length > 0 && (
                <div className="flex items-start gap-2 px-3.5 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <span className="font-semibold">{ambiguousTickets.length} ticket{ambiguousTickets.length > 1 ? 's' : ''}</span> need clarification (confidence &lt; 85%). You can resolve them now or skip.
                  </p>
                </div>
              )}

              {/* Ticket list grouped by epic */}
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {Array.from(new Set(pipelineResult.tickets.map(t => t.epic))).map(epic => {
                  const epicTickets = pipelineResult.tickets.filter(t => t.epic === epic);
                  return (
                    <div key={epic}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{epic}</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                        <span className="text-[10px] text-slate-400">{epicTickets.length} tickets</span>
                      </div>
                      <div className="space-y-1.5">
                        {epicTickets.map((t, i) => (
                          <div key={t.tempId} className={cn(
                            'flex items-start gap-3 px-3 py-2.5 rounded-xl border',
                            t.confidence < 85
                              ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/10'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30',
                          )}>
                            <span className="text-xs font-bold text-slate-400 mt-0.5 w-5 flex-shrink-0">#{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{t.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-medium">
                                  {t.effortDays}d
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded font-medium">
                                  {t.requiredRole}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-medium">
                                  {t.priority}
                                </span>
                                {t.confidence < 85 && (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5">
                                    <AlertTriangle className="w-3 h-3" />{t.confidence}%
                                  </span>
                                )}
                              </div>
                              {t.acceptanceCriteria && (
                                <div className="mt-1.5">
                                  <button
                                    onClick={() => toggleAC(t.tempId)}
                                    className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                                  >
                                    <span>{expandedAC.has(t.tempId) ? '▾' : '▸'}</span>
                                    <span>Acceptance Criteria</span>
                                  </button>
                                  {expandedAC.has(t.tempId) && (
                                    <pre className="mt-1 text-[10px] leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-2">
                                      {t.acceptanceCriteria}
                                    </pre>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP: AMBIGUITY ──────────────────────────────────────── */}
          {step === 'ambiguity' && currentAmbiguous && (
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Resolve Ambiguity</h4>
                <span className="text-xs text-slate-500">{ambiguityIndex + 1} / {ambiguousTickets.length}</span>
              </div>

              {/* Progress */}
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${((ambiguityIndex + 1) / ambiguousTickets.length) * 100}%` }}
                />
              </div>

              {/* Ticket */}
              <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">{currentAmbiguous.confidence}% confidence</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{currentAmbiguous.title}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{currentAmbiguous.sourceText}</p>
              </div>

              {/* Questions */}
              {currentAmbiguous.ambiguities?.map((q, qi) => (
                <div key={qi} className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
                    {q.question}
                  </p>
                  <div className="space-y-1.5 pl-5">
                    {q.options.map((opt, oi) => {
                      const isSelected = ambiguityAnswers[currentAmbiguous.tempId]?.[qi] === opt;
                      return (
                        <button
                          key={oi}
                          onClick={() => setAmbiguityAnswers(prev => ({
                            ...prev,
                            [currentAmbiguous.tempId]: { ...(prev[currentAmbiguous.tempId] ?? {}), [qi]: opt }
                          }))}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-lg text-xs border transition-all',
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-700',
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── STEP: RELEASE CONFIG ─────────────────────────────────── */}
          {step === 'release_config' && (
            <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[520px] pr-1">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Configure Release</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Set the release window and pick an SDLC template. The AI respects this boundary — overflow tickets will be flagged.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Release Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={releaseName}
                      onChange={e => setReleaseName(e.target.value)}
                      className="w-full text-sm px-3 py-2 pr-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {releaseName && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 rounded-full flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />AI
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">End Date (Dev Window)</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Sprint Length — {sprintLengthWeeks} week{sprintLengthWeeks !== 1 ? 's' : ''} ({sprintLengthWeeks * 7} days)
                  </label>
                  <input
                    type="range" min={1} max={4} step={1}
                    value={sprintLengthWeeks}
                    onChange={e => setSprintLengthWeeks(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>1 week</span><span>2 weeks</span><span>3 weeks</span><span>4 weeks</span>
                  </div>
                </div>

                {/* Phase Structure mode picker */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Phase Structure</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: 'template' as const, label: 'Use Template',  desc: 'Choose from predefined phase structures' },
                      { id: 'custom'   as const, label: 'Custom',         desc: 'Build your own phase structure' },
                      { id: 'skip'     as const, label: 'Skip',           desc: 'Continue without phases' },
                    ]).map(opt => {
                      const isActive = phaseMode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setPhaseMode(opt.id)}
                          className={cn(
                            'flex flex-col items-start px-3 py-2.5 rounded-xl border transition-all text-left',
                            isActive
                              ? 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30'
                              : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-800/30',
                          )}
                        >
                          <span className={cn('text-xs font-semibold', isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300')}>
                            {opt.label}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 leading-snug">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Template cards — only when mode = 'template' */}
                {phaseMode === 'template' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Select Template</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(SDLC_TEMPLATES) as [SDLCTemplateId, typeof SDLC_TEMPLATES[SDLCTemplateId]][]).map(([tid, tpl]) => {
                        const isActive = sdlcTemplate === tid;
                        return (
                          <button
                            key={tid}
                            onClick={() => setSdlcTemplate(tid)}
                            className={cn(
                              'flex flex-col items-start px-4 py-3 rounded-xl border transition-all text-left',
                              isActive
                                ? 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30'
                                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-800/30',
                            )}
                          >
                            <span className={cn('text-xs font-semibold', isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200')}>
                              {tpl.name}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5 leading-snug">{tpl.desc}</span>
                            <div className="flex gap-0.5 mt-2 w-full h-1.5 rounded-full overflow-hidden">
                              {tpl.phases.map(ph => (
                                <div
                                  key={ph.name}
                                  className={PHASE_COLORS[ph.color as keyof typeof PHASE_COLORS]?.bar ?? 'bg-slate-400'}
                                  style={{ width: `${ph.pct * 100}%` }}
                                />
                              ))}
                            </div>
                            <span className="text-[9px] text-slate-400 mt-1">{tpl.phases.length} phases</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom phase builder — mode = 'custom' */}
                {phaseMode === 'custom' && (
                  <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Plus className="w-3.5 h-3.5 text-amber-600" />
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Custom Phase Builder</p>
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-300">Custom phase entry is coming soon. For now, select a template and adjust the date boundaries below.</p>
                    <button
                      onClick={() => setPhaseMode('template')}
                      className="mt-2 text-[10px] font-semibold text-amber-700 dark:text-amber-300 underline hover:no-underline"
                    >
                      Switch to Template →
                    </button>
                  </div>
                )}

                {/* Phase Timeline — editable (only when template mode) */}
                {phaseMode === 'template' && startDate && endDate && phaseBoundaries.length > 1 && (() => {
                  const tpl = SDLC_TEMPLATES[sdlcTemplate];
                  const lastIdx = tpl.phases.length - 1;
                  // Use UTC-parsed dates for calDays so DST/timezone doesn't shift day counts.
                  // phaseBoundaries are YYYY-MM-DD strings computed at UTC midnight, so
                  // subtracting them directly gives correct calendar-day differences.
                  const totalMs = new Date(phaseBoundaries[phaseBoundaries.length - 1] + 'T12:00:00').getTime()
                                - new Date(phaseBoundaries[0] + 'T12:00:00').getTime();
                  const phases = tpl.phases.map((ph, i) => {
                    const phStartMs = new Date(phaseBoundaries[i] + 'T12:00:00').getTime();
                    const phEndMs   = new Date(phaseBoundaries[i + 1] + 'T12:00:00').getTime();
                    const pct = totalMs > 0 ? (phEndMs - phStartMs) / totalMs : ph.pct;
                    const calDays = Math.round((phEndMs - phStartMs) / (1000 * 60 * 60 * 24));
                    const workingDays = Math.round(calDays * 5 / 7);
                    const devDays = Math.round(workingDays * Math.max(1, teamMembers.length) * 0.8);
                    // endStr = phaseBoundaries[i+1] directly (exclusive end = start of next phase).
                    // This avoids same-day display when a phase is only 1-2 calendar days.
                    const endStr = phaseBoundaries[i + 1];
                    return { ...ph, startStr: phaseBoundaries[i], endStr, pct, calDays, workingDays, devDays, isLast: i === lastIdx };
                  });
                  const isModified = phaseBoundaries.some((b, i) => b !== computeBoundaries(startDate, endDate, sdlcTemplate)[i]);
                  return (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phase Timeline</p>
                        {isModified && (
                          <button
                            onClick={() => setPhaseBoundaries(computeBoundaries(startDate, endDate, sdlcTemplate))}
                            className="text-[10px] text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 underline"
                          >
                            Reset to auto
                          </button>
                        )}
                      </div>
                      {/* Gantt bar — widths driven by actual edited boundaries */}
                      <div className="flex h-5 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        {phases.map(ph => (
                          <div
                            key={ph.name}
                            className={cn(PHASE_COLORS[ph.color as keyof typeof PHASE_COLORS]?.bar ?? 'bg-slate-400', 'flex items-center justify-center transition-all')}
                            style={{ width: `${ph.pct * 100}%` }}
                            title={ph.name}
                          >
                            <span className="text-[8px] font-bold text-white truncate px-0.5">{ph.name}</span>
                          </div>
                        ))}
                      </div>
                      {/* Editable phase rows */}
                      <div className="space-y-1.5">
                        {phases.map((ph, i) => (
                          <div key={ph.name} className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                            <div className={cn('w-2.5 h-2.5 rounded-sm flex-shrink-0', PHASE_COLORS[ph.color as keyof typeof PHASE_COLORS]?.bar ?? 'bg-slate-400')} />
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 w-24 flex-shrink-0 truncate">{ph.name}</span>
                            {/* Start date — first phase locked to startDate */}
                            <input
                              type="date"
                              value={ph.startStr}
                              disabled={i === 0}
                              onChange={e => updateBoundary(i, e.target.value)}
                              className="text-[10px] px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-40 disabled:cursor-not-allowed w-28"
                            />
                            <span className="text-[10px] text-slate-400 flex-shrink-0">→</span>
                            {/* End date — last phase locked to endDate (same as outer end-date picker) */}
                            <input
                              type="date"
                              value={ph.endStr}
                              disabled={ph.isLast}
                              onChange={e => updateBoundary(i + 1, e.target.value)}
                              className="text-[10px] px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-40 disabled:cursor-not-allowed w-28"
                            />
                            {/* Dev days badge */}
                            <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                              <span className={cn(
                                'text-[10px] font-semibold px-1.5 py-0.5 rounded-md',
                                PHASE_COLORS[ph.color as keyof typeof PHASE_COLORS]?.bg ?? 'bg-slate-100',
                                PHASE_COLORS[ph.color as keyof typeof PHASE_COLORS]?.text ?? 'text-slate-600',
                              )} title={`${ph.calDays} calendar days · ${ph.workingDays} working days`}>
                                {ph.devDays}d
                              </span>
                              <span className="text-[10px] text-slate-400 w-7 text-right">
                                {Math.round(ph.pct * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Capacity estimate */}
                <div className={cn(
                  'px-4 py-3 rounded-xl border space-y-2',
                  projectedOverflowTickets > 0
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                )}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Capacity Estimate</p>
                    {projectedOverflowTickets > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="w-3 h-3" />
                        ~{projectedOverflowTickets} ticket{projectedOverflowTickets !== 1 ? 's' : ''} may exceed window
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total effort:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{totalEffortDays} dev-days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dev Window capacity:</span>
                      <span className={cn(
                        'font-semibold',
                        projectedOverflowTickets > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-800 dark:text-slate-200'
                      )}>{windowCapacityDays} dev-days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Est. sprints needed:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{estimatedSprints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tickets:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{pipelineResult?.tickets.length ?? 0} total</span>
                    </div>
                  </div>
                  {projectedOverflowTickets > 0 && (
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 pt-1 border-t border-amber-200 dark:border-amber-800">
                      Total effort ({totalEffortDays}d) exceeds the dev window capacity ({windowCapacityDays}d). Extend the dev window or plan to park ~{projectedOverflowTickets} ticket{projectedOverflowTickets !== 1 ? 's' : ''} in a future release.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: SPRINT PREVIEW ─────────────────────────────────── */}
          {step === 'sprint_preview' && dryRunResult && (
            <div className="px-6 py-5 space-y-4">
              {dryRunResult.success ? (
                <>
                  {/* Capacity summary banner */}
                  {overflowCount > 0 ? (
                    <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                          {(pipelineResult?.tickets.length ?? 0) - overflowCount} of {pipelineResult?.tickets.length} tickets fit — {overflowCount} auto-parked
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                          Overflow tickets are automatically parked to the next release. Extend window to include them.
                        </p>
                      </div>
                      <button
                        onClick={() => setStep('release_config')}
                        className="flex-shrink-0 text-[10px] font-semibold text-amber-700 dark:text-amber-300 underline hover:no-underline"
                      >
                        Extend window
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        All {pipelineResult?.tickets.length} tickets fit within the dev window
                      </p>
                    </div>
                  )}

                  {/* Phase legend — only in template mode */}
                  {phaseMode === 'template' && startDate && endDate && (() => {
                    const tpl = SDLC_TEMPLATES[sdlcTemplate];
                    return (
                      <div className="flex items-center gap-2 flex-wrap">
                        {tpl.phases.map(ph => (
                          <div key={ph.name} className="flex items-center gap-1">
                            <div className={cn('w-2.5 h-2.5 rounded-sm', PHASE_COLORS[ph.color as keyof typeof PHASE_COLORS]?.bar ?? 'bg-slate-400')} />
                            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{ph.name}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {/* Phase-grouped view (template mode) */}
                    {phaseMode === 'template' && phaseBoundaries.length > 1 && (() => {
                      const tpl = SDLC_TEMPLATES[sdlcTemplate];
                      // Use YYYY-MM-DD string ranges — avoids UTC-vs-local-midnight
                      // timezone drift that caused sprints to fall into the wrong phase.
                      const phaseRanges = tpl.phases.map((ph, i) => ({
                        ...ph,
                        startStr: phaseBoundaries[i],
                        endStr:   phaseBoundaries[i + 1],
                      }));

                      // Convert a Date to its LOCAL calendar date string (YYYY-MM-DD)
                      // so sprint.startDate (local midnight from date-fns) is compared
                      // consistently against phaseBoundary strings.
                      const toLocalDateStr = (d: Date): string => {
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        return `${y}-${m}-${day}`;
                      };

                      const getPhaseForSprint = (sprint: Sprint) => {
                        const ss = toLocalDateStr(new Date(sprint.startDate));
                        return phaseRanges.find(p => ss >= p.startStr && ss < p.endStr)
                          ?? phaseRanges[phaseRanges.length - 1];
                      };

                      // group sprints by phase
                      const grouped: { phase: typeof phaseRanges[0]; sprints: Sprint[] }[] = [];
                      (dryRunResult.release.sprints ?? []).forEach((sprint: Sprint) => {
                        const ph = getPhaseForSprint(sprint);
                        const existing = grouped.find(g => g.phase.name === ph.name);
                        if (existing) existing.sprints.push(sprint);
                        else grouped.push({ phase: ph, sprints: [sprint] });
                      });

                      return grouped.map(({ phase, sprints }) => (
                        <div key={phase.name}>
                          {/* Phase header */}
                          <div className={cn(
                            'flex items-center justify-between px-3 py-1.5 rounded-lg mb-2',
                            PHASE_COLORS[phase.color as keyof typeof PHASE_COLORS]?.bg ?? 'bg-slate-100'
                          )}>
                            <span className={cn('text-[10px] font-bold uppercase tracking-wider', PHASE_COLORS[phase.color as keyof typeof PHASE_COLORS]?.text ?? 'text-slate-700')}>
                              {phase.name}
                            </span>
                            <span className={cn('text-[10px]', PHASE_COLORS[phase.color as keyof typeof PHASE_COLORS]?.text ?? 'text-slate-600')}>
                              {new Date(phase.startStr + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} →{' '}
                              {new Date(phase.endStr + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          {/* Sprints in this phase */}
                          <div className="space-y-2 pl-2 border-l-2 ml-1" style={{ borderColor: undefined }}>
                            {sprints.map((sprint: Sprint) => {
                              const sprintTickets = dryRunResult.release.features.flatMap((f: Feature) =>
                                f.tickets.filter((t: Ticket) => {
                                  const ts = new Date(t.startDate).getTime();
                                  const ss = new Date(sprint.startDate).getTime();
                                  const se = new Date(sprint.endDate).getTime();
                                  return ts >= ss && ts <= se;
                                })
                              );
                              const totalEffort = sprintTickets.reduce((s: number, t: Ticket) => s + (t.effortDays ?? 1), 0);
                              const sprintWorkingDays = Math.round(
                                (new Date(sprint.endDate).getTime() - new Date(sprint.startDate).getTime()) / (1000 * 60 * 60 * 24) * 5 / 7
                              );
                              const teamCapForSprint = Math.max(1, teamMembers.length) * sprintWorkingDays * 0.8;
                              const capacityPct = Math.round((totalEffort / teamCapForSprint) * 100);

                              return (
                                <div key={sprint.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60">
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{sprint.name}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-500">
                                        {new Date(sprint.startDate).toLocaleDateString()} – {new Date(sprint.endDate).toLocaleDateString()}
                                      </span>
                                      <span className={cn(
                                        'text-[10px] font-bold px-1.5 py-0.5 rounded',
                                        capacityPct >= 90 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                          : capacityPct >= 70 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                      )}>
                                        {capacityPct}%
                                      </span>
                                    </div>
                                  </div>
                                  {/* Capacity bar */}
                                  <div className="h-1 bg-slate-100 dark:bg-slate-700">
                                    <div
                                      className={cn(
                                        'h-full transition-all',
                                        PHASE_COLORS[phase.color as keyof typeof PHASE_COLORS]?.bar ?? (
                                          capacityPct >= 100 ? 'bg-red-500'
                                            : capacityPct >= 90 ? 'bg-amber-400'
                                            : 'bg-blue-500'
                                        )
                                      )}
                                      style={{ width: `${Math.min(100, capacityPct)}%` }}
                                    />
                                  </div>
                                  {sprintTickets.length > 0 && (
                                    <div className="px-3 py-2 space-y-1">
                                      {sprintTickets.slice(0, 5).map((t: Ticket) => (
                                        <div key={t.id} className="flex items-center gap-2 text-xs">
                                          <span className="text-slate-400 flex-shrink-0 w-4 text-right">{t.effortDays ?? 1}d</span>
                                          <span className="text-slate-600 dark:text-slate-400 truncate">{t.title}</span>
                                          {t.assignedTo && (
                                            <span className="ml-auto flex-shrink-0 text-[10px] text-slate-400">{t.assignedTo.split(' ')[0]}</span>
                                          )}
                                        </div>
                                      ))}
                                      {sprintTickets.length > 5 && (
                                        <p className="text-[10px] text-slate-400">+{sprintTickets.length - 5} more</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}

                    {/* Flat sprint list — skip / custom phase mode */}
                    {phaseMode !== 'template' && (dryRunResult.release.sprints ?? []).map((sprint: Sprint) => {
                      const sprintTickets = dryRunResult.release.features.flatMap((f: Feature) =>
                        f.tickets.filter((t: Ticket) => {
                          const ts = new Date(t.startDate).getTime();
                          const ss = new Date(sprint.startDate).getTime();
                          const se = new Date(sprint.endDate).getTime();
                          return ts >= ss && ts <= se;
                        })
                      );
                      const totalEffort = sprintTickets.reduce((s: number, t: Ticket) => s + (t.effortDays ?? 1), 0);
                      const sprintWorkingDays = Math.round(
                        (new Date(sprint.endDate).getTime() - new Date(sprint.startDate).getTime()) / (1000 * 60 * 60 * 24) * 5 / 7
                      );
                      const teamCapForSprint = Math.max(1, teamMembers.length) * sprintWorkingDays * 0.8;
                      const capacityPct = Math.round((totalEffort / teamCapForSprint) * 100);
                      return (
                        <div key={sprint.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{sprint.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500">
                                {new Date(sprint.startDate).toLocaleDateString()} – {new Date(sprint.endDate).toLocaleDateString()}
                              </span>
                              <span className={cn(
                                'text-[10px] font-bold px-1.5 py-0.5 rounded',
                                capacityPct >= 90 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                  : capacityPct >= 70 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              )}>{capacityPct}%</span>
                            </div>
                          </div>
                          <div className="h-1 bg-slate-100 dark:bg-slate-700">
                            <div
                              className={cn('h-full transition-all', capacityPct >= 100 ? 'bg-red-500' : capacityPct >= 90 ? 'bg-amber-400' : 'bg-blue-500')}
                              style={{ width: `${Math.min(100, capacityPct)}%` }}
                            />
                          </div>
                          {sprintTickets.length > 0 && (
                            <div className="px-3 py-2 space-y-1">
                              {sprintTickets.slice(0, 5).map((t: Ticket) => (
                                <div key={t.id} className="flex items-center gap-2 text-xs">
                                  <span className="text-slate-400 flex-shrink-0 w-4 text-right">{t.effortDays ?? 1}d</span>
                                  <span className="text-slate-600 dark:text-slate-400 truncate">{t.title}</span>
                                  {t.assignedTo && <span className="ml-auto flex-shrink-0 text-[10px] text-slate-400">{t.assignedTo.split(' ')[0]}</span>}
                                </div>
                              ))}
                              {sprintTickets.length > 5 && <p className="text-[10px] text-slate-400">+{sprintTickets.length - 5} more</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Outside Dev Window — flagged overflow tickets */}
                  {overflowCount > 0 && (
                    <div className="rounded-xl border border-amber-300 dark:border-amber-700 overflow-hidden">
                      {/* Section header */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 dark:bg-amber-900/40 border-b border-amber-300 dark:border-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wide">
                          Overflow — {overflowCount} ticket{overflowCount !== 1 ? 's' : ''} won&apos;t fit
                        </span>
                        <span className="ml-auto text-[10px] text-amber-600 dark:text-amber-400">
                          {overflowTickets.reduce((s, t) => s + t.effortDays, 0)}d deferred
                        </span>
                      </div>
                      {/* Overflow ticket rows */}
                      <div className="divide-y divide-amber-200 dark:divide-amber-800 bg-amber-50/60 dark:bg-amber-950/10">
                        {overflowTickets.map((t: TicketInput) => (
                          <div key={t.id} className="flex items-center gap-2.5 px-3 py-2">
                            {/* Diagonal stripe indicator */}
                            <div className="w-1 h-8 rounded-full flex-shrink-0"
                              style={{ background: 'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 2px, transparent 2px, transparent 6px)' }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{t.title}</p>
                              <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                {t.effortDays}d · {t.epic}
                              </p>
                            </div>
                            <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded">
                              Next Release
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sprint planning failed</p>
                  <p className="text-xs text-slate-500">
                    {!dryRunResult.success ? dryRunResult.error : 'Unknown error'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: CONFLICT ───────────────────────────────────────── */}
          {step === 'conflict' && (
            <div className="px-6 py-5 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Resolve Overflow</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {overflowCount} ticket{overflowCount > 1 ? 's' : ''} could not fit within the release window. Choose how to handle them.
                </p>
              </div>

              <div className="space-y-2.5">
                {([ 
                  { value: 'park_next_release' as OverflowResolution, label: 'Park to next release', desc: 'Overflow tickets are saved in a "Parked — Next Release" feature group. Not scheduled, but not lost.' },
                  { value: 'extend_window'    as OverflowResolution, label: 'Extend dev window',    desc: 'Go back and push the end date to accommodate all tickets.' },
                  { value: 'skip'             as OverflowResolution, label: 'Drop overflow tickets', desc: 'Overflow tickets will be excluded from the release entirely.' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setOverflowResolution(opt.value)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-xl border transition-all',
                      overflowResolution === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5',
                        overflowResolution === opt.value
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-300 dark:border-slate-600',
                      )} />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{opt.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP: COMPLETE ───────────────────────────────────────── */}
          {step === 'complete' && (
            <div className="px-6 py-6 space-y-5">
              {/* Checkmark + title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Release Plan Generated!</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{releaseName} is ready in your timeline.</p>
                </div>
              </div>

              {/* 2×2 summary grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Package,     label: 'Release',   value: releaseName || '—',                                           sub: 'AI-named from PRD' },
                  { icon: Layers,      label: 'Tickets',   value: pipelineResult?.tickets.length ?? 0,                          sub: 'across all epics' },
                  { icon: GitBranch,   label: 'Sprints',   value: dryRunResult?.success ? dryRunResult.release.sprints?.length ?? 0 : 0, sub: `${sprintLengthWeeks}w sprint length` },
                  { icon: Calendar,    label: 'Timeline',  value: startDate && endDate ? `${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000*60*60*24*7))}w` : '—', sub: startDate ? `from ${new Date(startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : '' },
                ].map(({ icon: Icon, label, value, sub }) => (
                  <div key={label} className="flex items-start gap-3 px-3 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">{value}</p>
                      <p className="text-[10px] text-slate-500">{label}</p>
                      <p className="text-[10px] text-slate-400">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Phase recap Gantt */}
              {startDate && endDate && (() => {
                const tpl = SDLC_TEMPLATES[sdlcTemplate];
                return (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {tpl.name} — Phase breakdown
                    </p>
                    <div className="flex h-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      {tpl.phases.map(ph => (
                        <div
                          key={ph.name}
                          className={cn(PHASE_COLORS[ph.color as keyof typeof PHASE_COLORS]?.bar ?? 'bg-slate-400', 'flex items-center justify-center')}
                          style={{ width: `${ph.pct * 100}%` }}
                          title={ph.name}
                        >
                          <span className="text-[7px] font-bold text-white truncate px-0.5">{ph.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {tpl.phases.map(ph => (
                        <div key={ph.name} className="flex items-center gap-1">
                          <div className={cn('w-2 h-2 rounded-sm', PHASE_COLORS[ph.color as keyof typeof PHASE_COLORS]?.bar ?? 'bg-slate-400')} />
                          <span className="text-[10px] text-slate-500">{ph.name} ({Math.round(ph.pct * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* What happens next */}
              <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">What happens next</p>
                </div>
                <ol className="space-y-1 pl-0.5">
                  {[
                    'Your release appears in the Timeline view with all sprints laid out.',
                    'Tickets are assigned to team members based on role and capacity.',
                    'Review sprints in the Timeline and drag tickets between sprints as needed.',
                    'Kick off Sprint 1 and track progress on the Planning Dashboard.',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-blue-800 dark:text-blue-200">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[9px] font-bold mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

        </div>{/* end scrollable content */}

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/50">

          {/* Back/Cancel */}
          <div>
            {step === 'upload' && (
              <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Cancel</button>
            )}
            {step === 'preview' && (
              <button onClick={() => setStep('upload')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step === 'ambiguity' && (
              <button onClick={() => setStep('preview')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step === 'release_config' && (
              <button onClick={() => setStep(ambiguousTickets.length > 0 ? 'ambiguity' : 'preview')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step === 'sprint_preview' && (
              <button onClick={() => setStep('release_config')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step === 'conflict' && (
              <button onClick={() => setStep('sprint_preview')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step === 'complete' && <div />}
          </div>

          {/* Primary Action */}
          <div className="flex items-center gap-2">
            {/* Upload step */}
            {step === 'upload' && (
              <button
                onClick={startProcessing}
                disabled={!prdText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
              >
                <Sparkles className="w-4 h-4" /> Analyze with AI
              </button>
            )}

            {/* Processing — no action, auto-advances */}
            {step === 'processing' && pipelineError && (
              <button
                onClick={startProcessing}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-700 rounded-xl hover:bg-slate-800 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            )}

            {/* Preview */}
            {step === 'preview' && (
              <div className="flex items-center gap-2">
                {ambiguousTickets.length > 0 && (
                  <button
                    onClick={() => { setAmbiguityIndex(0); setStep('ambiguity'); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Resolve ({ambiguousTickets.length})
                  </button>
                )}
                <button
                  onClick={() => setStep('release_config')}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  Configure Release <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Ambiguity */}
            {step === 'ambiguity' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (ambiguityIndex < ambiguousTickets.length - 1) {
                      setAmbiguityIndex(i => i + 1);
                    } else {
                      applyAmbiguityAnswers();
                      setStep('release_config');
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  {ambiguityIndex < ambiguousTickets.length - 1 ? (
                    <> Next <ChevronRight className="w-4 h-4" /> </>
                  ) : (
                    <> Done <CheckCircle2 className="w-4 h-4" /> </>
                  )}
                </button>
                <button
                  onClick={() => { applyAmbiguityAnswers(); setStep('release_config'); }}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  <SkipForward className="w-3.5 h-3.5" /> Skip all
                </button>
              </div>
            )}

            {/* Release config */}
            {step === 'release_config' && (
              <button
                onClick={runSprintPreview}
                disabled={!releaseName.trim() || !startDate || !endDate || teamMembers.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
              >
                Preview Sprint Plan <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Sprint preview — failure: let user go back to tweak config */}
            {step === 'sprint_preview' && dryRunResult && !dryRunResult.success && (
              <button
                onClick={() => { setDryRunResult(null); setStep('release_config'); }}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Configure
              </button>
            )}

            {/* Sprint preview — no overflow: generate directly */}
            {step === 'sprint_preview' && dryRunResult?.success && overflowCount === 0 && (
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
              >
                Generate Release Plan
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {/* Sprint preview — overflow exists: let user pick resolution in conflict step */}
            {step === 'sprint_preview' && dryRunResult?.success && overflowCount > 0 && (
              <button
                onClick={() => setStep('conflict')}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20"
              >
                Review Overflow ({overflowCount}) <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Conflict */}
            {step === 'conflict' && (
              <div className="flex items-center gap-2">
                {overflowResolution === 'extend_window' ? (
                  <button
                    onClick={() => setStep('release_config')}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to Configure
                  </button>
                ) : (
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Generate Release Plan <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Complete */}
            {step === 'complete' && (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20"
              >
                View Timeline
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
