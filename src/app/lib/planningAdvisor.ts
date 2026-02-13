/**
 * AI Planning Advisor
 * Analyzes release plans and provides intelligent recommendations
 * WITHOUT modifying any allocation logic or planningEngine
 */

import { ReleasePlan } from '../../domain/types';
import { Conflict } from './conflictDetection';

export interface PlanningInsight {
  riskLevel: 'low' | 'medium' | 'high';
  sections: {
    assessment: string;
    impact: string[];
    recommendations: string[];
  };
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
  const totalBacklog = plan.totalBacklogDays;
  const totalCapacity = plan.totalCapacityDays;
  const delta = totalCapacity - totalBacklog;
  const feasibility = plan.feasiblePercentage;

  // Conflict breakdown
  const overlapCount = conflicts.filter(c => c.type === 'overlap').length;
  
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
  
  const overloadThreshold = plan.sprints.length * 10;
  const overloadedDevCount = Array.from(developerWorkloads.entries())
    .filter(([_, days]) => days > overloadThreshold)
    .length;

  const sprintOverCount = plan.sprints.filter(sprint => {
    const sprintEffort = sprint.tickets.reduce((sum, t) => sum + t.effortDays, 0);
    return sprintEffort > sprint.capacityDays;
  }).length;

  const unscheduledTickets = plan.overflowTickets.length;
  const overflowEffort = plan.overflowTickets.reduce((sum, t) => sum + t.effortDays, 0);

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (feasibility >= 95 && conflicts.length === 0 && delta >= 0) {
    riskLevel = 'low';
  } else if (feasibility >= 75 && conflicts.length <= 3 && delta >= -20) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  // Build assessment
  const assessment = `Release feasibility is ${Math.round(feasibility)}%. Total backlog requires ${totalBacklog} days. Available capacity is ${totalCapacity} days. Net capacity delta is ${delta >= 0 ? '+' : ''}${delta} days.`;

  // Build impact section
  const impact: string[] = [];

  if (overlapCount > 0) {
    impact.push(`${overlapCount} ticket${overlapCount > 1 ? 's have' : ' has'} concurrent assignment conflicts`);
  }

  if (overloadedDevCount > 0) {
    impact.push(`${overloadedDevCount} developer${overloadedDevCount > 1 ? 's are' : ' is'} overloaded beyond ${overloadThreshold} days`);
  }

  if (sprintOverCount > 0) {
    impact.push(`${sprintOverCount} sprint${sprintOverCount > 1 ? 's exceed' : ' exceeds'} capacity limits`);
  }

  if (delta < 0) {
    impact.push(`Backlog exceeds capacity by ${Math.abs(delta)} days`);
  }

  if (unscheduledTickets > 0) {
    impact.push(`${unscheduledTickets} ticket${unscheduledTickets > 1 ? 's' : ''} (${overflowEffort} days) remain unscheduled`);
  }

  // Build recommendations
  const recommendations: string[] = [];

  if (delta < 0) {
    const extensionWeeks = Math.ceil(Math.abs(delta) / teamSize / 5);
    recommendations.push(`Extend release timeline by ${extensionWeeks} week${extensionWeeks > 1 ? 's' : ''} to accommodate ${Math.abs(delta)}-day capacity deficit`);
  }

  if (overloadedDevCount > 0) {
    const excessLoad = Array.from(developerWorkloads.values())
      .filter(days => days > overloadThreshold)
      .reduce((sum, days) => sum + (days - overloadThreshold), 0);
    recommendations.push(`Redistribute ${Math.round(excessLoad)} days across ${overloadedDevCount} overloaded developer${overloadedDevCount > 1 ? 's' : ''}`);
  }

  if (sprintOverCount > 0) {
    const avgOverage = plan.sprints
      .filter(s => {
        const effort = s.tickets.reduce((sum, t) => sum + t.effortDays, 0);
        return effort > s.capacityDays;
      })
      .reduce((sum, s) => {
        const effort = s.tickets.reduce((total, t) => total + t.effortDays, 0);
        return sum + (effort - s.capacityDays);
      }, 0) / sprintOverCount;
    const adjustmentDays = Math.ceil(avgOverage / teamSize);
    recommendations.push(`Increase sprint length by ${adjustmentDays} day${adjustmentDays > 1 ? 's' : ''} or rebalance ${Math.round(avgOverage)} days per affected sprint`);
  }

  if (overlapCount > 3) {
    recommendations.push(`Resolve ${overlapCount} assignment overlaps through schedule staggering`);
  }

  if (conflicts.length === 0 && delta > 0 && feasibility >= 95) {
    recommendations.push(`Release is structurally stable with ${delta}-day capacity buffer`);
  }

  if (recommendations.length === 0 && riskLevel === 'medium') {
    recommendations.push(`Monitor sprint velocity and adjust capacity allocations as execution progresses`);
  }

  return {
    riskLevel,
    sections: {
      assessment,
      impact,
      recommendations
    }
  };
}
