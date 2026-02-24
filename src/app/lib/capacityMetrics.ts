/**
 * Capacity Metrics: Calculate release health metrics
 * 
 * Provides calculations for capacity utilization, timeline status,
 * and team velocity for the Release Health Header dashboard.
 */

import { Ticket, Sprint, TeamMember, Release } from '../data/mockData';
import { isWeekend, differenceInDays, startOfDay } from 'date-fns';

/**
 * Calculate capacity utilization percentage
 * 
 * Compares total effort days allocated vs total available capacity
 * Accounts for: team size, velocity multipliers, weekends, holidays, PTO
 */
export interface CapacityUtilization {
  percentage: number; // 0-100+
  allocatedDays: number;
  availableCapacityDays: number;
  status: 'under' | 'optimal' | 'over'; // <70% | 70-95% | >95%
}

export function calculateCapacityUtilization(
  tickets: Ticket[],
  _sprints: Sprint[] | undefined,
  teamMembers: TeamMember[],
  holidays: Date[],
  release: Release
): CapacityUtilization {
  
  // Calculate total effort allocated (sum of all ticket effort days)
  const allocatedDays = tickets.reduce((sum, ticket) => {
    const effortDays = ticket.effortDays || ticket.storyPoints || 0;
    return sum + effortDays;
  }, 0);

  // Calculate available capacity
  // Count working days in release window
  const releaseStart = startOfDay(release.startDate);
  const releaseEnd = startOfDay(release.endDate);
  const totalCalendarDays = differenceInDays(releaseEnd, releaseStart) + 1;
  
  let workingDays = 0;
  for (let i = 0; i < totalCalendarDays; i++) {
    const current = new Date(releaseStart);
    current.setDate(current.getDate() + i);
    
    if (!isWeekend(current)) {
      // Check if not a holiday
      const isHoliday = holidays.some(h => {
        const hDate = startOfDay(new Date(h));
        return hDate.getTime() === current.getTime();
      });
      
      if (!isHoliday) {
        workingDays++;
      }
    }
  }

  // Calculate team capacity (developers only, with velocity multipliers)
  const developers = teamMembers.filter(tm => tm.role === 'Developer');
  const totalVelocity = developers.reduce((sum, dev) => {
    return sum + (dev.velocityMultiplier || 1.0);
  }, 0);
  
  // Available capacity = working days × total team velocity
  const availableCapacityDays = workingDays * totalVelocity;

  // Calculate percentage
  const percentage = availableCapacityDays > 0 
    ? Math.round((allocatedDays / availableCapacityDays) * 100)
    : 0;

  // Determine status
  let status: 'under' | 'optimal' | 'over';
  if (percentage < 70) {
    status = 'under';
  } else if (percentage <= 95) {
    status = 'optimal';
  } else {
    status = 'over';
  }

  return {
    percentage,
    allocatedDays: Math.round(allocatedDays),
    availableCapacityDays: Math.round(availableCapacityDays),
    status
  };
}

/**
 * Calculate timeline status based on current date vs release dates
 */
export interface TimelineStatus {
  status: 'upcoming' | 'active' | 'at-risk' | 'overdue' | 'completed';
  daysRemaining: number | null;
  progressPercentage: number; // 0-100
  message: string;
}

export function calculateTimelineStatus(
  release: Release,
  tickets: Ticket[]
): TimelineStatus {
  const now = startOfDay(new Date());
  const releaseStart = startOfDay(release.startDate);
  const releaseEnd = startOfDay(release.endDate);
  
  const totalDays = differenceInDays(releaseEnd, releaseStart) + 1;
  const daysSinceStart = differenceInDays(now, releaseStart);
  const daysRemaining = differenceInDays(releaseEnd, now);
  
  // Calculate progress based on completed tickets
  const totalTickets = tickets.length;
  const completedTickets = tickets.filter(t => t.status === 'completed').length;
  const progressPercentage = totalTickets > 0 
    ? Math.round((completedTickets / totalTickets) * 100)
    : 0;

  // Determine status
  if (now < releaseStart) {
    return {
      status: 'upcoming',
      daysRemaining,
      progressPercentage: 0,
      message: `Starts in ${Math.abs(daysRemaining)} days`
    };
  }
  
  if (now > releaseEnd) {
    if (progressPercentage === 100) {
      return {
        status: 'completed',
        daysRemaining: 0,
        progressPercentage: 100,
        message: 'Release completed'
      };
    } else {
      return {
        status: 'overdue',
        daysRemaining: 0,
        progressPercentage,
        message: `${Math.abs(daysRemaining)} days overdue`
      };
    }
  }

  // Release is active
  const timeElapsedPercentage = (daysSinceStart / totalDays) * 100;
  
  // At risk if progress is significantly behind time elapsed
  if (progressPercentage < timeElapsedPercentage - 20) {
    return {
      status: 'at-risk',
      daysRemaining,
      progressPercentage,
      message: `${daysRemaining} days remaining (behind schedule)`
    };
  }

  return {
    status: 'active',
    daysRemaining,
    progressPercentage,
    message: `${daysRemaining} days remaining`
  };
}

/**
 * Calculate team velocity metrics
 */
export interface TeamVelocity {
  averageVelocity: number; // Average multiplier across team
  totalCapacity: number; // Sum of all velocity multipliers
  developerCount: number;
  experience: 'junior' | 'mixed' | 'senior'; // Team experience level
}

export function calculateTeamVelocity(teamMembers: TeamMember[]): TeamVelocity {
  const developers = teamMembers.filter(tm => tm.role === 'Developer');
  const developerCount = developers.length;
  
  if (developerCount === 0) {
    return {
      averageVelocity: 0,
      totalCapacity: 0,
      developerCount: 0,
      experience: 'mixed'
    };
  }

  const totalCapacity = developers.reduce((sum, dev) => {
    return sum + (dev.velocityMultiplier || 1.0);
  }, 0);

  const averageVelocity = totalCapacity / developerCount;

  // Determine experience level based on average velocity
  let experience: 'junior' | 'mixed' | 'senior';
  
  if (averageVelocity < 0.85) {
    experience = 'junior';
  } else if (averageVelocity > 1.15) {
    experience = 'senior';
  } else {
    experience = 'mixed';
  }

  return {
    averageVelocity: Math.round(averageVelocity * 100) / 100,
    totalCapacity: Math.round(totalCapacity * 10) / 10,
    developerCount,
    experience
  };
}

/**
 * Calculate conflict severity score
 */
export interface ConflictMetrics {
  totalConflicts: number;
  criticalConflicts: number;
  warningConflicts: number;
  overallSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export function calculateConflictMetrics(
  enhancedConflicts: Array<{ type: string; severity: 'critical' | 'warning' | 'info' }>
): ConflictMetrics {
  const totalConflicts = enhancedConflicts.length;
  const criticalConflicts = enhancedConflicts.filter(c => c.severity === 'critical').length;
  const warningConflicts = enhancedConflicts.filter(c => c.severity === 'warning').length;

  // Determine overall severity
  let overallSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  if (totalConflicts === 0) {
    overallSeverity = 'none';
  } else if (criticalConflicts > 5) {
    overallSeverity = 'critical';
  } else if (criticalConflicts > 0) {
    overallSeverity = 'high';
  } else if (warningConflicts > 10) {
    overallSeverity = 'medium';
  } else {
    overallSeverity = 'low';
  }

  return {
    totalConflicts,
    criticalConflicts,
    warningConflicts,
    overallSeverity
  };
}
