/**
 * Capacity calculation utilities
 * 
 * Pure functions for computing sprint capacity based on team size,
 * working days, holidays, and PTO.
 */

import { calculateWorkingDays, countPtoDaysInRange } from './dateUtils';

/**
 * Input parameters for capacity calculation
 */
export interface CapacityInput {
  startDate: Date;
  endDate: Date;
  numberOfDevelopers: number;
  holidays: Date[];
  ptoDates: Date[];
}

/**
 * Detailed capacity breakdown for a sprint
 */
export interface CapacityResult {
  workingDays: number; // Working days (excludes weekends + holidays)
  ptoDays: number; // PTO days within sprint
  availableDays: number; // Working days minus PTO
  capacityDays: number; // Total team capacity (availableDays × numberOfDevelopers)
}

/**
 * Calculate sprint capacity
 * 
 * Formula:
 * 1. workingDays = count weekdays excluding holidays
 * 2. ptoDays = count PTO dates within sprint (weekdays only)
 * 3. availableDays = workingDays - ptoDays
 * 4. capacityDays = availableDays × numberOfDevelopers
 * 
 * @param input - Configuration with dates, team size, holidays, PTO
 * @returns Detailed capacity breakdown
 */
export function calculateSprintCapacity(input: CapacityInput): CapacityResult {
  const { startDate, endDate, numberOfDevelopers, holidays, ptoDates } = input;
  
  // Edge case: invalid developer count
  if (numberOfDevelopers <= 0) {
    return {
      workingDays: 0,
      ptoDays: 0,
      availableDays: 0,
      capacityDays: 0,
    };
  }
  
  // Step 1: Calculate base working days (exclude weekends + holidays)
  const workingDays = calculateWorkingDays(startDate, endDate, holidays);
  
  // Step 2: Count PTO days within sprint window (weekdays only, excluding holidays)
  const ptoDays = countPtoDaysInRange(startDate, endDate, ptoDates, holidays);
  
  // Step 3: Calculate available days per developer
  // Note: PTO is aggregated across team, so we subtract once
  const availableDays = Math.max(0, workingDays - ptoDays);
  
  // Step 4: Multiply by team size to get total capacity
  const capacityDays = availableDays * numberOfDevelopers;
  
  return {
    workingDays,
    ptoDays,
    availableDays,
    capacityDays,
  };
}

/**
 * Calculate total capacity across multiple sprints
 * 
 * @param capacities - Array of capacity results
 * @returns Summed capacity
 */
export function sumCapacities(capacities: CapacityResult[]): CapacityResult {
  return capacities.reduce(
    (sum, cap) => ({
      workingDays: sum.workingDays + cap.workingDays,
      ptoDays: sum.ptoDays + cap.ptoDays,
      availableDays: sum.availableDays + cap.availableDays,
      capacityDays: sum.capacityDays + cap.capacityDays,
    }),
    {
      workingDays: 0,
      ptoDays: 0,
      availableDays: 0,
      capacityDays: 0,
    }
  );
}
