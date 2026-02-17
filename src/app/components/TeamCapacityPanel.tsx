import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Users, Calendar, AlertTriangle, TrendingUp, X } from 'lucide-react';
import { TeamMemberCapacity } from '../lib/teamCapacityCalculation';
import { ConflictSummary } from '../lib/conflictDetection';
import { resolveEffortDays } from '../lib/effortResolver';
import { calculateDeveloperVelocityInsights } from '../lib/velocityInsights';
import { Product, TeamMember, Holiday } from '../data/mockData';

interface TeamCapacityPanelProps {
  teamCapacities: TeamMemberCapacity[];
  conflictSummary?: ConflictSummary;
  onClose: () => void;
  onViewConflicts?: () => void;
  product?: Product;
  teamMembers?: TeamMember[];
  holidays?: Holiday[];
}

export function TeamCapacityPanel({ teamCapacities, conflictSummary, onClose, onViewConflicts, product, teamMembers, holidays }: TeamCapacityPanelProps) {
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set());
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

  // Calculate velocity insights for all developers
  const velocityInsights = useMemo(() => {
    if (!product || !teamMembers || !holidays) return [];
    return calculateDeveloperVelocityInsights(product, teamMembers, holidays);
  }, [product, teamMembers, holidays]);

  const toggleSprint = (sprintId: string) => {
    const newExpanded = new Set(expandedSprints);
    if (newExpanded.has(sprintId)) {
      newExpanded.delete(sprintId);
    } else {
      newExpanded.add(sprintId);
    }
    setExpandedSprints(newExpanded);
  };

  const toggleMember = (memberId: string) => {
    const newExpanded = new Set(expandedMembers);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedMembers(newExpanded);
  };

  const getStatusColor = (status: 'over' | 'near' | 'good' | 'low') => {
    switch (status) {
      case 'over': return 'bg-red-50 text-red-700 border-red-200';
      case 'near': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'good': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'low': return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: 'over' | 'near' | 'good' | 'low') => {
    switch (status) {
      case 'over': return '🔴';
      case 'near': return '🟡';
      case 'good': return '🟢';
      case 'low': return '⚪';
    }
  };

  const getStatusLabel = (status: 'over' | 'near' | 'good' | 'low') => {
    switch (status) {
      case 'over': return 'Over';
      case 'near': return 'Near';
      case 'good': return 'Good';
      case 'low': return 'Low';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Developer': return 'bg-blue-50 text-blue-700';
      case 'Designer': return 'bg-purple-50 text-purple-700';
      case 'QA': return 'bg-emerald-50 text-emerald-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getRiskColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low': return 'bg-emerald-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
    }
  };

  // Group by sprint
  const sprintGroups: Map<string, { sprintName: string; members: TeamMemberCapacity[] }> = new Map();
  
  if (teamCapacities.length > 0 && teamCapacities[0].sprintCapacities.length > 0) {
    teamCapacities[0].sprintCapacities.forEach(sc => {
      sprintGroups.set(sc.sprintId, {
        sprintName: sc.sprintName,
        members: []
      });
    });

    teamCapacities.forEach(member => {
      member.sprintCapacities.forEach(sc => {
        const group = sprintGroups.get(sc.sprintId);
        if (group) {
          group.members.push(member);
        }
      });
    });
  }

  return (
    <div className="w-96 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-600" />
          <h2 className="text-sm font-medium text-gray-900">Team Capacity</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded transition-all duration-200 hover:-translate-y-0.5"
          title="Close panel"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Conflict Alert */}
      {conflictSummary && conflictSummary.totalConflicts > 0 && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" style={{ animationDuration: '2s' }} />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">
                Scheduling Conflicts Detected
              </h3>
              {/* Structured Summary */}
              <div className="text-xs text-amber-800 mb-2 space-y-1">
                <div className="flex items-center gap-2">
                  {(conflictSummary.overlapConflicts ?? 0) > 0 && (
                    <span>🔴 {conflictSummary.overlapConflicts} Overlap{(conflictSummary.overlapConflicts ?? 0) > 1 ? 's' : ''}</span>
                  )}
                  {(conflictSummary.developerOverloadConflicts ?? 0) > 0 && (
                    <span>🟠 {conflictSummary.developerOverloadConflicts} Overloaded Dev{(conflictSummary.developerOverloadConflicts ?? 0) > 1 ? 's' : ''}</span>
                  )}
                  {(conflictSummary.sprintOverCapacityConflicts ?? 0) > 0 && (
                    <span>🟡 {conflictSummary.sprintOverCapacityConflicts} Sprint Over Capacity</span>
                  )}
                </div>
              </div>
              {conflictSummary.affectedDevelopers.length > 0 && (
                <div className="text-xs text-amber-700 mb-2">
                  <span className="font-medium">Affected: </span>
                  {conflictSummary.affectedDevelopers.slice(0, 3).join(', ')}
                  {conflictSummary.affectedDevelopers.length > 3 && ` +${conflictSummary.affectedDevelopers.length - 3} more`}
                </div>
              )}
              {onViewConflicts && (
                <button
                  onClick={onViewConflicts}
                  className="text-xs font-medium text-amber-700 hover:text-amber-800 underline hover:no-underline"
                >
                  View Conflict Details →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {teamCapacities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Users className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">No team members assigned to this release</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Overall Team Summary with Conflict Integration */}
            <div className={`border rounded-lg p-3 ${conflictSummary && conflictSummary.totalConflicts > 0 ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {conflictSummary && conflictSummary.totalConflicts > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                )}
                <h3 className={`text-xs font-medium ${conflictSummary && conflictSummary.totalConflicts > 0 ? 'text-amber-900' : 'text-blue-900'}`}>
                  Release Health
                </h3>
              </div>
              <div className={`text-xs space-y-1 ${conflictSummary && conflictSummary.totalConflicts > 0 ? 'text-amber-700' : 'text-blue-700'}`}>
                <div className="flex justify-between">
                  <span>Total Team Members:</span>
                  <span className="font-medium">{teamCapacities.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Assigned:</span>
                  <span className="font-medium">
                    {teamCapacities.reduce((sum, m) => sum + m.totalAssignedDays, 0).toFixed(1)} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Capacity:</span>
                  <span className="font-medium">
                    {teamCapacities.reduce((sum, m) => sum + m.totalAvailableCapacity, 0).toFixed(1)} days
                  </span>
                </div>
                {conflictSummary && conflictSummary.totalConflicts > 0 && (
                  <div className="flex justify-between pt-1 border-t border-amber-300 font-semibold">
                    <span>⚠️ Conflicts:</span>
                    <span>{conflictSummary.totalConflicts}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Group by Sprint */}
            {Array.from(sprintGroups.entries()).map(([sprintId, { sprintName, members }]) => {
              // Get sprint capacity for each member
              const sprintData = teamCapacities.map(member => {
                const sprintCapacity = member.sprintCapacities.find(sc => sc.sprintId === sprintId);
                return { member, sprintCapacity };
              }).filter(item => item.sprintCapacity);

              const isExpanded = expandedSprints.has(sprintId);

              // Calculate sprint totals
              const sprintTotalAssigned = sprintData.reduce((sum, item) => 
                sum + (item.sprintCapacity?.assignedDays || 0), 0
              );
              const sprintTotalCapacity = sprintData.reduce((sum, item) => 
                sum + (item.sprintCapacity?.availableCapacity || 0), 0
              );
              const sprintUtilization = sprintTotalCapacity > 0
                ? Math.round((sprintTotalAssigned / sprintTotalCapacity) * 100)
                : 0;

              return (
                <div key={sprintId} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Sprint Header */}
                  <button
                    onClick={() => toggleSprint(sprintId)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      )}
                      <span className="text-sm font-medium text-gray-900">{sprintName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">
                        {sprintUtilization}% utilized
                      </span>
                    </div>
                  </button>

                  {/* Sprint Members */}
                  {isExpanded && (
                    <div className="p-3 space-y-2 bg-white">
                      {sprintData.map(({ member, sprintCapacity }) => {
                        if (!sprintCapacity) return null;
                        
                        const isMemberExpanded = expandedMembers.has(`${sprintId}-${member.memberId}`);

                        return (
                          <div
                            key={member.memberId}
                            className="border border-gray-200 rounded-md overflow-hidden"
                          >
                            {/* Member Summary */}
                            <button
                              onClick={() => toggleMember(`${sprintId}-${member.memberId}`)}
                              className="w-full p-2 hover:bg-gray-50 transition-all duration-200 rounded"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 text-left">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-gray-900">
                                      {member.memberName}
                                    </span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${getRoleColor(member.role)}`}>
                                      {member.role}
                                    </span>
                                    {/* Velocity Insight Badge */}
                                    {velocityInsights.length > 0 && (() => {
                                      const insight = velocityInsights.find(v => v.memberName === member.memberName);
                                      if (insight && insight.totalSprintsAnalyzed > 0) {
                                        return (
                                          <div className="relative group">
                                            <div className={`w-2 h-2 rounded-full ${getRiskColor(insight.riskLevel)}`} title="Velocity risk indicator" />
                                            {/* Tooltip */}
                                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 w-56 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                                              <div className="font-semibold mb-1">Historical Velocity</div>
                                              <div className="space-y-0.5">
                                                <div>Avg per sprint: {insight.avgAssignedDaysPerSprint.toFixed(1)}d</div>
                                                <div>Avg utilization: {insight.avgUtilizationPercent.toFixed(0)}%</div>
                                                <div>Sprints analyzed: {insight.totalSprintsAnalyzed}</div>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                    {conflictSummary && conflictSummary.conflictsByDeveloper[member.memberName] > 0 && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-semibold">
                                        <AlertTriangle className="w-2.5 h-2.5" />
                                        {conflictSummary.conflictsByDeveloper[member.memberName]}
                                      </span>
                                    )}
                                  </div>
                                  {/* Experience Level & Velocity */}
                                  {teamMembers && (() => {
                                    const teamMember = teamMembers.find(tm => tm.name === member.memberName);
                                    if (teamMember?.experienceLevel) {
                                      return (
                                        <div className="text-[11px] text-gray-500 mt-1 mb-2">
                                          {teamMember.experienceLevel} · {teamMember.velocityMultiplier ?? 1}x
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                  <div className="text-xs text-gray-600 space-y-0.5">
                                    <div className="flex justify-between">
                                      <span>Assigned:</span>
                                      <span className="font-medium">
                                        {sprintCapacity.assignedDays.toFixed(1)}d
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Capacity:</span>
                                      <span className="font-medium">{sprintCapacity.availableCapacity.toFixed(1)}d</span>
                                    </div>
                                    {(sprintCapacity.ptoOverlapDays > 0 || sprintCapacity.holidayOverlapDays > 0) && (
                                      <div className="flex justify-between text-amber-600">
                                        <span>Reductions:</span>
                                        <span className="font-medium">
                                          {sprintCapacity.ptoOverlapDays > 0 && `${sprintCapacity.ptoOverlapDays}d PTO`}
                                          {sprintCapacity.ptoOverlapDays > 0 && sprintCapacity.holidayOverlapDays > 0 && ', '}
                                          {sprintCapacity.holidayOverlapDays > 0 && `${sprintCapacity.holidayOverlapDays}d holiday`}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 ml-2">
                                  <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(sprintCapacity.status)}`}>
                                    {getStatusIcon(sprintCapacity.status)} {sprintCapacity.utilizationPercent}%
                                  </span>
                                  {isMemberExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-gray-400" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </button>

                            {/* Member Details */}
                            {isMemberExpanded && (
                              <div className="px-2 pb-2 bg-gray-50 border-t border-gray-200">
                                {/* Assigned Tickets */}
                                {sprintCapacity.tickets.length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-xs font-medium text-gray-700 mb-1">
                                      Assigned Tickets ({sprintCapacity.tickets.length})
                                    </div>
                                    <div className="space-y-1">
                                      {sprintCapacity.tickets.map(ticket => (
                                        <div
                                          key={ticket.id}
                                          className="text-xs p-1.5 bg-white rounded border border-gray-200"
                                        >
                                          <div className="font-medium text-gray-900 truncate">
                                            {ticket.title}
                                          </div>
                                          <div className="text-gray-500 mt-0.5">
                                            {resolveEffortDays(ticket)}d · {ticket.status}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* PTO Entries */}
                                {sprintCapacity.ptoEntries.length > 0 && (
                                  <div className="mt-2">
                                    <div className="flex items-center gap-1 text-xs font-medium text-amber-700 mb-1">
                                      <Calendar className="w-3 h-3" />
                                      PTO Impact
                                    </div>
                                    <div className="space-y-1">
                                      {sprintCapacity.ptoEntries.map(pto => (
                                        <div
                                          key={pto.id}
                                          className="text-xs p-1.5 bg-amber-50 rounded border border-amber-200"
                                        >
                                          <div className="font-medium text-amber-900">{pto.name}</div>
                                          <div className="text-amber-700 mt-0.5">
                                            {pto.startDate.toLocaleDateString()} - {pto.endDate.toLocaleDateString()}
                                          </div>
                                          <div className="text-amber-600 mt-0.5">
                                            Impact: {pto.overlapDays} days in this sprint
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Holiday Impact */}
                                {sprintCapacity.holidays.length > 0 && (
                                  <div className="mt-2">
                                    <div className="flex items-center gap-1 text-xs font-medium text-blue-700 mb-1">
                                      <Calendar className="w-3 h-3" />
                                      Holiday Impact
                                    </div>
                                    <div className="space-y-1">
                                      {sprintCapacity.holidays.map((holiday, idx) => (
                                        <div
                                          key={`${holiday.id}-${idx}`}
                                          className="text-xs p-1.5 rounded border" style={{ backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' }}
                                        >
                                          <div className="font-medium text-blue-900">{holiday.name}</div>
                                          <div className="text-blue-700 mt-0.5">
                                            {holiday.date.toLocaleDateString()}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Warnings */}
                                {sprintCapacity.status === 'over' && (
                                  <div className="mt-2 flex items-start gap-1 text-xs p-1.5 bg-red-50 rounded border border-red-200">
                                    <AlertTriangle className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-red-700">
                                      Over-allocated! Consider redistributing work.
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
