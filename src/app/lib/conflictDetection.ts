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
  timelineOverflowConflicts?: number;
}

// Enhanced Conflict Type with Suggestions
export interface Conflict {
  ticketId: string;
  developer: string;
  type: "overlap" | "developerOverload" | "sprintOverCapacity" | "timelineOverflow";
  severity: "high" | "medium" | "low";
  message: string;
  impactedDays?: number;
  conflictingTickets?: string[];
  overflowDays?: number;
  suggestions?: {
    possibleReassignments?: string[];
    possibleSprintMoves?: string[];
    possibleShiftDays?: number[];
    extendTimeline?: boolean;
    reduceScope?: boolean;
    splitTicket?: boolean;
  };
}

/**
 * Ensure value is a Date object (handles mixed string/Date scenarios)
 */
function ensureDate(value: any): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  return new Date(value);
}

/**
 * Check if two date ranges overlap
 * 
 * INCLUSIVE BOUNDARY LOGIC:
 * - Uses <= to catch boundary overlaps (Task A ends Feb 27, Task B starts Feb 27)
 * - Realistic for planning: Developer can't finish one task and start another on same day
 * - Handles single-day tasks naturally (startDate === endDate)
 * 
 * @example
 * // Boundary overlap (Task A ends Mon, Task B starts Mon)
 * datesOverlap(Mon, Mon, Mon, Wed) // TRUE - both work Monday
 * 
 * @example
 * // No overlap (Task A ends Mon, Task B starts Tue)
 * datesOverlap(Fri, Mon, Tue, Thu) // FALSE - different days
 * 
 * @example
 * // Single-day overlap (both on same day)
 * datesOverlap(Mon, Mon, Mon, Mon) // TRUE - same day conflict
 */
function datesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  // Normalize to Date objects to handle string/Date mixed scenarios
  const s1 = ensureDate(start1);
  const e1 = ensureDate(end1);
  const s2 = ensureDate(start2);
  const e2 = ensureDate(end2);
  
  // Inclusive inequality: catches boundary overlaps and single-day conflicts
  return s1 <= e2 && s2 <= e1;
}

/**
 * Calculate number of overlapping days between two date ranges
 */
function calculateOverlapDays(start1: Date, end1: Date, start2: Date, end2: Date): number {
  if (!datesOverlap(start1, end1, start2, end2)) return 0;
  
  const s1 = ensureDate(start1);
  const e1 = ensureDate(end1);
  const s2 = ensureDate(start2);
  const e2 = ensureDate(end2);
  
  const overlapStart = s1 > s2 ? s1 : s2;
  const overlapEnd = e1 < e2 ? e1 : e2;
  
  const diffTime = Math.abs(overlapEnd.getTime() - overlapStart.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // If same timestamp (single-day or boundary touch), count as 1 day minimum
  return days === 0 ? 1 : days + 1;
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
  ticketsByDeveloper.forEach((devTickets, developer) => {
    for (let i = 0; i < devTickets.length; i++) {
      const ticket1 = devTickets[i];
      
      for (let j = i + 1; j < devTickets.length; j++) {
        const ticket2 = devTickets[j];
        
        if (datesOverlap(ticket1.startDate, ticket1.endDate, ticket2.startDate, ticket2.endDate)) {
          const overlapDays = calculateOverlapDays(
            ticket1.startDate, 
            ticket1.endDate, 
            ticket2.startDate, 
            ticket2.endDate
          );
          
          // Debug logging
          console.log(
            `[Conflict Detected] ${developer}: "${ticket1.title}" overlaps "${ticket2.title}" by ${overlapDays} day(s)`,
            `\n  Ticket 1: ${ticket1.startDate.toISOString().split('T')[0]} → ${ticket1.endDate.toISOString().split('T')[0]}`,
            `\n  Ticket 2: ${ticket2.startDate.toISOString().split('T')[0]} → ${ticket2.endDate.toISOString().split('T')[0]}`
          );
          
          // BIDIRECTIONAL RECORDING: Add conflict to ticket1's list
          const existing1 = conflictMap.get(ticket1.id);
          if (existing1) {
            existing1.conflictingTickets.push({
              ticketId: ticket2.id,
              ticketTitle: ticket2.title,
              startDate: ticket2.startDate,
              endDate: ticket2.endDate,
              overlapDays
            });
          } else {
            conflictMap.set(ticket1.id, {
              ticketId: ticket1.id,
              conflictingTickets: [{
                ticketId: ticket2.id,
                ticketTitle: ticket2.title,
                startDate: ticket2.startDate,
                endDate: ticket2.endDate,
                overlapDays
              }]
            });
          }
          
          // BIDIRECTIONAL RECORDING: Add conflict to ticket2's list
          const existing2 = conflictMap.get(ticket2.id);
          if (existing2) {
            existing2.conflictingTickets.push({
              ticketId: ticket1.id,
              ticketTitle: ticket1.title,
              startDate: ticket1.startDate,
              endDate: ticket1.endDate,
              overlapDays
            });
          } else {
            conflictMap.set(ticket2.id, {
              ticketId: ticket2.id,
              conflictingTickets: [{
                ticketId: ticket1.id,
                ticketTitle: ticket1.title,
                startDate: ticket1.startDate,
                endDate: ticket1.endDate,
                overlapDays
              }]
            });
          }
        }
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
    sprintOverCapacityConflicts: 0,
    timelineOverflowConflicts: 0
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
  teamMembers?: Array<{ name: string; experienceLevel?: string; velocityMultiplier?: number }>,
  timelineEndDate?: Date
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
  
  // 1. Check for overlaps within each developer's workload
  // Track already-processed pairs to avoid duplicate bidirectional conflicts
  const processedPairs = new Set<string>();
  
  ticketsByDeveloper.forEach((devTickets, developer) => {
    for (let i = 0; i < devTickets.length; i++) {
      const ticket1 = devTickets[i];
      
      for (let j = i + 1; j < devTickets.length; j++) {
        const ticket2 = devTickets[j];
        
        if (datesOverlap(ticket1.startDate, ticket1.endDate, ticket2.startDate, ticket2.endDate)) {
          const overlapDays = calculateOverlapDays(
            ticket1.startDate,
            ticket1.endDate,
            ticket2.startDate,
            ticket2.endDate
          );
          
          // Create unique pair identifier
          const pairKey = [ticket1.id, ticket2.id].sort().join('|');
          
          // Skip if already processed (prevents duplicates in bidirectional recording)
          if (processedPairs.has(pairKey)) continue;
          processedPairs.add(pairKey);
          
          // Debug logging
          console.log(
            `[Enhanced Conflict] ${developer}: \"${ticket1.title}\" ↔ \"${ticket2.title}\" (${overlapDays} day overlap)`
          );
          
          // Determine severity
          const severity: "high" | "medium" | "low" = 
            overlapDays > 5 ? "high" :
            overlapDays > 2 ? "medium" : "low";
          
          // Compute suggestions for ticket1
          const suggestions1 = computeSuggestions(
            ticket1,
            [ticket2.id],
            tickets,
            ticketsByDeveloper,
            sprints,
            teamMembers
          );
          
          // Compute suggestions for ticket2
          const suggestions2 = computeSuggestions(
            ticket2,
            [ticket1.id],
            tickets,
            ticketsByDeveloper,
            sprints,
            teamMembers
          );
          
          // Add conflict for ticket1
          conflicts.push({
            ticketId: ticket1.id,
            developer,
            type: "overlap",
            severity,
            message: `${ticket1.title} overlaps with ${ticket2.title}`,
            impactedDays: overlapDays,
            conflictingTickets: [ticket2.id],
            suggestions: suggestions1
          });
          
          // Add conflict for ticket2 (bidirectional)
          conflicts.push({
            ticketId: ticket2.id,
            developer,
            type: "overlap",
            severity,
            message: `${ticket2.title} overlaps with ${ticket1.title}`,
            impactedDays: overlapDays,
            conflictingTickets: [ticket1.id],
            suggestions: suggestions2
          });
        }
      }
    }
  });
  
  // 2. Check for timeline overflow (tickets extending beyond end date)
  if (timelineEndDate) {
    tickets.forEach(ticket => {
      // Calculate adjusted duration based on velocity
      const assignedMember = teamMembers?.find(tm => tm.name === ticket.assignedTo);
      const velocityMultiplier = assignedMember?.velocityMultiplier ?? 1;
      const effortDays = (ticket as any).effortDays ?? ticket.storyPoints ?? 1;
      const adjustedDuration = Math.ceil(effortDays / velocityMultiplier);
      
      // Calculate when ticket would actually end
      const actualEndDate = new Date(ticket.startDate);
      actualEndDate.setDate(actualEndDate.getDate() + adjustedDuration);
      
      // Check if it overflows beyond timeline
      if (actualEndDate > timelineEndDate) {
        const overflowDays = Math.ceil(
          (actualEndDate.getTime() - timelineEndDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Compute overflow-specific suggestions
        const suggestions = computeOverflowSuggestions(
          ticket,
          overflowDays,
          assignedMember,
          teamMembers,
          sprints
        );
        
        // Severity based on how much it overflows
        const severity: "high" | "medium" | "low" = 
          overflowDays > 5 ? "high" :
          overflowDays > 2 ? "medium" : "low";
        
        conflicts.push({
          ticketId: ticket.id,
          developer: ticket.assignedTo || 'Unassigned',
          type: "timelineOverflow",
          severity,
          message: `${ticket.title} extends ${overflowDays} day${overflowDays > 1 ? 's' : ''} beyond timeline end`,
          overflowDays,
          suggestions
        });
      }
    });
  }
  
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
  teamMembers?: Array<{ name: string; experienceLevel?: string; velocityMultiplier?: number }>
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

/**
 * Compute suggestions for resolving timeline overflow
 */
function computeOverflowSuggestions(
  ticket: Ticket,
  overflowDays: number,
  assignedMember: any,
  teamMembers?: Array<{ name: string; experienceLevel?: string; velocityMultiplier?: number }>,
  sprints?: Array<{ id: string; startDate: Date; endDate: Date }>
): {
  possibleReassignments?: string[];
  possibleSprintMoves?: string[];
  extendTimeline?: boolean;
  reduceScope?: boolean;
  splitTicket?: boolean;
} {
  const suggestions: any = {};
  
  // 1. Suggest extending the timeline
  suggestions.extendTimeline = true;
  
  // 2. Suggest reducing scope if ticket has high effort
  const effortDays = (ticket as any).effortDays ?? ticket.storyPoints ?? 1;
  if (effortDays > 3) {
    suggestions.reduceScope = true;
  }
  
  // 3. Suggest splitting if ticket is large
  if (effortDays > 5) {
    suggestions.splitTicket = true;
  }
  
  // 4. Find faster developers (higher velocity multiplier)
  if (teamMembers && teamMembers.length > 0 && assignedMember) {
    const currentVelocity = assignedMember.velocityMultiplier ?? 1;
    const fasterDevs = teamMembers
      .filter(tm => {
        const velocity = tm.velocityMultiplier ?? 1;
        return velocity > currentVelocity && tm.name !== ticket.assignedTo;
      })
      .sort((a, b) => (b.velocityMultiplier ?? 1) - (a.velocityMultiplier ?? 1))
      .map(tm => tm.name)
      .slice(0, 3);
    
    if (fasterDevs.length > 0) {
      suggestions.possibleReassignments = fasterDevs;
    }
  }
  
  // 5. Suggest moving to earlier sprint to start sooner
  if (sprints && sprints.length > 0) {
    const currentSprintIndex = sprints.findIndex(s => 
      ticket.startDate >= s.startDate && ticket.startDate <= s.endDate
    );
    
    if (currentSprintIndex > 0) {
      // Suggest previous sprint to start earlier
      suggestions.possibleSprintMoves = [sprints[currentSprintIndex - 1].id];
    }
  }
  
  return suggestions;
}

// ============================================
// ENHANCED CONFLICT CLUSTERING & VALIDATION
// ============================================

/**
 * Conflict Cluster - Groups related conflicts for bulk resolution
 */
export interface ConflictCluster {
  id: string;
  developer: string;
  tickets: string[]; // All ticket IDs in cluster
  timeWindow: { start: Date; end: Date };
  severity: 'high' | 'medium' | 'low';
  peakOverlapDays: number; // Maximum overlap at any single point
  totalConflicts: number; // Number of conflict pairs in cluster
  suggestedResolution?: {
    method: 'bulk-shift' | 'bulk-reassign' | 'redistribute';
    shiftDays?: number;
    reassignTo?: string[];
    confidence: number; // 0-100
  };
}

/**
 * Validated Suggestion - Enhanced with confidence and validation
 */
export interface ValidatedSuggestion {
  type: 'reassign' | 'shift' | 'sprint-move';
  label: string; // Display text
  value: string | number;
  confidence: number; // 0-100
  validation: {
    willResolve: boolean; // Guaranteed to resolve THIS conflict
    mayCreateNew: boolean; // Might create NEW conflicts
    newConflictCount: number; // Estimated new conflicts
    capacityImpact: number; // Days added to target assignee
    hasPtoConflict: boolean; // Would schedule during PTO
    hasSkillMatch: boolean; // Assignee has required skills
  };
}

/**
 * Group conflicts into clusters by developer and time proximity
 * Reduces visual noise by showing "David: 3 tasks" instead of 6 bidirectional entries
 */
export function groupConflictsIntoClusters(conflicts: Conflict[]): ConflictCluster[] {
  const clusters: ConflictCluster[] = [];
  const processed = new Set<string>();
  
  // Group by developer first
  const byDeveloper = new Map<string, Conflict[]>();
  conflicts.forEach(conflict => {
    if (conflict.type !== 'overlap') return; // Only cluster overlaps
    const devConflicts = byDeveloper.get(conflict.developer) || [];
    devConflicts.push(conflict);
    byDeveloper.set(conflict.developer, devConflicts);
  });
  
  // For each developer, find clusters of overlapping tickets
  byDeveloper.forEach((devConflicts, developer) => {
    // Build graph: ticket -> conflicting tickets
    const graph = new Map<string, Set<string>>();
    
    devConflicts.forEach(conflict => {
      if (!graph.has(conflict.ticketId)) {
        graph.set(conflict.ticketId, new Set());
      }
      conflict.conflictingTickets?.forEach(ctId => {
        graph.get(conflict.ticketId)!.add(ctId);
      });
    });
    
    // Find connected components (clusters) using DFS
    const visited = new Set<string>();
    
    const dfs = (ticketId: string, cluster: Set<string>) => {
      if (visited.has(ticketId)) return;
      visited.add(ticketId);
      cluster.add(ticketId);
      
      const neighbors = graph.get(ticketId);
      if (neighbors) {
        neighbors.forEach(neighborId => dfs(neighborId, cluster));
      }
    };
    
    // Find all clusters for this developer
    graph.forEach((_, ticketId) => {
      if (!visited.has(ticketId)) {
        const clusterTickets = new Set<string>();
        dfs(ticketId, clusterTickets);
        
        if (clusterTickets.size > 1) {
          // Calculate cluster metadata
          const clusterConflicts = devConflicts.filter(c => clusterTickets.has(c.ticketId));
          
          // Find time window (earliest start, latest end among all tickets)
          const tickets = Array.from(clusterTickets);
          const dates = clusterConflicts.map(c => {
            const conflict = devConflicts.find(dc => dc.ticketId === c.ticketId);
            return conflict;
          }).filter(Boolean);
          
          const allDates = dates.flatMap(c => {
            const ticket = devConflicts.find(dc => dc.ticketId === c?.ticketId);
            return ticket ? [ticket] : [];
          });
          
          if (allDates.length === 0) return;
          
          // Extract time window from original conflicts
          const timeWindow = {
            start: new Date(Math.min()),
            end: new Date(Math.max())
          };
          
          // Calculate peak overlap and severity
          const peakOverlapDays = Math.max(...clusterConflicts.map(c => c.impactedDays || 0));
          const hasCritical = clusterConflicts.some(c => c.severity === 'high');
          const severity = hasCritical ? 'high' : peakOverlapDays > 2 ? 'medium' : 'low';
          
          // Create cluster ID
          const clusterId = `cluster-${developer.replace(/\s+/g, '-')}-${tickets[0]}`;
          
          // Count unique conflict pairs (not bidirectional duplicates)
          const totalConflicts = Math.ceil(clusterConflicts.length / 2);
          
          clusters.push({
            id: clusterId,
            developer,
            tickets: Array.from(clusterTickets),
            timeWindow,
            severity,
            peakOverlapDays,
            totalConflicts
          });
        }
      }
    });
  });
  
  return clusters;
}

/**
 * Check if a resolution action would create new conflicts
 * Returns count of NEW conflicts that would be created
 */
export function validateResolution(
  action: { type: 'reassign' | 'shift' | 'sprint-move'; ticketId: string; value: string | number },
  currentTicket: Ticket,
  allTickets: Ticket[],
  teamMembers?: Array<{ name: string; pto?: Array<{ startDate: Date; endDate: Date }> }>
): {
  willResolveCurrentConflict: boolean;
  wouldCreateNewConflicts: number;
  newConflictTicketIds: string[];
  hasPtoConflict: boolean;
} {
  let result = {
    willResolveCurrentConflict: false,
    wouldCreateNewConflicts: 0,
    newConflictTicketIds: [] as string[],
    hasPtoConflict: false
  };
  
  if (action.type === 'reassign' && typeof action.value === 'string') {
    const newAssignee = action.value;
    
    // Check if reassignment resolves current conflict (moves to different developer)
    result.willResolveCurrentConflict = newAssignee !== currentTicket.assignedTo;
    
    // Check if new assignee has overlapping work
    const newAssigneeTickets = allTickets.filter(t => t.assignedTo === newAssignee && t.id !== currentTicket.id);
    newAssigneeTickets.forEach(t => {
      if (datesOverlap(currentTicket.startDate, currentTicket.endDate, t.startDate, t.endDate)) {
        result.wouldCreateNewConflicts++;
        result.newConflictTicketIds.push(t.id);
      }
    });
    
    // Check if new assignee has PTO during ticket dates
    const member = teamMembers?.find(tm => tm.name === newAssignee);
    if (member?.pto) {
      const hasPto = member.pto.some(pto => 
        datesOverlap(currentTicket.startDate, currentTicket.endDate, pto.startDate, pto.endDate)
      );
      result.hasPtoConflict = hasPto;
    }
    
  } else if (action.type === 'shift' && typeof action.value === 'number') {
    const shiftDays = action.value;
    const newStart = new Date(currentTicket.startDate);
    newStart.setDate(newStart.getDate() + shiftDays);
    const newEnd = new Date(currentTicket.endDate);
    newEnd.setDate(newEnd.getDate() + shiftDays);
    
    // Check if shift resolves conflicts with same developer
    const sameDevTickets = allTickets.filter(t => 
      t.assignedTo === currentTicket.assignedTo && t.id !== currentTicket.id
    );
    
    let resolvedCount = 0;
    sameDevTickets.forEach(t => {
      const currentlyConflicts = datesOverlap(currentTicket.startDate, currentTicket.endDate, t.startDate, t.endDate);
      const wouldConflict = datesOverlap(newStart, newEnd, t.startDate, t.endDate);
      
      if (currentlyConflicts && !wouldConflict) {
        resolvedCount++;
      } else if (wouldConflict && !currentlyConflicts) {
        result.wouldCreateNewConflicts++;
        result.newConflictTicketIds.push(t.id);
      }
    });
    
    result.willResolveCurrentConflict = resolvedCount > 0;
  }
  
  return result;
}

/**
 * Enhance suggestions with validation and confidence scores
 */
export function computeValidatedSuggestions(
  ticket: Ticket,
  conflictingTicketIds: string[],
  allTickets: Ticket[],
  ticketsByDeveloper: Map<string, Ticket[]>,
  sprints?: Array<{ id: string; startDate: Date; endDate: Date }>,
  teamMembers?: Array<{ name: string; experienceLevel?: string; velocityMultiplier?: number; pto?: Array<{ startDate: Date; endDate: Date }> }>
): ValidatedSuggestion[] {
  const suggestions: ValidatedSuggestion[] = [];
  
  // 1. Validated Reassignment Suggestions
  if (teamMembers && teamMembers.length > 0) {
    const availableDevs = teamMembers
      .filter(tm => tm.name !== ticket.assignedTo)
      .map(tm => {
        const validation = validateResolution(
          { type: 'reassign', ticketId: ticket.id, value: tm.name },
          ticket,
          allTickets,
          teamMembers
        );
        
        // Calculate confidence based on validation
        let confidence = 100;
        if (validation.wouldCreateNewConflicts > 0) confidence -= validation.wouldCreateNewConflicts * 20;
        if (validation.hasPtoConflict) confidence -= 30;
        confidence = Math.max(0, confidence);
        
        // Calculate capacity impact
        const devTickets = ticketsByDeveloper.get(tm.name) || [];
        const currentCapacity = devTickets.reduce((sum, t) => sum + ((t as any).effortDays || t.storyPoints), 0);
        const ticketEffort = (ticket as any).effortDays || ticket.storyPoints;
        
        return {
          type: 'reassign' as const,
          label: tm.name,
          value: tm.name,
          confidence,
          validation: {
            willResolve: validation.willResolveCurrentConflict,
            mayCreateNew: validation.wouldCreateNewConflicts > 0,
            newConflictCount: validation.wouldCreateNewConflicts,
            capacityImpact: ticketEffort,
            hasPtoConflict: validation.hasPtoConflict,
            hasSkillMatch: true // TODO: Check requiredRole
          }
        };
      })
      .filter(s => s.confidence >= 40) // Only show suggestions with 40+ confidence
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
    
    suggestions.push(...availableDevs);
  }
  
  // 2. Validated Shift Suggestions
  // Test shift options and calculate minimum days needed
  for (let shiftDays = 1; shiftDays <= 10; shiftDays++) {
    const validation = validateResolution(
      { type: 'shift', ticketId: ticket.id, value: shiftDays },
      ticket,
      allTickets,
      teamMembers
    );
    
    if (validation.willResolveCurrentConflict && validation.wouldCreateNewConflicts === 0) {
      // Found minimum shift that resolves without creating new conflicts
      const confidence = 100 - (shiftDays * 5); // Prefer smaller shifts
      
      suggestions.push({
        type: 'shift',
        label: `+${shiftDays} day${shiftDays > 1 ? 's' : ''}`,
        value: shiftDays,
        confidence: Math.max(50, confidence),
        validation: {
          willResolve: true,
          mayCreateNew: false,
          newConflictCount: 0,
          capacityImpact: 0,
          hasPtoConflict: false,
          hasSkillMatch: true
        }
      });
      
      break; // Only suggest minimum shift needed
    }
  }
  
  // 3. Sprint Move Suggestions (keep existing logic)
  if (sprints && sprints.length > 0) {
    const currentSprintIndex = sprints.findIndex(s => 
      ticket.startDate >= s.startDate && ticket.startDate <= s.endDate
    );
    
    if (currentSprintIndex >= 0 && currentSprintIndex < sprints.length - 1) {
      suggestions.push({
        type: 'sprint-move',
        label: 'Next Sprint',
        value: sprints[currentSprintIndex + 1].id,
        confidence: 70, // Moderate confidence (may still have conflicts in new sprint)
        validation: {
          willResolve: true,
          mayCreateNew: false, // TODO: Check capacity in target sprint
          newConflictCount: 0,
          capacityImpact: 0,
          hasPtoConflict: false,
          hasSkillMatch: true
        }
      });
    }
  }
  
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Deduplicate bidirectional conflicts (show A↔B once instead of twice)
 * Groups conflicts into unique pairs for cleaner UI
 */
export function deduplicateConflicts(conflicts: Conflict[]): Conflict[] {
  const processedPairs = new Set<string>();
  const deduplicated: Conflict[] = [];
  
  conflicts.forEach(conflict => {
    if (conflict.type !== 'overlap') {
      // Non-overlap conflicts don't have bidirectional duplicates
      deduplicated.push(conflict);
      return;
    }
    
    // Create pair key from sorted ticket IDs
    const conflictingId = conflict.conflictingTickets?.[0];
    if (!conflictingId) {
      deduplicated.push(conflict);
      return;
    }
    
    const pairKey = [conflict.ticketId, conflictingId].sort().join('|');
    
    if (!processedPairs.has(pairKey)) {
      processedPairs.add(pairKey);
      deduplicated.push(conflict);
    }
  });
  
  return deduplicated;
}

/**
 * Returns the SINGLE BEST action that will resolve a conflict.
 * Pre-validates all options and returns only the highest-confidence solution.
 * Returns null if no good solution exists.
 */
export function getBestResolution(
  conflict: Conflict,
  currentTicket: any,
  allTickets: any[],
  teamMembers: any[]
): {
  type: 'reassign' | 'shift' | 'sprint-move';
  value: string | number;
  description: string;
  confidence: number;
  impact: {
    willResolve: boolean;
    resolvedConflicts: number;
    mayCreateNew: boolean;
    newConflictCount: number;
    willExtendRelease: boolean;
    extensionDays: number;
    willReduceCapacity: boolean;
    capacityImpact: number;
  };
} | null {
  const suggestions: Array<{
    type: 'reassign' | 'shift' | 'sprint-move';
    value: string | number;
    description: string;
    confidence: number;
    impact: any;
  }> = [];

  // Test reassignment options
  if (conflict.suggestions?.possibleReassignments) {
    for (const dev of conflict.suggestions.possibleReassignments) {
      const validation = validateResolution(
        { type: 'reassign', ticketId: conflict.ticketId, value: dev },
        currentTicket,
        allTickets,
        teamMembers
      );

      // Only consider if it actually resolves and doesn't create major new issues
      if (validation.willResolve && validation.newConflictCount === 0 && !validation.hasPtoConflict) {
        const confidence = 100 - (validation.newConflictCount * 20) - (validation.hasPtoConflict ? 30 : 0);
        suggestions.push({
          type: 'reassign',
          value: dev,
          description: `Reassign to ${dev}`,
          confidence,
          impact: {
            willResolve: true,
            resolvedConflicts: 1,
            mayCreateNew: false,
            newConflictCount: 0,
            willExtendRelease: false,
            extensionDays: 0,
            willReduceCapacity: false,
            capacityImpact: validation.capacityImpact
          }
        });
      }
    }
  }

  // Test shift options - find the MINIMUM shift that resolves
  if (conflict.suggestions?.possibleShiftDays) {
    for (const days of conflict.suggestions.possibleShiftDays.sort((a, b) => a - b)) {
      const validation = validateResolution(
        { type: 'shift', ticketId: conflict.ticketId, value: days },
        currentTicket,
        allTickets,
        teamMembers
      );

      // Only consider if it resolves and doesn't create many new conflicts
      if (validation.willResolve && validation.newConflictCount <= 1) {
        const newStartDate = new Date(currentTicket.startDate);
        newStartDate.setDate(newStartDate.getDate() + days);
        
        const confidence = 100 - (validation.newConflictCount * 20);
        const willExtendRelease = days > 0; // Positive shift may extend release
        
        suggestions.push({
          type: 'shift',
          value: days,
          description: `Move to start ${newStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          confidence,
          impact: {
            willResolve: true,
            resolvedConflicts: 1,
            mayCreateNew: validation.newConflictCount > 0,
            newConflictCount: validation.newConflictCount,
            willExtendRelease,
            extensionDays: willExtendRelease ? days : 0,
            willReduceCapacity: false,
            capacityImpact: 0
          }
        });
        
        // Take the first (minimum) shift that works
        break;
      }
    }
  }

  // Test sprint move options
  if (conflict.suggestions?.possibleSprintMoves) {
    for (const sprintId of conflict.suggestions.possibleSprintMoves) {
      const validation = validateResolution(
        { type: 'sprint-move', ticketId: conflict.ticketId, value: sprintId },
        currentTicket,
        allTickets,
        teamMembers
      );

      if (validation.willResolve && validation.newConflictCount === 0) {
        const confidence = 95 - (validation.newConflictCount * 20);
        suggestions.push({
          type: 'sprint-move',
          value: sprintId,
          description: 'Move to next sprint',
          confidence,
          impact: {
            willResolve: true,
            resolvedConflicts: 1,
            mayCreateNew: false,
            newConflictCount: 0,
            willExtendRelease: false,
            extensionDays: 0,
            willReduceCapacity: true,
            capacityImpact: currentTicket.effortDays || currentTicket.storyPoints || 1
          }
        });
        break;
      }
    }
  }

  // Return the best suggestion (highest confidence)
  if (suggestions.length === 0) {
    return null;
  }

  suggestions.sort((a, b) => b.confidence - a.confidence);
  return suggestions[0];
}

// ===========================
// Dev Window Resolution Logic
// ===========================

export interface DevWindowCapacityAnalysis {
  developers: {
    name: string;
    totalCapacity: number;
    allocatedDays: number;
    availableDays: number;
    utilization: number; // percentage
    freeSlots: {
      start: Date;
      end: Date;
      days: number;
    }[];
    canAccommodate: boolean;
  }[];
  totalAvailable: number;
  overallUtilization: number;
}

export interface DevWindowFix {
  type: 'reassign' | 'reschedule' | 'capacity-exhausted';
  developer?: string;
  newStartDate?: Date;
  newEndDate?: Date;
  confidence: number;
  description: string;
  impact: {
    createsNewConflicts: boolean;
    fitsInDevWindow: boolean;
    utilizationChange?: number;
  };
  alternatives?: {
    type: 'extend-dev-window' | 'move-to-backlog' | 'reduce-scope';
    label: string;
    impact: string;
    daysNeeded?: number;
  }[];
  capacityBreakdown?: {
    developer: string;
    utilization: number;
    freeSlots: number;
  }[];
}

/**
 * Helper function to check if ticket is in dev window
 */
function isTicketInDevWindow(ticket: Ticket, phases: Phase[]): boolean {
  const devPhases = phases.filter(p => p.allowsWork);
  
  if (devPhases.length === 0) return true;
  
  const ticketStart = new Date(ticket.startDate);
  ticketStart.setHours(0, 0, 0, 0);
  const ticketEnd = new Date(ticket.endDate);
  ticketEnd.setHours(0, 0, 0, 0);
  
  return devPhases.some(phase => {
    const phaseStart = new Date(phase.startDate);
    phaseStart.setHours(0, 0, 0, 0);
    const phaseEnd = new Date(phase.endDate);
    phaseEnd.setHours(0, 0, 0, 0);
    
    return ticketStart >= phaseStart && ticketEnd <= phaseEnd;
  });
}

/**
 * Analyzes dev window capacity and finds free slots for each developer
 */
export function analyzeDevWindowCapacity(
  spilloverTicket: Ticket,
  devPhases: Phase[],
  allTickets: Ticket[],
  teamMembers: any[]
): DevWindowCapacityAnalysis {
  const ticketDays = spilloverTicket.effortDays || spilloverTicket.storyPoints || 1;
  
  // Get dev window date range
  const devWindowStart = new Date(Math.min(...devPhases.map(p => new Date(p.startDate).getTime())));
  const devWindowEnd = new Date(Math.max(...devPhases.map(p => new Date(p.endDate).getTime())));
  
  // Calculate total dev window days
  const totalDevWindowDays = Math.ceil((devWindowEnd.getTime() - devWindowStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const developers = teamMembers.map(member => {
    // Get tickets assigned to this developer in dev window
    const memberTickets = allTickets.filter(t => 
      t.assignedTo === member.name &&
      t.id !== spilloverTicket.id && // Exclude the spillover ticket itself
      isTicketInDevWindow(t, devPhases)
    );
    
    // Calculate allocated days
    const allocatedDays = memberTickets.reduce((sum, t) => sum + (t.effortDays || t.storyPoints || 1), 0);
    
    // Find free slots
    const freeSlots: { start: Date; end: Date; days: number }[] = [];
    
    // Sort member tickets by start date
    const sortedTickets = [...memberTickets].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    
    // Check for gaps
    let currentDate = new Date(devWindowStart);
    
    for (const ticket of sortedTickets) {
      const ticketStart = new Date(ticket.startDate);
      
      if (ticketStart.getTime() > currentDate.getTime()) {
        const gapDays = Math.ceil((ticketStart.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (gapDays > 0) {
          freeSlots.push({
            start: new Date(currentDate),
            end: new Date(ticketStart.getTime() - 1000 * 60 * 60 * 24),
            days: gapDays
          });
        }
      }
      
      currentDate = new Date(new Date(ticket.endDate).getTime() + 1000 * 60 * 60 * 24);
    }
    
    // Check for gap at the end
    if (currentDate.getTime() < devWindowEnd.getTime()) {
      const gapDays = Math.ceil((devWindowEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (gapDays > 0) {
        freeSlots.push({
          start: new Date(currentDate),
          end: new Date(devWindowEnd),
          days: gapDays
        });
      }
    }
    
    const availableDays = freeSlots.reduce((sum, slot) => sum + slot.days, 0);
    const utilization = (allocatedDays / totalDevWindowDays) * 100;
    const canAccommodate = freeSlots.some(slot => slot.days >= ticketDays);
    
    return {
      name: member.name,
      totalCapacity: totalDevWindowDays,
      allocatedDays,
      availableDays,
      utilization,
      freeSlots,
      canAccommodate
    };
  });
  
  const totalAvailable = developers.reduce((sum, dev) => sum + dev.availableDays, 0);
  const totalAllocated = developers.reduce((sum, dev) => sum + dev.allocatedDays, 0);
  const overallUtilization = (totalAllocated / (totalDevWindowDays * developers.length)) * 100;
  
  return {
    developers,
    totalAvailable,
    overallUtilization
  };
}

/**
 * Finds a conflict-free time slot for a developer in the dev window
 */
export function findConflictFreeSlot(
  developerName: string,
  ticketDays: number,
  devPhases: Phase[],
  allTickets: Ticket[],
  spilloverTicketId: string
): { start: Date; end: Date } | null {
  const devWindowStart = new Date(Math.min(...devPhases.map(p => new Date(p.startDate).getTime())));
  const devWindowEnd = new Date(Math.max(...devPhases.map(p => new Date(p.endDate).getTime())));
  
  // Get developer's tickets in dev window (excluding the spillover ticket itself)
  const devTickets = allTickets
    .filter(t => 
      t.assignedTo === developerName && 
      t.id !== spilloverTicketId &&
      isTicketInDevWindow(t, devPhases)
    )
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  // Check gaps between tickets
  let currentDate = new Date(devWindowStart);
  
  for (const ticket of devTickets) {
    const ticketStart = new Date(ticket.startDate);
    const gapDays = Math.ceil((ticketStart.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (gapDays >= ticketDays) {
      // Found a gap - return slot
      const slotEnd = new Date(currentDate);
      slotEnd.setDate(slotEnd.getDate() + ticketDays - 1);
      
      // Verify slot is within dev window phase boundaries
      if (slotEnd <= devWindowEnd) {
        return { start: new Date(currentDate), end: slotEnd };
      }
    }
    
    currentDate = new Date(new Date(ticket.endDate).getTime() + 1000 * 60 * 60 * 24);
  }
  
  // Check gap at the end
  const remainingDays = Math.ceil((devWindowEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (remainingDays >= ticketDays) {
    const slotEnd = new Date(currentDate);
    slotEnd.setDate(slotEnd.getDate() + ticketDays - 1);
    return { start: new Date(currentDate), end: slotEnd };
  }
  
  return null;
}

/**
 * Gets the best resolution for a dev window spillover, or returns capacity-exhausted alternatives
 */
export function getBestDevWindowFix(
  spilloverTicket: Ticket,
  devPhases: Phase[],
  allTickets: Ticket[],
  teamMembers: any[]
): DevWindowFix {
  console.log(`[getBestDevWindowFix] Analyzing spillover ticket: ${spilloverTicket.id} (${spilloverTicket.title})`);
  
  // Defensive check: Ensure we have dev phases
  if (!devPhases || devPhases.length === 0) {
    console.error('[getBestDevWindowFix] No dev phases provided - cannot compute fix');
    return {
      type: 'capacity-exhausted',
      confidence: 0,
      description: 'Cannot analyze: No Dev Window phases defined for this release',
      impact: { createsNewConflicts: false, fitsInDevWindow: false },
      alternatives: [{
        type: 'move-to-backlog',
        label: 'Move to Backlog',
        impact: 'Remove from current release'
      }],
      capacityBreakdown: []
    };
  }
  
  const ticketDays = spilloverTicket.effortDays || spilloverTicket.storyPoints || 1;
  
  // Analyze capacity
  const analysis = analyzeDevWindowCapacity(spilloverTicket, devPhases, allTickets, teamMembers);
  
  // Strategy 1: Try reassignment to another developer with free capacity
  const devsWithCapacity = analysis.developers
    .filter(dev => dev.name !== spilloverTicket.assignedTo && dev.canAccommodate)
    .sort((a, b) => a.utilization - b.utilization); // Prefer less utilized devs
  
  for (const dev of devsWithCapacity) {
    const slot = findConflictFreeSlot(dev.name, ticketDays, devPhases, allTickets, spilloverTicket.id);
    
    if (slot) {
      // Validate this won't create new conflicts
      const testTicket = { ...spilloverTicket, assignedTo: dev.name, startDate: slot.start.toISOString(), endDate: slot.end.toISOString() };
      const wouldCreateConflicts = allTickets.some(t => {
        if (t.id === spilloverTicket.id) return false;
        if (t.assignedTo !== dev.name) return false;
        
        const tStart = new Date(t.startDate);
        const tEnd = new Date(t.endDate);
        return (slot.start <= tEnd && slot.end >= tStart);
      });
      
      if (!wouldCreateConflicts) {
        return {
          type: 'reassign',
          developer: dev.name,
          newStartDate: slot.start,
          newEndDate: slot.end,
          confidence: 95,
          description: `Reassign to ${dev.name} (${slot.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${slot.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} free)`,
          impact: {
            createsNewConflicts: false,
            fitsInDevWindow: true,
            utilizationChange: dev.utilization
          }
        };
      }
    }
  }
  
  // Strategy 2: Try reschedule same developer to free slot
  const currentDev = analysis.developers.find(dev => dev.name === spilloverTicket.assignedTo);
  if (currentDev) {
    const slot = findConflictFreeSlot(currentDev.name, ticketDays, devPhases, allTickets, spilloverTicket.id);
    
    if (slot) {
      return {
        type: 'reschedule',
        developer: currentDev.name,
        newStartDate: slot.start,
        newEndDate: slot.end,
        confidence: 90,
        description: `Reschedule to ${slot.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${slot.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        impact: {
          createsNewConflicts: false,
          fitsInDevWindow: true,
          utilizationChange: currentDev.utilization
        }
      };
    }
  }
  
  // Strategy 3: No safe solution - Be honest about capacity exhaustion
  const daysNeeded = ticketDays;
  const alternatives: DevWindowFix['alternatives'] = [
    {
      type: 'extend-dev-window',
      label: `Extend Dev Window by ${daysNeeded} days`,
      impact: `Delays Testing → Go-Live by ${daysNeeded} days`,
      daysNeeded
    },
    {
      type: 'move-to-backlog',
      label: 'Move to Next Release',
      impact: 'Reduces current release scope'
    },
    {
      type: 'reduce-scope',
      label: 'Reduce Ticket Scope',
      impact: `Break into smaller tasks or reduce effort from ${ticketDays}d`
    }
  ];
  
  return {
    type: 'capacity-exhausted',
    confidence: 0,
    description: `Cannot accommodate - Dev Window at capacity (${Math.round(analysis.overallUtilization)}% utilization)`,
    impact: {
      createsNewConflicts: false,
      fitsInDevWindow: false
    },
    alternatives,
    capacityBreakdown: analysis.developers.map(dev => ({
      developer: dev.name,
      utilization: Math.round(dev.utilization),
      freeSlots: dev.freeSlots.length
    }))
  };
}
