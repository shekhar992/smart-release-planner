import { useState } from 'react';
import { X, AlertTriangle, ArrowRight, CalendarClock, Users as UsersIcon, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { cn } from './ui/utils';
import { Conflict } from '../lib/conflictDetection';
import { Ticket } from '../data/mockData';

interface ConflictResolutionPanelProps {
  conflicts: Conflict[];
  tickets: Ticket[];
  onClose: () => void;
  onReassignTicket?: (ticketId: string, newAssignee: string) => void;
  onMoveTicketToSprint?: (ticketId: string, sprintId: string) => void;
  onShiftTicket?: (ticketId: string, shiftDays: number) => void;
  onIgnoreConflict?: (ticketId: string) => void;
}

export function ConflictResolutionPanel({
  conflicts,
  tickets,
  onClose,
  onReassignTicket,
  onMoveTicketToSprint,
  onShiftTicket,
  onIgnoreConflict
}: ConflictResolutionPanelProps) {
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set([conflicts[0]?.ticketId]));

  const toggleConflict = (ticketId: string) => {
    const newExpanded = new Set(expandedConflicts);
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId);
    } else {
      newExpanded.add(ticketId);
    }
    setExpandedConflicts(newExpanded);
  };

  const getSeverityBadge = (severity: "high" | "medium" | "low") => {
    const styles = {
      high: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700",
      medium: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700",
      low: "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
    };
    const labels = {
      high: "High Priority",
      medium: "Medium Priority",
      low: "Low Priority"
    };
    return (
      <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-lg border", styles[severity])}>
        {labels[severity]}
      </span>
    );
  };

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case "overlap": return "🔴";
      case "developerOverload": return "🟠";
      case "sprintOverCapacity": return "🟡";
      case "timelineOverflow": return "⚠️";
      default: return "⚠️";
    }
  };

  const handleApplySuggestion = (ticketId: string, type: 'reassign' | 'sprint' | 'shift', value: string | number) => {
    if (type === 'reassign' && typeof value === 'string') {
      onReassignTicket?.(ticketId, value);
    } else if (type === 'sprint' && typeof value === 'string') {
      onMoveTicketToSprint?.(ticketId, value);
    } else if (type === 'shift' && typeof value === 'number') {
      onShiftTicket?.(ticketId, value);
    }
  };

  const getTicketById = (ticketId: string) => {
    return tickets.find(t => t.id === ticketId);
  };

  return (
    <div className="w-[480px] h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-slate-700 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-amber-50/50 to-red-50/50 dark:from-amber-950/30 dark:to-red-950/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Conflict Resolution</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected</p>
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 dark:bg-slate-800/30">
        {conflicts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-950/50 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-base font-semibold text-slate-900 dark:text-white">No Conflicts</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">All tickets are scheduled without conflicts</p>
          </div>
        ) : (
          conflicts.map((conflict) => {
            const isExpanded = expandedConflicts.has(conflict.ticketId);
            const ticket = getTicketById(conflict.ticketId);
            const hasAnySuggestions = conflict.suggestions && (
              (conflict.suggestions.possibleReassignments?.length ?? 0) > 0 ||
              (conflict.suggestions.possibleSprintMoves?.length ?? 0) > 0 ||
              (conflict.suggestions.possibleShiftDays?.length ?? 0) > 0 ||
              conflict.suggestions.extendTimeline ||
              conflict.suggestions.reduceScope ||
              conflict.suggestions.splitTicket
            );

            return (
              <div 
                key={conflict.ticketId}
                className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl"
              >
                {/* Conflict Header */}
                <div 
                  className={cn(
                    "p-4 cursor-pointer transition-colors duration-200",
                    isExpanded ? 'bg-amber-50/50 dark:bg-amber-950/30' : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                  onClick={() => toggleConflict(conflict.ticketId)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-xl mt-0.5 flex-shrink-0">{getTypeEmoji(conflict.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {ticket?.title || conflict.ticketId}
                          </h3>
                          {getSeverityBadge(conflict.severity)}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{conflict.message}</p>
                        {conflict.impactedDays && (
                          <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 flex items-center gap-1">
                            <CalendarClock className="w-3.5 h-3.5" />
                            {conflict.impactedDays} day{conflict.impactedDays > 1 ? 's' : ''} impacted
                          </p>
                        )}
                        {conflict.overflowDays && (
                          <p className="text-xs text-red-700 dark:text-red-300 mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Extends {conflict.overflowDays} day{conflict.overflowDays > 1 ? 's' : ''} beyond timeline
                          </p>
                        )}
                      </div>
                    </div>
                    <button className="flex-shrink-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Conflict Details */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    {/* Ticket Details */}
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Assigned to:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{conflict.developer}</span>
                      </div>
                      {ticket && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Date range:</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {ticket.startDate.toLocaleDateString()} - {ticket.endDate.toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Effort:</span>
                            <span className="font-medium text-slate-900 dark:text-white">{ticket.effortDays ?? ticket.storyPoints ?? 1}d</span>
                          </div>
                        </>
                      )}
                      {conflict.conflictingTickets && conflict.conflictingTickets.length > 0 && (
                        <div className="pt-2 border-t border-slate-300 dark:border-slate-600">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Conflicts with:</span>
                          <div className="mt-2 space-y-1.5">
                            {conflict.conflictingTickets.slice(0, 3).map(cId => {
                              const cTicket = getTicketById(cId);
                              return (
                                <div key={cId} className="text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                  <span className="text-red-500 text-lg">•</span>
                                  <span className="truncate">{cTicket?.title || cId}</span>
                                </div>
                              );
                            })}
                            {conflict.conflictingTickets.length > 3 && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                                +{conflict.conflictingTickets.length - 3} more...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Suggestions */}
                    {hasAnySuggestions ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="text-lg">💡</span>
                          Suggested Actions
                        </h4>

                        {/* Reassignment Suggestions */}
                        {conflict.suggestions?.possibleReassignments && conflict.suggestions.possibleReassignments.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Reassign to available developer:</p>
                            <div className="flex flex-wrap gap-2">
                              {conflict.suggestions.possibleReassignments.map(dev => (
                                <button
                                  key={dev}
                                  onClick={() => handleApplySuggestion(conflict.ticketId, 'reassign', dev)}
                                  className="px-3 py-1.5 text-xs bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 dark:from-blue-950/50 dark:to-blue-900/30 dark:hover:from-blue-900/50 dark:hover:to-blue-800/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg transition-all duration-200 flex items-center gap-1.5 font-medium"
                                >
                                  <UsersIcon className="w-3.5 h-3.5" />
                                  {dev}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sprint Move Suggestions */}
                        {conflict.suggestions?.possibleSprintMoves && conflict.suggestions.possibleSprintMoves.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Move to different sprint:</p>
                            <div className="flex flex-wrap gap-2">
                              {conflict.suggestions.possibleSprintMoves.map(sprintId => (
                                <button
                                  key={sprintId}
                                  onClick={() => handleApplySuggestion(conflict.ticketId, 'sprint', sprintId)}
                                  className="px-3 py-1.5 text-xs bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 dark:from-purple-950/50 dark:to-purple-900/30 dark:hover:from-purple-900/50 dark:hover:to-purple-800/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-lg transition-all duration-200 flex items-center gap-1.5 font-medium"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                  Next Sprint
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Shift Days Suggestions */}
                        {conflict.suggestions?.possibleShiftDays && conflict.suggestions.possibleShiftDays.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Shift schedule:</p>
                            <div className="flex flex-wrap gap-2">
                              {conflict.suggestions.possibleShiftDays.map(days => (
                                <button
                                  key={days}
                                  onClick={() => handleApplySuggestion(conflict.ticketId, 'shift', days)}
                                  className="px-3 py-1.5 text-xs bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 dark:from-green-950/50 dark:to-green-900/30 dark:hover:from-green-900/50 dark:hover:to-green-800/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 rounded-lg transition-all duration-200 flex items-center gap-1.5 font-medium"
                                >
                                  <CalendarClock className="w-3.5 h-3.5" />
                                  +{days} day{days > 1 ? 's' : ''}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Overflow-specific Suggestions */}
                        {conflict.type === 'timelineOverflow' && (
                          <>
                            {conflict.suggestions?.extendTimeline && (
                              <div className="space-y-2">
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Timeline adjustments:</p>
                                <div className="flex flex-wrap gap-2">
                                  <div className="px-3 py-1.5 text-xs bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/50 dark:to-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 rounded-lg flex items-center gap-1.5">
                                    <CalendarClock className="w-3.5 h-3.5" />
                                    Extend timeline end date by {conflict.overflowDays} day{(conflict.overflowDays || 0) > 1 ? 's' : ''}
                                  </div>
                                </div>
                              </div>
                            )}
                            {conflict.suggestions?.reduceScope && (
                              <div className="space-y-2">
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Scope adjustments:</p>
                                <div className="flex flex-wrap gap-2">
                                  <div className="px-3 py-1.5 text-xs bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700 rounded-lg flex items-center gap-1.5">
                                    ✂️ Reduce ticket scope/effort to fit within timeline
                                  </div>
                                </div>
                              </div>
                            )}
                            {conflict.suggestions?.splitTicket && (
                              <div className="space-y-2">
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Ticket breakdown:</p>
                                <div className="flex flex-wrap gap-2">
                                  <div className="px-3 py-1.5 text-xs bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/50 dark:to-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 rounded-lg flex items-center gap-1.5">
                                    🔀 Split into smaller tickets across multiple sprints
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 dark:text-slate-400 italic">
                        No automatic suggestions available. Manual resolution required.
                      </div>
                    )}

                    {/* Ignore Button */}
                    <div className="pt-3 border-t border-slate-300 dark:border-slate-600">
                      <button
                        onClick={() => onIgnoreConflict?.(conflict.ticketId)}
                        className="w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 font-medium"
                      >
                        Ignore This Conflict
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
          💡 <span className="font-semibold">Tip:</span> Click suggestions to apply changes. No changes are made automatically.
        </p>
      </div>
    </div>
  );
}
