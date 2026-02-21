import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Users, Calendar, AlertTriangle, TrendingUp, X, CheckCircle2 } from 'lucide-react';
import { cn } from './ui/utils';
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
      case 'over': return 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'near': return 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'good': return 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
      case 'low': return 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600';
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
      case 'Developer': return 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'Designer': return 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'QA': return 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 text-emerald-700 dark:text-emerald-300';
      default: return 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300';
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
    <div className="w-96 h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-slate-700 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Team Capacity</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
          title="Close panel"
        >
          <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {/* Conflict Alert */}
      {conflictSummary && conflictSummary.totalConflicts > 0 && (
        <div className="px-5 py-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-white animate-pulse" style={{ animationDuration: '2s' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Scheduling Conflicts Detected
              </h3>
              {/* Structured Summary */}
              <div className="text-xs text-amber-800 dark:text-amber-200 mb-2 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {(conflictSummary.overlapConflicts ?? 0) > 0 && (
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-lg">🔴 {conflictSummary.overlapConflicts} Overlap{(conflictSummary.overlapConflicts ?? 0) > 1 ? 's' : ''}</span>
                  )}
                  {(conflictSummary.developerOverloadConflicts ?? 0) > 0 && (
                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-lg">🟠 {conflictSummary.developerOverloadConflicts} Overloaded Dev{(conflictSummary.developerOverloadConflicts ?? 0) > 1 ? 's' : ''}</span>
                  )}
                  {(conflictSummary.sprintOverCapacityConflicts ?? 0) > 0 && (
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">🟡 {conflictSummary.sprintOverCapacityConflicts} Sprint Over Capacity</span>
                  )}
                </div>
              </div>
              {conflictSummary.affectedDevelopers.length > 0 && (
                <div className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                  <span className="font-semibold">Affected: </span>
                  {conflictSummary.affectedDevelopers.slice(0, 3).join(', ')}
                  {conflictSummary.affectedDevelopers.length > 3 && ` +${conflictSummary.affectedDevelopers.length - 3} more`}
                </div>
              )}
              {onViewConflicts && (
                <button
                  onClick={onViewConflicts}
                  className="text-xs font-semibold text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 underline hover:no-underline transition-colors"
                >
                  View Conflict Details →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-800/30">
        {teamCapacities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-lg mb-4">
              <Users className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">No team members assigned to this release</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Overall Team Summary with Conflict Integration */}
            <div className={cn(
              "border rounded-xl p-4 shadow-sm",
              conflictSummary && conflictSummary.totalConflicts > 0
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200 dark:border-amber-800'
                : 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800'
            )}>
              <div className="flex items-center gap-2 mb-3">
                {conflictSummary && conflictSummary.totalConflicts > 0 ? (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                )}
                <h3 className={cn(
                  "text-sm font-semibold",
                  conflictSummary && conflictSummary.totalConflicts > 0
                    ? 'text-amber-900 dark:text-amber-100'
                    : 'text-blue-900 dark:text-blue-100'
                )}>
                  Release Health
                </h3>
              </div>
              <div className={cn(
                "text-sm space-y-2",
                conflictSummary && conflictSummary.totalConflicts > 0
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-blue-700 dark:text-blue-300'
              )}>
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
                <div key={sprintId} className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                  {/* Sprint Header */}
                  <button
                    onClick={() => toggleSprint(sprintId)}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50/50 to-white/50 dark:from-slate-800/50 dark:to-slate-900/50 hover:from-slate-100/50 hover:to-slate-50/50 dark:hover:from-slate-700/50 dark:hover:to-slate-800/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      )}
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{sprintName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium">
                        {sprintUtilization}% utilized
                      </span>
                    </div>
                  </button>

                  {/* Sprint Members */}
                  {isExpanded && (
                    <div className="p-4 space-y-3 bg-slate-50/30 dark:bg-slate-800/30">
                      {sprintData.map(({ member, sprintCapacity }) => {
                        if (!sprintCapacity) return null;
                        
                        const isMemberExpanded = expandedMembers.has(`${sprintId}-${member.memberId}`);

                        return (
                          <div
                            key={member.memberId}
                            className={cn(
                              "border rounded-xl overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-xl",
                              isMemberExpanded
                                ? 'ring-2 ring-blue-500 border-blue-300 dark:border-blue-700 bg-white/95 dark:bg-slate-900/95'
                                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white/90 dark:bg-slate-900/90'
                            )}
                          >
                            {/* Member Summary */}
                            <button
                              onClick={() => toggleMember(`${sprintId}-${member.memberId}`)}
                              className="w-full p-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all duration-200 rounded"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 text-left">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs shadow-lg shadow-blue-500/30">
                                      {member.memberName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                      {member.memberName}
                                    </span>
                                    <span className={cn("text-xs px-2 py-0.5 rounded-lg font-medium", getRoleColor(member.role))}>
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
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-semibold">
                                        <AlertTriangle className="w-3 h-3" />
                                        {conflictSummary.conflictsByDeveloper[member.memberName]}
                                      </span>
                                    )}
                                  </div>
                                  {/* Experience Level & Velocity */}
                                  {teamMembers && (() => {
                                    const teamMember = teamMembers.find(tm => tm.name === member.memberName);
                                    if (teamMember?.experienceLevel) {
                                      return (
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-2">
                                          {teamMember.experienceLevel} · {teamMember.velocityMultiplier ?? 1}x
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
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
                                      <div className="flex justify-between text-amber-600 dark:text-amber-400">
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
                                  <span className={cn("text-xs px-2.5 py-1 rounded-lg border font-medium", getStatusColor(sprintCapacity.status))}>
                                    {getStatusIcon(sprintCapacity.status)} {sprintCapacity.utilizationPercent}%
                                  </span>
                                  {isMemberExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                  )}
                                </div>
                              </div>
                            </button>

                            {/* Member Details */}
                            {isMemberExpanded && (
                              <div className="px-3 pb-3 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-700">
                                {/* Assigned Tickets */}
                                {sprintCapacity.tickets.length > 0 && (
                                  <div className="mt-3">
                                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Assigned Tickets ({sprintCapacity.tickets.length})
                                    </div>
                                    <div className="space-y-2">
                                      {sprintCapacity.tickets.map(ticket => (
                                        <div
                                          key={ticket.id}
                                          className="text-xs p-2.5 bg-white/95 dark:bg-slate-900/95 rounded-lg border border-slate-200 dark:border-slate-700 backdrop-blur-xl"
                                        >
                                          <div className="font-semibold text-slate-900 dark:text-white truncate">
                                            {ticket.title}
                                          </div>
                                          <div className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium">
                                              {resolveEffortDays(ticket)}d
                                            </span>
                                            <span className="px-2 py-0.5 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg font-medium">
                                              {ticket.status}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* PTO Entries */}
                                {sprintCapacity.ptoEntries.length > 0 && (
                                  <div className="mt-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2">
                                      <Calendar className="w-3.5 h-3.5" />
                                      PTO Impact
                                    </div>
                                    <div className="space-y-2">
                                      {sprintCapacity.ptoEntries.map(pto => (
                                        <div
                                          key={pto.id}
                                          className="text-xs p-2.5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-lg border border-amber-200 dark:border-amber-800"
                                        >
                                          <div className="font-semibold text-amber-900 dark:text-amber-100">{pto.name}</div>
                                          <div className="text-amber-700 dark:text-amber-300 mt-1">
                                            {pto.startDate.toLocaleDateString()} - {pto.endDate.toLocaleDateString()}
                                          </div>
                                          <div className="text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg font-medium">
                                              Impact: {pto.overlapDays} days
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Holiday Impact */}
                                {sprintCapacity.holidays.length > 0 && (
                                  <div className="mt-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
                                      <Calendar className="w-3.5 h-3.5" />
                                      Holiday Impact
                                    </div>
                                    <div className="space-y-2">
                                      {sprintCapacity.holidays.map((holiday, idx) => (
                                        <div
                                          key={`${holiday.id}-${idx}`}
                                          className="text-xs p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                                        >
                                          <div className="font-semibold text-blue-900 dark:text-blue-100">{holiday.name}</div>
                                          <div className="text-blue-700 dark:text-blue-300 mt-1">
                                            {holiday.date.toLocaleDateString()}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Warnings */}
                                {sprintCapacity.status === 'over' && (
                                  <div className="mt-3 flex items-start gap-2 text-xs p-2.5 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-red-700 dark:text-red-300 font-medium">
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
