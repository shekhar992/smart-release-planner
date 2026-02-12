# Domain-to-App Mapper Analysis

**Date**: 2026-02-12  
**Purpose**: Analysis of the mapper function that bridges the Release Feasibility Engine (domain layer) with the existing UI layer.

---

## Function Overview

### What It Does

This is a **mapper/adapter function** that converts domain layer outputs into the app's existing data structure.

**Input**:
- `ReleasePlan` from domain layer (with `sprints[]`, `overflowTickets[]`, capacity metrics)
- Release metadata (name, start date, end date)

**Output**:
- `Release` object for UI/localStorage (following Product → Release → Features → Tickets hierarchy)

---

## Current Implementation

```typescript
import { ReleasePlan } from "./types";
import { Release, Feature, Ticket, Sprint } from "../mockData";
import { v4 as uuid } from "uuid";

export function mapReleasePlanToAppRelease(
  plan: ReleasePlan,
  releaseName: string,
  releaseStart: Date,
  releaseEnd: Date
): Release {

  const mappedSprints: Sprint[] = plan.sprints.map(s => ({
    id: s.id,
    name: s.name,
    startDate: s.startDate,
    endDate: s.endDate
  }));

  const importedFeature: Feature = {
    id: uuid(),
    name: "Imported Backlog",
    tickets: []
  };

  const deferredFeature: Feature = {
    id: uuid(),
    name: "Deferred (Out of Scope)",
    tickets: []
  };

  // Map placed tickets
  plan.sprints.forEach(sprint => {
    sprint.tickets.forEach(ticket => {
      const mappedTicket: Ticket = {
        id: ticket.id,
        title: ticket.title,
        description: "",
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        status: "planned",
        storyPoints: ticket.effortDays, // 1 day = 1 SP (temporary bridge)
        assignedTo: "Unassigned"
      };

      importedFeature.tickets.push(mappedTicket);
    });
  });

  // Map overflow tickets
  plan.overflowTickets.forEach(ticket => {
    const mappedTicket: Ticket = {
      id: ticket.id,
      title: ticket.title,
      description: "",
      startDate: releaseEnd,
      endDate: releaseEnd,
      status: "planned",
      storyPoints: ticket.effortDays,
      assignedTo: "Unassigned"
    };

    deferredFeature.tickets.push(mappedTicket);
  });

  return {
    id: uuid(),
    name: releaseName,
    startDate: releaseStart,
    endDate: releaseEnd,
    features: [importedFeature, deferredFeature],
    sprints: mappedSprints,
    storyPointMapping: undefined
  };
}
```

---

## Transformations Performed

### 1. Sprint Mapping
Converts domain `Sprint` (with capacity metrics) → app `Sprint` (simple date range):
- Strips out: `workingDays`, `capacityDays`, `allocatedDays`, `tickets[]`
- Keeps: `id`, `name`, `startDate`, `endDate`

### 2. Ticket Grouping
Creates 2 features:
- **"Imported Backlog"** - Contains all tickets that were successfully placed in sprints
- **"Deferred (Out of Scope)"** - Contains overflow tickets that didn't fit

### 3. Placed Tickets
For each ticket placed in a sprint:
- Inherits sprint's `startDate` and `endDate`
- `status`: `"planned"`
- `assignedTo`: `"Unassigned"`
- `effortDays` → `storyPoints` (1:1 conversion - **note: "temporary bridge"**)
- `description`: empty string

### 4. Overflow Tickets
For tickets that didn't fit:
- Both `startDate` and `endDate` set to `releaseEnd`
- Same defaults as placed tickets
- Grouped under "Deferred (Out of Scope)" feature

---

## Key Observations

### ✅ Good Decisions

1. **Explicit feature grouping** - Clear separation of placed vs. overflow tickets
2. **Safe defaults** - All tickets start as "planned" / "Unassigned"
3. **Sprint date inheritance** - Placed tickets automatically get sprint boundaries
4. **Clean mapping** - Simple, deterministic transformation

---

## ⚠️ Considerations & Limitations

### 1. Loss of `epic` Field
- **Domain layer**: `TicketInput` has an `epic` field
- **Current mapper**: Ignores epic, creates a single "Imported Backlog" feature
- **Impact**: All tickets lumped into one feature regardless of epic grouping

**Alternative approach**: Group tickets by epic to preserve domain structure
```typescript
// Group tickets by epic
const ticketsByEpic = new Map<string, TicketInput[]>();
plan.sprints.forEach(sprint => {
  sprint.tickets.forEach(ticket => {
    if (!ticketsByEpic.has(ticket.epic)) {
      ticketsByEpic.set(ticket.epic, []);
    }
    ticketsByEpic.get(ticket.epic)!.push({ ticket, sprint });
  });
});

// Create one feature per epic
const features: Feature[] = Array.from(ticketsByEpic.entries()).map(([epic, items]) => ({
  id: uuid(),
  name: epic,
  tickets: items.map(({ ticket, sprint }) => mapTicketToApp(ticket, sprint))
}));
```

---

### 2. Loss of `priority` Field
- **Domain layer**: Tickets have `priority: 1-5`
- **App layer**: `Ticket` type doesn't have a priority field
- **Impact**: Priority information used for allocation is lost after mapping

**Options**:
- Store priority in `description` field temporarily
- Extend app `Ticket` type to include priority
- Accept that priority only matters during planning, not after

---

### 3. `effortDays` → `storyPoints` Conversion
- **Current**: 1 day = 1 SP (as noted: "temporary bridge")
- **Issue**: App uses story points with configurable mappings (Fibonacci, Linear, Custom)
- **Question**: Should we reverse-engineer story points from effort days using the inverse of `storyPointMapping`?

**Example**:
```typescript
// If mapping says: 5 SP = 3 days
// And ticket has effortDays = 3
// Should we map back to storyPoints = 5?
```

---

### 4. Overflow Ticket Dates
- **Current**: Both `startDate` and `endDate` set to `releaseEnd`
- **Impact**: Overflow tickets appear as single-day items at the end of the timeline
- **Question**: Should overflow tickets be:
  - Visible on timeline at all?
  - Scheduled after the release ends?
  - Hidden from timeline (separate "backlog" view)?

---

### 5. No `storyPointMapping`
- **Current**: Returns `undefined`
- **Impact**: No SP→Days mapping saved with the release
- **Options**:
  - Pass in the original mapping from domain config
  - Create a default Linear (1:1) mapping to match the conversion
  - Leave undefined (current approach)

---

### 6. Sprint Association Lost
- **Domain**: Each ticket knows which sprint it's allocated to
- **App**: Tickets only have start/end dates matching sprint boundaries
- **Impact**: Can't directly query "which tickets are in Sprint 2?"
- **Current workaround**: Infer sprint from date overlap

---

### 7. Capacity Metrics Lost
- **Domain sprints**: Include `workingDays`, `capacityDays`, `allocatedDays`
- **App sprints**: Only store `id`, `name`, `startDate`, `endDate`
- **Impact**: Can't show "Sprint 2: 18 days capacity" in UI without recalculating

---

## Suggested File Location

**Option 1** (Recommended): Adapters folder
```
/src/domain/adapters/
  └── domainToAppMapper.ts
```

**Option 2**: Flat structure
```
/src/domain/
  └── domainToAppMapper.ts
```

**Rationale**:
- Domain layer should remain pure (no app imports)
- This mapper knows about BOTH layers
- Keeps boundary/integration logic isolated and testable

---

## Import Requirements

```typescript
import { ReleasePlan } from './types';  // or '../types' depending on location
import { Release, Feature, Ticket, Sprint } from '../app/data/mockData';
import { v4 as uuid } from 'uuid';
```

**Note**: `uuid` package already installed (confirmed in terminal output).

---

## Usage Example

```typescript
import { buildReleasePlan } from '@/domain';
import { mapReleasePlanToAppRelease } from '@/domain/adapters/domainToAppMapper';
import { saveRelease } from '@/app/lib/localStorage';

// 1. Run feasibility check
const plan = buildReleasePlan(tickets, config);

// 2. Show user feasibility report
console.log(`Feasibility: ${plan.feasiblePercentage}%`);
console.log(`Overflow: ${plan.overflowTickets.length} tickets`);

// 3. If user accepts, convert to app format
const appRelease = mapReleasePlanToAppRelease(
  plan,
  "Q1 2026 Release",
  config.releaseStart,
  config.releaseEnd
);

// 4. Save to localStorage
saveRelease(productId, appRelease);
```

---

## Enhanced Version (Optional)

```typescript
export interface MapperOptions {
  groupByEpic?: boolean;          // Group tickets into epic-based features
  includeOverflow?: boolean;      // Include overflow in release or omit
  preservePriority?: boolean;     // Store priority in description field
  createSprintAssignments?: boolean; // Add sprint info to ticket description
}

export function mapReleasePlanToAppRelease(
  plan: ReleasePlan,
  releaseName: string,
  releaseStart: Date,
  releaseEnd: Date,
  options?: MapperOptions
): Release {
  const {
    groupByEpic = false,
    includeOverflow = true,
    preservePriority = false,
    createSprintAssignments = false
  } = options || {};
  
  // ... enhanced implementation
}
```

**Benefits**:
- Flexible: Choose whether to group by epic or not
- Preserves more domain information if needed
- Backward compatible (options are optional)

---

## Questions for Decision

1. **Epic grouping**: Should tickets be grouped by epic, or is a single "Imported Backlog" feature acceptable?

2. **Priority preservation**: Do we need to preserve priority information after allocation?

3. **Overflow visibility**: Should overflow tickets appear on the timeline, or be hidden in a separate view?

4. **Story point mapping**: Should we reverse-engineer story points from effort days, or stick with 1:1?

5. **Capacity display**: Do we want to show sprint capacity metrics in the UI? (Would require extending app `Sprint` type)

6. **Sprint association**: Is inferring sprint from date overlap sufficient, or should we explicitly track which sprint a ticket belongs to?

---

## Recommendation

**Start simple** (current implementation is fine for MVP), but be aware of the limitations. Add enhancements incrementally based on user feedback.

**Immediate next steps**:
1. ✅ Create the file at `src/domain/adapters/domainToAppMapper.ts`
2. Add basic unit tests for the mapper
3. Wire it into a UI flow (e.g., "Import from Feasibility Check" button)
4. Gather feedback on whether epic grouping or capacity display is needed

---

## Implementation Notes (2026-02-12)

### Final Implementation Decisions

After ChatGPT review, the following enhancements were implemented:

✅ **Epic grouping enabled** - Tickets are now grouped by their `epic` field, creating one Feature per epic
✅ **crypto.randomUUID()** - Uses native Web Crypto API instead of uuid package
✅ **Conditional deferred feature** - Only creates "Deferred (Out of Scope)" if overflow exists
✅ **Cleaner overflow mapping** - More concise array transformation

### File Created
- **Location**: [src/domain/adapters/domainToAppMapper.ts](src/domain/adapters/domainToAppMapper.ts)
- **Exports**: `mapReleasePlanToAppRelease()` function

### Changes from Initial Proposal
1. **Grouped by epic by default** - No longer creates single "Imported Backlog" feature
2. **No uuid dependency** - Uses built-in `crypto.randomUUID()`
3. **Smarter overflow handling** - Deferred feature only created when needed

### Known Limitations (Accepted for MVP)
1. **Priority loss** - Priority information not preserved after mapping
2. **1:1 SP conversion** - effortDays → storyPoints without reverse mapping
3. **Capacity metrics stripped** - Sprint capacity data not saved to app layer
4. **Sprint association by date** - Tickets infer sprint membership from date overlap

---

## End of Analysis
