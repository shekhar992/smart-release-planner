import { addDays, isWeekend, parseISO, startOfDay } from 'date-fns';

/**
 * Calculate end date from start date and duration in days, skipping weekends
 */
export function calculateEndDate(startDate: Date, durationInDays: number): Date {
  let currentDate = startOfDay(startDate);
  let workingDaysAdded = 0;

  while (workingDaysAdded < durationInDays) {
    currentDate = addDays(currentDate, 1);
    if (!isWeekend(currentDate)) {
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
