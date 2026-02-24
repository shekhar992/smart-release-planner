/**
 * Ticket Dependency Utilities
 * 
 * Helper functions for calculating ticket status based on dependencies
 * and managing dependency relationships.
 */

import { Ticket } from '../data/mockData';

export type TicketStatus = 'ready' | 'blocked' | 'in-progress' | 'completed';

/**
 * Calculate if a ticket is blocked by any dependencies
 */
export function isTicketBlocked(ticket: Ticket, allTickets: Ticket[]): boolean {
  if (!ticket.dependencies?.blockedBy || ticket.dependencies.blockedBy.length === 0) {
    return false;
  }

  // Check if any blocking tickets are not completed
  return ticket.dependencies.blockedBy.some(blockerId => {
    const blocker = allTickets.find(t => t.id === blockerId);
    return blocker && blocker.status !== 'completed';
  });
}

/**
 * Get the current status of a ticket based on its actual status and dependencies
 */
export function getTicketDependencyStatus(ticket: Ticket, allTickets: Ticket[]): TicketStatus {
  // If completed, always return completed
  if (ticket.status === 'completed') {
    return 'completed';
  }

  // If in progress, always return in-progress
  if (ticket.status === 'in-progress') {
    return 'in-progress';
  }

  // Check if blocked by dependencies
  if (isTicketBlocked(ticket, allTickets)) {
    return 'blocked';
  }

  // Otherwise ready to start
  return 'ready';
}

/**
 * Count how many tickets this ticket blocks
 */
export function countBlockedTickets(ticket: Ticket, allTickets: Ticket[]): number {
  return allTickets.filter(t => 
    t.dependencies?.blockedBy?.includes(ticket.id)
  ).length;
}

/**
 * Get all tickets that are blocked by this ticket
 */
export function getBlockedTickets(ticket: Ticket, allTickets: Ticket[]): Ticket[] {
  return allTickets.filter(t => 
    t.dependencies?.blockedBy?.includes(ticket.id)
  );
}

/**
 * Get all tickets that are blocking this ticket
 */
export function getBlockingTickets(ticket: Ticket, allTickets: Ticket[]): Ticket[] {
  if (!ticket.dependencies?.blockedBy) {
    return [];
  }

  return allTickets.filter(t => 
    ticket.dependencies?.blockedBy?.includes(t.id)
  );
}

/**
 * Calculate the blocks array for all tickets (reverse edges)
 * This updates the dependencies.blocks field based on other tickets' blockedBy arrays
 */
export function calculateReverseEdges(tickets: Ticket[]): Ticket[] {
  return tickets.map(ticket => ({
    ...ticket,
    dependencies: {
      blockedBy: ticket.dependencies?.blockedBy || [],
      blocks: tickets
        .filter(t => t.dependencies?.blockedBy?.includes(ticket.id))
        .map(t => t.id)
    }
  }));
}

/**
 * Detect circular dependencies
 * Returns true if there's a cycle in the dependency graph
 */
export function hasCircularDependency(tickets: Ticket[]): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(ticketId: string): boolean {
    if (recursionStack.has(ticketId)) {
      return true; // Cycle detected
    }

    if (visited.has(ticketId)) {
      return false; // Already checked this path
    }

    visited.add(ticketId);
    recursionStack.add(ticketId);

    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket?.dependencies?.blockedBy) {
      for (const blockerId of ticket.dependencies.blockedBy) {
        if (hasCycle(blockerId)) {
          return true;
        }
      }
    }

    recursionStack.delete(ticketId);
    return false;
  }

  for (const ticket of tickets) {
    if (hasCycle(ticket.id)) {
      return true;
    }
  }

  return false;
}

/**
 * Get status dot color based on ticket status
 */
export function getStatusDotColor(status: TicketStatus): string {
  switch (status) {
    case 'ready':
      return '#10B981'; // Green
    case 'blocked':
      return '#F59E0B'; // Orange
    case 'in-progress':
      return '#3B82F6'; // Blue
    case 'completed':
      return '#6B7280'; // Gray
    default:
      return '#6B7280';
  }
}

/**
 * Get status label for display
 */
export function getStatusLabel(status: TicketStatus): string {
  switch (status) {
    case 'ready':
      return 'Ready to Start';
    case 'blocked':
      return 'Blocked by Dependencies';
    case 'in-progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    default:
      return 'Unknown';
  }
}
