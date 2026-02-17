/**
 * Effort Suggestion Engine v1
 * 
 * Provides effort estimates based on ticket title and assignee role.
 * Uses keyword detection and role-based normalization.
 */

export interface EffortSuggestionResult {
  suggestedDays: number;
  confidence: 'low' | 'medium' | 'high';
  factors: string[];
}

/**
 * Suggest effort days for a ticket based on title and role.
 * 
 * @param title - Ticket title
 * @param role - Team member role (optional)
 * @returns Suggestion with confidence level and contributing factors
 */
export function suggestEffortDays(
  title: string,
  role?: string
): EffortSuggestionResult {

  let base = 2;
  const factors: string[] = [];
  const normalizedTitle = title.toLowerCase();

  // Keyword detection for complexity estimation
  if (normalizedTitle.includes('api')) {
    base += 1.5;
    factors.push('API work detected');
  }

  if (normalizedTitle.includes('refactor')) {
    base += 2;
    factors.push('Refactor complexity');
  }

  if (normalizedTitle.includes('integration')) {
    base += 2;
    factors.push('Integration work');
  }

  if (normalizedTitle.includes('bug')) {
    base += 0.5;
    factors.push('Bug fix');
  }

  if (normalizedTitle.includes('design')) {
    base += 1;
    factors.push('Design work');
  }

  if (normalizedTitle.includes('test') || normalizedTitle.includes('testing')) {
    base += 1;
    factors.push('Testing effort');
  }

  if (normalizedTitle.includes('setup') || normalizedTitle.includes('configuration')) {
    base += 1.5;
    factors.push('Setup/configuration');
  }

  if (normalizedTitle.includes('migration')) {
    base += 3;
    factors.push('Data migration');
  }

  if (normalizedTitle.includes('documentation')) {
    base += 1;
    factors.push('Documentation');
  }

  // Role-based normalization
  if (role === 'Developer') {
    base *= 1;
  }

  if (role === 'QA') {
    base *= 0.8;
    factors.push('QA role normalization');
  }

  if (role === 'Designer') {
    base *= 1;
  }

  // Round to nearest 0.5
  const rounded = Math.round(base * 2) / 2;

  // Determine confidence based on number of detected factors
  let confidence: 'low' | 'medium' | 'high';
  if (factors.length >= 2) {
    confidence = 'high';
  } else if (factors.length === 1) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    suggestedDays: rounded,
    confidence,
    factors
  };
}
