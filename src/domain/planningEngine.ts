/**
 * Release Feasibility Planning Engine
 * 
 * Core domain logic for sprint planning and capacity allocation.
 * This is a pure, deterministic implementation with no UI dependencies.
 */

import { startOfDay } from 'date-fns';
import { generateSprintPeriods } from './dateUtils';
import { calculateSprintCapacity } from './capacityUtils';
import type {
  TicketInput,
  ReleaseConfig,
  ReleasePlan,
  Sprint,
} from './types';

/**
 * Sort tickets by priority (ascending: 1 is highest) then by effort (ascending)
 * 
 * Returns a new array without mutating input.
 */
function sortTicketsByPriority(tickets: TicketInput[]): TicketInput[] {
  return [...tickets].sort((a, b) => {
    // Priority: lower number = higher priority (1 is highest)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Within same priority, sort by effort (smaller tasks first)
    return a.effortDays - b.effortDays;
  });
}

/**
 * Build a complete release plan with sprint allocation
 * 
 * Algorithm:
 * 1. Generate sprint periods within release window
 * 2. Calculate capacity for each sprint (working days × devs - PTO)
 * 3. Sort tickets by priority, then effort
 * 4. Sequentially allocate tickets to first sprint with capacity
 * 5. Tickets that don't fit go to overflow
 * 
 * @param tickets - Array of tickets to plan
 * @param config - Release configuration
 * @returns Complete release plan with allocations and overflow
 */
export function buildReleasePlan(
  tickets: TicketInput[],
  config: ReleaseConfig
): ReleasePlan {
  // Normalize dates to prevent timezone inconsistencies
  const releaseStart = startOfDay(config.releaseStart);
  const releaseEnd = startOfDay(config.releaseEnd);
  
  // Defensive config validation
  if (releaseStart > releaseEnd) {
    throw new Error('Invalid release range: start date is after end date');
  }
  
  if (config.sprintLengthDays <= 0) {
    throw new Error('Invalid sprint length: must be greater than 0');
  }
  
  // Validate and filter tickets
  const validTickets = tickets.filter(ticket => {
    if (ticket.effortDays <= 0 || isNaN(ticket.effortDays)) {
      console.warn(`Invalid ticket filtered out: ${ticket.id} (effortDays: ${ticket.effortDays})`);
      return false;
    }
    return true;
  });
  
  // Edge case: no valid tickets
  if (validTickets.length === 0) {
    return {
      sprints: [],
      overflowTickets: [],
      totalBacklogDays: 0,
      totalCapacityDays: 0,
      feasiblePercentage: 100,
    };
  }
  
  // Edge case: invalid config
  if (config.numberOfDevelopers <= 0 || config.sprintLengthDays <= 0) {
    const totalBacklogDays = validTickets.reduce((sum, t) => sum + t.effortDays, 0);
    return {
      sprints: [],
      overflowTickets: [...validTickets],
      totalBacklogDays,
      totalCapacityDays: 0,
      feasiblePercentage: 0,
    };
  }
  
  // Step 1: Generate sprint periods
  const sprintPeriods = generateSprintPeriods(
    releaseStart,
    releaseEnd,
    config.sprintLengthDays
  );
  
  // Edge case: no sprints generated (e.g., invalid date range)
  if (sprintPeriods.length === 0) {
    const totalBacklogDays = validTickets.reduce((sum, t) => sum + t.effortDays, 0);
    return {
      sprints: [],
      overflowTickets: [...validTickets],
      totalBacklogDays,
      totalCapacityDays: 0,
      feasiblePercentage: 0,
    };
  }
  
  // Step 2: Initialize sprints with capacity calculations
  const sprints: Sprint[] = sprintPeriods.map((period, index) => {
    const capacity = calculateSprintCapacity({
      startDate: period.startDate,
      endDate: period.endDate,
      numberOfDevelopers: config.numberOfDevelopers,
      holidays: config.holidays,
      ptoDates: config.ptoDates,
    });
    
    return {
      id: `sprint-${index + 1}`,
      name: `Sprint ${index + 1}`,
      startDate: period.startDate,
      endDate: period.endDate,
      workingDays: capacity.workingDays,
      capacityDays: capacity.capacityDays,
      allocatedDays: 0,
      tickets: [],
    };
  });
  
  // Step 3: Sort tickets by priority
  const sortedTickets = sortTicketsByPriority(validTickets);
  
  // Step 4: Allocate tickets to sprints (greedy first-fit algorithm)
  const overflowTickets: TicketInput[] = [];
  
  for (const ticket of sortedTickets) {
    let placed = false;
    
    // Try to place in first available sprint with remaining capacity
    for (const sprint of sprints) {
      const remainingCapacity = sprint.capacityDays - sprint.allocatedDays;
      
      // Only place if ticket fully fits (no splitting)
      if (ticket.effortDays <= remainingCapacity) {
        sprint.tickets.push(ticket);
        sprint.allocatedDays += ticket.effortDays;
        placed = true;
        break; // Move to next ticket
      }
    }
    
    // If not placed in any sprint, add to overflow
    if (!placed) {
      overflowTickets.push(ticket);
    }
  }
  
  // Step 5: Calculate summary metrics
  const totalBacklogDays = validTickets.reduce((sum, t) => sum + t.effortDays, 0);
  const totalCapacityDays = sprints.reduce((sum, s) => sum + s.capacityDays, 0);
  
  // Calculate placed effort (total - overflow)
  const overflowEffort = overflowTickets.reduce((sum, t) => sum + t.effortDays, 0);
  const placedEffort = totalBacklogDays - overflowEffort;
  
  // Feasibility percentage
  const feasiblePercentage = totalBacklogDays > 0
    ? (placedEffort / totalBacklogDays) * 100
    : 100;
  
  return {
    sprints,
    overflowTickets,
    totalBacklogDays,
    totalCapacityDays,
    feasiblePercentage: Math.round(feasiblePercentage * 100) / 100, // Round to 2 decimals
  };
}

/**
 * Check if a release plan is fully feasible (all tickets fit)
 */
export function isReleaseFeasible(plan: ReleasePlan): boolean {
  return plan.overflowTickets.length === 0;
}

/**
 * Get comprehensive summary statistics for a release plan
 */
export function getReleaseSummary(plan: ReleasePlan) {
  const totalSprints = plan.sprints.length;
  const totalTicketsPlaced = plan.sprints.reduce((sum, s) => sum + s.tickets.length, 0);
  const overflowCount = plan.overflowTickets.length;
  
  // Calculate actual utilization (how much capacity was used)
  const totalAllocated = plan.sprints.reduce((sum, s) => sum + s.allocatedDays, 0);
  const utilizationPercentage = plan.totalCapacityDays > 0
    ? (totalAllocated / plan.totalCapacityDays) * 100
    : 0;
  
  return {
    totalSprints,
    totalTicketsPlaced,
    overflowCount,
    totalBacklogDays: plan.totalBacklogDays,
    totalCapacityDays: plan.totalCapacityDays,
    feasiblePercentage: plan.feasiblePercentage,
    utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
    isFeasible: overflowCount === 0,
    capacityRemaining: Math.max(0, plan.totalCapacityDays - totalAllocated),
  };
}

/**
 * Get per-sprint utilization breakdown
 */
export function getSprintUtilization(sprint: Sprint): {
  utilizationPercentage: number;
  remainingCapacity: number;
  ticketCount: number;
} {
  const utilizationPercentage = sprint.capacityDays > 0
    ? (sprint.allocatedDays / sprint.capacityDays) * 100
    : 0;
  
  return {
    utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
    remainingCapacity: Math.max(0, sprint.capacityDays - sprint.allocatedDays),
    ticketCount: sprint.tickets.length,
  };
}

/**
 * Safe wrapper for buildReleasePlan with error handling
 * 
 * Returns a structured result object instead of throwing errors.
 * Useful for UI integration where graceful error handling is needed.
 * 
 * @param tickets - Array of tickets to plan
 * @param config - Release configuration
 * @returns Result object with success status, data, or error message
 */
export function buildReleasePlanSafe(
  tickets: TicketInput[],
  config: ReleaseConfig
): { success: true; data: ReleasePlan } | { success: false; error: string } {
  try {
    const plan = buildReleasePlan(tickets, config);
    return { success: true, data: plan };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
}
