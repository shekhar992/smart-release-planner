import { addDays, isWeekend, parseISO, startOfDay, format } from 'date-fns';
import type { Holiday } from '../data/mockData';

/**
 * Format a Date to YYYY-MM-DD string using LOCAL timezone.
 * This is the timezone-safe replacement for toISOString().split('T')[0]
 * which incorrectly shifts dates in timezones ahead of UTC (e.g. IST = UTC+5:30).
 *
 * @example
 * // In IST, startOfDay(new Date('2026-03-25')) = 2026-03-24T18:30:00.000Z
 * // toISOString().split('T')[0] => '2026-03-24' ❌ (wrong day!)
 * // toLocalDateString(...)        => '2026-03-25' ✅ (correct local day)
 */
export function toLocalDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse a YYYY-MM-DD string as a LOCAL date (not UTC).
 * 
 * WARNING: new Date("2026-03-16") creates a UTC date, which in IST becomes March 16 5:30 AM.
 * This function creates midnight in the LOCAL timezone.
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object at midnight local time
 * 
 * @example
 * // In IST (UTC+5:30):
 * new Date("2026-03-16")           // => 2026-03-16T00:00:00.000Z (March 16 5:30 AM IST) ❌
 * parseLocalDate("2026-03-16")     // => 2026-03-15T18:30:00.000Z (March 16 00:00 IST) ✅
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Convert Holiday objects to array of Date objects
 * Extracts all dates in each holiday range
 */
function extractHolidayDates(holidays: Holiday[]): Date[] {
  const dates: Date[] = [];
  for (const holiday of holidays) {
    let currentDate = startOfDay(new Date(holiday.startDate));
    const endDate = startOfDay(new Date(holiday.endDate));
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
  }
  
  // Debug logging
  if (dates.length > 0) {
    console.log('[dateUtils] Extracted holiday dates:', dates.map(d => format(d, 'yyyy-MM-dd')));
  }
  
  return dates;
}

/**
 * Check if a date is a holiday
 * Uses year/month/day comparison to avoid timezone precision issues
 */
function isHoliday(date: Date, holidays: Date[]): boolean {
  const checkDate = startOfDay(date);
  const targetYear = checkDate.getFullYear();
  const targetMonth = checkDate.getMonth();
  const targetDay = checkDate.getDate();
  
  const match = holidays.some(holiday => {
    const holidayDate = startOfDay(holiday);
    return (
      holidayDate.getFullYear() === targetYear &&
      holidayDate.getMonth() === targetMonth &&
      holidayDate.getDate() === targetDay
    );
  });
  
  // Debug logging for holiday matches
  if (match) {
    console.log(`[dateUtils] ✓ Holiday match found for ${format(checkDate, 'yyyy-MM-dd')}`);
  }
  
  return match;
}

/**
 * Calculate end date from start date and duration in working days
 * Skips weekends and holidays
 * 
 * @param startDate - Starting date
 * @param durationInDays - Number of working days (Mon-Fri, excluding holidays)
 * @param holidays - Optional array of Holiday objects to skip
 * @returns End date after adding working days
 */
export function calculateEndDate(startDate: Date, durationInDays: number, holidays: Holiday[] = []): Date {
  if (durationInDays <= 0) return startOfDay(startDate);
  
  const holidayDates = extractHolidayDates(holidays);
  let currentDate = startOfDay(startDate);
  let workingDaysAdded = 0;

  while (workingDaysAdded < durationInDays) {
    currentDate = addDays(currentDate, 1);
    // Skip weekends and holidays
    if (!isWeekend(currentDate) && !isHoliday(currentDate, holidayDates)) {
      workingDaysAdded++;
    }
  }

  return currentDate;
}

/**
 * Serialize date to ISO string for storage
 */
export function serializeDate(date: Date): string {
  return date.toISOString();
}

/**
 * Deserialize ISO string to Date
 */
export function deserializeDate(dateString: string): Date {
  return parseISO(dateString);
}

/**
 * Convert story points to duration in days
 */
export function storyPointsToDuration(storyPoints: number, conversionRate: number): number {
  return storyPoints * conversionRate;
}

/**
 * Calculate end date from start date and effort days (WORKING days)
 * Skips weekends and holidays to calculate realistic end dates
 * 
 * @param startDate - Starting date
 * @param effortDays - Number of working days (Mon-Fri, excluding holidays)
 * @param holidays - Optional array of Holiday objects to skip
 * @returns End date after adding working days
 * 
 * @example
 * // 8 working days starting Monday March 9 (skips weekend March 14-15)
 * calculateEndDateFromEffort(new Date('2026-03-09'), 8, [])
 * // Returns: Wednesday, March 18, 2026
 */
export function calculateEndDateFromEffort(startDate: Date, effortDays: number, holidays: Holiday[] = []): Date {
  if (effortDays <= 0) return startOfDay(startDate);
  
  // Debug logging
  console.log(`[dateUtils] calculateEndDateFromEffort: start=${format(startDate, 'yyyy-MM-dd')}, effortDays=${effortDays}, holidays=${holidays.length}`);
  
  const holidayDates = extractHolidayDates(holidays);
  
  // For single day tasks, return start date
  if (effortDays === 1) {
    // But verify start date is not a weekend/holiday
    const start = startOfDay(startDate);
    if (isWeekend(start) || isHoliday(start, holidayDates)) {
      // Move to next working day
      let nextWorkingDay = start;
      while (isWeekend(nextWorkingDay) || isHoliday(nextWorkingDay, holidayDates)) {
        nextWorkingDay = addDays(nextWorkingDay, 1);
      }
      return nextWorkingDay;
    }
    return start;
  }
  
  // Count working days from start date
  let currentDate = startOfDay(startDate);
  let workingDaysAdded = 0;
  
  // Start date counts as day 0 if it's a working day
  if (!isWeekend(currentDate) && !isHoliday(currentDate, holidayDates)) {
    workingDaysAdded = 1;
  }
  
  // Add remaining working days
  while (workingDaysAdded < effortDays) {
    currentDate = addDays(currentDate, 1);
    if (!isWeekend(currentDate) && !isHoliday(currentDate, holidayDates)) {
      workingDaysAdded++;
    }
  }

  console.log(`[dateUtils] calculateEndDateFromEffort result: ${format(currentDate, 'yyyy-MM-dd')} (${workingDaysAdded} working days)`);
  return currentDate;
}

/**
 * Calculate effort days from start and end dates (WORKING days)
 * Counts only Mon-Fri, excluding weekends and holidays
 * Used when timeline bar is resized
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @param holidays - Optional array of Holiday objects to exclude
 * @returns Number of working days between dates (inclusive)
 * 
 * @example
 * // Monday March 9 to Monday March 16 (includes weekend)
 * calculateEffortFromDates(new Date('2026-03-09'), new Date('2026-03-16'), [])
 * // Returns: 6 working days (Mon-Fri + Mon, skips Sat-Sun)
 */
export function calculateEffortFromDates(startDate: Date, endDate: Date, holidays: Holiday[] = []): number {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  
  if (end < start) return 0;
  if (end.getTime() === start.getTime()) return 1;
  
  const holidayDates = extractHolidayDates(holidays);
  let workingDays = 0;
  let currentDate = new Date(start);
  
  while (currentDate <= end) {
    if (!isWeekend(currentDate) && !isHoliday(currentDate, holidayDates)) {
      workingDays++;
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return Math.max(1, workingDays);
}
