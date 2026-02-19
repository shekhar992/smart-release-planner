import { useState } from 'react';
import { X, AlertTriangle, ArrowRight, CalendarClock, Users as UsersIcon, ChevronDown, ChevronUp } from 'lucide-react';
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
      high: "bg-red-100 text-red-800 border-red-300",
      medium: "bg-amber-100 text-amber-800 border-amber-300",
      low: "bg-yellow-100 text-yellow-800 border-yellow-300"
    };
    const labels = {
      high: "High Priority",
      medium: "Medium Priority",
      low: "Low Priority"
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${styles[severity]}`}>
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
    <div className="w-[480px] h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-red-50">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Conflict Resolution</h2>
            <p className="text-xs text-gray-600">{conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded transition-all duration-200 hover:-translate-y-0.5"
          title="Close panel"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conflicts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-sm font-medium text-gray-900">No Conflicts</p>
            <p className="text-xs text-gray-500 mt-1">All tickets are scheduled without conflicts</p>
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
                className="border rounded-lg overflow-hidden shadow-sm"
              >
                {/* Conflict Header */}
                <div 
                  className={`p-3 cursor-pointer transition-colors ${
                    isExpanded ? 'bg-amber-50' : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => toggleConflict(conflict.ticketId)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-lg mt-0.5 flex-shrink-0">{getTypeEmoji(conflict.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {ticket?.title || conflict.ticketId}
                          </h3>
                          {getSeverityBadge(conflict.severity)}
                        </div>
                        <p className="text-xs text-gray-600">{conflict.message}</p>
                        {conflict.impactedDays && (
                          <p className="text-xs text-amber-700 mt-1">
                            ⏱ {conflict.impactedDays} day{conflict.impactedDays > 1 ? 's' : ''} impacted
                          </p>
                        )}
                        {conflict.overflowDays && (
                          <p className="text-xs text-red-700 mt-1">
                            📅 Extends {conflict.overflowDays} day{conflict.overflowDays > 1 ? 's' : ''} beyond timeline
                          </p>
                        )}
                      </div>
                    </div>
                    <button className="flex-shrink-0 text-gray-400 hover:text-gray-600">
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
                  <div className="p-3 bg-gray-50 border-t border-gray-200 space-y-3">
                    {/* Ticket Details */}
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assigned to:</span>
                        <span className="font-medium text-gray-900">{conflict.developer}</span>
                      </div>
                      {ticket && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date range:</span>
                            <span className="font-medium text-gray-900">
                              {ticket.startDate.toLocaleDateString()} - {ticket.endDate.toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Story points:</span>
                            <span className="font-medium text-gray-900">{ticket.storyPoints}</span>
                          </div>
                        </>
                      )}
                      {conflict.conflictingTickets && conflict.conflictingTickets.length > 0 && (
                        <div className="pt-2 border-t border-gray-300">
                          <span className="text-gray-600">Conflicts with:</span>
                          <div className="mt-1 space-y-1">
                            {conflict.conflictingTickets.slice(0, 3).map(cId => {
                              const cTicket = getTicketById(cId);
                              return (
                                <div key={cId} className="text-gray-900 flex items-center gap-1">
                                  <span className="text-red-500">•</span>
                                  <span className="truncate">{cTicket?.title || cId}</span>
                                </div>
                              );
                            })}
                            {conflict.conflictingTickets.length > 3 && (
                              <div className="text-gray-500 italic">
                                +{conflict.conflictingTickets.length - 3} more...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Suggestions */}
                    {hasAnySuggestions ? (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                          <span>💡</span>
                          Suggested Actions
                        </h4>

                        {/* Reassignment Suggestions */}
                        {conflict.suggestions?.possibleReassignments && conflict.suggestions.possibleReassignments.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600">Reassign to available developer:</p>
                            <div className="flex flex-wrap gap-1">
                              {conflict.suggestions.possibleReassignments.map(dev => (
                                <button
                                  key={dev}
                                  onClick={() => handleApplySuggestion(conflict.ticketId, 'reassign', dev)}
                                  className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded transition-colors flex items-center gap-1"
                                >
                                  <UsersIcon className="w-3 h-3" />
                                  {dev}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sprint Move Suggestions */}
                        {conflict.suggestions?.possibleSprintMoves && conflict.suggestions.possibleSprintMoves.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600">Move to different sprint:</p>
                            <div className="flex flex-wrap gap-1">
                              {conflict.suggestions.possibleSprintMoves.map(sprintId => (
                                <button
                                  key={sprintId}
                                  onClick={() => handleApplySuggestion(conflict.ticketId, 'sprint', sprintId)}
                                  className="px-2 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded transition-colors flex items-center gap-1"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                  Next Sprint
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Shift Days Suggestions */}
                        {conflict.suggestions?.possibleShiftDays && conflict.suggestions.possibleShiftDays.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600">Shift schedule:</p>
                            <div className="flex flex-wrap gap-1">
                              {conflict.suggestions.possibleShiftDays.map(days => (
                                <button
                                  key={days}
                                  onClick={() => handleApplySuggestion(conflict.ticketId, 'shift', days)}
                                  className="px-2 py-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded transition-colors flex items-center gap-1"
                                >
                                  <CalendarClock className="w-3 h-3" />
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
                              <div className="space-y-1">
                                <p className="text-xs text-gray-600">Timeline adjustments:</p>
                                <div className="flex flex-wrap gap-1">
                                  <div className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded flex items-center gap-1">
                                    <CalendarClock className="w-3 h-3" />
                                    Extend timeline end date by {conflict.overflowDays} day{(conflict.overflowDays || 0) > 1 ? 's' : ''}
                                  </div>
                                </div>
                              </div>
                            )}
                            {conflict.suggestions?.reduceScope && (
                              <div className="space-y-1">
                                <p className="text-xs text-gray-600">Scope adjustments:</p>
                                <div className="flex flex-wrap gap-1">
                                  <div className="px-2 py-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded flex items-center gap-1">
                                    ✂️ Reduce ticket scope/effort to fit within timeline
                                  </div>
                                </div>
                              </div>
                            )}
                            {conflict.suggestions?.splitTicket && (
                              <div className="space-y-1">
                                <p className="text-xs text-gray-600">Ticket breakdown:</p>
                                <div className="flex flex-wrap gap-1">
                                  <div className="px-2 py-1 text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded flex items-center gap-1">
                                    🔀 Split into smaller tickets across multiple sprints
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 italic">
                        No automatic suggestions available. Manual resolution required.
                      </div>
                    )}

                    {/* Ignore Button */}
                    <div className="pt-2 border-t border-gray-300">
                      <button
                        onClick={() => onIgnoreConflict?.(conflict.ticketId)}
                        className="w-full px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
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
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600 text-center">
          💡 <span className="font-medium">Tip:</span> Click suggestions to apply changes. No changes are made automatically.
        </p>
      </div>
    </div>
  );
}
