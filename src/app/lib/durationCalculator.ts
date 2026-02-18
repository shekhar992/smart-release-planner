/**
 * Duration Calculator - Velocity-Aware Duration Calculation
 * 
 * Calculates actual calendar duration based on effort and velocity multiplier.
 */

/**
 * Calculate duration in days based on effort and velocity.
 * 
 * Formula: duration = effort / velocity (rounded up)
 * 
 * @param effortDays - Raw effort estimation in days
 * @param velocityMultiplier - Team member's velocity multiplier (default: 1)
 * @returns Duration in calendar days (always rounded up)
 * 
 * @example
 * // 10 days effort with Senior (1.3x velocity)
 * calculateDurationDays(10, 1.3) // => 8 days
 * 
 * @example
 * // 10 days effort with Junior (0.7x velocity)
 * calculateDurationDays(10, 0.7) // => 15 days
 */
export function calculateDurationDays(
  effortDays: number,
  velocityMultiplier: number = 1
): number {
  if (!effortDays || effortDays <= 0) return 1;

  const rawDuration = effortDays / velocityMultiplier;
  return Math.max(1, Math.round(rawDuration));
}
