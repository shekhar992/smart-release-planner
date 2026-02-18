/**
 * Effort Resolver - Centralized Effort Estimation Logic
 * 
 * This module provides a single source of truth for ticket effort estimation.
 * It migrates from storyPoints to effortDays as the primary estimation field.
 * 
 * Migration Strategy:
 * - effortDays is the new primary field (when available)
 * - storyPoints remains as fallback during transition
 * - Ensures zero breaking changes to timeline rendering
 */

import { StoryPointMapping, storyPointsToDays } from '../data/mockData';

export interface TicketWithEffort {
  effortDays?: number;
  storyPoints?: number;
  [key: string]: any;
}

/**
 * Resolve the effort estimation for a ticket in days.
 * 
 * Resolution order:
 * 1. If effortDays is explicitly set and > 0, use it (new primary)
 * 2. If storyPoints exists, use it directly as days (temporary fallback)
 * 3. Default to 1 day if neither is available
 * 
 * @param ticket - Ticket object with optional effortDays and/or storyPoints
 * @returns Estimated effort in days
 * 
 * @example
 * // New ticket with effortDays
 * resolveEffortDays({ effortDays: 3 }) // => 3
 * 
 * @example
 * // Legacy ticket with storyPoints
 * resolveEffortDays({ storyPoints: 5 }) // => 5
 * 
 * @example
 * // Priority: effortDays wins over storyPoints
 * resolveEffortDays({ effortDays: 2, storyPoints: 5 }) // => 2
 */
export function resolveEffortDays(ticket: TicketWithEffort): number {
  // Priority 1: Use effortDays if explicitly set
  if (ticket.effortDays != null && ticket.effortDays > 0) {
    return ticket.effortDays;
  }

  // Priority 2: Fallback to storyPoints (temporary transition)
  if (ticket.storyPoints != null && ticket.storyPoints > 0) {
    return ticket.storyPoints;
  }

  // Priority 3: Default to 1 day
  return 1;
}

/**
 * Resolve effort with story point mapping conversion.
 * 
 * This variant applies the SP-to-days mapping when converting from storyPoints,
 * but uses effortDays directly when available (no mapping applied).
 * 
 * @param ticket - Ticket object with optional effortDays and/or storyPoints
 * @param mapping - Optional story point mapping for conversion
 * @returns Estimated effort in days
 * 
 * @example
 * // effortDays bypasses mapping
 * resolveEffortDaysWithMapping({ effortDays: 3 }, mapping) // => 3
 * 
 * @example
 * // storyPoints uses mapping
 * resolveEffortDaysWithMapping({ storyPoints: 5 }, fibMapping) // => 3 (based on mapping)
 */
export function resolveEffortDaysWithMapping(
  ticket: TicketWithEffort,
  mapping?: StoryPointMapping
): number {
  // Priority 1: Use effortDays directly (no mapping)
  if (ticket.effortDays != null && ticket.effortDays > 0) {
    return ticket.effortDays;
  }

  // Priority 2: Convert storyPoints using mapping
  if (ticket.storyPoints != null && ticket.storyPoints > 0) {
    return storyPointsToDays(ticket.storyPoints, mapping);
  }

  // Priority 3: Default to 1 day
  return 1;
}

/**
 * Calculate total effort for multiple tickets.
 * 
 * @param tickets - Array of tickets
 * @param mapping - Optional story point mapping
 * @returns Total effort in days
 */
export function calculateTotalEffort(
  tickets: TicketWithEffort[],
  mapping?: StoryPointMapping
): number {
  return tickets.reduce((total, ticket) => {
    return total + resolveEffortDaysWithMapping(ticket, mapping);
  }, 0);
}

/**
 * Check if a ticket uses the new effort estimation system.
 * 
 * @param ticket - Ticket to check
 * @returns true if ticket has effortDays set
 */
export function usesEffortDays(ticket: TicketWithEffort): boolean {
  return ticket.effortDays != null && ticket.effortDays > 0;
}

/**
 * Check if a ticket uses legacy story points.
 * 
 * @param ticket - Ticket to check
 * @returns true if ticket only has storyPoints (no effortDays)
 */
export function usesStoryPoints(ticket: TicketWithEffort): boolean {
  return !usesEffortDays(ticket) && 
         ticket.storyPoints != null && 
         ticket.storyPoints > 0;
}

/**
 * Get adjusted duration for a ticket based on assigned developer's velocity.
 * 
 * This is the single source of truth for duration normalization.
 * Returns raw effort divided by velocity multiplier.
 * 
 * @param ticket - Ticket with effort data
 * @param teamMember - Optional assigned team member with velocityMultiplier
 * @returns Adjusted duration in days
 * 
 * @example
 * // No team member assigned
 * getAdjustedDuration({ effortDays: 10 }) // => 10
 * 
 * @example
 * // Senior developer (1.3x velocity)
 * getAdjustedDuration({ effortDays: 10 }, { velocityMultiplier: 1.3 }) // => 7.69
 * 
 * @example
 * // Junior developer (0.7x velocity)
 * getAdjustedDuration({ effortDays: 10 }, { velocityMultiplier: 0.7 }) // => 14.29
 */
export function getAdjustedDuration(
  ticket: TicketWithEffort,
  teamMember?: { velocityMultiplier?: number }
): number {
  const rawEffort = resolveEffortDays(ticket);

  if (!teamMember) return rawEffort;

  const velocity = teamMember.velocityMultiplier ?? 1;

  // Prevent divide-by-zero
  if (velocity <= 0) return rawEffort;

  return Math.max(1, Math.round(rawEffort / velocity));
}
