/**
 * Core domain types for Release Feasibility Engine
 * 
 * These types represent pure business logic with no UI dependencies.
 */

/**
 * Input ticket from backlog
 * Effort is measured in Developer Days (not story points)
 */
export interface TicketInput {
  id: string;
  title: string;
  epic: string;
  effortDays: number;
  priority: number; // 1-5, where 1 is highest priority
  assignedToRaw?: string; // Raw assignment from CSV (validated later against team roster)
}

/**
 * Configuration for release planning
 */
export interface ReleaseConfig {
  releaseStart: Date;
  releaseEnd: Date;
  sprintLengthDays: number; // Calendar days (e.g., 14 for 2-week sprints)
  numberOfDevelopers: number;
  holidays: Date[]; // Global holidays (exclude these from working days)
  /**
   * TEAM-LEVEL PTO dates (not per-developer).
   * Each date represents 1 working day lost for the entire team.
   * Example: If 1 developer takes 1 day PTO, add that date here.
   * Capacity reduction: 1 date = 1 working day subtracted from total team capacity.
   * PTO on weekends or holidays is automatically ignored (not double-counted).
   */
  ptoDates: Date[];
}

/**
 * Sprint with allocated tickets and capacity details
 */
export interface Sprint {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  workingDays: number; // Working days after excluding weekends + holidays
  capacityDays: number; // Total team capacity (workingDays × devs - PTO)
  allocatedDays: number; // Sum of effort from allocated tickets
  tickets: TicketInput[];
}

/**
 * Complete release plan output
 */
export interface ReleasePlan {
  sprints: Sprint[];
  overflowTickets: TicketInput[]; // Tickets that don't fit in any sprint
  totalBacklogDays: number; // Sum of all ticket effort
  totalCapacityDays: number; // Sum of all sprint capacity
  feasiblePercentage: number; // (placed effort / total effort) × 100
}
