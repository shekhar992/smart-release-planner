import { useState, useEffect } from 'react';
import { X, AlertTriangle, ArrowRight, CalendarClock, Users as UsersIcon, CheckCircle2, Sparkles, ChevronRight, ChevronLeft, Skip } from 'lucide-react';
import { cn } from './ui/utils';
import { Conflict, getBestResolution } from '../lib/conflictDetection';
import { Ticket, TeamMember } from '../data/mockData';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolvedConflicts, setResolvedConflicts] = useState<Set<string>>(new Set());
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const currentConflict = conflicts[currentIndex];
  const totalConflicts = conflicts.length;
  const resolvedCount = resolvedConflicts.size;

  // Get the best resolution for current conflict
  const ticket = currentConflict ? tickets.find(t => t.id === currentConflict.ticketId) : null;
  const bestResolution = currentConflict && ticket
    ? getBestResolution(currentConflict, ticket, tickets, teamMembers || [])
    : null;

  // Auto-advance when conflict is resolved
  useEffect(() => {
    if (resolvedConflicts.has(currentConflict?.ticketId)) {
      // Already resolved, auto-advance after short delay
      const timer = setTimeout(() => {
        if (currentIndex < totalConflicts - 1) {
          setCurrentIndex(currentIndex + 1);
          setShowMoreOptions(false);
        } else {
          // All done, close panel
          onClose();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [resolvedConflicts, currentConflict?.ticketId, currentIndex, totalConflicts, onClose]);

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

      // Mark as resolved
      setResolvedConflicts(prev => new Set(prev).add(currentConflict.ticketId));
    } finally {
      setTimeout(() => setIsApplying(false), 500);
    }
  };

  const handleSkip = () => {
    if (currentIndex < totalConflicts - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowMoreOptions(false);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
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

    // Mark as resolved
    setResolvedConflicts(prev => new Set(prev).add(currentConflict.ticketId));
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

  const isResolved = currentConflict && resolvedConflicts.has(currentConflict.ticketId);

  if (conflicts.length === 0) {
    return (
      <div className="w-[480px] h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-slate-700 flex flex-col shadow-2xl">
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
    <div className="w-[480px] h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-slate-700 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-amber-50/50 to-red-50/50 dark:from-amber-950/30 dark:to-red-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Conflict Resolution</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                {resolvedCount} of {totalConflicts} resolved
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
            title="Close panel"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
            <span>Conflict {currentIndex + 1} of {totalConflicts}</span>
            <span>{Math.round((resolvedCount / totalConflicts) * 100)}% complete</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-500"
              style={{ width: `${(resolvedCount / totalConflicts) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content - Single Conflict View */}
      <div className="flex-1 overflow-y-auto p-5 bg-slate-50/30 dark:bg-slate-800/30">
        {isResolved ? (
          // Resolved State
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-950/50 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mb-4 shadow-lg animate-bounce-once">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">Conflict Resolved!</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Moving to next...</p>
          </div>
        ) : currentConflict && ticket ? (
          // Active Conflict View
          <div className="space-y-4">
            {/* Conflict Card */}
            <div className="border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-lg">
              {/* Card Header */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{typeInfo?.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {typeInfo?.label}
                      </h3>
                      {getSeverityBadge(currentConflict.severity)}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {ticket.title}
                    </p>
                  </div>
                </div>
              </div>

              {/* Problem Description */}
              <div className="p-4 space-y-3 bg-white dark:bg-slate-900">
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  {currentConflict.message}
                </div>

                {/* Ticket Details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-slate-500 dark:text-slate-400 block mb-1">Assigned to</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{currentConflict.developer}</span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-slate-500 dark:text-slate-400 block mb-1">Duration</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{ticket.effortDays || ticket.storyPoints || 1} days</span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg col-span-2">
                    <span className="text-slate-500 dark:text-slate-400 block mb-1">Scheduled</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {ticket.startDate.toLocaleDateString()} - {ticket.endDate.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Conflicting Tickets */}
                {currentConflict.conflictingTickets && currentConflict.conflictingTickets.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Conflicts with:</span>
                    <div className="mt-2 space-y-1">
                      {currentConflict.conflictingTickets.slice(0, 3).map(cId => {
                        const cTicket = getTicketById(cId);
                        return (
                          <div key={cId} className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span className="text-red-500">•</span>
                            <span className="truncate">{cTicket?.title || cId}</span>
                          </div>
                        );
                      })}
                      {currentConflict.conflictingTickets.length > 3 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                          +{currentConflict.conflictingTickets.length - 3} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Best Resolution */}
            {bestResolution ? (
              <div className="border-2 border-amber-300 dark:border-amber-700 rounded-xl overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 shadow-lg">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recommended Solution</h3>
                    <span className="ml-auto text-xs font-semibold px-2 py-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full">
                      {bestResolution.confidence}% confidence
                    </span>
                  </div>

                  <p className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                    {bestResolution.description}
                  </p>

                  {/* Impact Preview */}
                  <div className="space-y-2 mb-4 text-sm">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Impact:</p>
                    {bestResolution.impact.willResolve && (
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Resolves this conflict</span>
                      </div>
                    )}
                    {bestResolution.impact.mayCreateNew && bestResolution.impact.newConflictCount > 0 && (
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>May create {bestResolution.impact.newConflictCount} new conflict{bestResolution.impact.newConflictCount > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {bestResolution.impact.willExtendRelease && bestResolution.impact.extensionDays > 0 && (
                      <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                        <CalendarClock className="w-4 h-4" />
                        <span>May extend release by {bestResolution.impact.extensionDays} day{bestResolution.impact.extensionDays > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {!bestResolution.impact.mayCreateNew && !bestResolution.impact.willExtendRelease && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>No negative side effects</span>
                      </div>
                    )}
                  </div>

                  {/* Primary Action Button */}
                  <button
                    onClick={handleApplyBestSolution}
                    disabled={isApplying}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2",
                      isApplying
                        ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl"
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                    {isApplying ? 'Applying...' : 'Apply & Continue'}
                  </button>

                  {/* More Options (Collapsed by default) */}
                  <button
                    onClick={() => setShowMoreOptions(!showMoreOptions)}
                    className="w-full mt-2 px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all duration-200 flex items-center justify-center gap-1"
                  >
                    {showMoreOptions ? 'Hide' : 'More'} options
                    <ChevronRight className={cn("w-3 h-3 transition-transform", showMoreOptions && "rotate-90")} />
                  </button>
                </div>
              </div>
            ) : (
              // No automatic solution available
              <div className="border border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Manual Resolution Required</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      No automatic solution found. Please review options below or skip this conflict.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMoreOptions(true)}
                  className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-all"
                >
                  Show Manual Options
                </button>
              </div>
            )}

            {/* Manual Options (Expanded) */}
            {showMoreOptions && currentConflict.suggestions && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Manual Options</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Choose an alternative resolution</p>
                </div>
                <div className="p-4 space-y-3">
                  {/* Reassignment Options */}
                  {currentConflict.suggestions.possibleReassignments && currentConflict.suggestions.possibleReassignments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Reassign to:</p>
                      <div className="flex flex-wrap gap-2">
                        {currentConflict.suggestions.possibleReassignments.map(dev => (
                          <button
                            key={dev}
                            onClick={() => handleManualAction('reassign', dev)}
                            className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg transition-all duration-200 flex items-center gap-1.5 font-medium"
                          >
                            <UsersIcon className="w-3.5 h-3.5" />
                            {dev}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shift Options */}
                  {currentConflict.suggestions.possibleShiftDays && currentConflict.suggestions.possibleShiftDays.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Shift schedule:</p>
                      <div className="flex flex-wrap gap-2">
                        {currentConflict.suggestions.possibleShiftDays.slice(0, 3).map(days => (
                          <button
                            key={days}
                            onClick={() => handleManualAction('shift', days)}
                            className="px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 dark:bg-green-950/50 dark:hover:bg-green-900/70 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 rounded-lg transition-all duration-200 flex items-center gap-1.5 font-medium"
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                            +{days} day{days > 1 ? 's' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sprint Move Options */}
                  {currentConflict.suggestions.possibleSprintMoves && currentConflict.suggestions.possibleSprintMoves.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Move to sprint:</p>
                      <div className="flex flex-wrap gap-2">
                        {currentConflict.suggestions.possibleSprintMoves.map(sprintId => (
                          <button
                            key={sprintId}
                            onClick={() => handleManualAction('sprint', sprintId)}
                            className="px-3 py-1.5 text-xs bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-lg transition-all duration-200 flex items-center gap-1.5 font-medium"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            Next Sprint
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ignore Option */}
            <button
              onClick={() => {
                onIgnoreConflict?.(currentConflict.ticketId);
                setResolvedConflicts(prev => new Set(prev).add(currentConflict.ticketId));
              }}
              className="w-full px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-all duration-200 font-medium"
            >
              Ignore This Conflict
            </button>
          </div>
        ) : null}
      </div>

      {/* Footer - Navigation */}
      <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
              currentIndex === 0
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
          >
            Skip
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
