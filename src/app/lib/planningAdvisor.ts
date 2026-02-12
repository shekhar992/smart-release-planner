/**
 * AI Planning Advisor
 * Analyzes release plans and provides intelligent recommendations
 * WITHOUT modifying any allocation logic or planningEngine
 */

import { ReleasePlan } from '../../domain/types';
import { Conflict } from './conflictDetection';

export interface PlanningInsight {
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  recommendations: string[];
}

/**
 * Generate intelligent planning insights based on release plan analysis
 */
export function generatePlanningInsights(
  plan: ReleasePlan,
  conflicts: Conflict[],
  teamSize: number
): PlanningInsight {
  // Core metrics
  const totalTickets = plan.overflowTickets.length + plan.sprints.reduce((sum, s) => sum + s.tickets.length, 0);
  const scheduledTickets = plan.sprints.reduce((sum, s) => sum + s.tickets.length, 0);
  const unscheduledTickets = plan.overflowTickets.length;
  const feasiblePercentage = totalTickets > 0 ? (scheduledTickets / totalTickets) * 100 : 100;
  
  // Capacity analysis
  const totalBacklogDays = plan.totalBacklogDays;
  const totalCapacityDays = plan.totalCapacityDays;
  const capacityDelta = totalCapacityDays - totalBacklogDays;
  const overflowEffort = plan.overflowTickets.reduce((sum, t) => sum + t.effortDays, 0);
  
  // Sprint capacity analysis
  const sprintOverCapacityCount = plan.sprints.filter(sprint => {
    const sprintEffort = sprint.tickets.reduce((sum, t) => sum + t.effortDays, 0);
    return sprintEffort > sprint.capacityDays;
  }).length;
  
  // Developer workload analysis
  const developerWorkloads = new Map<string, number>();
  plan.sprints.forEach(sprint => {
    sprint.tickets.forEach(ticket => {
      if (ticket.assignedToRaw) {
        const current = developerWorkloads.get(ticket.assignedToRaw) || 0;
        developerWorkloads.set(ticket.assignedToRaw, current + ticket.effortDays);
      }
    });
  });
  
  const overloadThreshold = plan.sprints.length * 10; // 10 days per sprint
  const overloadedDeveloperCount = Array.from(developerWorkloads.entries())
    .filter(([_, days]) => days > overloadThreshold)
    .length;
  
  // Conflict breakdown
  const overlapConflicts = conflicts.filter(c => c.type === 'overlap').length;
  const totalConflicts = conflicts.length;
  
  // Priority analysis
  const highPriorityOverflow = plan.overflowTickets.filter(t => t.priority <= 2).length;
  const lowPriorityOverflow = plan.overflowTickets.filter(t => t.priority >= 4).length;
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (feasiblePercentage >= 95 && totalConflicts === 0 && capacityDelta >= 0) {
    riskLevel = 'low';
  } else if (feasiblePercentage >= 75 && totalConflicts <= 3 && capacityDelta >= -20) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }
  
  // Build data-driven summary
  const summary = `Release feasibility is ${Math.round(feasiblePercentage)}%. Total backlog requires ${totalBacklogDays} days. Available capacity is ${totalCapacityDays} days. Net delta: ${capacityDelta >= 0 ? '+' : ''}${capacityDelta} days.`;
  
  // Generate structured recommendations
  const recommendations: string[] = [];
  
  // Assessment section
  if (riskLevel === 'low') {
    recommendations.push('Assessment: High feasibility. Capacity exceeds demand with adequate buffer.');
  } else if (riskLevel === 'medium') {
    recommendations.push('Assessment: Moderate feasibility. Capacity constraints identified with manageable adjustments required.');
  } else {
    recommendations.push('Assessment: Low feasibility. Significant capacity deficit and scheduling conflicts detected.');
  }
  
  // Key Risks section
  const risks: string[] = [];
  
  if (overflowEffort > 0) {
    risks.push(`${overflowEffort} days of unscheduled work (${unscheduledTickets} tickets)`);
  }
  
  if (sprintOverCapacityCount > 0) {
    risks.push(`${sprintOverCapacityCount} sprint${sprintOverCapacityCount > 1 ? 's' : ''} exceeding capacity`);
  }
  
  if (overloadedDeveloperCount > 0) {
    risks.push(`${overloadedDeveloperCount} developer${overloadedDeveloperCount > 1 ? 's' : ''} overloaded (>${overloadThreshold} days)`);
  }
  
  if (overlapConflicts > 0) {
    risks.push(`${overlapConflicts} schedule overlap conflict${overlapConflicts > 1 ? 's' : ''}`);
  }
  
  if (highPriorityOverflow > 0) {
    risks.push(`${highPriorityOverflow} high-priority ticket${highPriorityOverflow > 1 ? 's' : ''} unscheduled`);
  }
  
  if (risks.length > 0) {
    recommendations.push('Key Risks: ' + risks.join('; ') + '.');
  }
  
  // Recommendations section
  const actions: string[] = [];
  
  if (overflowEffort > 20) {
    const additionalSprints = Math.ceil(overflowEffort / (teamSize * 5));
    const additionalWeeks = Math.ceil(additionalSprints * (plan.sprints[0]?.workingDays || 10) / 5);
    actions.push(`Extend release by ${additionalWeeks} week${additionalWeeks > 1 ? 's' : ''} (${additionalSprints} sprint${additionalSprints > 1 ? 's' : ''}) to accommodate unscheduled backlog`);
  } else if (overflowEffort > 0) {
    actions.push(`Defer ${unscheduledTickets} unscheduled ticket${unscheduledTickets > 1 ? 's' : ''} (${overflowEffort} days) to subsequent release`);
  }
  
  if (sprintOverCapacityCount > 0) {
    const avgOverage = plan.sprints
      .filter(s => {
        const effort = s.tickets.reduce((sum, t) => sum + t.effortDays, 0);
        return effort > s.capacityDays;
      })
      .reduce((sum, s) => sum + (s.tickets.reduce((total, t) => total + t.effortDays, 0) - s.capacityDays), 0) / sprintOverCapacityCount;
    actions.push(`Increase sprint duration by ${Math.ceil(avgOverage / teamSize)} day${Math.ceil(avgOverage / teamSize) > 1 ? 's' : ''} or redistribute ${Math.round(avgOverage)} days per affected sprint`);
  }
  
  if (overloadedDeveloperCount > 0) {
    if (overloadedDeveloperCount >= Math.ceil(teamSize / 2)) {
      const additionalDevs = Math.ceil((totalBacklogDays - overflowEffort - totalCapacityDays) / (plan.sprints.length * 8));
      if (additionalDevs > 0) {
        actions.push(`Add ${additionalDevs} developer${additionalDevs > 1 ? 's' : ''} to meet capacity requirements`);
      }
    } else {
      const excessLoad = Array.from(developerWorkloads.values())
        .filter(days => days > overloadThreshold)
        .reduce((sum, days) => sum + (days - overloadThreshold), 0);
      actions.push(`Rebalance ${Math.round(excessLoad)} days across ${overloadedDeveloperCount} overloaded developer${overloadedDeveloperCount > 1 ? 's' : ''}`);
    }
  }
  
  if (overlapConflicts > 5) {
    actions.push(`Resolve ${overlapConflicts} concurrent assignment overlaps through schedule staggering`);
  }
  
  if (highPriorityOverflow > 0) {
    actions.push(`Prioritize ${highPriorityOverflow} high-priority unscheduled ticket${highPriorityOverflow > 1 ? 's' : ''} by deferring lower-priority work`);
  }
  
  if (lowPriorityOverflow > 5 && lowPriorityOverflow > highPriorityOverflow) {
    actions.push(`Move ${lowPriorityOverflow} low-priority tickets to future release cycle`);
  }
  
  if (actions.length > 0) {
    recommendations.push('Recommendations: ' + actions.join('; ') + '.');
  } else if (riskLevel === 'low') {
    recommendations.push('Recommendations: Release plan is balanced. Proceed with execution and monitor sprint velocity.');
  }
  
  return {
    riskLevel,
    summary,
    recommendations: recommendations.slice(0, 6) // Structured output
  };
}
