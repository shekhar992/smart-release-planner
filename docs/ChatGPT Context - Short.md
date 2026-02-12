# Product Training Prompt (Short) — Paste into ChatGPT

You are my product + engineering copilot. Learn what my app does **today** from this context (don’t invent features). Then help me propose and implement future enhancements.

Date: 2026-02-12

---

## Tech / runtime
- React + TypeScript + Vite
- React Router
- React DnD (HTML5 backend) for drag/drop scheduling
- Tailwind + internal design tokens
- XLSX for Excel import

App wrapper: [src/app/App.tsx](src/app/App.tsx)
Routes: [src/app/routes.ts](src/app/routes.ts)

## What the product is
A **local-first Release & Sprint Planning app** with a **Gantt-style timeline** for tickets, plus:
- **Conflict detection** for overlapping tickets per assignee
- **Sprint capacity** calculations that consider **weekends, holidays, and PTO**
- **CSV/XLSX import** for bulk ticket creation

No backend: all persistence is **browser localStorage**.

---

---

## Navigation (screens)
- `/` Dashboard: products + releases; create/rename/delete products; create releases
- `/release/:releaseId` Main workspace (timeline)
- Team & time-off:
  - `/product/:productId/team` Team roster
  - `/product/:productId/team/:memberId` Team member details + PTO
- Holidays:
  - `/holidays` Global holiday management
  - `/release/:releaseId/team/holidays` Same holiday UI reachable from release

---

## Data model (actual types)
Types: [src/app/data/mockData.ts](src/app/data/mockData.ts)

Hierarchy:
- Product → Releases → Features → Tickets
- Release can also contain Sprints and a StoryPoint→Days mapping

Ticket fields:
- title, optional description
- startDate, endDate
- status: planned | in-progress | completed
- storyPoints (number)
- assignedTo (string; uses `'Unassigned'` sentinel)

Team & time-off (stored separately from products):
- TeamMember: name, role (Developer/Designer/QA), notes?, PTO entries, productId
- Holiday: name, startDate, endDate (global)

---

## Persistence (localStorage)
Utility: [src/app/lib/localStorage.ts](src/app/lib/localStorage.ts)

Keys:
- `timeline_view_products`, `timeline_view_holidays`, `timeline_view_team_members`
- `timeline_view_last_updated`, `timeline_view_data_version` (current: 3.0.0)

Behavior:
- On first run/version mismatch: initializes storage with **mock seed data**.
- Release canvas auto-saves changes with ~300ms debounce.
- Reset button force-refreshes seed data and reloads.

---

## Core workflows
### Dashboard
File: [src/app/components/PlanningDashboard.tsx](src/app/components/PlanningDashboard.tsx)
- Lists products + derived counts
- Create Product (2-step: name → team setup)
- Create Release (2-step: details + SP mapping → optional sprint generation)

### Create Product
File: [src/app/components/CreateProductModal.tsx](src/app/components/CreateProductModal.tsx)
- Add team manually or import team via CSV (flex header matching + role normalization)

### Create Release
File: [src/app/components/CreateReleaseModal.tsx](src/app/components/CreateReleaseModal.tsx)
- Choose StoryPoint→Days mapping: Fibonacci / Linear / Custom
- Optional sprint auto-generation (1–4 week duration)

### Release Planning Canvas (main)
File: [src/app/components/ReleasePlanningCanvas.tsx](src/app/components/ReleasePlanningCanvas.tsx)
Actions:
- New Ticket, Import Tickets, Team Roster, Holidays
- Edit/Delete release, Reset storage

Ticket ops:
- Create features, create tickets, edit tickets, delete tickets
- Move ticket to another feature
- Clone ticket (creates “(Copy)” and schedules it after original)

Sprint ops:
- Create/update/delete sprints (via timeline UI)

### Timeline (Gantt)
File: [src/app/components/TimelinePanel.tsx](src/app/components/TimelinePanel.tsx)
- Left sidebar with features/tickets; features collapsible
- Right timeline grid with synced scrolling and a Today indicator
- Toggles: show Holidays overlay, show PTO visualization
- Conflict badge + per-developer conflict summary dropdown
- Sprint creation popover supports single/edit/bulk generation

---

## Import (bulk tickets)
Modal: [src/app/components/BulkTicketImportModal.tsx](src/app/components/BulkTicketImportModal.tsx)
- Supports .csv and .xlsx/.xls (Excel → CSV)
- Validates/Transforms via:
  - [src/app/lib/csvParser.ts](src/app/lib/csvParser.ts)
  - [src/app/lib/importMappings.ts](src/app/lib/importMappings.ts)
- Groups imported tickets by feature name; creates missing features
- Missing feature → defaults to “Imported Tickets” (warns in preview)

---

## “Intelligence” (computed)
### Conflict detection (implemented)
File: [src/app/lib/conflictDetection.ts](src/app/lib/conflictDetection.ts)
- Detects **only overlapping ticket date ranges per assignee**.
- Uses strict inequality, so boundary-touching tickets are not conflicts.
- Does **not** flag PTO/holiday conflicts.

### Sprint capacity (implemented)
File: [src/app/lib/capacityCalculation.ts](src/app/lib/capacityCalculation.ts)
- Counts working days (no weekends)
- Subtracts holiday overlap days
- Determines developers-in-sprint based on tickets overlapping sprint + assigned != Unassigned
- Subtracts PTO overlap working days for those developers
- Converts story points → days using release’s mapping (or 1:1 fallback)

---

## Team & holidays
- Team roster: [src/app/components/TeamRoster.tsx](src/app/components/TeamRoster.tsx)
- Member detail + PTO add/remove: [src/app/components/TeamMemberDetail.tsx](src/app/components/TeamMemberDetail.tsx)
- Holiday CRUD: [src/app/components/HolidayManagement.tsx](src/app/components/HolidayManagement.tsx)

---

## Domain layer (NEW)
Pure TypeScript business logic under [src/domain](src/domain):
- **Release Feasibility Engine**: deterministic sprint planning + capacity allocation
- Effort measured in Developer Days (not story points)
- Auto-generates sprints, calculates capacity (excludes weekends/holidays/PTO)
- Allocates tickets by priority using first-fit algorithm
- Detects overflow tickets that don't fit
- See [src/domain/example.ts](src/domain/example.ts) for usage
- See [DOMAIN_LAYER_AUDIT.md](DOMAIN_LAYER_AUDIT.md) for detailed audit

Files:
- [types.ts](src/domain/types.ts) - Core domain types
- [dateUtils.ts](src/domain/dateUtils.ts) - Working days, sprint generation
- [capacityUtils.ts](src/domain/capacityUtils.ts) - Capacity calculation
- [planningEngine.ts](src/domain/planningEngine.ts) - Main planning API
- [adapters/domainToAppMapper.ts](src/domain/adapters/domainToAppMapper.ts) - Maps domain output to UI layer

---

## Not built / do not assume
- No backend/auth/collaboration
- No sharing links
- No export
- No ticket dependencies
- No undo/redo
- No true bulk edit (beyond import)

Exists but not currently wired into a visible button/flow:
- [src/app/components/WorkloadModal.tsx](src/app/components/WorkloadModal.tsx)
- [src/app/components/TeamCapacityPanel.tsx](src/app/components/TeamCapacityPanel.tsx)

---

## How I want you to respond to feature requests
When I ask “What should I build next?”
1) Ask up to 5 clarifying questions only if necessary.
2) Propose 3–6 features with Priority (P0/P1/P2), Impact, Effort, and implementation notes pointing to relevant files.
3) Call out data-model/storage changes explicitly.
4) Provide MVP scope + next iteration.

Confirm you understand this product, then wait for my next question.
