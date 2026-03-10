/**
 * Auto-Assignment Service
 * 
 * Centralized intelligence layer for automatically assigning tickets to team members.
 * Used across all ticket entry flows: PRD Import, Bulk Import, Auto Release.
 * 
 * Core Logic:
 * 1. Classify ticket role (if not provided)
 * 2. Find matching team members by role
 * 3. Assign using round-robin distribution
 * 4. Smart fallbacks for edge cases
 */

import { Ticket, TeamMember } from '../data/mockData';

export type RequiredRole = 'Frontend' | 'Backend' | 'Fullstack' | 'QA' | 'Designer' | 'iOS' | 'Android' | 'DataEngineer';

/**
 * Classify ticket role based on title and description
 * 
 * Uses keyword matching to determine the best-fit role.
 * This is a fallback for CSV imports without explicit role classification.
 */
export function classifyTicketRole(ticket: { title: string; description?: string; requiredRole?: string }): RequiredRole {
  // If role is already provided, validate and return it
  if (ticket.requiredRole) {
    const validRoles: RequiredRole[] = ['Frontend', 'Backend', 'Fullstack', 'QA', 'Designer', 'iOS', 'Android', 'DataEngineer'];
    if (validRoles.includes(ticket.requiredRole as RequiredRole)) {
      return ticket.requiredRole as RequiredRole;
    }
  }

  const text = `${ticket.title} ${ticket.description || ''}`.toLowerCase();
  
  // Frontend keywords (high confidence)
  if (/\b(ui|ux|component|page|button|form|modal|css|html|react|vue|angular|tailwind|sass|responsive|layout|navigation|menu|dashboard|chart|table|grid|animation|transition|theme|design system)\b/i.test(text)) {
    return 'Frontend';
  }
  
  // Backend keywords (high confidence)
  if (/\b(api|endpoint|database|server|auth|authentication|authorization|migration|query|redis|postgres|mysql|mongodb|cache|webhook|queue|job|cron|lambda|function|service|microservice|gateway|rest|graphql|jwt|token|session)\b/i.test(text)) {
    return 'Backend';
  }
  
  // iOS keywords
  if (/\b(ios|swift|swiftui|uikit|xcode|testflight|app store)\b/i.test(text)) {
    return 'iOS';
  }
  
  // Android keywords
  if (/\b(android|kotlin|jetpack|compose|gradle|play store)\b/i.test(text)) {
    return 'Android';
  }
  
  // QA/Testing keywords
  if (/\b(test|testing|qa|quality|automation|playwright|cypress|jest|selenium|e2e|integration test|unit test|coverage|bug|defect|regression)\b/i.test(text)) {
    return 'QA';
  }
  
  // Designer keywords
  if (/\b(design|wireframe|mockup|figma|sketch|prototype|ux research|user research|usability|persona|journey map|information architecture|visual design|brand|color palette|typography|icon)\b/i.test(text)) {
    return 'Designer';
  }
  
  // Data Engineer keywords
  if (/\b(etl|pipeline|data warehouse|spark|airflow|kafka|stream|batch|data lake|bigquery|redshift|snowflake|dbt)\b/i.test(text)) {
    return 'DataEngineer';
  }
  
  // Default to Fullstack (can handle both frontend and backend)
  return 'Fullstack';
}

/**
 * Auto-assign a single ticket to a team member
 * 
 * Uses round-robin distribution within role groups.
 * Maintains fair distribution across team members.
 */
export function autoAssignTicket(
  ticket: Ticket,
  teamMembers: TeamMember[],
  assignmentIndex: Record<string, number> = {}
): { ticket: Ticket; assignmentIndex: Record<string, number> } {
  
  // If already assigned and valid, keep it
  if (ticket.assignedTo && ticket.assignedTo !== '' && ticket.assignedTo !== 'Unassigned') {
    const isValid = teamMembers.some(m => m.name === ticket.assignedTo);
    if (isValid) {
      return { ticket, assignmentIndex };
    }
  }

  // No team members available
  if (teamMembers.length === 0) {
    return { 
      ticket: { ...ticket, assignedTo: 'Unassigned' }, 
      assignmentIndex 
    };
  }

  // Determine required role
  const requiredRole = ticket.requiredRole || classifyTicketRole(ticket);
  
  // Find team members with matching role
  let matchingMembers = teamMembers.filter(m => m.role === requiredRole);
  
  // Fallback 1: Try Fullstack/Developer if no exact match
  if (matchingMembers.length === 0) {
    matchingMembers = teamMembers.filter(
      m => m.role === 'Fullstack' || m.role === 'Developer'
    );
  }
  
  // Fallback 2: Use any team member
  if (matchingMembers.length === 0) {
    matchingMembers = teamMembers;
  }
  
  // Round-robin assignment
  const roleKey = requiredRole;
  const currentIndex = assignmentIndex[roleKey] || 0;
  const assignedMember = matchingMembers[currentIndex % matchingMembers.length];
  
  // Update index for next assignment
  const updatedIndex = { ...assignmentIndex };
  updatedIndex[roleKey] = currentIndex + 1;
  
  return {
    ticket: {
      ...ticket,
      requiredRole,
      assignedTo: assignedMember.name
    },
    assignmentIndex: updatedIndex
  };
}

/**
 * Auto-assign multiple tickets to team members
 * 
 * Batch operation that maintains round-robin state across all tickets.
 * Ensures fair distribution even in large batches.
 */
export function autoAssignTickets(
  tickets: Ticket[],
  teamMembers: TeamMember[]
): Ticket[] {
  let assignmentIndex: Record<string, number> = {};
  
  return tickets.map(ticket => {
    const result = autoAssignTicket(ticket, teamMembers, assignmentIndex);
    assignmentIndex = result.assignmentIndex;
    return result.ticket;
  });
}

/**
 * Validate and fix ticket assignments
 * 
 * Checks if assigned team members exist in roster.
 * Auto-assigns if assignment is missing or invalid.
 */
export function validateAndFixAssignments(
  tickets: Ticket[],
  teamMembers: TeamMember[]
): Ticket[] {
  const teamMemberNames = new Set(teamMembers.map(m => m.name));
  
  return tickets.map(ticket => {
    // Valid assignment - keep it
    if (ticket.assignedTo && 
        ticket.assignedTo !== '' && 
        ticket.assignedTo !== 'Unassigned' &&
        teamMemberNames.has(ticket.assignedTo)) {
      return ticket;
    }
    
    // Invalid or missing - auto-assign
    const result = autoAssignTicket(ticket, teamMembers);
    return result.ticket;
  });
}
