import { Sprint, Ticket, TeamMember, Holiday, StoryPointMapping } from '../data/mockData';
import { calculateTotalEffort, getAdjustedDuration } from './effortResolver';

export interface TeamMemberSprintCapacity {
  sprintId: string;
  sprintName: string;
  startDate: Date;
  endDate: Date;
  workingDays: number;        // Total working days in sprint (excluding weekends)
  ptoOverlapDays: number;     // Days on PTO during sprint
  holidayOverlapDays: number; // Holiday days during sprint
  availableCapacity: number;  // workingDays - ptoOverlap - holidayOverlap
  assignedStoryPoints: number;
  assignedDays: number;       // Converted from story points
  utilizationPercent: number;
  status: 'over' | 'near' | 'good' | 'low';
  tickets: Ticket[];          // Assigned tickets in this sprint
  ptoEntries: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    overlapDays: number;
  }[];
  holidays: {
    id: string;
    name: string;
    date: Date;
  }[];
}

export interface TeamMemberCapacity {
  memberId: string;
  memberName: string;
  role: string;
  sprintCapacities: TeamMemberSprintCapacity[];
  totalAssignedStoryPoints: number;
  totalAssignedDays: number;
  totalAvailableCapacity: number;
  totalUtilizationPercent: number;
  overallStatus: 'over' | 'near' | 'good' | 'low';
}

/**
 * Calculate the number of working days (Mon-Fri) between two dates, inclusive
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Calculate how many days a PTO entry overlaps with a sprint
 */
function calculatePTOOverlap(
  ptoStart: Date,
  ptoEnd: Date,
  sprintStart: Date,
  sprintEnd: Date
): number {
  const overlapStart = new Date(Math.max(ptoStart.getTime(), sprintStart.getTime()));
  const overlapEnd = new Date(Math.min(ptoEnd.getTime(), sprintEnd.getTime()));

  if (overlapStart > overlapEnd) {
    return 0; // No overlap
  }

  return calculateWorkingDays(overlapStart, overlapEnd);
}

/**
 * Calculate how many holidays fall within a sprint (excluding weekends)
 */
function calculateHolidayOverlap(
  holidays: Holiday[],
  sprintStart: Date,
  sprintEnd: Date
): { count: number; holidays: { id: string; name: string; date: Date }[] } {
  const overlappingHolidays: { id: string; name: string; date: Date }[] = [];
  let count = 0;

  for (const holiday of holidays) {
    const holidayDate = new Date(holiday.startDate);

    // Check if single-day holiday falls in sprint
    if (holidayDate >= sprintStart && holidayDate <= sprintEnd) {
      const day = holidayDate.getDay();
      if (day !== 0 && day !== 6) { // Not a weekend
        count++;
        overlappingHolidays.push({
          id: holiday.id,
          name: holiday.name,
          date: holidayDate
        });
      }
    }
  }

  return { count, holidays: overlappingHolidays };
}

/**
 * Get utilization status based on percentage
 */
function getUtilizationStatus(utilizationPercent: number): 'over' | 'near' | 'good' | 'low' {
  if (utilizationPercent > 90) return 'over';
  if (utilizationPercent >= 70) return 'near';
  if (utilizationPercent >= 30) return 'good';
  return 'low';
}

/**
 * Get tickets assigned to a team member that fall within a sprint
 */
function getTicketsInSprint(
  tickets: Ticket[],
  memberName: string,
  sprintStart: Date,
  sprintEnd: Date
): Ticket[] {
  return tickets.filter(ticket => {
    // Check if ticket is assigned to this member
    if (ticket.assignedTo !== memberName) return false;

    // Check if ticket overlaps with sprint
    const ticketStart = new Date(ticket.startDate);
    const ticketEnd = new Date(ticket.endDate);
    
    return ticketStart <= sprintEnd && ticketEnd >= sprintStart;
  });
}

/**
 * Calculate capacity for a single team member across all sprints
 */
export function calculateTeamMemberCapacity(
  member: TeamMember,
  sprints: Sprint[],
  allTickets: Ticket[],
  holidays: Holiday[],
  storyPointMapping?: StoryPointMapping
): TeamMemberCapacity {
  const sprintCapacities: TeamMemberSprintCapacity[] = [];

  for (const sprint of sprints) {
    const sprintStart = new Date(sprint.startDate);
    const sprintEnd = new Date(sprint.endDate);

    // Calculate working days in sprint
    const workingDays = calculateWorkingDays(sprintStart, sprintEnd);

    // Calculate PTO overlap
    let ptoOverlapDays = 0;
    const ptoEntries: TeamMemberSprintCapacity['ptoEntries'] = [];
    
    if (member.pto) {
      for (const pto of member.pto) {
        const overlapDays = calculatePTOOverlap(
          pto.startDate,
          pto.endDate,
          sprintStart,
          sprintEnd
        );
        
        if (overlapDays > 0) {
          ptoOverlapDays += overlapDays;
          ptoEntries.push({
            id: `${member.id}-pto-${ptoEntries.length}`,
            name: pto.name || 'PTO',
            startDate: pto.startDate,
            endDate: pto.endDate,
            overlapDays
          });
        }
      }
    }

    // Calculate holiday overlap
    const { count: holidayOverlapDays, holidays: sprintHolidays } = 
      calculateHolidayOverlap(holidays, sprintStart, sprintEnd);

    // Available capacity
    const availableCapacity = Math.max(0, workingDays - ptoOverlapDays - holidayOverlapDays);

    // Get tickets assigned to this member in this sprint
    const sprintTickets = getTicketsInSprint(allTickets, member.name, sprintStart, sprintEnd);

    // Calculate assigned work using effort resolver
    const assignedStoryPoints = sprintTickets.reduce((sum, t) => sum + t.storyPoints, 0);
    
    // Use centralized adjusted duration calculation
    const assignedDays = sprintTickets.reduce((total, ticket) => {
      return total + getAdjustedDuration(ticket, member);
    }, 0);
    
    // Debug logging for velocity adjustments
    const baseAssignedDays = calculateTotalEffort(sprintTickets, storyPointMapping);
    if (baseAssignedDays > 0) {
      const velocityMultiplier = member.velocityMultiplier ?? 1;
      console.debug(
        `[VelocityAdjusted] ${member.name}: ${baseAssignedDays.toFixed(1)}d → ${assignedDays.toFixed(1)}d (÷${velocityMultiplier})`
      );
    }

    // Calculate utilization
    const utilizationPercent = availableCapacity > 0 
      ? Math.round((assignedDays / availableCapacity) * 100)
      : 0;

    const status = getUtilizationStatus(utilizationPercent);

    sprintCapacities.push({
      sprintId: sprint.id,
      sprintName: sprint.name,
      startDate: sprintStart,
      endDate: sprintEnd,
      workingDays,
      ptoOverlapDays,
      holidayOverlapDays,
      availableCapacity,
      assignedStoryPoints,
      assignedDays,
      utilizationPercent,
      status,
      tickets: sprintTickets,
      ptoEntries,
      holidays: sprintHolidays
    });
  }

  // Calculate totals
  const totalAssignedStoryPoints = sprintCapacities.reduce((sum, sc) => sum + sc.assignedStoryPoints, 0);
  const totalAssignedDays = sprintCapacities.reduce((sum, sc) => sum + sc.assignedDays, 0);
  const totalAvailableCapacity = sprintCapacities.reduce((sum, sc) => sum + sc.availableCapacity, 0);
  const totalUtilizationPercent = totalAvailableCapacity > 0
    ? Math.round((totalAssignedDays / totalAvailableCapacity) * 100)
    : 0;
  const overallStatus = getUtilizationStatus(totalUtilizationPercent);

  return {
    memberId: member.id,
    memberName: member.name,
    role: member.role,
    sprintCapacities,
    totalAssignedStoryPoints,
    totalAssignedDays,
    totalAvailableCapacity,
    totalUtilizationPercent,
    overallStatus
  };
}

/**
 * Calculate capacity for all team members across all sprints
 */
export function calculateAllTeamMemberCapacities(
  teamMembers: TeamMember[],
  sprints: Sprint[],
  allTickets: Ticket[],
  holidays: Holiday[],
  storyPointMapping?: StoryPointMapping
): TeamMemberCapacity[] {
  return teamMembers.map(member => 
    calculateTeamMemberCapacity(member, sprints, allTickets, holidays, storyPointMapping)
  );
}
