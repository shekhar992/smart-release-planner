/**
 * Adapter layer: Maps domain layer outputs to app layer data structures
 * 
 * This module bridges the Release Feasibility Engine (pure domain logic)
 * with the existing UI/localStorage data model.
 */

import { ReleasePlan } from '../types';
import { Release, Feature, Ticket, Sprint, TeamMember } from '../../app/data/mockData';
import { addDays, isWeekend, min, startOfDay } from 'date-fns';

/**
 * Calculate the end date for a ticket based on effort days
 * Skips weekends during calculation
 * 
 * @param startDate - Start date of the ticket
 * @param effortDays - Number of working days required
 * @param maxEndDate - Maximum allowed end date (sprint boundary)
 * @returns End date for the ticket (capped at maxEndDate)
 */
function calculateTicketEndDate(
  startDate: Date,
  effortDays: number,
  maxEndDate: Date
): Date {
  let currentDate = startOfDay(startDate);
  let workingDaysAdded = 0;

  // For effortDays = 1, startDate === endDate
  if (effortDays <= 1) {
    return min([currentDate, startOfDay(maxEndDate)]);
  }

  // Add working days, skipping weekends
  while (workingDaysAdded < effortDays - 1) {
    currentDate = addDays(currentDate, 1);
    
    if (!isWeekend(currentDate)) {
      workingDaysAdded++;
    }
    
    // Cap at sprint end date
    if (currentDate >= startOfDay(maxEndDate)) {
      return startOfDay(maxEndDate);
    }
  }

  return min([currentDate, startOfDay(maxEndDate)]);
}

/**
 * Convert a ReleasePlan (domain output) into a Release (app format)
 * 
 * Key transformations:
 * - Groups placed tickets by epic into separate features
 * - Creates "Deferred (Out of Scope)" feature for overflow tickets
 * - Maps domain Sprint (with capacity metrics) to app Sprint (simple dates)
 * - Converts effortDays to storyPoints (1:1 mapping)
 * - Validates ticket assignments against team roster
 * 
 * @param plan - Output from buildReleasePlan()
 * @param releaseName - Name for the new release
 * @param releaseStart - Release start date
 * @param releaseEnd - Release end date
 * @param teamMembers - Optional team members for assignment validation
 * @returns Release object ready for localStorage/UI
 */
export function mapReleasePlanToAppRelease(
  plan: ReleasePlan,
  releaseName: string,
  releaseStart: Date,
  releaseEnd: Date,
  teamMembers?: TeamMember[]
): Release {

  const generateId = () => crypto.randomUUID();

  // Build team member name set for O(1) lookup
  const teamMemberNames = teamMembers ? new Set(teamMembers.map(tm => tm.name)) : new Set<string>();

  // Helper: Validate assignment against team roster
  const validateAssignment = (assignedToRaw?: string): string => {
    if (!assignedToRaw) return "Unassigned";
    if (teamMemberNames.size === 0) return "Unassigned";
    return teamMemberNames.has(assignedToRaw) ? assignedToRaw : "Unassigned";
  };

  // Map domain sprints to app sprints (strip capacity metrics)
  const mappedSprints: Sprint[] = plan.sprints.map(s => ({
    id: s.id,
    name: s.name,
    startDate: s.startDate,
    endDate: s.endDate
  }));

  // Group placed tickets by epic (creates one feature per epic)
  const epicMap = new Map<string, Feature>();

  plan.sprints.forEach(sprint => {
    sprint.tickets.forEach(ticket => {

      if (!epicMap.has(ticket.epic)) {
        epicMap.set(ticket.epic, {
          id: generateId(),
          name: ticket.epic,
          tickets: []
        });
      }

      // Calculate ticket end date based on effort days (skipping weekends)
      const ticketEndDate = calculateTicketEndDate(
        sprint.startDate,
        ticket.effortDays,
        sprint.endDate
      );

      const mappedTicket: Ticket = {
        id: ticket.id,
        title: ticket.title,
        description: "",
        startDate: sprint.startDate,
        endDate: ticketEndDate,
        status: "planned",
        storyPoints: ticket.effortDays, // 1 day = 1 SP
        assignedTo: validateAssignment(ticket.assignedToRaw)
      };

      epicMap.get(ticket.epic)!.tickets.push(mappedTicket);
    });
  });

  const features: Feature[] = Array.from(epicMap.values());

  // Add deferred feature only if there are overflow tickets
  if (plan.overflowTickets.length > 0) {
    const deferredFeature: Feature = {
      id: generateId(),
      name: "Deferred (Out of Scope)",
      tickets: plan.overflowTickets.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        description: "",
        startDate: releaseEnd,
        endDate: releaseEnd,
        status: "planned",
        storyPoints: ticket.effortDays,
        assignedTo: validateAssignment(ticket.assignedToRaw)
      }))
    };

    features.push(deferredFeature);
  }

  return {
    id: generateId(),
    name: releaseName,
    startDate: releaseStart,
    endDate: releaseEnd,
    features,
    sprints: mappedSprints,
    storyPointMapping: undefined,
    milestones: [],
    phases: []
  };
}
