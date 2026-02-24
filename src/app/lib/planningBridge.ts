/**
 * Planning Bridge: App ↔ Domain adapter for auto-allocation
 * 
 * This module converts app layer data (Ticket, Release, TeamMember)
 * into domain layer inputs (TicketInput, ReleaseConfig), calls the
 * planning engine, and converts the output back to app format.
 */

import { buildReleasePlan } from '../../domain/planningEngine';
import { mapReleasePlanToAppRelease } from '../../domain/adapters/domainToAppMapper';
import { TicketInput, ReleaseConfig, ReleasePlan } from '../../domain/types';
import { Release, TeamMember, Holiday, storyPointsToDays } from '../data/mockData';

/**
 * Convert app Release → list of TicketInput for planning engine
 * 
 * Traverses feature hierarchy, converts SP → effort days, assigns priorities
 * based on feature order (earlier features = higher priority)
 */
function convertTicketsToInputs(release: Release): TicketInput[] {
  const inputs: TicketInput[] = [];
  
  // Priority scoring: Earlier features get higher priority (1 = highest)
  // Within a feature, all tickets get the same priority
  const featureCount = release.features.length;
  
  release.features.forEach((feature, featureIndex) => {
    // Map feature index to priority 1-5 scale
    // First 20% of features → priority 1
    // Next 20% → priority 2, etc.
    const priorityBucket = Math.floor((featureIndex / featureCount) * 5) + 1;
    const priority = Math.min(5, Math.max(1, priorityBucket));
    
    feature.tickets.forEach(ticket => {
      // Convert story points to effort days
      const effortDays = ticket.effortDays 
        ? ticket.effortDays 
        : storyPointsToDays(ticket.storyPoints, release.storyPointMapping);
      
      inputs.push({
        id: ticket.id,
        title: ticket.title,
        epic: feature.name,
        effortDays,
        priority,
        assignedToRaw: ticket.assignedTo === 'Unassigned' ? undefined : ticket.assignedTo
      });
    });
  });
  
  return inputs;
}

/**
 * Build ReleaseConfig from app state
 * 
 * Aggregates team size, holidays, and PTO dates into domain config
 */
function buildReleaseConfig(
  release: Release,
  teamMembers: TeamMember[],
  holidays: Holiday[],
  sprintLengthDays: number = 14
): ReleaseConfig {
  
  // Count active developers (filter to only Developers, not Designers/QA)
  const developers = teamMembers.filter(tm => tm.role === 'Developer');
  const numberOfDevelopers = developers.length;
  
  // Convert holidays to Date array
  // For multi-day holidays, include all dates in range
  const holidayDates: Date[] = [];
  holidays.forEach(h => {
    let current = new Date(h.startDate);
    const end = new Date(h.endDate);
    
    while (current <= end) {
      holidayDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  });
  
  // Aggregate all PTO dates from team members
  // Domain expects TEAM-LEVEL PTO (each date = 1 working day lost)
  // If 1 dev takes 1 day off, that's 1 entry
  const ptoDates: Date[] = [];
  
  developers.forEach(dev => {
    dev.pto.forEach(ptoEntry => {
      // Add each day in the PTO range
      const start = ptoEntry.startDate;
      const end = ptoEntry.endDate;
      let current = new Date(start);
      
      while (current <= end) {
        ptoDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    });
  });
  
  return {
    releaseStart: release.startDate,
    releaseEnd: release.endDate,
    sprintLengthDays,
    numberOfDevelopers,
    holidays: holidayDates,
    ptoDates
  };
}

/**
 * Auto-allocate tickets to sprints using the planning engine
 * 
 * This is the main entry point for the "Auto-Allocate" feature.
 * 
 * @param release - Current release to plan
 * @param teamMembers - Active team members
 * @param holidays - Global holidays
 * @param sprintLengthDays - Sprint length (default: 14 days)
 * @returns New Release with auto-allocated tickets, or null if planning fails
 */
export function autoAllocateRelease(
  release: Release,
  teamMembers: TeamMember[],
  holidays: Holiday[],
  sprintLengthDays: number = 14
): { success: true; release: Release; plan: ReleasePlan } | { success: false; error: string } {
  
  try {
    // Step 1: Convert app tickets → domain inputs
    const ticketInputs = convertTicketsToInputs(release);
    
    if (ticketInputs.length === 0) {
      return {
        success: false,
        error: 'No tickets to allocate. Add features and tickets first.'
      };
    }
    
    // Step 2: Build release configuration
    const config = buildReleaseConfig(release, teamMembers, holidays, sprintLengthDays);
    
    if (config.numberOfDevelopers === 0) {
      return {
        success: false,
        error: 'No developers in team. Add team members with Developer role first.'
      };
    }
    
    // Step 3: Call planning engine
    const plan = buildReleasePlan(ticketInputs, config);
    
    // Step 4: Convert domain output → app Release
    const allocatedRelease = mapReleasePlanToAppRelease(
      plan,
      release.name,
      release.startDate,
      release.endDate,
      teamMembers
    );
    
    // Preserve original release metadata
    allocatedRelease.id = release.id;
    allocatedRelease.storyPointMapping = release.storyPointMapping;
    allocatedRelease.milestones = release.milestones;
    allocatedRelease.phases = release.phases;
    
    return {
      success: true,
      release: allocatedRelease,
      plan
    };
    
  } catch (error) {
    console.error('[Planning Bridge] Auto-allocation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown planning error'
    };
  }
}
