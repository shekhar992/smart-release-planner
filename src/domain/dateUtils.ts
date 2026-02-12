/**
 * Date utility functions for sprint planning
 * 
 * Pure functions with no side effects. All dates are normalized to startOfDay.
 */

import {
  startOfDay,
  addDays,
  isWeekend,
  isSameDay,
  min,
} from 'date-fns';

/**
 * Deduplicate holidays by day (removes duplicate dates)
 * 
 * @param holidays - Array of holiday dates (may contain duplicates)
 * @returns Deduplicated array of holidays
 */
function deduplicateHolidays(holidays: Date[]): Date[] {
  const seen = new Set<string>();
  return holidays.filter(holiday => {
    const key = startOfDay(holiday).toISOString().split('T')[0];
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Check if a date falls on a holiday
 */
export function isHoliday(date: Date, holidays: Date[]): boolean {
  const normalized = startOfDay(date);
  return holidays.some(holiday => isSameDay(startOfDay(holiday), normalized));
}

/**
 * Calculate working days between two dates (inclusive)
 * Excludes weekends and holidays
 * 
 * @param start - Start date (inclusive)
 * @param end - End date (inclusive)
 * @param holidays - Array of holiday dates
 * @returns Number of working days
 */
export function calculateWorkingDays(
  start: Date,
  end: Date,
  holidays: Date[]
): number {
  const startDay = startOfDay(start);
  const endDay = startOfDay(end);
  
  // Edge case: invalid date range
  if (startDay > endDay) {
    return 0;
  }
  
  // Deduplicate holidays once before calculation
  const uniqueHolidays = deduplicateHolidays(holidays);
  
  let workingDays = 0;
  let currentDate = startDay;
  
  // Iterate through each day
  while (currentDate <= endDay) {
    // Count if not weekend and not holiday
    if (!isWeekend(currentDate) && !isHoliday(currentDate, uniqueHolidays)) {
      workingDays++;
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return workingDays;
}

/**
 * Count PTO days that fall within a date range
 * Only counts valid working-day PTO (excludes weekends and holidays)
 * 
 * This prevents double-counting: if PTO falls on a holiday,
 * it should not reduce capacity since the holiday already did.
 * 
 * @param start - Range start date
 * @param end - Range end date
 * @param ptoDates - Array of aggregated PTO dates
 * @param holidays - Array of holiday dates to exclude
 * @returns Count of PTO days within range (working days only)
 */
export function countPtoDaysInRange(
  start: Date,
  end: Date,
  ptoDates: Date[],
  holidays: Date[]
): number {
  const startDay = startOfDay(start);
  const endDay = startOfDay(end);
  
  // Deduplicate holidays once before calculation
  const uniqueHolidays = deduplicateHolidays(holidays);
  
  return ptoDates.filter(ptoDate => {
    const pto = startOfDay(ptoDate);
    // Check if within range, not a weekend, and not a holiday
    return pto >= startDay && pto <= endDay && !isWeekend(pto) && !isHoliday(pto, uniqueHolidays);
  }).length;
}

/**
 * Generate sprint periods within release window
 * Sprints are sequential with no gaps
 * 
 * @param releaseStart - Release start date
 * @param releaseEnd - Release end date
 * @param sprintLengthDays - Sprint length in calendar days
 * @returns Array of sprint date ranges
 */
export function generateSprintPeriods(
  releaseStart: Date,
  releaseEnd: Date,
  sprintLengthDays: number
): Array<{ startDate: Date; endDate: Date }> {
  const sprints: Array<{ startDate: Date; endDate: Date }> = [];
  
  const startDay = startOfDay(releaseStart);
  const endDay = startOfDay(releaseEnd);
  
  // Edge case: invalid date range
  if (startDay > endDay) {
    return [];
  }
  
  // Edge case: invalid sprint length
  if (sprintLengthDays <= 0) {
    return [];
  }
  
  let currentStart = startDay;
  
  while (currentStart <= endDay) {
    // Calculate sprint end (sprintLengthDays - 1 because inclusive)
    const potentialEnd = addDays(currentStart, sprintLengthDays - 1);
    
    // Cap at release end
    const actualEnd = min([potentialEnd, endDay]);
    
    sprints.push({
      startDate: currentStart,
      endDate: actualEnd,
    });
    
    // Move to next sprint (day after current sprint end)
    currentStart = addDays(actualEnd, 1);
    
    // Safety limit to prevent infinite loops
    if (sprints.length > 100) {
      console.warn('Sprint generation exceeded safety limit of 100 sprints');
      break;
    }
  }
  
  return sprints;
}
