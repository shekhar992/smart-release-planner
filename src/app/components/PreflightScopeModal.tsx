/**
 * PreflightScopeModal
 *
 * Shows a summary of what the auto-resolver is about to do BEFORE it runs.
 * Gives the PM full situational awareness and lets them configure preferences:
 *   - Scope card: conflict breakdown by type + locked ticket count
 *   - PM preferences: strategy toggles (minimize reassignments, protect critical path, etc.)
 *
 * Zero risk to existing auto-resolve logic — this modal simply gates the call.
 */

import { X, Zap, Lock, AlertTriangle, Users, GitBranch, Info } from 'lucide-react';
import type { Release } from '../data/mockData';
import type { Phase, TeamMember } from '../data/mockData';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PreflightPreferences {
  minimizeReassignments: boolean;
  protectCriticalPath: boolean;
  prioritizeSeniorsOnHighRisk: boolean;
}

export const DEFAULT_PREFERENCES: PreflightPreferences = {
  minimizeReassignments: false,
  protectCriticalPath: false,
  prioritizeSeniorsOnHighRisk: false,
};

interface PreflightScopeModalProps {
  release: Release;
  teamMembers: TeamMember[];
  phases: Phase[];
  preferences: PreflightPreferences;
  onPreferencesChange: (p: PreflightPreferences) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

// ─── Conflict Scope Computation ────────────────────────────────────────────

interface ConflictScope {
  total: number;
  unassigned: number;
  overloaded: number;
  outOfWindow: number;
  wrongRole: number;
  dateOverlap: number;
  lockedTickets: number;
}

function computeScope(release: Release, phases: Phase[], teamMembers: TeamMember[]): ConflictScope {
  const devPhases = phases.filter(p => p.allowsWork);
  let devWindowStart: Date;
  let devWindowEnd: Date;

  if (devPhases.length > 0) {
    const ms = devPhases.flatMap(p => [
      new Date(p.startDate).getTime(),
      new Date(p.endDate).getTime(),
    ]);
    devWindowStart = new Date(Math.min(...ms));
    devWindowEnd = new Date(Math.max(...ms));
  } else {
    devWindowStart = new Date(release.startDate);
    devWindowEnd = new Date(release.endDate);
  }

  const allTickets = release.features.flatMap(f => f.tickets);

  let unassigned = 0, overloaded = 0, outOfWindow = 0, wrongRole = 0, dateOverlap = 0, lockedTickets = 0;
  const countedIds = new Set<string>();

  for (const t of allTickets) {
    if (t.locked) { lockedTickets++; continue; }

    // Out-of-window
    if (new Date(t.endDate) > devWindowEnd || new Date(t.startDate) > devWindowEnd) {
      outOfWindow++;
      countedIds.add(t.id);
      continue;
    }

    // Unassigned
    if (!t.assignedTo || t.assignedTo.trim() === '') {
      unassigned++;
      countedIds.add(t.id);
      continue;
    }

    // Wrong role
    if (t.requiredRole && t.assignedTo) {
      const dev = teamMembers.find(m => m.name === t.assignedTo);
      if (!dev || (dev.role !== t.requiredRole && dev.role !== 'Fullstack' && t.requiredRole !== 'Fullstack')) {
        wrongRole++;
        countedIds.add(t.id);
        continue;
      }
    }
  }

  // Per-dev overlap detection (simplified)
  const ticketsByDev = new Map<string, typeof allTickets>();
  for (const t of allTickets) {
    if (t.locked || countedIds.has(t.id) || !t.assignedTo) continue;
    const list = ticketsByDev.get(t.assignedTo) ?? [];
    list.push(t);
    ticketsByDev.set(t.assignedTo, list);
  }
  for (const [, devTickets] of ticketsByDev) {
    const sorted = [...devTickets].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
    for (let i = 1; i < sorted.length; i++) {
      const cs = new Date(sorted[i].startDate);
      const ce = new Date(sorted[i].endDate);
      const hasOvlp = sorted.slice(0, i).some(e => {
        const es = new Date(e.startDate);
        const ee = new Date(e.endDate);
        return cs <= ee && es <= ce;
      });
      if (hasOvlp && !countedIds.has(sorted[i].id)) {
        dateOverlap++;
        countedIds.add(sorted[i].id);
      }
    }
  }

  // Per-dev overload (utilization > 90%) — rough estimate without full cap calculation
  const effortByDev = new Map<string, number>();
  for (const t of allTickets) {
    if (t.locked || !t.assignedTo || t.assignedTo.trim() === '') continue;
    effortByDev.set(t.assignedTo, (effortByDev.get(t.assignedTo) ?? 0) + (t.effortDays ?? t.storyPoints ?? 1));
  }
  const devWindowDays = Math.max(1, (devWindowEnd.getTime() - devWindowStart.getTime()) / (1000 * 60 * 60 * 24) * 5 / 7);
  for (const [devName, effort] of effortByDev) {
    const dev = teamMembers.find(m => m.name === devName);
    const capacity = devWindowDays * (dev?.velocityMultiplier ?? 1) * 0.9;
    if (effort > capacity) {
      // Count overloaded tickets for this dev that aren't already counted
      const devTickets = allTickets.filter(
        t => !t.locked && !countedIds.has(t.id) && t.assignedTo === devName,
      ).sort((a, b) => (a.effortDays ?? 1) - (b.effortDays ?? 1));
      let excess = effort - capacity;
      for (const t of devTickets) {
        if (excess <= 0) break;
        overloaded++;
        countedIds.add(t.id);
        excess -= t.effortDays ?? t.storyPoints ?? 1;
      }
    }
  }

  const total = unassigned + overloaded + outOfWindow + wrongRole + dateOverlap;
  return { total, unassigned, overloaded, outOfWindow, wrongRole, dateOverlap, lockedTickets };
}

// ─── Scope Row ──────────────────────────────────────────────────────────────

function ScopeRow({ label, count, color }: { label: string; count: number; color: string }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{count}</span>
    </div>
  );
}

// ─── Preference Toggle ──────────────────────────────────────────────────────

function PrefToggle({
  label,
  sublabel,
  checked,
  onChange,
}: {
  label: string;
  sublabel: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer group">
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-9 h-5 rounded-full transition-colors duration-200 ${
            checked ? 'bg-violet-500' : 'bg-slate-200 dark:bg-slate-700'
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
              checked ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
          {label}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sublabel}</p>
      </div>
    </label>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function PreflightScopeModal({
  release,
  teamMembers,
  phases,
  preferences,
  onPreferencesChange,
  onConfirm,
  onCancel,
}: PreflightScopeModalProps) {
  const scope = computeScope(release, phases, teamMembers);
  const noConflicts = scope.total === 0;

  const setPreference = (key: keyof PreflightPreferences, value: boolean) => {
    onPreferencesChange({ ...preferences, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40">
              <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Auto-Resolve Preflight</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Review scope before running</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scope Card ── */}
        <div className="px-6 pt-5 pb-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {noConflicts ? 'No conflicts detected' : `${scope.total} ticket${scope.total !== 1 ? 's' : ''} to resolve`}
              </span>
            </div>

            {noConflicts ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All tickets look good! Auto-resolve won't make any changes.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                <ScopeRow label="Unassigned" count={scope.unassigned} color="text-slate-600 dark:text-slate-300" />
                <ScopeRow label="Overloaded dev" count={scope.overloaded} color="text-red-600 dark:text-red-400" />
                <ScopeRow label="Outside dev window" count={scope.outOfWindow} color="text-orange-600 dark:text-orange-400" />
                <ScopeRow label="Wrong role assigned" count={scope.wrongRole} color="text-blue-600 dark:text-blue-400" />
                <ScopeRow label="Date overlap" count={scope.dateOverlap} color="text-amber-600 dark:text-amber-400" />
              </div>
            )}

            {scope.lockedTickets > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {scope.lockedTickets} locked ticket{scope.lockedTickets !== 1 ? 's' : ''} will be skipped
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── PM Preferences ── */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Resolution Strategy
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <PrefToggle
              label="Minimize reassignments"
              sublabel="Prefer same dev, move sprint instead of swapping owner"
              checked={preferences.minimizeReassignments}
              onChange={v => setPreference('minimizeReassignments', v)}
            />
            <PrefToggle
              label="Protect critical path"
              sublabel="Keep high-priority tickets (P1–P2) in the earliest sprint"
              checked={preferences.protectCriticalPath}
              onChange={v => setPreference('protectCriticalPath', v)}
            />
            <PrefToggle
              label="Seniors on high-risk tickets"
              sublabel="Assign senior developers to unassigned P1 tickets first"
              checked={preferences.prioritizeSeniorsOnHighRisk}
              onChange={v => setPreference('prioritizeSeniorsOnHighRisk', v)}
            />
          </div>

          <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/40">
            <Info className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-violet-700 dark:text-violet-300">
              Preferences guide the resolver's priorities. You'll review every change before anything is applied.
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={noConflicts}
            className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <GitBranch className="w-4 h-4" />
            Run Auto-Resolve
          </button>
        </div>
      </div>
    </div>
  );
}
