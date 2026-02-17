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

/**
 * Calculate end date from start date and effort days (calendar days)
 * Makes effortDays the single source of truth for duration
 */
export function calculateEndDateFromEffort(startDate: Date, effortDays: number): Date {
  const end = new Date(startDate);
  end.setDate(end.getDate() + effortDays - 1);
  return end;
}

/**
 * Calculate effort days from start and end dates (calendar days)
 * Used when timeline bar is resized
 */
export function calculateEffortFromDates(startDate: Date, endDate: Date): number {
  const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}
