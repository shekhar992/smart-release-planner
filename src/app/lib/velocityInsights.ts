/**
 * Velocity Benchmarking (V1)
 * 
 * Provides historical velocity insights for developers across all releases.
 * Helps identify workload patterns and risk levels.
 */

import { Product, TeamMember } from '../data/mockData';
import { calculateTeamMemberCapacity } from './teamCapacityCalculation';

export interface DeveloperVelocityInsight {
  memberId: string;
  memberName: string;
  avgAssignedDaysPerSprint: number;
  avgUtilizationPercent: number;
  totalSprintsAnalyzed: number;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Calculate velocity insights for all developers in a product.
 * 
 * Analyzes historical data across all releases to determine:
 * - Average assigned days per sprint
 * - Average utilization percentage
 * - Risk level based on utilization patterns
 * 
 * @param product - Product with releases and team data
 * @param teamMembers - Team members to analyze
 * @param holidays - Company holidays for capacity calculation
 * @returns Array of velocity insights per developer
 */
export function calculateDeveloperVelocityInsights(
  product: Product,
  teamMembers: TeamMember[],
  holidays: any[]
): DeveloperVelocityInsight[] {
  
  const insights: Map<string, DeveloperVelocityInsight> = new Map();

  // Return empty if no releases or team members
  if (!product.releases || product.releases.length === 0 || teamMembers.length === 0) {
    return [];
  }

  // Initialize insights for all team members
  teamMembers.forEach(member => {
    insights.set(member.id, {
      memberId: member.id,
      memberName: member.name,
      avgAssignedDaysPerSprint: 0,
      avgUtilizationPercent: 0,
      totalSprintsAnalyzed: 0,
      riskLevel: 'low'
    });
  });

  // Aggregate data across all releases
  product.releases.forEach(release => {
    if (!release.sprints || release.sprints.length === 0) return;

    // Get all tickets from all features
    const allTickets = release.features.flatMap(f => f.tickets);

    // Calculate capacity for each team member
    teamMembers.forEach(member => {
      const capacity = calculateTeamMemberCapacity(
        member,
        release.sprints!,
        allTickets,
        holidays,
        release.storyPointMapping
      );

      const insight = insights.get(member.id)!;

      // Aggregate sprint data
      capacity.sprintCapacities.forEach(sc => {
        // Only count sprints with actual work assigned
        if (sc.assignedDays > 0 || sc.availableCapacity > 0) {
          insight.totalSprintsAnalyzed++;
          
          // Running sum for averaging later
          insight.avgAssignedDaysPerSprint += sc.assignedDays;
          insight.avgUtilizationPercent += sc.utilizationPercent;
        }
      });
    });
  });

  // Calculate averages and determine risk levels
  const results: DeveloperVelocityInsight[] = [];

  insights.forEach(insight => {
    if (insight.totalSprintsAnalyzed > 0) {
      // Calculate averages
      insight.avgAssignedDaysPerSprint = 
        insight.avgAssignedDaysPerSprint / insight.totalSprintsAnalyzed;
      insight.avgUtilizationPercent = 
        insight.avgUtilizationPercent / insight.totalSprintsAnalyzed;

      // Determine risk level based on average utilization
      if (insight.avgUtilizationPercent < 70) {
        insight.riskLevel = 'low';
      } else if (insight.avgUtilizationPercent <= 95) {
        insight.riskLevel = 'medium';
      } else {
        insight.riskLevel = 'high';
      }

      results.push(insight);
    }
  });

  return results;
}

/**
 * Get velocity insight for a specific developer.
 * 
 * @param insights - Array of all velocity insights
 * @param memberName - Name of the team member
 * @returns Velocity insight or null if not found
 */
export function getVelocityInsightByName(
  insights: DeveloperVelocityInsight[],
  memberName: string
): DeveloperVelocityInsight | null {
  return insights.find(i => i.memberName === memberName) || null;
}
