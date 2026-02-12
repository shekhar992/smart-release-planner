# Domain Layer Audit — Release Feasibility Engine

**Date**: 2026-02-12  
**Last Updated**: 2026-02-12 (Post-fix)  
**Audited Files**:
- `/src/domain/types.ts`
- `/src/domain/dateUtils.ts`
- `/src/domain/capacityUtils.ts`
- `/src/domain/planningEngine.ts`

**Purpose**: Objective analysis of current implementation behavior, edge cases, and weaknesses.

**Status**: ✅ Critical fixes applied (see [Fixes Applied](#fixes-applied) section)

---

## 1) Sprint Generation

### Implementation Details

**Function**: `generateSprintPeriods()` in `dateUtils.ts`

**Algorithm**:
1. Normalizes dates using `startOfDay()`
2. Validates date range (returns `[]` if start > end)
3. Validates sprint length (returns `[]` if ≤ 0)
4. Iteratively creates sprints:
   - Sprint end = `currentStart + sprintLengthDays - 1` (inclusive)
   - Sprint end is **capped** at `releaseEnd` using `min([potentialEnd, endDay])`
   - Next sprint starts the day after previous sprint ends
5. Safety limit: stops after 100 sprints with console warning

### Behavior: Release End Mid-Sprint

**Question**: If `releaseEnd` falls mid-sprint, what happens?

**Answer**: **Last sprint is truncated.**

**Example**:
- Release: March 1 - March 20 (20 days)
- Sprint length: 14 days
- Sprint 1: March 1-14 (14 days)
- Sprint 2: March 15-20 (**6 days**, truncated)

**Code Evidence**:
```typescript
const actualEnd = min([potentialEnd, endDay]);
```

This ensures the last sprint never extends beyond the release boundary.

### Edge Case Handling

| Scenario | Behavior | Code Location |
|----------|----------|---------------|
| `releaseStart > releaseEnd` | Returns `[]` (empty array) | Line 100-102 |
| `sprintLengthDays ≤ 0` | Returns `[]` | Line 105-107 |
| `releaseStart === releaseEnd` | Creates **1 sprint** with same start/end | Passes validation |
| Very long release (>100 sprints) | Stops at 100, logs warning | Line 128-131 |

### Identified Issue
✅ **Edge case exists**: If `releaseStart === releaseEnd`, a single 1-day sprint is created. Depending on business rules, this may or may not be valid.

---

## 2) Working Day Logic

### Implementation Details

**Function**: `calculateWorkingDays()` in `dateUtils.ts`

**Algorithm**:
1. Normalizes start/end dates to `startOfDay()`
2. Returns `0` if start > end
3. Iterates day-by-day from start to end (inclusive)
4. Counts days that are:
   - NOT a weekend (`!isWeekend(currentDate)`)
   - AND NOT a holiday (`!isHoliday(currentDate, holidays)`)

### Weekend Exclusion
✅ **Yes, weekends are excluded.**

Uses `date-fns` `isWeekend()` which checks if day is Saturday or Sunday.

### Holiday Exclusion
✅ **Yes, holidays are excluded.**

**Function**: `isHoliday()` in `dateUtils.ts`
```typescript
export function isHoliday(date: Date, holidays: Date[]): boolean {
  const normalized = startOfDay(date);
  return holidays.some(holiday => isSameDay(startOfDay(holiday), normalized));
}
```

### Holiday Deduplication
❌ **No, holidays are NOT deduplicated.**

- The `holidays` array is passed as-is
- If the same date appears multiple times in `holidays[]`, it will be checked multiple times
- This doesn't cause incorrect results (just redundant checks), but is inefficient

### Timezone Safety
⚠️ **Partial timezone handling.**

- All dates are normalized using `startOfDay()` from `date-fns`
- `startOfDay()` uses **local timezone** of the execution environment
- If input dates are created in **different timezones**, results may be incorrect

**Example Risk**:
```typescript
const start = new Date('2026-03-01T23:00:00Z'); // UTC March 1 11pm
const end = new Date('2026-03-02T01:00:00-08:00'); // PST March 2 1am
// Depending on execution timezone, this might count incorrectly
```

**Recommendation**: Input dates should be constructed consistently (e.g., always pass ISO date strings without time components, or always use UTC midnight).

---

## 3) PTO Handling

### Implementation Details

**Function**: `countPtoDaysInRange()` in `dateUtils.ts`

**Algorithm**:
1. Normalizes start/end dates to `startOfDay()`
2. Filters `ptoDates` array for dates that:
   - Fall within the range (`pto >= startDay && pto <= endDay`)
   - Are NOT weekends (`!isWeekend(pto)`)
3. Returns count

### Application to Capacity

**Function**: `calculateSprintCapacity()` in `capacityUtils.ts`

**Formula**:
```typescript
workingDays = calculateWorkingDays(start, end, holidays); // excludes weekends + holidays
ptoDays = countPtoDaysInRange(start, end, ptoDates);      // excludes weekends only
availableDays = Math.max(0, workingDays - ptoDays);
capacityDays = availableDays × numberOfDevelopers;
```

### PTO Application
✅ **Yes, PTO days are removed per sprint.**

Each sprint calculates its own PTO overlap.

### Double-Counting Risk
✅ **Fixed - PTO no longer double-counted with holidays.**

**Previous Problem**:
- `workingDays` already excluded holidays
- `ptoDays` did NOT check if PTO date is also a holiday
- If a developer took PTO on a holiday, capacity was reduced twice

**Fix Applied**:
`countPtoDaysInRange()` now accepts holidays parameter and excludes them:
```typescript
return pto >= startDay && pto <= endDay && !isWeekend(pto) && !isHoliday(pto, holidays);
```

### PTO Model Assumption
✅ **Clarified - documentation now explicit.**

Updated comment in `ReleaseConfig`:
```typescript
/**
 * TEAM-LEVEL PTO dates (not per-developer).
 * Each date represents 1 working day lost for the entire team.
 * Example: If 1 developer takes 1 day PTO, add that date here.
 * Capacity reduction: 1 date = 1 working day subtracted from total team capacity.
 * PTO on weekends or holidays is automatically ignored (not double-counted).
 */
ptoDates: Date[];
```

---

## 4) Capacity Calculation

### Exact Formula

**Function**: `calculateSprintCapacity()` in `capacityUtils.ts`

**Step-by-step**:
```typescript
// Step 1: Working days (weekdays minus holidays)
workingDays = calculateWorkingDays(startDate, endDate, holidays);

// Step 2: PTO days within sprint (weekdays only)
ptoDays = countPtoDaysInRange(startDate, endDate, ptoDates);

// Step 3: Available days per developer
availableDays = Math.max(0, workingDays - ptoDays);

// Step 4: Total team capacity
capacityDays = availableDays × numberOfDevelopers;
```

### Capacity Calculated Per Sprint
✅ **Yes.**

Each sprint gets its own `CapacityResult` object with:
- `workingDays`
- `ptoDays`
- `availableDays`
- `capacityDays`

### Developer Count Applied Correctly
✅ **Yes, multiplied at the final step.**

The formula correctly multiplies the net available days by the number of developers.

### Edge Case: Zero or Negative Developers
✅ **Handled.**

```typescript
if (numberOfDevelopers <= 0) {
  return { workingDays: 0, ptoDays: 0, availableDays: 0, capacityDays: 0 };
}
```

### Edge Case: PTO Days > Working Days
✅ **Handled.**

```typescript
const availableDays = Math.max(0, workingDays - ptoDays);
```

Prevents negative capacity.

---

## 5) Ticket Allocation Logic

### Sorting Logic

**Function**: `sortTicketsByPriority()` in `planningEngine.ts`

**Algorithm**:
```typescript
return [...tickets].sort((a, b) => {
  // Priority: lower number = higher priority (1 is highest)
  if (a.priority !== b.priority) {
    return a.priority - b.priority;  // Sort ascending (1, 2, 3...)
  }
  // Within same priority, sort by effort (smaller tasks first)
  return a.effortDays - b.effortDays;  // Sort ascending
});
```

**Behavior**:
1. Sort by priority ascending (1 = highest priority comes first)
2. Within same priority, sort by effort ascending (smaller tasks first)

✅ **Immutable**: Uses spread operator to avoid mutating input.

### Allocation Strategy
✅ **Yes, greedy first-fit algorithm.**

**Algorithm**:
```typescript
for (const ticket of sortedTickets) {
  let placed = false;
  
  for (const sprint of sprints) {
    const remainingCapacity = sprint.capacityDays - sprint.allocatedDays;
    
    if (ticket.effortDays <= remainingCapacity) {
      sprint.tickets.push(ticket);
      sprint.allocatedDays += ticket.effortDays;
      placed = true;
      break;  // Move to next ticket
    }
  }
  
  if (!placed) {
    overflowTickets.push(ticket);
  }
}
```

**Behavior**:
- Iterates tickets in priority order
- For each ticket, tries sprints sequentially (Sprint 1, Sprint 2, ...)
- Places ticket in **first sprint** with enough remaining capacity
- Moves to next ticket (does NOT backtrack or optimize)

### Ticket Splitting
✅ **No, tickets are NOT split.**

Check condition:
```typescript
if (ticket.effortDays <= remainingCapacity)
```

This is strict: ticket must **fully fit** in remaining capacity or it's skipped.

### Overflow Behavior
✅ **Tickets that don't fit any sprint go to `overflowTickets[]`.**

This array is returned in the `ReleasePlan` output.

### Limitation
⚠️ **First-fit is not optimal.**

**Example scenario**:
- Sprint 1 capacity: 10 days
- Sprint 2 capacity: 10 days
- Tickets: [8 days, 5 days, 5 days]

**Current behavior**:
1. Place 8-day ticket in Sprint 1 (2 days remaining)
2. 5-day ticket doesn't fit Sprint 1, placed in Sprint 2 (5 days remaining)
3. 5-day ticket fits in Sprint 2 (0 days remaining)
4. **Result**: All tickets placed

**Could be problematic if**:
- Tickets: [8 days, 3 days, 9 days]
1. Place 8-day in Sprint 1 (2 days remaining)
2. Place 3-day ticket... doesn't fit Sprint 1, goes to Sprint 2 (7 days remaining)
3. 9-day ticket doesn't fit Sprint 2 → **overflow**

**Better allocation** (bin-packing optimization):
1. Place 8-day and 3-day in Sprint 1 (would require reordering)
2. Place 9-day in Sprint 2
3. **Result**: All tickets placed

This is a known limitation of greedy first-fit.

---

## 6) Feasibility Metrics

### Total Capacity Calculation

**Function**: `buildReleasePlan()` in `planningEngine.ts`

```typescript
const totalCapacityDays = sprints.reduce((sum, s) => sum + s.capacityDays, 0);
```

✅ **Correctly sums all sprint capacities.**

### Feasible Percentage Calculation

**Formula**:
```typescript
const totalBacklogDays = tickets.reduce((sum, t) => sum + t.effortDays, 0);
const overflowEffort = overflowTickets.reduce((sum, t) => sum + t.effortDays, 0);
const placedEffort = totalBacklogDays - overflowEffort;

const feasiblePercentage = totalBacklogDays > 0
  ? (placedEffort / totalBacklogDays) * 100
  : 100;
```

**Behavior**:
- Calculates what % of total backlog was successfully placed
- If no backlog, returns 100% (assumes "feasible by default")
- Rounds to 2 decimal places

✅ **Mathematically correct.**

### Edge Case: Zero Developers

**Handled in `buildReleasePlan()`**:
```typescript
if (config.numberOfDevelopers <= 0 || config.sprintLengthDays <= 0) {
  const totalBacklogDays = tickets.reduce((sum, t) => sum + t.effortDays, 0);
  return {
    sprints: [],
    overflowTickets: [...tickets],
    totalBacklogDays,
    totalCapacityDays: 0,
    feasiblePercentage: 0,
  };
}
```

✅ **Returns 0% feasibility.**

### Edge Case: Empty Backlog

**Handled at start of `buildReleasePlan()`**:
```typescript
if (tickets.length === 0) {
  return {
    sprints: [],
    overflowTickets: [],
    totalBacklogDays: 0,
    totalCapacityDays: 0,
    feasiblePercentage: 100,
  };
}
```

✅ **Returns 100% feasibility** (logical: empty backlog is "fully feasible").

### Edge Case: Same Start/End Date
⚠️ **Not explicitly handled.**

If `releaseStart === releaseEnd`:
- `generateSprintPeriods()` creates 1 sprint with same start/end
- `calculateWorkingDays()` checks if that day is a weekday/non-holiday
- Could result in 0 working days if it's a weekend/holiday

**Behavior**: Works, but may create a 0-capacity sprint.

---

## 7) Weaknesses & Risks

### Architectural Risks

#### ~~1. **PTO/Holiday Double-Counting**~~ ✅ FIXED
- ~~**Issue**: PTO days are not checked against holidays~~
- ~~**Impact**: Capacity under-reported if developer takes PTO on a holiday~~
- **Status**: Fixed - `countPtoDaysInRange()` now excludes holidays

#### ~~2. **PTO Model Ambiguity**~~ ✅ FIXED  
- ~~**Issue**: Unclear if `ptoDates` is individual PTO or aggregated team loss~~
- ~~**Impact**: If misunderstood, capacity calculation will be completely wrong~~
- **Status**: Fixed - documentation now explicitly states "TEAM-LEVEL PTO dates"

#### 3. **Timezone Assumptions** ⚠️ MEDIUM RISK
- **Issue**: All dates normalized to local timezone using `startOfDay()`
- **Impact**: Dates created in different timezones may produce incorrect results
- **Location**: All `startOfDay()` calls in `dateUtils.ts`
- **Mitigation**: Requires consistent date construction (e.g., ISO strings without time)

#### 4. **Non-Optimal Allocation** ⚠️ LOW RISK
- **Issue**: First-fit greedy algorithm is not optimal (bin-packing problem)
- **Impact**: May produce overflow when better allocation exists
- **Location**: `buildReleasePlan()` allocation loop
- **Trade-off**: Optimization (e.g., best-fit) is more complex and may not be needed

### Missing Edge Cases

#### 1. **Negative Effort Days** ❌ NOT VALIDATED
- **Issue**: No validation that `ticket.effortDays >= 0`
- **I~~1. **Negative Effort Days**~~ ✅ FIXED
- ~~**Issue**: No validation that `ticket.effortDays >= 0`~~
- **Status**: Fixed - invalid tickets are filtered with warning

#### ~~2. **Invalid Priority Range**~~ ⚠️ DEFERRED
- **Issue**: No validation that `ticket.priority` is 1-5
- **Impact**: Sorting still works, but may not match business expectations
- **Status**: Not critical - sorting works with any numeric priority
- **Issue**: Holiday array not deduplicated
- **Impact**: Performance (not correctness)
- **Location**: `isHoliday()` checks all holidays on every iteration

#### 4. **Empty Sprint Creation** ⚠️ EDGE CASE
- **Issue**: If release is all weekends/holidays, sprints have 0 capacity
- **Impact**: Not a bug, but may confuse users
- **Location**: `generateSprintPeriods()` doesn't filter out 0-capacity sprints

#### 5. **Truncated Sprint Naming** ⚠️ UX ISSUE
- **Issue**: Last truncated sprint still called "Sprint N" (no indication it's shorter)
- **Impact**: User may not realize it's a partial sprint
- **Location**: Sprint naming in `buildReleasePlan()`

### Potential Bugs

#### 1. **Integer vs Decimal Effort** ⚠️ AMBIGUOUS
- **Issue**: `effortDays` is typed as `number`, but are decimals allowed?
- **Example**: Is `effortDays: 2.5` valid?
- **Impact**: If decimals allowed, no issues. If not, should validate.

#### 2. **Safety Limit Hardcoded** ⚠️ MAGIC NUMBER
- **Issue**: 100-sprint safety limit is hardcoded
- **Location**: `generateSprintPeriods()` line 128
- **Impact**: Very long releases (e.g., 2+ years with 1-week sprints) will be truncated silently

#### 3. **No Circular Reference Protection** ⚠️ LOW RISK
- **Issue**: If tickets array contains duplicate references, allocation may behave unexpectedly
- **Mitigation**: Unlikely in practice (tickets created fresh from input)

---

## Su~~1. **Integer vs Decimal Effort**~~ ✅ VALIDATED
- **Issue**: `effortDays` is typed as `number`, but are decimals allowed?
- **Status**: Invalid values (≤0, NaN) now filtered with warning
- **Note**: Decimals (e.g., 2.5 days) are allowed and work correctly
| Sprint generation | ✅ Works correctly | Low |
| Sprint truncation | ✅ Truncates at release end | Low |
| Weekend exclusion | ✅ Correct | None |
| Holiday exclusion | ✅ Correct | None |
| Holiday deduplication | ❌ Not optimized | Low |
| Timezone handling | ⚠️ Assumes local timezone | Medium |
| PTO counting | ✅ Correct (per model) | None |
| PTO/holiday overlap | ✅ Fixed - no longer double-counts | None |
| PTO model clarity | ✅ Fixed - clearly documented | None |
| Capacity formula | ✅ Correct | None |
| Developer count | ✅ Applied correctly | None |
| Ticket sorting | ✅ Correct | None |
| Allocation strategy | ✅ Works (first-fit) | Low |
| Ticket splitting | ✅ No splitting (as designed) | None |
| Overflow handling | ✅ Correct | None |
| Feasibility % | ✅ Correct | None |
| Edge cases (empty) | ✅ Handled | None |
| Edge cases (invalid) | ✅ Handled | None |
| Input validation | ✅ Fixed - effort validated | None |

---

## Critical Fixes Needed

~~1. **Fix PTO/holiday double-counting** (High Priority)~~ ✅ **FIXED**
~~2. **Clarify PTO model in documentation** (High Priority)~~ ✅ **FIXED**
~~3. **Add input validation** for negative effort, out-of-range priority (Medium Priority)~~ ✅ **FIXED** (effort validation)
4. **Document timezone assumptions** (Medium Priority) - Still pending

---

## Fixes Applied

### 1. PTO/Holiday Double-Counting ✅ FIXED

**Issue**: PTO days on holidays were reducing capacity twice.

**Fix Applied**:
- Modified `countPtoDaysInRange()` in `dateUtils.ts`
- Added `holidays` parameter to function signature
- Updated filter logic to exclude: `!isWeekend(pto) && !isHoliday(pto, holidays)`
- Updated call site in `capacityUtils.ts` to pass holidays

**Result**: PTO on holidays or weekends is now correctly ignored.

### 2. PTO Model Clarification ✅ FIXED

**Issue**: Documentation unclear if `ptoDates` was individual or aggregated.

**Fix Applied**:
- Enhanced JSDoc comment for `ReleaseConfig.ptoDates` in `types.ts`
- Explicitly states: "TEAM-LEVEL PTO dates (not per-developer)"
- Clarifies: "Each date represents 1 working day lost for the entire team"
- Documents auto-ignore behavior for weekends/holidays

**Result**: PTO model is now unambiguous.

### 3. Effort Validation ✅ FIXED

**Issue**: No validation for invalid effort values.

**Fix Applied**:
- Added validation at start of `buildReleasePlan()` in `planningEngine.ts`
- Filters out tickets where `effortDays <= 0` or `isNaN(effortDays)`
- Logs console warning with ticket ID and invalid value
- Updated all references from `tickets` to `validTickets`

**Result**: System handles invalid tickets gracefully without crashing.

---

## End of Audit

This audit reflects the current implementation as of 2026-02-12. No improvements or refactoring suggestions are included per instruction.
