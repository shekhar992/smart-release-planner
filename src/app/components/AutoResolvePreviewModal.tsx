/**
 * AutoResolvePreviewModal
 *
 * Shows a comprehensive before-you-commit diff of what the auto-resolver
 * proposes to change.  Two tabs:
 *   "Changes"         – list of every ticket resolution with type badges
 *   "Capacity Impact" – per-sprint / per-dev before → after utilization bars
 *
 * The user can inspect everything, then Approve or Cancel.
 */

import { useState } from 'react';
import { X, Zap, CheckCircle, AlertTriangle, ArrowRight, Users, ChevronDown, ChevronRight, Info, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type {
  AutoResolveResult,
  TicketResolution,
  UnresolvableTicket,
  SprintCapacitySummary,
  DevCapacityInfo,
  ChangeType,
  ConflictReason,
} from '../lib/autoResolver';

// ─── Helpers ───────────────────────────────────────────────────────────────

function utilColor(pct: number): string {
  if (pct > 90) return 'bg-red-500';
  if (pct > 80) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function utilTextColor(pct: number): string {
  if (pct > 90) return 'text-red-600 dark:text-red-400';
  if (pct > 80) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function changeBadge(type: ChangeType) {
  const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-semibold';
  switch (type) {
    case 'assigned':
      return <span className={`${base} bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300`}>✦ Assigned</span>;
    case 'reassigned':
      return <span className={`${base} bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300`}>⇄ Reassigned</span>;
    case 'moved':
      return <span className={`${base} bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300`}>→ Sprint Moved</span>;
    case 'reassigned_and_moved':
      return <span className={`${base} bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300`}>⇄→ Reassigned + Moved</span>;
  }
}

function rolePill(role: string) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-label font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
      {role}
    </span>
  );
}

const REASON_CONFIG: Record<ConflictReason, { label: string; cls: string }> = {
  unassigned:    { label: 'Unassigned',    cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' },
  overloaded:    { label: 'Overloaded',    cls: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  out_of_window: { label: 'Out of Window', cls: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  wrong_role:    { label: 'Wrong Role',    cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  date_overlap:  { label: 'Date Conflict', cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
};

function reasonPill(reason: ConflictReason | undefined) {
  const cfg = reason ? REASON_CONFIG[reason] : REASON_CONFIG.overloaded;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ResolutionRow({ r }: { r: TicketResolution }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      {/* Change type badge */}
      <div className="pt-0.5 flex-shrink-0">{changeBadge(r.changeType)}</div>

      {/* Ticket info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[240px]">
            {r.ticketTitle}
          </span>
          {reasonPill(r.conflictReason)}
          {rolePill(r.taggedRole)}
          <span className="text-caption text-slate-400">{r.effortDays}d</span>
        </div>

        {/* Assignee diff */}
        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
          <Users className="w-3 h-3 flex-shrink-0" />
          <span className={r.fromAssignee === 'Unassigned' ? 'text-slate-400 italic' : ''}>{r.fromAssignee}</span>
          <ArrowRight className="w-3 h-3 flex-shrink-0 text-slate-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">{r.toAssignee}</span>
        </div>

        {/* Sprint diff (only if changed) */}
        {r.fromSprintId !== r.toSprintId && (
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-500 flex-wrap">
            <span>📅</span>
            <span className="italic">{r.fromSprintId ? 'current sprint' : 'unplaced'}</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="font-medium text-purple-600 dark:text-purple-400">{r.toSprintName}</span>
            <span className="text-slate-400">
              (starts {format(new Date(r.toStartDate), 'MMM d')})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function UnresolvableRow({ u }: { u: UnresolvableTicket }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/20 last:border-b-0">
      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{u.ticketTitle}</p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{u.reason}</p>
        <p className="text-xs text-slate-400 mt-0.5">{u.effortDays}d effort · Needs manual assignment</p>
      </div>
    </div>
  );
}

function DevBar({ before, after }: { before: DevCapacityInfo; after: DevCapacityInfo }) {
  const beforePct = Math.min(100, before.utilizationPct);
  const afterPct = Math.min(100, after.utilizationPct);
  const changed = Math.abs(beforePct - afterPct) > 0.5;

  return (
    <div className="py-2 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{before.devName}</span>
          <span className="text-label text-slate-400">{before.role}</span>
          {before.ptoDays > 0 && (
            <span className="text-label text-orange-500">({before.ptoDays}d PTO)</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-caption">
          <span className={utilTextColor(beforePct)}>{Math.round(beforePct)}%</span>
          {changed && (
            <>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className={`font-semibold ${utilTextColor(afterPct)}`}>{Math.round(afterPct)}%</span>
            </>
          )}
        </div>
      </div>

      {/* Stacked bar: before layer (full width) + after layer overlay */}
      {before.capacityDays > 0 ? (
        <div className="relative h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          {/* Before bar */}
          <div
            className={`absolute inset-y-0 left-0 rounded-full opacity-40 transition-all ${utilColor(beforePct)}`}
            style={{ width: `${beforePct}%` }}
          />
          {/* After bar */}
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all ${utilColor(afterPct)}`}
            style={{ width: `${afterPct}%` }}
          />
          {/* 90% ceiling marker */}
          <div className="absolute inset-y-0 w-px bg-slate-500/50 dark:bg-slate-400/50" style={{ left: '90%' }} />
        </div>
      ) : (
        <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="text-label text-slate-400">No working days in sprint</span>
        </div>
      )}

      {/* Capacity legend */}
      <div className="flex items-center gap-3 mt-1 text-label text-slate-400">
        <span>{before.availableDays}d available</span>
        <span>·</span>
        <span>{Math.round(after.assignedDays * 10) / 10}d assigned after</span>
        <span>·</span>
        <span>cap {Math.round(before.capacityDays * 10) / 10}d</span>
      </div>
    </div>
  );
}

function SprintCapacityBlock({
  before,
  after,
}: {
  before: SprintCapacitySummary;
  after: SprintCapacitySummary;
}) {
  const [open, setOpen] = useState(true);
  const afterDevMap = new Map(after.devCapacities.map(d => [d.devId, d]));

  // Only show devs who have some capacity or are involved in changes
  const activeDevs = before.devCapacities.filter(
    d => d.capacityDays > 0 || d.assignedDays > 0,
  );

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{before.sprintName}</span>
          <span className="text-caption text-slate-400">  {format(new Date(before.startDate), 'MMM d')} – {format(new Date(before.endDate), 'MMM d')}
          </span>
        </div>
        <span className="text-caption text-slate-400">{activeDevs.length} devs</span>
      </button>

      {open && (
        <div className="px-4 pt-2 pb-1">
          {activeDevs.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No active developers in this sprint window.</p>
          ) : (
            activeDevs.map(beforeDev => {
              const afterDev = afterDevMap.get(beforeDev.devId) ?? beforeDev;
              return <DevBar key={beforeDev.devId} before={beforeDev} after={afterDev} />;
            })
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 pt-2 pb-1 text-label text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block opacity-40" /> Before</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> After</span>
            <span className="flex items-center gap-1"><span className="w-px h-3 bg-slate-500 inline-block" /> 90% ceiling</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────

function LoadingSkeleton({ onCancel }: { onCancel: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl pointer-events-auto overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Auto-Resolve Preview</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Analyzing conflicts and building a resolution plan…</p>
              </div>
            </div>
          </div>
          {/* Skeleton rows */}
          <div className="px-4 py-4 space-y-3">
            {[90, 75, 82, 60, 70].map((w, i) => (
              <div key={i} className="flex items-center gap-3 px-2">
                <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className={`h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse`} style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
            <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-9 w-36 rounded-xl bg-violet-200 dark:bg-violet-900/40 animate-pulse" />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

interface Props {
  result: AutoResolveResult | null;
  isLoading?: boolean;
  onApprove: (resolutions: TicketResolution[]) => void;
  onCancel: () => void;
  onReviewManually?: () => void;
}

// ─── How-this-works card (inline in Changes tab) ────────────────────────────
function HowItWorksCard({ unresolvableCount }: { unresolvableCount: number }) {
  return (
    <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
      <div className="flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-0.5">How this works</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Conflicts are fixed in order: unassigned tickets first, overloaded sprints next, then date overlaps.
            {unresolvableCount > 0
              ? ` ${unresolvableCount} ticket${unresolvableCount > 1 ? 's' : ''} couldn't be auto-placed — no dev had enough room. Apply changes, then run once more or review those manually.`
              : ' If any conflict remains after applying, run it once more — cascading changes clear in 1–2 passes.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AutoResolvePreviewModal({ result, isLoading, onApprove, onCancel, onReviewManually }: Props) {
  const [tab, setTab] = useState<'changes' | 'impact'>('changes');

  // Show skeleton while the resolver is running
  if (isLoading || !result) {
    return <LoadingSkeleton onCancel={onCancel} />;
  }

  const { resolutions, unresolvable, sprintSnapshotsBefore, sprintSnapshotsAfter } = result;

  const totalConflicts = resolutions.length + unresolvable.length;
  const resolvedPct = totalConflicts > 0 ? Math.round((resolutions.length / totalConflicts) * 100) : 100;

  // Summary counts
  const assigned = resolutions.filter(r => r.changeType === 'assigned').length;
  const reassigned = resolutions.filter(r => r.changeType === 'reassigned').length;
  const moved = resolutions.filter(
    r => r.changeType === 'moved' || r.changeType === 'reassigned_and_moved',
  ).length;

  // Group resolutions by change type for display ordering
  const sorted = [...resolutions].sort((a, b) => {
    const order: Record<ChangeType, number> = {
      assigned: 0, reassigned: 1, moved: 2, reassigned_and_moved: 3,
    };
    return order[a.changeType] - order[b.changeType];
  });

  // Match before/after sprint snapshots for capacity tab
  const sprintPairs = sprintSnapshotsBefore.map(before => ({
    before,
    after: sprintSnapshotsAfter.find(a => a.sprintId === before.sprintId) ?? before,
  }));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

          {/* ── Header ── */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Auto-Resolve Preview</h2>
              </div>
              {totalConflicts > 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  <span className={`font-semibold ${
                    resolvedPct === 100 ? 'text-emerald-600 dark:text-emerald-400' :
                    resolvedPct >= 70  ? 'text-blue-600 dark:text-blue-400' :
                                         'text-amber-600 dark:text-amber-400'
                  }`}>{resolutions.length} of {totalConflicts} conflicts resolved ({resolvedPct}%)</span>
                  {unresolvable.length > 0 && (
                    <span className="text-slate-400"> · {unresolvable.length} need manual review</span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Review all proposed changes before committing to the timeline.</p>
              )}
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Summary chips ── */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 flex-wrap bg-slate-50 dark:bg-slate-800/40">
            {assigned > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="w-3 h-3" /> {assigned} assigned
              </span>
            )}
            {reassigned > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                ⇄ {reassigned} rebalanced
              </span>
            )}
            {moved > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                → {moved} sprint-moved
              </span>
            )}
            {unresolvable.length > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-3 h-3" /> {unresolvable.length} needs review
              </span>
            )}
            {resolutions.length === 0 && unresolvable.length === 0 && (
              <span className="text-sm text-slate-400 italic">Nothing to resolve — all devs are within capacity.</span>
            )}
          </div>

          {/* ── Tabs ── */}
          <div className="flex items-center gap-1 px-6 pt-3 flex-shrink-0">
            {(['changes', 'impact'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t
                    ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {t === 'changes'
                  ? `Changes (${resolutions.length})`
                  : `Capacity Impact (${sprintPairs.length} sprints)`}
              </button>
            ))}
          </div>

          {/* ── Body (scrollable) ── */}
          <div className="flex-1 overflow-y-auto min-h-0 mt-3">

            {tab === 'changes' && (
              <div className="pb-4">
                <HowItWorksCard unresolvableCount={unresolvable.length} />

                {sorted.length > 0 && (
                  <div className="mx-4 mt-3 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {sorted.map(r => <ResolutionRow key={r.ticketId} r={r} />)}
                  </div>
                )}

                {unresolvable.length > 0 && (
                  <div className="mx-4 mt-4">
                    <h3 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Needs Manual Review ({unresolvable.length})
                    </h3>
                    <div className="rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden">
                      {unresolvable.map(u => <UnresolvableRow key={u.ticketId} u={u} />)}
                    </div>
                  </div>
                )}

                {sorted.length === 0 && unresolvable.length === 0 && (
                  <div className="flex flex-col items-center py-12 text-slate-400">
                    <CheckCircle className="w-10 h-10 mb-3 text-emerald-400" />
                    <p className="text-sm font-medium">Everything looks great!</p>
                    <p className="text-xs mt-1">No unassigned tickets or overloaded developers found.</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'impact' && (
              <div className="px-4 pb-4">
                {sprintPairs.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No sprints found within the dev window.</p>
                ) : (
                  sprintPairs.map(({ before, after }) => (
                    <SprintCapacityBlock key={before.sprintId} before={before} after={after} />
                  ))
                )}

                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">Utilization window: 80–90%</span>.
                    The resolver targets the least-loaded eligible developer first and will
                    never assign a ticket that would push a developer above 90%.
                    Faded bars show the original utilization; solid bars show the proposed state.
                    The vertical marker at <span className="font-semibold">90%</span> is the hard ceiling.
                  </p>
                </div>
              </div>
            )}


          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-50 dark:bg-slate-800/40">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-300 dark:border-slate-600"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              {unresolvable.length > 0 && onReviewManually && (
                <button
                  onClick={onReviewManually}
                  className="text-xs text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                >
                  Review {unresolvable.length} manually
                </button>
              )}
              <button
                onClick={() => onApprove(resolutions)}
                disabled={resolutions.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white disabled:text-slate-400 text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                Approve {resolutions.length} Change{resolutions.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
