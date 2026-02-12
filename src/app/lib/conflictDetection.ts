/**
 * Conflict Detection Utility
 * Detects scheduling conflicts for team members with overlapping tasks
 */

export interface Ticket {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  assignedTo: string;
  storyPoints: number;
  status: string;
}

export interface TicketConflict {
  ticketId: string;
  conflictingTickets: ConflictInfo[];
}

export interface ConflictInfo {
  ticketId: string;
  ticketTitle: string;
  startDate: Date;
  endDate: Date;
  overlapDays: number;
}

export interface ConflictSummary {
  totalConflicts: number;
  affectedDevelopers: string[];
  conflictsByDeveloper: Record<string, number>;
  overlapConflicts?: number;
  developerOverloadConflicts?: number;
  sprintOverCapacityConflicts?: number;
}

// Enhanced Conflict Type with Suggestions
export interface Conflict {
  ticketId: string;
  developer: string;
  type: "overlap" | "developerOverload" | "sprintOverCapacity";
  severity: "high" | "medium" | "low";
  message: string;
  impactedDays?: number;
  conflictingTickets?: string[];
  suggestions?: {
    possibleReassignments?: string[];
    possibleSprintMoves?: string[];
    possibleShiftDays?: number[];
  };
}

/**
 * Check if two date ranges overlap
 * Uses strict inequality so that back-to-back (cascading) tickets
 * sharing the same boundary date are NOT treated as conflicts.
 */
function datesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Calculate number of overlapping days between two date ranges
 */
function calculateOverlapDays(start1: Date, end1: Date, start2: Date, end2: Date): number {
  if (!datesOverlap(start1, end1, start2, end2)) return 0;
  
  const overlapStart = start1 > start2 ? start1 : start2;
  const overlapEnd = end1 < end2 ? end1 : end2;
  
  const diffTime = Math.abs(overlapEnd.getTime() - overlapStart.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day
}

/**
 * Detect all scheduling conflicts in a list of tickets
 * Returns a map of ticketId -> conflicting tickets
 */
export function detectConflicts(tickets: Ticket[]): Map<string, TicketConflict> {
  const conflictMap = new Map<string, TicketConflict>();
  
  // Group tickets by assignee
  const ticketsByDeveloper = new Map<string, Ticket[]>();
  
  tickets.forEach(ticket => {
    if (!ticket.assignedTo || ticket.assignedTo === 'Unassigned') return;
    
    const devTickets = ticketsByDeveloper.get(ticket.assignedTo) || [];
    devTickets.push(ticket);
    ticketsByDeveloper.set(ticket.assignedTo, devTickets);
  });
  
  // Check for conflicts within each developer's tickets
  ticketsByDeveloper.forEach((devTickets) => {
    for (let i = 0; i < devTickets.length; i++) {
      const ticket1 = devTickets[i];
      const conflicts: ConflictInfo[] = [];
      
      for (let j = i + 1; j < devTickets.length; j++) {
        const ticket2 = devTickets[j];
        
        if (datesOverlap(ticket1.startDate, ticket1.endDate, ticket2.startDate, ticket2.endDate)) {
          const overlapDays = calculateOverlapDays(
            ticket1.startDate, 
            ticket1.endDate, 
            ticket2.startDate, 
            ticket2.endDate
          );
          
          conflicts.push({
            ticketId: ticket2.id,
            ticketTitle: ticket2.title,
            startDate: ticket2.startDate,
            endDate: ticket2.endDate,
            overlapDays
          });
        }
      }
      
      if (conflicts.length > 0) {
        conflictMap.set(ticket1.id, {
          ticketId: ticket1.id,
          conflictingTickets: conflicts
        });
      }
    }
  });
  
  return conflictMap;
}

/**
 * Get conflict summary statistics
 */
export function getConflictSummary(conflicts: Map<string, TicketConflict>, tickets: Ticket[]): ConflictSummary {
  const affectedTicketIds = new Set<string>();
  const affectedDevelopers = new Set<string>();
  const conflictsByDev: Record<string, number> = {};
  
  conflicts.forEach((conflict, ticketId) => {
    affectedTicketIds.add(ticketId);
    conflict.conflictingTickets.forEach(c => affectedTicketIds.add(c.ticketId));
  });
  
  // Find developers affected
  tickets.forEach(ticket => {
    if (affectedTicketIds.has(ticket.id) && ticket.assignedTo && ticket.assignedTo !== 'Unassigned') {
      affectedDevelopers.add(ticket.assignedTo);
      conflictsByDev[ticket.assignedTo] = (conflictsByDev[ticket.assignedTo] || 0) + 1;
    }
  });
  
  return {
    totalConflicts: conflicts.size,
    affectedDevelopers: Array.from(affectedDevelopers),
    conflictsByDeveloper: conflictsByDev,
    overlapConflicts: conflicts.size, // All current conflicts are overlaps
    developerOverloadConflicts: 0,
    sprintOverCapacityConflicts: 0
  };
}

/**
 * Check if a specific ticket has conflicts
 */
export function hasConflict(ticketId: string, conflicts: Map<string, TicketConflict>): boolean {
  if (conflicts.has(ticketId)) return true;
  
  // Check if this ticket is in someone else's conflict list
  for (const conflict of conflicts.values()) {
    if (conflict.conflictingTickets.some(c => c.ticketId === ticketId)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get all conflicts for a specific ticket (both where it's the primary and where it's conflicting)
 */
export function getTicketConflicts(ticketId: string, conflicts: Map<string, TicketConflict>): ConflictInfo[] {
  const allConflicts: ConflictInfo[] = [];
  
  // Get direct conflicts
  const directConflict = conflicts.get(ticketId);
  if (directConflict) {
    allConflicts.push(...directConflict.conflictingTickets);
  }
  
  // Get reverse conflicts (where this ticket appears in someone else's list)
  conflicts.forEach((conflict, primaryTicketId) => {
    if (primaryTicketId !== ticketId) {
      const reverseConflict = conflict.conflictingTickets.find(c => c.ticketId === ticketId);
      if (reverseConflict) {
        // We need to find the primary ticket info
        // This is a bit tricky without the full ticket list, but we'll mark it
        allConflicts.push({
          ticketId: primaryTicketId,
          ticketTitle: 'Conflicting Task', // Will be resolved in component
          startDate: new Date(),
          endDate: new Date(),
          overlapDays: reverseConflict.overlapDays
        });
      }
    }
  });
  
  return allConflicts;
}

/**
 * Detect enhanced conflicts with suggestions
 * Returns detailed conflict information including possible resolutions
 */
export function detectEnhancedConflicts(
  tickets: Ticket[],
  sprints?: Array<{ id: string; startDate: Date; endDate: Date }>,
  teamMembers?: Array<{ name: string }>
): Conflict[] {
  const conflicts: Conflict[] = [];
  
  // Group tickets by developer
  const ticketsByDeveloper = new Map<string, Ticket[]>();
  tickets.forEach(ticket => {
    if (!ticket.assignedTo || ticket.assignedTo === 'Unassigned') return;
    const devTickets = ticketsByDeveloper.get(ticket.assignedTo) || [];
    devTickets.push(ticket);
    ticketsByDeveloper.set(ticket.assignedTo, devTickets);
  });
  
  // Check for overlaps within each developer's workload
  ticketsByDeveloper.forEach((devTickets, developer) => {
    for (let i = 0; i < devTickets.length; i++) {
      const ticket1 = devTickets[i];
      const conflictingIds: string[] = [];
      let totalOverlapDays = 0;
      
      for (let j = i + 1; j < devTickets.length; j++) {
        const ticket2 = devTickets[j];
        
        if (datesOverlap(ticket1.startDate, ticket1.endDate, ticket2.startDate, ticket2.endDate)) {
          const overlapDays = calculateOverlapDays(
            ticket1.startDate,
            ticket1.endDate,
            ticket2.startDate,
            ticket2.endDate
          );
          conflictingIds.push(ticket2.id);
          totalOverlapDays += overlapDays;
        }
      }
      
      if (conflictingIds.length > 0) {
        // Compute suggestions
        const suggestions = computeSuggestions(
          ticket1,
          conflictingIds,
          tickets,
          ticketsByDeveloper,
          sprints,
          teamMembers
        );
        
        // Determine severity based on overlap days and number of conflicts
        const severity: "high" | "medium" | "low" = 
          totalOverlapDays > 5 || conflictingIds.length > 2 ? "high" :
          totalOverlapDays > 2 ? "medium" : "low";
        
        conflicts.push({
          ticketId: ticket1.id,
          developer,
          type: "overlap",
          severity,
          message: `${ticket1.title} overlaps with ${conflictingIds.length} other task${conflictingIds.length > 1 ? 's' : ''}`,
          impactedDays: totalOverlapDays,
          conflictingTickets: conflictingIds,
          suggestions
        });
      }
    }
  });
  
  return conflicts;
}

/**
 * Compute suggestions for resolving a conflict
 */
function computeSuggestions(
  ticket: Ticket,
  conflictingTicketIds: string[],
  allTickets: Ticket[],
  ticketsByDeveloper: Map<string, Ticket[]>,
  sprints?: Array<{ id: string; startDate: Date; endDate: Date }>,
  teamMembers?: Array<{ name: string }>
): {
  possibleReassignments?: string[];
  possibleSprintMoves?: string[];
  possibleShiftDays?: number[];
} {
  const suggestions: {
    possibleReassignments?: string[];
    possibleSprintMoves?: string[];
    possibleShiftDays?: number[];
  } = {};
  
  // 1. Find developers with available capacity (less overlapping work)
  if (teamMembers && teamMembers.length > 0) {
    const lessLoadedDevs = teamMembers
      .filter(tm => {
        const devTickets = ticketsByDeveloper.get(tm.name) || [];
        // Check if this developer has capacity during the ticket's timeframe
        const hasOverlap = devTickets.some(t => 
          datesOverlap(ticket.startDate, ticket.endDate, t.startDate, t.endDate)
        );
        return !hasOverlap && tm.name !== ticket.assignedTo;
      })
      .map(tm => tm.name)
      .slice(0, 3); // Limit to top 3 suggestions
    
    if (lessLoadedDevs.length > 0) {
      suggestions.possibleReassignments = lessLoadedDevs;
    }
  }
  
  // 2. Find sprints where this ticket could fit
  if (sprints && sprints.length > 0) {
    const currentSprintIndex = sprints.findIndex(s => 
      ticket.startDate >= s.startDate && ticket.startDate <= s.endDate
    );
    
    if (currentSprintIndex >= 0 && currentSprintIndex < sprints.length - 1) {
      // Suggest next sprint
      suggestions.possibleSprintMoves = [sprints[currentSprintIndex + 1].id];
    }
  }
  
  // 3. Check if shifting by +1 day resolves conflicts
  const shiftOptions: number[] = [];
  for (let shiftDays = 1; shiftDays <= 5; shiftDays++) {
    const shiftedStart = new Date(ticket.startDate);
    shiftedStart.setDate(shiftedStart.getDate() + shiftDays);
    const shiftedEnd = new Date(ticket.endDate);
    shiftedEnd.setDate(shiftedEnd.getDate() + shiftDays);
    
    // Check if shifted ticket still conflicts
    const stillConflicts = conflictingTicketIds.some(cId => {
      const conflictingTicket = allTickets.find(t => t.id === cId);
      if (!conflictingTicket) return false;
      return datesOverlap(
        shiftedStart,
        shiftedEnd,
        conflictingTicket.startDate,
        conflictingTicket.endDate
      );
    });
    
    if (!stillConflicts) {
      shiftOptions.push(shiftDays);
      break; // Only suggest the minimum shift needed
    }
  }
  
  if (shiftOptions.length > 0) {
    suggestions.possibleShiftDays = shiftOptions;
  }
  
  return suggestions;
}
