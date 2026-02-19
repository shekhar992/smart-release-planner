/**
 * Sprint Capacity Calculation Utility
 * Calculates sprint capacity considering working days, holidays, PTO, and team velocity
 */

import { StoryPointMapping } from '../data/mockData';
import { resolveEffortDaysWithMapping } from './effortResolver';

export interface Sprint {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface Ticket {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  assignedTo: string;
  storyPoints: number;
  effortDays?: number; // New primary estimation field
  status: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  pto: PTOEntry[];
}

export interface PTOEntry {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface Holiday {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface SprintCapacity {
  sprintId: string;
  sprintName: string;
  
  // Time metrics
  totalCalendarDays: number;
  workingDays: number; // Excluding weekends
  holidayDays: number;
  ptoDays: number;
  availableDays: number; // workingDays - holidays - PTO
  
  // Capacity metrics
  teamSize: number; // Number of developers working in this sprint
  totalTeamDays: number; // availableDays × teamSize
  velocityPerDay: number; // Story points per day (default: 1)
  capacityStoryPoints: number; // totalTeamDays × velocityPerDay
  
  // Load metrics
  plannedStoryPoints: number;
  plannedDays: number; // SP converted to days via mapping
  utilizationPercent: number; // (plannedDays / totalTeamDays) × 100
  overCapacity: boolean; // plannedDays > totalTeamDays
  
  // Breakdown
  ticketCount: number;
  developersInSprint: string[];
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Count working days (excluding weekends) between two dates
 */
function countWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

function toLocalDateKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildHolidayWorkingDaySet(holidays: Holiday[], start: Date, end: Date): Set<string> {
  const set = new Set<string>();
  const rangeStart = new Date(start);
  const rangeEnd = new Date(end);
  rangeStart.setHours(0, 0, 0, 0);
  rangeEnd.setHours(0, 0, 0, 0);

  for (const holiday of holidays) {
    const hs = new Date(holiday.startDate);
    const he = new Date(holiday.endDate);
    hs.setHours(0, 0, 0, 0);
    he.setHours(0, 0, 0, 0);

    const overlapStart = new Date(Math.max(hs.getTime(), rangeStart.getTime()));
    const overlapEnd = new Date(Math.min(he.getTime(), rangeEnd.getTime()));
    if (overlapStart > overlapEnd) continue;

    const cursor = new Date(overlapStart);
    while (cursor <= overlapEnd) {
      if (!isWeekend(cursor)) {
        set.add(toLocalDateKey(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return set;
}

function countWorkingDaysExcludingSet(startDate: Date, endDate: Date, excluded: Set<string>): number {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    if (!isWeekend(current)) {
      const key = toLocalDateKey(current);
      if (!excluded.has(key)) count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Check if two date ranges overlap
 */
function datesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 <= end2 && start2 <= end1;
}

/**
 * Count days of overlap between two date ranges (excluding weekends)
 */
function countOverlapWorkingDays(start1: Date, end1: Date, start2: Date, end2: Date): number {
  if (!datesOverlap(start1, end1, start2, end2)) return 0;
  
  const overlapStart = start1 > start2 ? start1 : start2;
  const overlapEnd = end1 < end2 ? end1 : end2;
  
  return countWorkingDays(overlapStart, overlapEnd);
}

/**
 * Check if a ticket falls within a sprint
 */
function isTicketInSprint(ticket: Ticket, sprint: Sprint): boolean {
  return datesOverlap(ticket.startDate, ticket.endDate, sprint.startDate, sprint.endDate);
}

/**
 * Calculate sprint capacity considering all factors
 */
export function calculateSprintCapacity(
  sprint: Sprint,
  tickets: Ticket[],
  teamMembers: TeamMember[],
  holidays: Holiday[],
  velocityPerDay: number = 1,
  spMapping?: StoryPointMapping
): SprintCapacity {
  // Calculate total calendar days
  const totalCalendarDays = Math.ceil(
    (sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  
  // Calculate working days (excluding weekends)
  const workingDays = countWorkingDays(sprint.startDate, sprint.endDate);
  
  // Calculate holiday days that fall within sprint (excluding weekends)
  const holidayWorkingDays = buildHolidayWorkingDaySet(holidays, sprint.startDate, sprint.endDate);
  const holidayDays = holidayWorkingDays.size;
  
  // Find all developers working in this sprint
  const sprintTickets = tickets.filter(ticket => isTicketInSprint(ticket, sprint));
  const developersInSprint = Array.from(new Set(
    sprintTickets
      .map(t => t.assignedTo)
      .filter(assignee => assignee && assignee !== 'Unassigned')
  ));
  
  // Calculate PTO days for developers in this sprint
  let ptoDays = 0;
  developersInSprint.forEach(devName => {
    const member = teamMembers.find(m => m.name === devName);
    if (member && member.pto) {
      member.pto.forEach(pto => {
        if (!datesOverlap(pto.startDate, pto.endDate, sprint.startDate, sprint.endDate)) return;
        const overlapStart = pto.startDate > sprint.startDate ? pto.startDate : sprint.startDate;
        const overlapEnd = pto.endDate < sprint.endDate ? pto.endDate : sprint.endDate;
        ptoDays += countWorkingDaysExcludingSet(overlapStart, overlapEnd, holidayWorkingDays);
      });
    }
  });
  
  // Calculate available days
  const availableDays = Math.max(0, workingDays - holidayDays);
  
  // Calculate team capacity
  const teamSize = developersInSprint.length;
  const totalTeamDays = Math.max(0, (availableDays * teamSize) - ptoDays);
  const capacityStoryPoints = totalTeamDays * velocityPerDay;
  
  // Calculate planned story points for this sprint (legacy display)
  const plannedStoryPoints = sprintTickets.reduce((sum, ticket) => {
    return sum + ticket.storyPoints;
  }, 0);

  // Calculate planned days using effort resolver (effortDays → storyPoints with mapping)
  const plannedDays = sprintTickets.reduce((sum, ticket) => {
    return sum + resolveEffortDaysWithMapping(ticket, spMapping);
  }, 0);
  
  // Calculate utilization based on days (mapping-aware)
  const utilizationPercent = totalTeamDays > 0 
    ? (plannedDays / totalTeamDays) * 100 
    : 0;
  
  const overCapacity = plannedDays > totalTeamDays;
  
  return {
    sprintId: sprint.id,
    sprintName: sprint.name,
    totalCalendarDays,
    workingDays,
    holidayDays,
    ptoDays,
    availableDays,
    teamSize,
    totalTeamDays,
    velocityPerDay,
    capacityStoryPoints,
    plannedStoryPoints,
    plannedDays,
    utilizationPercent,
    overCapacity,
    ticketCount: sprintTickets.length,
    developersInSprint
  };
}

/**
 * Calculate capacity for all sprints
 */
export function calculateAllSprintCapacities(
  sprints: Sprint[],
  tickets: Ticket[],
  teamMembers: TeamMember[],
  holidays: Holiday[],
  velocityPerDay: number = 1,
  spMapping?: StoryPointMapping
): Map<string, SprintCapacity> {
  const capacityMap = new Map<string, SprintCapacity>();
  
  sprints.forEach(sprint => {
    const capacity = calculateSprintCapacity(sprint, tickets, teamMembers, holidays, velocityPerDay, spMapping);
    capacityMap.set(sprint.id, capacity);
  });
  
  return capacityMap;
}

/**
 * Get capacity status color based on utilization
 */
export function getCapacityStatusColor(utilizationPercent: number): string {
  if (utilizationPercent > 100) return '#dc2626'; // Red - over capacity
  if (utilizationPercent > 90) return '#f59e0b'; // Amber - near capacity
  if (utilizationPercent > 70) return '#10b981'; // Green - good capacity
  return '#64748b'; // Gray - under capacity
}

/**
 * Get capacity status label
 */
export function getCapacityStatusLabel(utilizationPercent: number): string {
  if (utilizationPercent > 100) return 'Over Capacity';
  if (utilizationPercent > 90) return 'Near Capacity';
  if (utilizationPercent > 70) return 'Good Capacity';
  return 'Under Capacity';
}
