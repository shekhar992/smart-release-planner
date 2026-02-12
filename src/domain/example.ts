/**
 * Example usage of the Release Feasibility Engine
 * 
 * This demonstrates how to use the domain layer to build a release plan.
 * Remove this file in production or move to a /examples folder.
 */

import {
  buildReleasePlan,
  getReleaseSummary,
  getSprintUtilization,
  type TicketInput,
  type ReleaseConfig,
} from './index';

// Example: Q1 2026 Release Planning
export function exampleUsage() {
  // Define tickets (backlog)
  const tickets: TicketInput[] = [
    { id: 'T-001', title: 'User authentication', epic: 'Auth', effortDays: 5, priority: 1 },
    { id: 'T-002', title: 'Dashboard UI', epic: 'Dashboard', effortDays: 8, priority: 1 },
    { id: 'T-003', title: 'API integration', epic: 'Backend', effortDays: 10, priority: 2 },
    { id: 'T-004', title: 'Unit tests', epic: 'Testing', effortDays: 3, priority: 3 },
    { id: 'T-005', title: 'Documentation', epic: 'Docs', effortDays: 2, priority: 4 },
    { id: 'T-006', title: 'Performance optimization', epic: 'Backend', effortDays: 7, priority: 2 },
  ];
  
  // Define release configuration
  const config: ReleaseConfig = {
    releaseStart: new Date('2026-03-01'),
    releaseEnd: new Date('2026-03-31'),
    sprintLengthDays: 14, // 2-week sprints
    numberOfDevelopers: 3,
    holidays: [
      new Date('2026-03-17'), // St. Patrick's Day
    ],
    ptoDates: [
      new Date('2026-03-09'), // John's PTO
      new Date('2026-03-10'), // Sarah's PTO
      new Date('2026-03-23'), // Team PTO
    ],
  };
  
  // Build the plan
  const plan = buildReleasePlan(tickets, config);
  
  // Get summary
  const summary = getReleaseSummary(plan);
  
  console.log('=== Release Plan Summary ===');
  console.log(`Total Sprints: ${summary.totalSprints}`);
  console.log(`Total Tickets Placed: ${summary.totalTicketsPlaced}`);
  console.log(`Overflow Tickets: ${summary.overflowCount}`);
  console.log(`Total Backlog: ${summary.totalBacklogDays} days`);
  console.log(`Total Capacity: ${summary.totalCapacityDays} days`);
  console.log(`Feasibility: ${summary.feasiblePercentage}%`);
  console.log(`Utilization: ${summary.utilizationPercentage}%`);
  console.log(`Is Feasible: ${summary.isFeasible ? 'YES' : 'NO'}`);
  console.log(`Capacity Remaining: ${summary.capacityRemaining} days`);
  
  // Per-sprint breakdown
  console.log('\n=== Sprint Breakdown ===');
  plan.sprints.forEach((sprint) => {
    const util = getSprintUtilization(sprint);
    console.log(`\n${sprint.name} (${sprint.startDate.toLocaleDateString()} - ${sprint.endDate.toLocaleDateString()})`);
    console.log(`  Capacity: ${sprint.capacityDays} days`);
    console.log(`  Allocated: ${sprint.allocatedDays} days`);
    console.log(`  Utilization: ${util.utilizationPercentage}%`);
    console.log(`  Tickets: ${util.ticketCount}`);
    sprint.tickets.forEach((ticket) => {
      console.log(`    - ${ticket.id}: ${ticket.title} (${ticket.effortDays} days, P${ticket.priority})`);
    });
  });
  
  // Overflow tickets
  if (plan.overflowTickets.length > 0) {
    console.log('\n=== Overflow (Not Planned) ===');
    plan.overflowTickets.forEach((ticket) => {
      console.log(`  - ${ticket.id}: ${ticket.title} (${ticket.effortDays} days, P${ticket.priority})`);
    });
  }
  
  return { plan, summary };
}

// Uncomment to run:
// exampleUsage();
