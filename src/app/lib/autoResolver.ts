/**
 * Auto-Resolver — AI-assisted capacity-aware ticket assignment engine
 *
 * Resolves FOUR categories of problems in one pass:
 *   1. Unassigned tickets          → find the right dev + sprint
 *   2. Overloaded devs             → shed tickets to other devs / later sprints
 *   3. Out-of-dev-window tickets   → tickets whose dates fall in Testing/UAT/Deploy phases
 *   4. Wrong-role assignments      → ticket's requiredRole doesn't match the assigned dev
 *
 * Constraints enforced:
 *   - Assignment only within the DevWindow phase (allowsWork = true)
 *   - Per-developer utilization ceiling: 90%  (UTIL_CEILING)
 *   - Role compatibility: ticket.requiredRole must match dev.role
 *     (Fullstack covers Frontend + Backend; undefined role = Any)
 *   - PTO deducted from each dev's available days per sprint
 *   - Sequential per-dev start dates — no two tickets for the same dev share a start date
 *
 * AI role tagging:
 *   - Tickets that already have requiredRole set → use it directly
 *   - Tickets without requiredRole → single batched Ollama call
 *   - Falls back to 'Any' if Ollama is unreachable
 */

import { addDays, isWeekend, startOfDay } from 'date-fns';
import { AI_ENDPOINT } from './aiEndpoint';
import type {
  Ticket,
  Sprint,
  Phase,
  TeamMember,
  Holiday,
  Release,
  StoryPointMapping,
} from '../data/mockData';
import { storyPointsToDays } from '../data/mockData';

// ─────────────────────────────── Public types ──────────────────────────────

export type TaggedRole =
  | 'Frontend'
  | 'Backend'
  | 'Fullstack'
  | 'QA'
  | 'Designer'
  | 'DataEngineer'
  | 'iOS'
  | 'Android'
  | 'Any';

export type ChangeType = 'assigned' | 'reassigned' | 'moved' | 'reassigned_and_moved';

export interface DevCapacityInfo {
  devId: string;
  devName: string;
  role: string;
  workingDays: number;
  ptoDays: number;
  availableDays: number;
  /** availableDays × velocityMultiplier */
  capacityDays: number;
  /** Sum of effortDays for all tickets assigned to this dev in this sprint */
  assignedDays: number;
  /** (assignedDays / capacityDays) × 100 */
  utilizationPct: number;
  /** max(0, capacityDays × 0.90 − assignedDays) */
  remainingDays: number;
}

export interface SprintCapacitySummary {
  sprintId: string;
  sprintName: string;
  startDate: Date;
  endDate: Date;
  devCapacities: DevCapacityInfo[];
}

export type ConflictReason =
  | 'unassigned'
  | 'overloaded'
  | 'out_of_window'
  | 'wrong_role'
  | 'date_overlap';

export interface TicketResolution {
  ticketId: string;
  featureId: string;
  ticketTitle: string;
  changeType: ChangeType;
  /** Why this ticket was flagged for resolution */
  conflictReason: ConflictReason;
  fromAssignee: string;
  toAssignee: string;
  fromSprintId: string | null;
  /** Human-readable name of the sprint the ticket was in before — shown in the preview diff */
  fromSprintName: string | null;
  toSprintId: string;
  toSprintName: string;
  fromStartDate: Date;
  toStartDate: Date;
  fromEndDate: Date;
  toEndDate: Date;
  taggedRole: string;
  effortDays: number;
  /** Destination developer's utilization % BEFORE this ticket was placed */
  toDevUtilBefore: number;
  /** Destination developer's utilization % AFTER this ticket was placed */
  toDevUtilAfter: number;
}

export interface UnresolvableTicket {
  ticketId: string;
  featureId: string;
  ticketTitle: string;
  reason: string;
  effortDays: number;
}

export interface AutoResolveResult {
  resolutions: TicketResolution[];
  unresolvable: UnresolvableTicket[];
  sprintSnapshotsBefore: SprintCapacitySummary[];
  sprintSnapshotsAfter: SprintCapacitySummary[];
  devWindowStart: Date;
  devWindowEnd: Date;
}

// ───────────────────────────── Internal helpers ────────────────────────────

interface TicketWithFeature extends Ticket {
  featureId: string;
}

// Mutable working capacity entry (extends DevCapacityInfo with a ticket list)
interface MutableCap extends DevCapacityInfo {
  _ticketIds: string[];
}

const UTIL_CEILING = 0.90;

/** Resolve effort for a ticket — prefers effortDays, then SP→days, then 1 */
function resolveEffort(ticket: Ticket, spMapping: StoryPointMapping | undefined): number {
  if (ticket.effortDays && ticket.effortDays > 0) return ticket.effortDays;
  if (ticket.storyPoints && ticket.storyPoints > 0) {
    return storyPointsToDays(ticket.storyPoints, spMapping);
  }
  return 1;
}

/** Advance a date to the next working day (skip weekends, no holiday check needed here) */
function nextWorkingDay(date: Date): Date {
  let d = addDays(startOfDay(date), 1);
  while (isWeekend(d)) d = addDays(d, 1);
  return d;
}

/** Count Mon–Fri days in [start, end] inclusive, excluding global holidays */
function countWorkingDays(start: Date, end: Date, holidays: Holiday[]): number {
  // Build a quick lookup set from holiday date ranges
  const holidaySet = new Set<string>();
  for (const h of holidays) {
    let d = startOfDay(new Date(h.startDate));
    const he = startOfDay(new Date(h.endDate));
    while (d <= he) {
      holidaySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      d = addDays(d, 1);
    }
  }

  let count = 0;
  let d = startOfDay(new Date(start));
  const e = startOfDay(new Date(end));
  while (d <= e) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6 && !holidaySet.has(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)) {
      count++;
    }
    d = addDays(d, 1);
  }
  return count;
}

/** Count PTO weekdays for a dev that fall within [sprintStart, sprintEnd] */
function countDevPtoInRange(dev: TeamMember, sprintStart: Date, sprintEnd: Date): number {
  let count = 0;
  const ss = startOfDay(new Date(sprintStart));
  const se = startOfDay(new Date(sprintEnd));

  for (const pto of dev.pto) {
    let d = startOfDay(new Date(pto.startDate));
    const pe = startOfDay(new Date(pto.endDate));
    while (d <= pe) {
      if (d >= ss && d <= se) {
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) count++;
      }
      d = addDays(d, 1);
    }
  }
  return count;
}

/** Build a fresh MutableCap map for all devs in a sprint */
function buildCapMap(
  devs: TeamMember[],
  sprintStart: Date,
  sprintEnd: Date,
  sprintTickets: TicketWithFeature[],
  holidays: Holiday[],
  spMapping: StoryPointMapping | undefined,
): Map<string, MutableCap> {
  const map = new Map<string, MutableCap>();
  for (const dev of devs) {
    const workingDays = countWorkingDays(sprintStart, sprintEnd, holidays);
    const ptoDays = countDevPtoInRange(dev, sprintStart, sprintEnd);
    const availableDays = Math.max(0, workingDays - ptoDays);
    const capacityDays = availableDays * (dev.velocityMultiplier ?? 1);
    const devTickets = sprintTickets.filter(t => t.assignedTo === dev.name);
    // Use resolveEffort so assignedDays is consistent with the greedy loop
    const assignedDays = devTickets.reduce((s, t) => s + resolveEffort(t, spMapping), 0);
    const utilizationPct = capacityDays > 0 ? (assignedDays / capacityDays) * 100 : 0;
    const remainingDays = Math.max(0, capacityDays * UTIL_CEILING - assignedDays);

    map.set(dev.id, {
      devId: dev.id,
      devName: dev.name,
      role: dev.role,
      workingDays,
      ptoDays,
      availableDays,
      capacityDays,
      assignedDays,
      utilizationPct,
      remainingDays,
      _ticketIds: devTickets.map(t => t.id),
    });
  }
  return map;
}

/**
 * Developer role → ticket role compatibility matrix
 *
 * - Fullstack developers can cover Frontend or Backend tickets
 * - 'Developer' (generic) can cover anything without a specific role
 * - undefined / 'Any' on ticket = any dev qualifies
 */
function isRoleCompatible(devRole: string, ticketRole: string | undefined): boolean {
  if (!ticketRole || ticketRole === 'Any') return true;
  if (devRole === ticketRole) return true;
  if (devRole === 'Fullstack' && (ticketRole === 'Frontend' || ticketRole === 'Backend')) return true;
  if (devRole === 'Developer') return true;
  return false;
}

/** Single batched Ollama call to tag all tickets needing a role */
async function tagTicketRoles(
  tickets: Array<{ id: string; title: string; description?: string }>,
): Promise<Map<string, TaggedRole>> {
  const result = new Map<string, TaggedRole>();
  if (tickets.length === 0) return result;

  const prompt = tickets
    .map((t, i) => `${i + 1}. ID: ${t.id}\nTitle: "${t.title}"\nDesc: "${t.description?.slice(0, 120) || 'none'}"`)
    .join('\n---\n');

  try {
    const res = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        model: 'llama3.2:3b',
        messages: [
          {
            role: 'system',
            content: `You classify software project tickets by the required developer role.
Return ONLY a valid JSON array with no extra text: [{"id":"<ticketId>","role":"<role>"}]

Valid roles (pick exactly one per ticket):
  Frontend     – UI, component, page, button, CSS, React, styling, form
  Backend      – API, endpoint, database, schema, server, migration, service
  Fullstack    – explicitly involves both frontend + backend work
  QA           – test, testing, regression, automation, quality, bug coverage
  Designer     – design, wireframe, mockup, UX, accessibility, Figma
  DataEngineer – pipeline, ETL, analytics, metrics, data warehouse, reporting
  iOS          – Swift, iOS, iPhone, Apple platform
  Android      – Android, Kotlin, Google Play
  Any          – unclear, generic, planning, documentation, meeting`,
          },
          { role: 'user', content: `Classify these tickets:\n${prompt}` },
        ],
        stream: false,
        options: { temperature: 0.1, num_predict: 1024, num_ctx: 4096 },
      }),
    });

    if (!res.ok) throw new Error(`LLM ${res.status}`);
    const data = await res.json();
    const content: string = data.message?.content ?? '';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array in response');
    const parsed: Array<{ id: string; role: string }> = JSON.parse(jsonMatch[0]);
    for (const item of parsed) {
      result.set(item.id, (item.role as TaggedRole) || 'Any');
    }
  } catch (e) {
    console.warn('[autoResolver] AI tagging failed – defaulting to Any:', e);
    for (const t of tickets) result.set(t.id, 'Any');
  }

  return result;
}

// ───────────────────────────── Main resolver ───────────────────────────────

export async function runAutoResolve(
  release: Release,
  teamMembers: TeamMember[],
  holidays: Holiday[],
  phases: Phase[],
): Promise<AutoResolveResult> {

  const spMapping = release.storyPointMapping;

  // ── 1. Dev window bounds ──────────────────────────────────────────────────
  const devPhases = phases.filter(p => p.allowsWork);
  let devWindowStart: Date;
  let devWindowEnd: Date;

  if (devPhases.length > 0) {
    const allMs = devPhases.flatMap(p => [
      new Date(p.startDate).getTime(),
      new Date(p.endDate).getTime(),
    ]);
    devWindowStart = startOfDay(new Date(Math.min(...allMs)));
    devWindowEnd = startOfDay(new Date(Math.max(...allMs)));
  } else {
    devWindowStart = startOfDay(new Date(release.startDate));
    devWindowEnd = startOfDay(new Date(release.endDate));
  }

  if (teamMembers.length === 0) {
    return {
      resolutions: [],
      unresolvable: [],
      sprintSnapshotsBefore: [],
      sprintSnapshotsAfter: [],
      devWindowStart,
      devWindowEnd,
    };
  }

  // ── 2. Sprints scoped to dev window ──────────────────────────────────────
  let sprints: Sprint[] = [];
  if (release.sprints && release.sprints.length > 0) {
    sprints = release.sprints
      .filter(s => {
        const ss = startOfDay(new Date(s.startDate));
        const se = startOfDay(new Date(s.endDate));
        return ss <= devWindowEnd && se >= devWindowStart;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  // Bug 3 fix: synthesize weekly buckets when no sprints are defined so the
  // greedy loop can detect per-bucket overload instead of one giant bucket.
  if (sprints.length === 0) {
    let cursor = startOfDay(devWindowStart);
    let weekNum = 1;
    while (cursor <= devWindowEnd) {
      const bucketEnd = startOfDay(addDays(cursor, 13) <= devWindowEnd ? addDays(cursor, 13) : devWindowEnd);
      sprints.push({
        id: `bucket-week-${weekNum}`,
        name: `Week ${weekNum}`,
        startDate: cursor,
        endDate: bucketEnd,
      });
      cursor = startOfDay(addDays(bucketEnd, 1));
      weekNum++;
    }
  }

  // ── 3. Flatten all tickets with featureId ─────────────────────────────────
  const allTickets: TicketWithFeature[] = release.features.flatMap(f =>
    f.tickets.map(t => ({ ...t, featureId: f.id })),
  );

  /**
   * Best-fit sprint lookup for a ticket.
   * - Exact range match first (ticket.startDate falls within sprint dates)
   * - Falls back to the nearest sprint by date distance so tickets that fall
   *   in gaps between sprints (or before the first sprint) are never invisible.
   */
  function findSprintForTicket(ticket: TicketWithFeature): Sprint | undefined {
    const ts = startOfDay(new Date(ticket.startDate));
    // Exact match
    const exact = sprints.find(s => {
      const ss = startOfDay(new Date(s.startDate));
      const se = startOfDay(new Date(s.endDate));
      return ts >= ss && ts <= se;
    });
    if (exact) return exact;
    // Nearest sprint — prevents inter-sprint tickets from being invisible
    let nearest: Sprint | undefined;
    let nearestDist = Infinity;
    for (const sprint of sprints) {
      const ss = startOfDay(new Date(sprint.startDate));
      const se = startOfDay(new Date(sprint.endDate));
      const dist = ts < ss ? ss.getTime() - ts.getTime() : ts.getTime() - se.getTime();
      if (dist < nearestDist) { nearestDist = dist; nearest = sprint; }
    }
    return nearest;
  }

  // ── 4. Build per-sprint ticket buckets (best-fit — no ticket is invisible) ─
  // Every ticket maps to exactly one sprint so buildCapMap sees 100% of workload.
  const sprintTicketMap = new Map<string, TicketWithFeature[]>();
  for (const sprint of sprints) sprintTicketMap.set(sprint.id, []);
  for (const ticket of allTickets) {
    const sprint = findSprintForTicket(ticket);
    if (sprint) sprintTicketMap.get(sprint.id)!.push(ticket);
  }

  // ── 5. Before capacity snapshots ─────────────────────────────────────────
  const sprintSnapshotsBefore: SprintCapacitySummary[] = sprints.map(sprint => {
    const tickets = sprintTicketMap.get(sprint.id) ?? [];
    const capMap = buildCapMap(
      teamMembers,
      new Date(sprint.startDate),
      new Date(sprint.endDate),
      tickets,
      holidays,
      spMapping,
    );
    return {
      sprintId: sprint.id,
      sprintName: sprint.name,
      startDate: new Date(sprint.startDate),
      endDate: new Date(sprint.endDate),
      devCapacities: Array.from(capMap.values()).map(({ _ticketIds, ...rest }) => rest),
    };
  });

  // ── 6. Build mutable working capacity map (keyed sprintId::devId) ─────────
  const mutableCaps = new Map<string, MutableCap>();
  for (const sprint of sprints) {
    const tickets = sprintTicketMap.get(sprint.id) ?? [];
    const capMap = buildCapMap(
      teamMembers,
      new Date(sprint.startDate),
      new Date(sprint.endDate),
      tickets,
      holidays,
      spMapping,
    );
    for (const [devId, cap] of capMap) {
      mutableCaps.set(`${sprint.id}::${devId}`, { ...cap });
    }
  }

  function getMutableCap(sprintId: string, devId: string): MutableCap | undefined {
    return mutableCaps.get(`${sprintId}::${devId}`);
  }

  function deductFromDev(sprintId: string, devId: string, effort: number) {
    const cap = getMutableCap(sprintId, devId);
    if (!cap) return;
    cap.assignedDays = Math.max(0, cap.assignedDays - effort);
    cap.utilizationPct = cap.capacityDays > 0 ? (cap.assignedDays / cap.capacityDays) * 100 : 0;
    cap.remainingDays = Math.max(0, cap.capacityDays * UTIL_CEILING - cap.assignedDays);
  }

  function addToDev(sprintId: string, devId: string, effort: number) {
    const cap = getMutableCap(sprintId, devId);
    if (!cap) return;
    cap.assignedDays += effort;
    cap.utilizationPct = cap.capacityDays > 0 ? (cap.assignedDays / cap.capacityDays) * 100 : 0;
    cap.remainingDays = Math.max(0, cap.capacityDays * UTIL_CEILING - cap.assignedDays);
  }

  // ── 7. Identify tickets needing resolution (4 categories) ───────────────

  // Category 1: Completely unassigned tickets
  const unassignedTickets = allTickets.filter(
    t => !t.assignedTo || t.assignedTo.trim() === '',
  );
  const unassignedIds = new Set(unassignedTickets.map(t => t.id));

  // Category 2: Overloaded tickets — for devs over 90%, shed smallest-effort tickets first
  const overloadedTickets: TicketWithFeature[] = [];
  const overloadedIds = new Set<string>();

  for (const snap of sprintSnapshotsBefore) {
    for (const dc of snap.devCapacities) {
      if (dc.utilizationPct <= 90) continue;

      const devSprintTickets = (sprintTicketMap.get(snap.sprintId) ?? [])
        .filter(t => t.assignedTo === dc.devName && !overloadedIds.has(t.id) && !unassignedIds.has(t.id))
        .sort((a, b) => resolveEffort(a, spMapping) - resolveEffort(b, spMapping));

      let excess = dc.assignedDays - dc.capacityDays * UTIL_CEILING;
      for (const ticket of devSprintTickets) {
        if (excess <= 0) break;
        overloadedTickets.push(ticket);
        overloadedIds.add(ticket.id);
        const dev = teamMembers.find(m => m.name === ticket.assignedTo);
        if (dev) deductFromDev(snap.sprintId, dev.id, resolveEffort(ticket, spMapping));
        excess -= resolveEffort(ticket, spMapping);
      }
    }
  }

  // Category 3 (Bug 1 fix): Tickets whose current endDate falls outside the dev window
  const outOfWindowTickets = allTickets.filter(t => {
    if (unassignedIds.has(t.id) || overloadedIds.has(t.id)) return false;
    const ticketEnd = startOfDay(new Date(t.endDate));
    const ticketStart = startOfDay(new Date(t.startDate));
    return ticketEnd > devWindowEnd || ticketStart > devWindowEnd;
  });
  const outOfWindowIds = new Set(outOfWindowTickets.map(t => t.id));

  // Category 4 (Bug 6 fix): Assigned tickets whose current dev role is incompatible
  const wrongRoleTickets = allTickets.filter(t => {
    if (unassignedIds.has(t.id) || overloadedIds.has(t.id) || outOfWindowIds.has(t.id)) return false;
    if (!t.requiredRole) return false;
    if (!t.assignedTo || t.assignedTo.trim() === '') return false;
    const assignedDev = teamMembers.find(m => m.name === t.assignedTo);
    if (!assignedDev) return true; // assigned to someone not on team → flag it
    return !isRoleCompatible(assignedDev.role, t.requiredRole);
  });

  // Deduct wrong-role tickets from their current dev so capacity is freed
  for (const snap of sprintSnapshotsBefore) {
    for (const ticket of wrongRoleTickets) {
      const dev = teamMembers.find(m => m.name === ticket.assignedTo);
      if (!dev) continue;
      const inThisSprint = (sprintTicketMap.get(snap.sprintId) ?? []).some(t => t.id === ticket.id);
      if (inThisSprint) deductFromDev(snap.sprintId, dev.id, resolveEffort(ticket, spMapping));
    }
  }

  // Category 5 (THE REAL GAP): Direct date-overlap conflicts.
  // The conflict detector flags date overlaps; the resolver's utilization-based
  // Category 2 never fires for them if the dev is under 90% capacity.
  // We fix this by scanning each dev's tickets for overlapping pairs and
  // extracting all but the earliest ticket from each overlapping cluster.
  const overlapConflictTickets: TicketWithFeature[] = [];
  const overlapConflictIds = new Set<string>();

  // Build per-dev ticket list (only assigned, not already in another category)
  const ticketsByDev = new Map<string, TicketWithFeature[]>();
  for (const t of allTickets) {
    if (
      !t.assignedTo ||
      t.assignedTo.trim() === '' ||
      unassignedIds.has(t.id) ||
      overloadedIds.has(t.id) ||
      outOfWindowIds.has(t.id)
    ) continue;
    const list = ticketsByDev.get(t.assignedTo) ?? [];
    list.push(t);
    ticketsByDev.set(t.assignedTo, list);
  }

  for (const [, devTickets] of ticketsByDev) {
    // Sort by startDate so the earliest ticket is always the "anchor"
    const sorted = [...devTickets].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    // For each ticket, check whether it overlaps any earlier ticket in the list.
    // If it does, it's a conflict — mark it for re-scheduling.
    for (let i = 1; i < sorted.length; i++) {
      const candidate = sorted[i];
      if (overlapConflictIds.has(candidate.id)) continue;
      const candStart = startOfDay(new Date(candidate.startDate));
      const candEnd   = startOfDay(new Date(candidate.endDate));

      const hasOverlap = sorted.slice(0, i).some(earlier => {
        if (overlapConflictIds.has(earlier.id)) return false; // earlier is also displaced
        const eStart = startOfDay(new Date(earlier.startDate));
        const eEnd   = startOfDay(new Date(earlier.endDate));
        return candStart <= eEnd && eStart <= candEnd; // inclusive overlap
      });

      if (hasOverlap) {
        overlapConflictTickets.push(candidate);
        overlapConflictIds.add(candidate.id);

        // Free this ticket's effort from the mutable cap map
        const dev = teamMembers.find(m => m.name === candidate.assignedTo);
        if (dev) {
          const sprint = findSprintForTicket(candidate);
          if (sprint) deductFromDev(sprint.id, dev.id, resolveEffort(candidate, spMapping));
        }
      }
    }
  }

  // Merge and de-duplicate; smallest-effort tickets resolved first (easiest to place)
  const ticketsToResolve = [
    ...unassignedTickets,
    ...overloadedTickets,
    ...outOfWindowTickets,
    ...wrongRoleTickets,
    ...overlapConflictTickets,
  ].sort((a, b) => resolveEffort(a, spMapping) - resolveEffort(b, spMapping));

  // ── 8. AI role tagging (batch single call) ────────────────────────────────
  const needsTagging = ticketsToResolve.filter(t => !t.requiredRole);
  const roleTagMap = await tagTicketRoles(
    needsTagging.map(t => ({ id: t.id, title: t.title, description: t.description })),
  );

  function getRole(ticket: TicketWithFeature): string {
    return ticket.requiredRole ?? roleTagMap.get(ticket.id) ?? 'Any';
  }

  // ── Conflict reason lookup ────────────────────────────────────────────────
  const conflictReasonMap = new Map<string, ConflictReason>();
  for (const t of unassignedTickets)    conflictReasonMap.set(t.id, 'unassigned');
  for (const t of overloadedTickets)    conflictReasonMap.set(t.id, 'overloaded');
  for (const t of outOfWindowTickets)   conflictReasonMap.set(t.id, 'out_of_window');
  for (const t of wrongRoleTickets)     conflictReasonMap.set(t.id, 'wrong_role');
  for (const t of overlapConflictTickets) conflictReasonMap.set(t.id, 'date_overlap');
  const getConflictReason = (id: string): ConflictReason =>
    conflictReasonMap.get(id) ?? 'overloaded';

  // ── 9. Greedy assignment ──────────────────────────────────────────────────
  const resolutions: TicketResolution[] = [];
  const unresolvable: UnresolvableTicket[] = [];

  // Track the last end-date used per dev per sprint so sequential tickets
  // get sequential, non-overlapping start dates.
  const lastEndDate = new Map<string, Date>(); // key = `${sprintId}::${devId}`

  // Pre-seed lastEndDate from tickets that WON'T be resolved so that newly
  // placed tickets can never overlap with already-scheduled existing work.
  const toResolveIds = new Set(ticketsToResolve.map(t => t.id));
  for (const sprint of sprints) {
    for (const t of sprintTicketMap.get(sprint.id) ?? []) {
      if (toResolveIds.has(t.id)) continue; // will be re-placed; skip its current dates
      if (!t.assignedTo || t.assignedTo.trim() === '') continue;
      const dev = teamMembers.find(m => m.name === t.assignedTo);
      if (!dev) continue;
      const key = `${sprint.id}::${dev.id}`;
      const te = startOfDay(new Date(t.endDate));
      const prev = lastEndDate.get(key);
      if (!prev || te > prev) lastEndDate.set(key, te);
    }
  }

  for (const ticket of ticketsToResolve) {
    const role = getRole(ticket);
    const effort = resolveEffort(ticket, spMapping); // Bug 4 fix
    const fromSprint = findSprintForTicket(ticket);
    const startSprintIdx = fromSprint ? sprints.findIndex(s => s.id === fromSprint.id) : 0;

    let resolved = false;

    for (let si = Math.max(0, startSprintIdx); si < sprints.length; si++) {
      const sprint = sprints[si];
      const sprintStart = startOfDay(new Date(sprint.startDate));
      const sprintEnd = startOfDay(new Date(sprint.endDate));

      // Find the least-loaded role-compatible dev with room for this ticket
      const eligibleDevs = teamMembers
        .map(dev => {
          const cap = getMutableCap(sprint.id, dev.id);
          return cap ? { dev, cap } : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .filter(({ dev, cap }) =>
          isRoleCompatible(dev.role, role) && cap.remainingDays >= effort,
        )
        .sort((a, b) => a.cap.utilizationPct - b.cap.utilizationPct);

      if (eligibleDevs.length === 0) continue;

      // ── FIX: try ALL eligible devs (ordered by utilization), not just the ─
      // ── first one. The first dev's sequential slot may be full in this sprint ─
      // ── but a less-loaded dev may still have an open slot. ─────────────────
      let bestDev: TeamMember | null = null;
      let candidateStart: Date | null = null;

      for (const { dev } of eligibleDevs) {
        const key = `${sprint.id}::${dev.id}`;
        const prevEnd = lastEndDate.get(key);
        const cStart = prevEnd
          ? (nextWorkingDay(prevEnd) <= sprintEnd ? nextWorkingDay(prevEnd) : null)
          : sprintStart;
        if (cStart === null) continue; // sequential slot overflows sprint end

        // ── FIX: only enforce devWindowEnd, NOT sprintEnd. ─────────────────
        // Tickets may straddle sprint boundaries — sprints are capacity buckets,
        // not hard date walls. A 3-day ticket on day 5 of a 6-day sprint is valid.
        if (addDays(cStart, effort - 1) > devWindowEnd) continue;

        bestDev = dev;
        candidateStart = cStart;
        break;
      }

      if (!bestDev || !candidateStart) continue;

      const toEndDate = addDays(candidateStart, effort - 1);

      // Determine change type
      const isUnassigned = !ticket.assignedTo || ticket.assignedTo.trim() === '';
      const assigneeChanged = bestDev.name !== ticket.assignedTo;
      const sprintChanged = !fromSprint || sprint.id !== fromSprint.id;

      let changeType: ChangeType;
      if (isUnassigned) {
        changeType = 'assigned';
      } else if (assigneeChanged && sprintChanged) {
        changeType = 'reassigned_and_moved';
      } else if (assigneeChanged) {
        changeType = 'reassigned';
      } else {
        changeType = 'moved';
      }

      // Capture utilization BEFORE and AFTER placing this ticket — shown in the preview diff
      const capBefore = getMutableCap(sprint.id, bestDev.id);
      const utilBefore = capBefore ? Math.round(capBefore.utilizationPct) : 0;

      // Update mutable capacity and sequential-date tracking
      addToDev(sprint.id, bestDev.id, effort);
      const capAfter = getMutableCap(sprint.id, bestDev.id);
      const utilAfter = capAfter ? Math.round(capAfter.utilizationPct) : 0;

      lastEndDate.set(`${sprint.id}::${bestDev.id}`, toEndDate);

      resolutions.push({
        ticketId: ticket.id,
        featureId: ticket.featureId,
        ticketTitle: ticket.title,
        changeType,
        conflictReason: getConflictReason(ticket.id),
        fromAssignee: ticket.assignedTo || 'Unassigned',
        toAssignee: bestDev.name,
        fromSprintId: fromSprint?.id ?? null,
        fromSprintName: fromSprint?.name ?? null,
        toSprintId: sprint.id,
        toSprintName: sprint.name,
        fromStartDate: new Date(ticket.startDate),
        toStartDate: candidateStart,
        fromEndDate: new Date(ticket.endDate),
        toEndDate,
        taggedRole: role,
        effortDays: effort,
        toDevUtilBefore: utilBefore,
        toDevUtilAfter: utilAfter,
      });

      resolved = true;
      break;
    }

    if (!resolved) {
      const roleExists = teamMembers.some(dev => isRoleCompatible(dev.role, role));
      unresolvable.push({
        ticketId: ticket.id,
        featureId: ticket.featureId,
        ticketTitle: ticket.title,
        reason: !roleExists
          ? `No ${role} developer exists on this team`
          : `No sprint within the dev window has capacity for a ${role} developer to absorb ${effort} effort days`,
        effortDays: effort,
      });
    }
  }

  // ── 10. Build after snapshots from the mutated cap map ───────────────────
  const sprintSnapshotsAfter: SprintCapacitySummary[] = sprints.map(sprint => ({
    sprintId: sprint.id,
    sprintName: sprint.name,
    startDate: new Date(sprint.startDate),
    endDate: new Date(sprint.endDate),
    devCapacities: teamMembers.map(dev => {
      const cap = getMutableCap(sprint.id, dev.id);
      if (!cap) {
        return {
          devId: dev.id, devName: dev.name, role: dev.role,
          workingDays: 0, ptoDays: 0, availableDays: 0,
          capacityDays: 0, assignedDays: 0, utilizationPct: 0, remainingDays: 0,
        };
      }
      const { _ticketIds, ...rest } = cap;
      return rest;
    }),
  }));

  return {
    resolutions,
    unresolvable,
    sprintSnapshotsBefore,
    sprintSnapshotsAfter,
    devWindowStart,
    devWindowEnd,
  };
}
