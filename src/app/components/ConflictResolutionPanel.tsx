import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, ArrowRight, CalendarClock, Users as UsersIcon, CheckCircle2, Sparkles, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { cn } from './ui/utils';
import { Conflict, getBestResolution } from '../lib/conflictDetection';
import { Ticket, TeamMember } from '../data/mockData';
import { explainConflict, type ConflictExplanation } from '../lib/aiCommandProcessor';

interface ConflictResolutionPanelProps {
  conflicts: Conflict[];
  tickets: Ticket[];
  teamMembers?: TeamMember[];
  onClose: () => void;
  onReassignTicket?: (ticketId: string, newAssignee: string) => void;
  onMoveTicketToSprint?: (ticketId: string, sprintId: string) => void;
  onShiftTicket?: (ticketId: string, shiftDays: number) => void;
  onIgnoreConflict?: (ticketId: string) => void;
}

export function ConflictResolutionPanel({
  conflicts,
  tickets,
  teamMembers,
  onClose,
  onReassignTicket,
  onMoveTicketToSprint,
  onShiftTicket,
  onIgnoreConflict
}: ConflictResolutionPanelProps) {
  // ID-based tracking instead of index: immune to conflicts array re-ordering/shrinking.
  const [currentConflictId, setCurrentConflictId] = useState<string | null>(
    conflicts[0]?.ticketId ?? null
  );
  const [resolvedConflicts, setResolvedConflicts] = useState<Set<string>>(new Set());
  // justResolvedId drives the transient "Conflict Resolved!" animation overlay.
  const [justResolvedId, setJustResolvedId] = useState<string | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // AI explainer state — keyed by conflictId so it resets when moving between conflicts
  const [aiExplanation, setAiExplanation] = useState<ConflictExplanation | null>(null);
  const [aiExplaining, setAiExplaining] = useState(false);

  // Reset explainer when navigating to a different conflict
  useEffect(() => {
    setAiExplanation(null);
    setAiExplaining(false);
  }, [currentConflictId]);

  const handleExplainWithAI = async () => {
    if (!currentConflict || !ticket || aiExplaining) return;
    setAiExplaining(true);
    setAiExplanation(null);
    try {
      const result = await explainConflict(
        currentConflict.message,
        ticket.title,
        currentConflict.developer,
      );
      setAiExplanation(result);
    } catch {
      setAiExplanation({
        plainEnglish: 'Could not reach AI. Is Ollama running?',
        rootCause: '',
        suggestion: '',
      });
    } finally {
      setAiExplaining(false);
    }
  };

  // Stable refs so timer callbacks always read the latest values without restarting the timer.
  const conflictsRef = useRef(conflicts);
  const resolvedRef = useRef(resolvedConflicts);
  useEffect(() => { conflictsRef.current = conflicts; }, [conflicts]);
  useEffect(() => { resolvedRef.current = resolvedConflicts; }, [resolvedConflicts]);

  // Derive current conflict by ID — never goes out-of-bounds.
  const currentConflict = conflicts.find(c => c.ticketId === currentConflictId) ?? null;
  const currentIndex = currentConflict ? conflicts.indexOf(currentConflict) : 0;
  const totalConflicts = conflicts.length;
  const resolvedCount = resolvedConflicts.size;

  // Get the best resolution for current conflict
  const ticket = currentConflict ? tickets.find(t => t.id === currentConflict.ticketId) : null;
  const bestResolution = currentConflict && ticket
    ? getBestResolution(currentConflict, ticket, tickets, teamMembers || [])
    : null;

  // After "Resolved!" animation finishes (1200ms), advance to the next unresolved conflict.
  // Reads from refs so the timer always uses the live conflicts/resolved state.
  useEffect(() => {
    if (!justResolvedId) return;
    const timer = setTimeout(() => {
      const live = conflictsRef.current;
      const resolved = resolvedRef.current;
      const next = live.find(c => c.ticketId !== justResolvedId && !resolved.has(c.ticketId));
      if (next) {
        setCurrentConflictId(next.ticketId);
      } else {
        onClose();
      }
      setJustResolvedId(null);
      setShowMoreOptions(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [justResolvedId, onClose]);

  // When the parent re-computes the conflicts array (e.g., after a ticket is shifted),
  // if our tracked ID vanished from the list sync to the first unresolved item.
  useEffect(() => {
    if (justResolvedId) return; // animation in flight — don't interfere
    if (conflicts.length === 0) { onClose(); return; }
    const stillPresent = currentConflictId != null &&
      conflicts.some(c => c.ticketId === currentConflictId);
    if (!stillPresent) {
      const next =
        conflicts.find(c => !resolvedConflicts.has(c.ticketId)) ?? conflicts[0];
      setCurrentConflictId(next.ticketId);
      setShowMoreOptions(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conflicts]);

  const handleApplyBestSolution = async () => {
    if (!bestResolution || !currentConflict) return;

    setIsApplying(true);

    try {
      if (bestResolution.type === 'reassign' && typeof bestResolution.value === 'string') {
        onReassignTicket?.(currentConflict.ticketId, bestResolution.value);
      } else if (bestResolution.type === 'shift' && typeof bestResolution.value === 'number') {
        onShiftTicket?.(currentConflict.ticketId, bestResolution.value);
      } else if (bestResolution.type === 'sprint-move' && typeof bestResolution.value === 'string') {
        onMoveTicketToSprint?.(currentConflict.ticketId, bestResolution.value);
      }

      // Mark as resolved and kick off the "Resolved!" animation + advance.
      const resolvedId = currentConflict.ticketId;
      setResolvedConflicts(prev => new Set(prev).add(resolvedId));
      setJustResolvedId(resolvedId);
    } finally {
      setTimeout(() => setIsApplying(false), 500);
    }
  };

  const handleSkip = () => {
    if (!currentConflict) { onClose(); return; }
    const idx = conflicts.indexOf(currentConflict);
    const next = conflicts[idx + 1];
    if (next) {
      setCurrentConflictId(next.ticketId);
      setShowMoreOptions(false);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (!currentConflict) return;
    const idx = conflicts.indexOf(currentConflict);
    if (idx > 0) {
      setCurrentConflictId(conflicts[idx - 1].ticketId);
      setShowMoreOptions(false);
    }
  };

  const handleManualAction = (type: 'reassign' | 'sprint' | 'shift', value: string | number) => {
    if (!currentConflict) return;

    if (type === 'reassign' && typeof value === 'string') {
      onReassignTicket?.(currentConflict.ticketId, value);
    } else if (type === 'sprint' && typeof value === 'string') {
      onMoveTicketToSprint?.(currentConflict.ticketId, value);
    } else if (type === 'shift' && typeof value === 'number') {
      onShiftTicket?.(currentConflict.ticketId, value);
    }

    // Mark as resolved and kick off animation + advance.
    const resolvedId = currentConflict.ticketId;
    setResolvedConflicts(prev => new Set(prev).add(resolvedId));
    setJustResolvedId(resolvedId);
  };

  const getSeverityBadge = (severity: "high" | "medium" | "low") => {
    const styles = {
      high: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700",
      medium: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700",
      low: "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
    };
    const labels = {
      high: "High Priority",
      medium: "Medium",
      low: "Low Priority"
    };
    return (
      <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-lg border", styles[severity])}>
        {labels[severity]}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "overlap": return { icon: "🔴", label: "Schedule Overlap" };
      case "developerOverload": return { icon: "🟠", label: "Developer Overload" };
      case "sprintOverCapacity": return { icon: "🟡", label: "Sprint Over Capacity" };
      case "timelineOverflow": return { icon: "⚠️", label: "Timeline Overflow" };
      default: return { icon: "⚠️", label: "Conflict" };
    }
  };

  const getTicketById = (ticketId: string) => {
    return tickets.find(t => t.id === ticketId);
  };

  // Show the resolved overlay whenever we just applied/handled a conflict (for animation duration).
  const isResolved = justResolvedId !== null;

  if (conflicts.length === 0) {
    return (
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-950/50 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-base font-semibold text-slate-900 dark:text-white">No Conflicts</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">All tickets are scheduled without conflicts</p>
          <button
            onClick={onClose}
            className="mt-6 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const typeInfo = currentConflict ? getTypeLabel(currentConflict.type) : null;

  return (
    <div className="w-full max-w-lg max-h-[88vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-amber-50/60 dark:bg-amber-950/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Conflict Resolution</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              · {currentIndex + 1} of {totalConflicts}
              {resolvedCount > 0 && <span className="text-emerald-600 dark:text-emerald-400"> · {resolvedCount} resolved</span>}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
            style={{ width: `${(resolvedCount / totalConflicts) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/40 dark:bg-slate-800/20">
        {isResolved ? (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Conflict Resolved!</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Moving to next…</p>
          </div>
        ) : currentConflict && ticket ? (
          <>
            {/* Conflict summary card */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 overflow-hidden">
              {/* Type + severity row */}
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50/80 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900">
                <span className="text-base leading-none">{typeInfo?.icon}</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{typeInfo?.label}</span>
                {getSeverityBadge(currentConflict.severity)}
              </div>

              {/* Ticket title + message */}
              <div className="px-3 py-2.5 space-y-1.5">
                <p className="text-sm font-medium text-slate-900 dark:text-white leading-snug">{ticket.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{currentConflict.message}</p>

                {/* Meta row — assignee · duration · dates */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <UsersIcon className="w-3 h-3" />{currentConflict.developer}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {ticket.effortDays || ticket.storyPoints || 1}d
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {ticket.startDate.toLocaleDateString()} – {ticket.endDate.toLocaleDateString()}
                  </span>
                </div>

                {/* AI Explainer */}
                <div className="pt-0.5">
                  {!aiExplanation && !aiExplaining && (
                    <button
                      onClick={handleExplainWithAI}
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      Explain with AI
                    </button>
                  )}
                  {aiExplaining && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Loader2 className="w-3 h-3 animate-spin" />Analyzing…
                    </div>
                  )}
                  {aiExplanation && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg space-y-1">
                      <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">{aiExplanation.plainEnglish}</p>
                      {aiExplanation.rootCause && (
                        <p className="text-[11px] text-blue-600 dark:text-blue-400"><span className="font-semibold">Why: </span>{aiExplanation.rootCause}</p>
                      )}
                      {aiExplanation.suggestion && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400"><span className="font-semibold">✓ Tip: </span>{aiExplanation.suggestion}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Conflicting tickets */}
                {currentConflict.conflictingTickets && currentConflict.conflictingTickets.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Conflicts with: </span>
                    {currentConflict.conflictingTickets.slice(0, 3).map((cId, i) => {
                      const cTicket = getTicketById(cId);
                      return (
                        <span key={cId} className="text-[11px] text-slate-600 dark:text-slate-400">
                          {i > 0 && ', '}{cTicket?.title || cId}
                        </span>
                      );
                    })}
                    {currentConflict.conflictingTickets.length > 3 && (
                      <span className="text-[11px] text-slate-400 italic"> +{currentConflict.conflictingTickets.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Best Resolution ─────────────────────────────────────── */}
            {bestResolution ? (
              <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/30 overflow-hidden">
                <div className="px-3 py-2.5">
                  {/* Title + confidence */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">Recommended Fix</span>
                    <span className="ml-auto text-[11px] font-semibold px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full">
                      {bestResolution.confidence}% confidence
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-2">{bestResolution.description}</p>

                  {/* Impact chips — inline */}
                  <div className="flex items-center flex-wrap gap-1.5 mb-2.5">
                    {bestResolution.impact.willResolve && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />Resolves conflict
                      </span>
                    )}
                    {bestResolution.impact.mayCreateNew && bestResolution.impact.newConflictCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-3 h-3" />{bestResolution.impact.newConflictCount} new conflict{bestResolution.impact.newConflictCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {bestResolution.impact.willExtendRelease && bestResolution.impact.extensionDays > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400">
                        <CalendarClock className="w-3 h-3" />+{bestResolution.impact.extensionDays}d release
                      </span>
                    )}
                    {!bestResolution.impact.mayCreateNew && !bestResolution.impact.willExtendRelease && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="w-3 h-3" />No side effects
                      </span>
                    )}
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleApplyBestSolution}
                      disabled={isApplying}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                        isApplying
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm"
                      )}
                    >
                      <Sparkles className="w-3 h-3" />
                      {isApplying ? 'Applying…' : 'Apply & Continue'}
                    </button>
                    <button
                      onClick={() => setShowMoreOptions(!showMoreOptions)}
                      className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1"
                    >
                      {showMoreOptions ? 'Less' : 'More'}
                      <ChevronRight className={cn("w-3 h-3 transition-transform", showMoreOptions && "rotate-90")} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Manual resolution needed</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">No automatic fix found — use the options below or skip.</p>
                </div>
                <button
                  onClick={() => setShowMoreOptions(true)}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
                >
                  Options
                </button>
              </div>
            )}

            {/* ── Manual Options ───────────────────────────────────────── */}
            {showMoreOptions && currentConflict.suggestions && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Manual Options</span>
                </div>
                <div className="p-3 space-y-2.5">
                  {currentConflict.suggestions.possibleReassignments && currentConflict.suggestions.possibleReassignments.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">Reassign to:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentConflict.suggestions.possibleReassignments.map(dev => (
                          <button key={dev} onClick={() => handleManualAction('reassign', dev)}
                            className="px-2.5 py-1 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg transition-colors flex items-center gap-1 font-medium">
                            <UsersIcon className="w-3 h-3" />{dev}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentConflict.suggestions.possibleShiftDays && currentConflict.suggestions.possibleShiftDays.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">Shift schedule:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentConflict.suggestions.possibleShiftDays.slice(0, 3).map(days => (
                          <button key={days} onClick={() => handleManualAction('shift', days)}
                            className="px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 rounded-lg transition-colors flex items-center gap-1 font-medium">
                            <CalendarClock className="w-3 h-3" />+{days}d
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentConflict.suggestions.possibleSprintMoves && currentConflict.suggestions.possibleSprintMoves.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">Move to sprint:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentConflict.suggestions.possibleSprintMoves.map(sprintId => (
                          <button key={sprintId} onClick={() => handleManualAction('sprint', sprintId)}
                            className="px-2.5 py-1 text-xs bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-lg transition-colors flex items-center gap-1 font-medium">
                            <ArrowRight className="w-3 h-3" />Next Sprint
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ignore */}
            <button
              onClick={() => {
                if (!currentConflict) return;
                const resolvedId = currentConflict.ticketId;
                onIgnoreConflict?.(resolvedId);
                setResolvedConflicts(prev => new Set(prev).add(resolvedId));
                setJustResolvedId(resolvedId);
              }}
              className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors font-medium"
            >
              Ignore This Conflict
            </button>
          </>
        ) : null}
      </div>

      {/* ── Footer navigation ───────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
            currentIndex === 0
              ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <ChevronLeft className="w-3.5 h-3.5" />Previous
        </button>
        <button
          onClick={handleSkip}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
        >
          Skip<ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
