# Product Training Prompt (Paste into ChatGPT)

You are my product+engineering copilot. Your job is to understand what my app does TODAY (not what it could do), then help me plan and implement future enhancements.

This context is grounded in the actual repository code. If something is not explicitly stated here, ask clarifying questions instead of guessing.

Date: 2026-02-12

---

## Quick tech stack (paste-first)

- **React + TypeScript + Vite**
- **React Router** for navigation
- **React DnD (HTML5 backend)** for drag-and-drop scheduling
- **Tailwind CSS** + a custom design-token module
- **XLSX** for Excel import (converted to CSV)
- **localStorage** persistence (no backend)

Entry points:
- App wrapper: [src/app/App.tsx](src/app/App.tsx)
- Routes: [src/app/routes.ts](src/app/routes.ts)

---

## 0) What I want from you

After reading, do the following whenever I ask for “next feature ideas” or “improvements”:

1. Ask up to 5 clarifying questions if needed (but don’t stall).
2. Propose 3–6 improvements with:
	 - **Priority**: P0 (must), P1 (should), P2 (nice)
	 - **Impact**: High/Medium/Low
	 - **Effort**: S/M/L (or hours estimate)
	 - **Implementation notes** referencing where in the code it should live.
3. Do not invent existing functionality. If you propose a feature that requires new data fields or new storage, call that out.

---

## 1) Product overview

This is a **local-first Release & Sprint Planning app** with a **Gantt-style timeline** for tickets, plus **conflict detection** and **capacity calculations**.

High-level use case:
- A PM/EM sets up a Product and a Release timeframe.
- They optionally generate Sprints.
- They create/import Features and Tickets.
- They schedule work on a timeline and monitor:
	- over-allocation (via sprint capacity)
	- overlapping work per developer (via conflict detection)
	- holiday and PTO overlays

---

## 2) Tech stack & runtime

See **Quick tech stack (paste-first)** above.

---

## 3) Navigation (routes / screens)

Defined in [src/app/routes.ts](src/app/routes.ts)

- `/` → Planning Dashboard
- `/release/:releaseId` → Release Planning Canvas (main timeline workspace)
- `/release/:releaseId/team` → Team Roster (scoped to product containing that release)
- `/release/:releaseId/team/holidays` → Holiday Management
- `/product/:productId/team` → Team Roster (scoped to product)
- `/product/:productId/team/:memberId` → Team Member Detail (PTO + member info)
- `/team` and `/team/:memberId` → Team screens (unscoped / legacy paths)
- `/holidays` → Holiday Management
- `*` → Not Found

Error boundaries are wired via [src/app/components/ErrorBoundary.tsx](src/app/components/ErrorBoundary.tsx).

---

## 4) Persistence model (localStorage)

Storage utility: [src/app/lib/localStorage.ts](src/app/lib/localStorage.ts)

Keys:
- `timeline_view_products`
- `timeline_view_holidays`
- `timeline_view_team_members`
- `timeline_view_last_updated`
- `timeline_view_data_version` (currently `3.0.0`)

Important behavior:
- On first load (or version mismatch), the app initializes storage with mock seed data via `initializeStorage(...)`.
- Data is saved as JSON; date fields are revived back into `Date` objects.
- Release canvas auto-saves updates with a **300ms debounce**.
- There is a **Reset** control that force-refreshes storage to the latest mock data (and reloads the page).

---

## 5) Domain model (source of truth types)

Types live in [src/app/data/mockData.ts](src/app/data/mockData.ts)

Core hierarchy:

- `Product`
	- `id`, `name`
	- `releases: Release[]`

- `Release`
	- `id`, `name`, `startDate`, `endDate`
	- `features: Feature[]`
	- `sprints?: Sprint[]`
	- `storyPointMapping?: StoryPointMapping`

- `Feature`
	- `id`, `name`
	- `tickets: Ticket[]`

- `Ticket`
	- `id`, `title`, optional `description`
	- `startDate`, `endDate`
	- `status: 'planned' | 'in-progress' | 'completed'`
	- `storyPoints: number`
	- `assignedTo: string` (uses `'Unassigned'` as a sentinel value)

Additional persisted entities:

- `TeamMember` (stored separately from products)
	- `id`, `name`, `role: 'Developer' | 'Designer' | 'QA'`, optional `notes`
	- `pto: PTOEntry[]`
	- `productId` (team members are scoped per product)

- `Holiday` (stored globally)
	- `id`, `name`, `startDate`, `endDate`

---

## 6) Seed data included

Main seed data is in [src/app/data/mockData.ts](src/app/data/mockData.ts):
- Multiple products, releases, features, and tickets.
- Tickets intentionally include some **overlapping assignments** to demonstrate conflict detection.
- Team members include PTO entries.

There is also an investor-style dataset in [src/app/data/demoData.ts](src/app/data/demoData.ts), but it is **not wired into initialization** (no code imports it currently).

---

## 7) Key screens & behaviors

### 7.1 Planning Dashboard (home)
File: [src/app/components/PlanningDashboard.tsx](src/app/components/PlanningDashboard.tsx)

Capabilities:
- Initializes storage from mock data on mount.
- Lists products as cards, including:
	- release count
	- ticket count (derived)
	- team member count (derived from stored team members by `productId`)
- Create new product via a modal.
- Create new release for a chosen product via a modal.
- Rename/delete product via a card menu.

### 7.2 Create Product flow
File: [src/app/components/CreateProductModal.tsx](src/app/components/CreateProductModal.tsx)

Two steps:
1. Product name
2. Team setup

Team setup supports:
- Manual entry of team members (name, role, notes)
- CSV import of team members
	- Flexible header matching (case-insensitive; looks for “name”, optional “role”, optional “notes”)
	- Role normalization (e.g., “engineer” → Developer)
	- Adds parsed rows into the manual list for review
	- Template download (`team-members-template.csv`)

### 7.3 Create Release flow
File: [src/app/components/CreateReleaseModal.tsx](src/app/components/CreateReleaseModal.tsx)

Two steps:
1. Release details
	 - product selection (unless pre-selected)
	 - name, start date, end date
	 - story point → day mapping preset:
		 - Fibonacci, Linear (1:1), or Custom mapping table
2. Sprint setup
	 - Optional auto-generation of sprints
	 - Sprint duration presets (1–4 weeks)
	 - Generated sprints are evenly chunked; leftover days are reported

### 7.4 Release Planning Canvas (main workspace)
File: [src/app/components/ReleasePlanningCanvas.tsx](src/app/components/ReleasePlanningCanvas.tsx)

Top-bar actions:
- Back to dashboard
- Edit release (name/start/end)
- Delete release
- Reset storage (force refresh to mock data)
- New Ticket
- Import Tickets
- Team Roster
- Holidays

Auto-save:
- On any release state change, save is debounced by ~300ms.
- A “Data saved” indicator shows last save time (derived from localStorage timestamp).

Ticket ops implemented:
- Add feature (by name)
- Add ticket
- Update ticket fields
- Delete ticket
- Move ticket between features
- Clone ticket (creates “(Copy)”, schedules immediately after original)

Sprint ops implemented:
- Create sprint
- Update sprint
- Delete sprint

Note: A [src/app/components/WorkloadModal.tsx](src/app/components/WorkloadModal.tsx) exists and is mounted conditionally, but the current canvas code does not expose any UI button that sets `showWorkloadModal = true`.

### 7.5 Timeline / Gantt view
File: [src/app/components/TimelinePanel.tsx](src/app/components/TimelinePanel.tsx)

Layout:
- Left sidebar: feature headers + ticket rows
- Right: scrollable timeline grid with synchronized scrolling (vertical + horizontal header sync)

Constants:
- `DAY_WIDTH = 40`
- `ROW_HEIGHT = 48`
- `FEATURE_HEADER_HEIGHT = 40`
- `SIDEBAR_WIDTH = 320`

Timeline layers (right side):
1. Time grid
	 - weekend shading
	 - vertical day lines
	 - thicker boundaries at week/month starts
	 - “Today” indicator (red vertical line + badge)
2. Sprint bands (visual background stripes per sprint)
3. Holiday bands (toggleable)
4. Ticket bars

Sidebar header controls:
- Toggle **Holidays** overlay
- Toggle **PTO** visualization
- Conflict summary badge (only shown if conflicts exist) with per-developer counts
- “Add Sprint” button opens Sprint creation popover

Feature behavior:
- Features are collapsible/expandable.
- Ticket selection syncs sidebar row + timeline bar.

Sprint creation/editing:
- Popover: [src/app/components/SprintCreationPopover.tsx](src/app/components/SprintCreationPopover.tsx)
	- Create single sprint
	- Edit existing sprint
	- Generate multiple sprints
	- Detects and warns on overlapping sprint date ranges

### 7.6 Ticket creation
File: [src/app/components/TicketCreationModal.tsx](src/app/components/TicketCreationModal.tsx)

Flow:
- Step 1: Select existing feature or create a new feature
- Step 2: Create ticket

Defaults:
- `startDate = today`
- `endDate = today + 5 days`
- `storyPoints = 3`
- `assignedTo = 'Unassigned'`
- `status = planned`

Supports “Create and add another” which chains the next ticket start date to the previous ticket’s end.

### 7.7 Ticket details / editing
File: [src/app/components/TicketDetailsPanel.tsx](src/app/components/TicketDetailsPanel.tsx)

This is a centered modal (with backdrop), not a docked sidebar.

Editable fields:
- Title, Description
- Story Points (quick buttons + numeric input)
- Assigned Developer (searchable dropdown)
- Status (segmented buttons)
- Start Date / End Date

Additional actions:
- Delete (with confirmation strip)
- Move ticket to another feature

Derived display:
- Duration (days)
- Associated sprint (based on ticket start date falling within a sprint)
- Feature name

Keyboard:
- Esc closes modal / closes nested UI first.

### 7.8 Bulk ticket import (CSV / Excel)
File: [src/app/components/BulkTicketImportModal.tsx](src/app/components/BulkTicketImportModal.tsx)

Supports:
- `.csv`, `.xlsx`, `.xls`
- Excel is converted to CSV client-side.

Validation/parsing:
- Parser: [src/app/lib/csvParser.ts](src/app/lib/csvParser.ts)
- Mapping: [src/app/lib/importMappings.ts](src/app/lib/importMappings.ts)

Ticket import rules:
- Required columns in mapping:
	- `id, title, startDate, endDate, status, storyPoints, assignedTo`
- Optional columns:
	- `description, feature`
- If `feature` is missing/blank for some rows, those tickets go under a default feature name **“Imported Tickets”** and warnings are shown in preview.
- Import groups rows by feature name:
	- If feature exists in the release (case-insensitive match), it adds tickets there.
	- Otherwise it creates the feature automatically.
- Status is strictly validated to `planned | in-progress | completed`.
- `storyPoints` must be positive.

Template download exists inside the modal.

### 7.9 Team roster & PTO
Team roster: [src/app/components/TeamRoster.tsx](src/app/components/TeamRoster.tsx)

- Lists team members, filtered by product when `productId` can be resolved.
- Clicking a member opens detail view.
- Can add a new team member (name, role, notes) for the product.

Team member detail: [src/app/components/TeamMemberDetail.tsx](src/app/components/TeamMemberDetail.tsx)

- Edit member info (name, role, notes)
- Add/remove PTO entries (name + date range)
- Changes persist to localStorage immediately.

### 7.10 Holiday management
File: [src/app/components/HolidayManagement.tsx](src/app/components/HolidayManagement.tsx)

- Holidays are global (not per product).
- Add holiday (name, start date, end date)
- Delete holiday
- Holidays affect sprint capacity and can be visualized as bands in the timeline.

---

## 8) Planning intelligence (what’s computed)

### 8.1 Conflict detection (implemented)
File: [src/app/lib/conflictDetection.ts](src/app/lib/conflictDetection.ts)

What it detects TODAY:
- **Overlapping tickets for the same assignee**.

Important detail:
- Overlap uses strict inequality: back-to-back tickets that share a boundary date are **not** treated as conflicts.

Outputs:
- `detectConflicts(tickets)` → `Map<ticketId, TicketConflict>`
- `getConflictSummary(conflicts, tickets)` → totals + affected developers + counts by developer
- `hasConflict(ticketId, conflicts)` helper

What it does NOT do today:
- It does not create conflicts for PTO or holidays (PTO/holidays are used for capacity and visualization, not conflict detection).

### 8.2 Sprint capacity calculation (implemented)
File: [src/app/lib/capacityCalculation.ts](src/app/lib/capacityCalculation.ts)

Key concepts:
- Counts **working days** (excludes weekends).
- Subtracts holiday overlap days (working-day overlap).
- Determines “developers in sprint” based on tickets that overlap the sprint and are assigned to someone other than `Unassigned`.
- Subtracts PTO overlap days for those developers (working-day overlap).

Story points → days:
- Uses `storyPointsToDays(...)` from [src/app/data/mockData.ts](src/app/data/mockData.ts)
- Release can carry a `storyPointMapping` chosen during release creation.

Utilization:
- Computes planned work in **days** (mapping-aware), then utilization percent = plannedDays / totalTeamDays.

Color helper:
- `getCapacityStatusColor(utilizationPercent)` returns hex colors for thresholds.

---

## 9) Design system & tokens

Design tokens are centralized in [src/app/lib/designTokens.ts](src/app/lib/designTokens.ts)

Includes:
- Ticket status colors (planned / in-progress / completed)
- Conflict colors
- Timeline grid colors
- Typography / spacing / shadows / transitions

Timeline panel imports:
- `designTokens` plus helper functions like `getTicketColors` and `getConflictColors`.

---

## 10) Domain layer (NEW - Feb 2026)

Pure TypeScript business logic under [src/domain](src/domain):

**Release Feasibility Engine** - deterministic sprint planning and capacity allocation:
- Effort measured in **Developer Days** (not story points)
- Auto-generates sprints within release window
- Calculates capacity: working days × developers - (weekends + holidays + PTO)
- Allocates tickets by priority (1 = highest) using first-fit greedy algorithm
- No ticket splitting; tickets that don't fit go to overflow
- Returns feasibility percentage and detailed utilization metrics

Entry point: [src/domain/index.ts](src/domain/index.ts)

Core files:
- [types.ts](src/domain/types.ts) - `TicketInput`, `ReleaseConfig`, `Sprint`, `ReleasePlan`
- [dateUtils.ts](src/domain/dateUtils.ts) - Working day calculation, sprint generation
- [capacityUtils.ts](src/domain/capacityUtils.ts) - Team capacity formulas
- [planningEngine.ts](src/domain/planningEngine.ts) - `buildReleasePlan()`, `getReleaseSummary()`
- [adapters/domainToAppMapper.ts](src/domain/adapters/domainToAppMapper.ts) - `mapReleasePlanToAppRelease()` - Converts domain output to UI format (groups by epic, handles overflow)
- [example.ts](src/domain/example.ts) - Usage demonstration

**Integration**: Adapter layer bridges domain → UI. Groups tickets by epic, maps sprints, creates "Deferred" feature for overflow.

**Audit**: See [DOMAIN_LAYER_AUDIT.md](DOMAIN_LAYER_AUDIT.md) for comprehensive analysis. See [DOMAIN_TO_APP_MAPPER_ANALYSIS.md](DOMAIN_TO_APP_MAPPER_ANALYSIS.md) for adapter design decisions.

---

## 11) What is explicitly NOT built (important)

These are not present as implemented product capabilities (do not assume they exist):

- No backend, auth, or collaboration.
- No sharing links.
- No export to PDF/PNG/Excel (import exists; export does not).
- No dependencies between tickets.
- No multi-select / bulk edit (beyond CSV import).
- No undo/redo.

Some components exist but are not currently wired into the UI:
- [src/app/components/WorkloadModal.tsx](src/app/components/WorkloadModal.tsx) (modal exists; no open button in canvas)
- [src/app/components/TeamCapacityPanel.tsx](src/app/components/TeamCapacityPanel.tsx) (component exists; not referenced elsewhere)

---

## 12) When I ask for enhancements, use this format

When I ask “What should I build next?” respond with:

1. **Clarifying questions** (0–5)
2. **Proposed features** (3–6), each:
	 - Name
	 - Problem solved
	 - Why it matters for this app
	 - Priority (P0/P1/P2), Impact, Effort
	 - Implementation plan (what data changes, what UI changes, which files)
3. **Risks / edge cases**
4. **Smallest shippable version** (MVP) + “next iteration” follow-ups

Start now by confirming you understand the current product.