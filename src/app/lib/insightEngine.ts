/**
 * Insight Engine: Generate proactive suggestions
 * 
 * Analyzes release metrics and generates actionable insights
 * for the Release Health Header dashboard.
 */

import { Ticket, TeamMember, Sprint, Release } from '../data/mockData';
import { CapacityUtilization, TimelineStatus, TeamVelocity, ConflictMetrics } from './capacityMetrics';

export interface InsightAction {
  type: 'apply' | 'view' | 'dismiss';
  label: string;
  handler: 'auto-allocate' | 'resolve-conflicts' | 'add-sprint' | 'add-team-member' | 'import-tickets' | 'view-capacity';
}

export interface InsightContext {
  featureId?: string;
  ticketId?: string;
  sprintId?: string;
  developerId?: string;
}

export interface Insight {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  priority: number; // 1-5, where 1 is highest
  title: string;
  message: string;
  actionLabel?: string;
  actionType?: 'auto-allocate' | 'resolve-conflicts' | 'add-sprint' | 'add-team-member' | 'import-tickets' | 'view-capacity';
  actions: InsightAction[];
  context?: InsightContext;
}

/**
 * Helper to create actions array from actionLabel and actionType
 */
function createActions(actionLabel?: string, actionType?: string): InsightAction[] {
  if (!actionLabel || !actionType) return [];
  
  return [
    {
      type: 'apply',
      label: actionLabel,
      handler: actionType as InsightAction['handler']
    },
    {
      type: 'view',
      label: 'View',
      handler: actionType as InsightAction['handler']
    }
  ];
}

/**
 * Generate insights based on current release state
 * 
 * Returns up to 3 highest-priority insights
 */
export function generateInsights(
  tickets: Ticket[],
  sprints: Sprint[] | undefined,
  _teamMembers: TeamMember[],
  _release: Release,
  capacityUtil: CapacityUtilization,
  timelineStatus: TimelineStatus,
  teamVelocity: TeamVelocity,
  conflictMetrics: ConflictMetrics,
  enhancedConflicts: Array<{ type: string; severity: string; suggestions?: { possibleReassignments?: string[] } }>
): Insight[] {
  
  const insights: Insight[] = [];
  let idCounter = 0;

  // === CRITICAL INSIGHTS (Priority 1) ===

  // Critical: No sprints defined
  if (!sprints || sprints.length === 0) {
    if (tickets.length > 0) {
      insights.push({
        id: `insight-${idCounter++}`,
        type: 'error',
        priority: 1,
        title: 'No sprints defined',
        message: `${tickets.length} tickets are unscheduled. Create sprints to organize work.`,
        actionLabel: 'Add Sprint',
        actionType: 'add-sprint',
        actions: createActions('Add Sprint', 'add-sprint')
      });
    }
  }

  // Critical: No developers
  if (teamVelocity.developerCount === 0) {
    insights.push({
      id: `insight-${idCounter++}`,
      type: 'error',
      priority: 1,
      title: 'No developers assigned',
      message: 'Add team members with Developer role to calculate capacity.',
      actionLabel: 'Add Team Member',
      actionType: 'add-team-member',
      actions: createActions('Add Team Member', 'add-team-member')
    });
  }

  // Critical: Severe capacity overload
  if (capacityUtil.percentage > 150 && teamVelocity.developerCount > 0) {
    const excessPercentage = capacityUtil.percentage - 100;
    insights.push({
      id: `insight-${idCounter++}`,
      type: 'error',
      priority: 1,
      title: 'Severe capacity overload',
      message: `Backlog exceeds capacity by ${excessPercentage}%. Consider reducing scope or adding team members.`,
      actionLabel: 'View Capacity',
      actionType: 'view-capacity',
      actions: createActions('View Capacity', 'view-capacity')
    });
  }

  // Critical: Many blocking conflicts
  if (conflictMetrics.criticalConflicts > 3) {
    insights.push({
      id: `insight-${idCounter++}`,
      type: 'error',
      priority: 1,
      title: `${conflictMetrics.criticalConflicts} critical conflicts`,
      message: 'Review and resolve conflicts to prevent delays.',
      actionLabel: 'Resolve Conflicts',
      actionType: 'resolve-conflicts',
      actions: createActions('Resolve Conflicts', 'resolve-conflicts')
    });
  }

  // === HIGH PRIORITY INSIGHTS (Priority 2) ===

  // Tickets not allocated to sprints
  const unallocatedTickets = tickets.filter(t => {
    if (!sprints || sprints.length === 0) return false;
    
    // Check if ticket falls within any sprint
    const ticketStart = new Date(t.startDate).getTime();
    const ticketEnd = new Date(t.endDate).getTime();
    
    return !sprints.some(sprint => {
      const sprintStart = new Date(sprint.startDate).getTime();
      const sprintEnd = new Date(sprint.endDate).getTime();
      // Ticket overlaps with sprint
      return ticketStart <= sprintEnd && ticketEnd >= sprintStart;
    });
  });

  if (unallocatedTickets.length > 5 && sprints && sprints.length > 0 && teamVelocity.developerCount > 0) {
    insights.push({
      id: `insight-${idCounter++}`,
      type: 'warning',
      priority: 2,
      title: `${unallocatedTickets.length} tickets unscheduled`,
      message: 'Use auto-allocate to distribute tickets across sprints based on capacity.',
      actionLabel: 'Auto-Allocate',
      actionType: 'auto-allocate',
      actions: createActions('Auto-Allocate', 'auto-allocate')
    });
  }

  // Capacity underutilization
  if (capacityUtil.status === 'under' && capacityUtil.percentage < 50 && tickets.length > 0) {
    const unusedCapacity = 100 - capacityUtil.percentage;
    insights.push({
      id: `insight-${idCounter++}`,
      type: 'info',
      priority: 2,
      title: 'Capacity underutilized',
      message: `${unusedCapacity}% of available capacity is unused. Consider adding more tickets to the backlog.`,
      actionLabel: 'Import Tickets',
      actionType: 'import-tickets',
      actions: createActions('Import Tickets', 'import-tickets')
    });
  }

  // Timeline at risk
  if (timelineStatus.status === 'at-risk') {
    insights.push({
      id: `insight-${idCounter++}`,
      type: 'warning',
      priority: 2,
      title: 'Behind schedule',
      message: `Progress (${timelineStatus.progressPercentage}%) is behind timeline. Review dependencies and blockers.`,
      actionLabel: 'View Conflicts',
      actionType: 'resolve-conflicts',
      actions: createActions('View Conflicts', 'resolve-conflicts')
    });
  }

  // === MEDIUM PRIORITY INSIGHTS (Priority 3) ===

  // Reassignment opportunities
  const reassignableConflicts = enhancedConflicts.filter(c => 
    c.suggestions?.possibleReassignments && c.suggestions.possibleReassignments.length > 0
  );
  
  if (reassignableConflicts.length > 2) {
    insights.push({
      id: `insight-${idCounter++}`,
      type: 'info',
      priority: 3,
      title: 'Reassignment opportunities',
      message: `${reassignableConflicts.length} conflicts could be resolved by reassigning tickets.`,
      actionLabel: 'View Suggestions',
      actionType: 'resolve-conflicts',
      actions: createActions('View Suggestions', 'resolve-conflicts')
    });
  }

  // Optimal capacity utilization
  if (capacityUtil.status === 'optimal' && conflictMetrics.totalConflicts === 0) {
    insights.push({
      id: `insight-${idCounter++}`,
      type: 'success',
      priority: 3,
      title: 'Planning looks healthy',
      message: `Capacity utilization at ${capacityUtil.percentage}% with no conflicts.`,
      actions: []
    });
  }

  // Junior-heavy team warning
  if (teamVelocity.experience === 'junior' && tickets.length > 20) {
    insights.push({
      id: `insight-${idCounter++}`,
      type: 'info',
      priority: 3,
      title: 'Junior-heavy team',
      message: `Average velocity is ${teamVelocity.averageVelocity}x. Consider adding senior developers or adjusting timeline.`,
      actions: []
    });
  }

  // === LOW PRIORITY INSIGHTS (Priority 4-5) ===

  // Empty backlog
  if (tickets.length === 0) {
    insights.push({
      id: `insight-${idCounter++}`,
      type: 'info',
      priority: 4,
      title: 'No tickets yet',
      message: 'Import tickets from CSV or create them manually to start planning.',
      actionLabel: 'Import Tickets',
      actionType: 'import-tickets',
      actions: createActions('Import Tickets', 'import-tickets')
    });
  }

  // Minor conflicts
  if (conflictMetrics.warningConflicts > 0 && conflictMetrics.criticalConflicts === 0) {
    insights.push({
      id: `insight-${idCounter++}`,
      type: 'info',
      priority: 4,
      title: `${conflictMetrics.warningConflicts} minor conflicts`,
      message: 'These conflicts are not blocking but should be reviewed.',
      actionLabel: 'View Conflicts',
      actionType: 'resolve-conflicts',
      actions: createActions('View Conflicts', 'resolve-conflicts')
    });
  }

  // Upcoming release
  if (timelineStatus.status === 'upcoming' && timelineStatus.daysRemaining && timelineStatus.daysRemaining < 7) {
    insights.push({
      id: `insight-${idCounter++}`,
      type: 'info',
      priority: 4,
      title: 'Release starting soon',
      message: `${Math.abs(timelineStatus.daysRemaining)} days until release begins. Ensure all tickets are planned.`,
      actions: []
    });
  }

  // Sort by priority (highest first) and return top 3
  return insights
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);
}

/**
 * Generate import summary after CSV import
 * 
 * Shows what was imported and suggests next steps
 */
export interface ImportSummary {
  ticketsImported: number;
  featuresCreated: number;
  estimatedDays: number;
  suggestedAction: 'auto-allocate' | 'add-sprints' | 'add-team-members';
  message: string;
}

export function generateImportSummary(
  ticketsImported: number,
  featuresCreated: number,
  estimatedDays: number,
  sprints: Sprint[] | undefined,
  developerCount: number
): ImportSummary {
  
  let suggestedAction: 'auto-allocate' | 'add-sprints' | 'add-team-members';
  let message: string;

  if (!sprints || sprints.length === 0) {
    suggestedAction = 'add-sprints';
    message = 'Create sprints to organize the imported tickets.';
  } else if (developerCount === 0) {
    suggestedAction = 'add-team-members';
    message = 'Add team members to calculate capacity and allocate tickets.';
  } else {
    suggestedAction = 'auto-allocate';
    message = 'Use auto-allocate to distribute tickets across sprints.';
  }

  return {
    ticketsImported,
    featuresCreated,
    estimatedDays: Math.round(estimatedDays),
    suggestedAction,
    message
  };
}
