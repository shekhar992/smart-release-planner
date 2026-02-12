/**
 * Domain layer index
 * Clean exports for the Release Feasibility Engine
 */

// Types
export type {
  TicketInput,
  ReleaseConfig,
  Sprint,
  ReleasePlan,
} from './types';

export type {
  CapacityInput,
  CapacityResult,
} from './capacityUtils';

// Date utilities
export {
  isHoliday,
  calculateWorkingDays,
  countPtoDaysInRange,
  generateSprintPeriods,
} from './dateUtils';

// Capacity utilities
export {
  calculateSprintCapacity,
  sumCapacities,
} from './capacityUtils';

// Planning engine (main API)
export {
  buildReleasePlan,
  isReleaseFeasible,
  getReleaseSummary,
  getSprintUtilization,
} from './planningEngine';

// Adapters (domain ↔ app layer integration)
export {
  mapReleasePlanToAppRelease,
} from './adapters/domainToAppMapper';
