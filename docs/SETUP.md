# Setup and Development Guide

## Quick Start (After Cloning)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173` (or next available port)

## Project Structure

```
src/app/
├── components/          # React components
│   ├── TimelinePanel.tsx          # Main timeline view with unified scroll
│   ├── ReleasePlanningCanvas.tsx  # Release planning container
│   └── ...                        # Other UI components
├── lib/                 # Utility libraries
│   ├── conflictDetection.ts       # Developer conflict detection logic
│   └── capacityCalculation.ts     # Sprint capacity calculations
├── data/
│   └── mockData.ts               # Demo data and type definitions
└── contexts/            # React contexts for state management
```

## Key Features Implemented

### Priority 1: Developer Conflict Detection ✅
- Visual indicators (yellow highlights, warning icons)
- Conflict summary badge in header
- Hover tooltips showing overlap details
- Per-developer overlap calculation

### Priority 2: Sprint Capacity Calculation ✅
- Integrated capacity visualization in sprint header
- Progress bars with color-coded status (Over/Near/Good/Low)
- Considers holidays, PTO, team size, velocity
- Detailed tooltips with breakdown

### Enhanced UX ✅
- **Unified Scroll**: Sidebar and timeline scroll together as single canvas (JIRA-style)
- **Swimlane Structure**: Feature grouping with expand/collapse
- **Grid Rendering**: Full-height grid extends through all content
- **Sprint Bands**: Alternating backgrounds for visual separation
- **Holiday Overlays**: Visual indicators for holidays

## Technical Highlights

### Scroll Synchronization
- Both sidebar and timeline render in natural document flow
- Scroll events synchronized using refs and event handlers
- No separate scroll containers - moves as one unit

### Positioning System
- Feature headers: 40px height
- Ticket rows: 48px height
- Timeline bars use relative positioning matching sidebar flow
- Grid lines span full calculated content height

### Type Safety
- Full TypeScript with strict mode
- Exported types: `Release`, `Feature`, `Sprint`, `Ticket`, `TeamMember`, `Holiday`
- No `any` types in core logic

## Development Notes

### Mock Data
- Located in `src/app/data/mockData.ts`
- Contains demo data for Q1 2026 Sprint Planning
- Includes intentional conflicts for testing (Marcus Rivera, Elena Zhang)
- 3 sprints, 4 features, ~30 tickets

### Constants
```typescript
DAY_WIDTH = 40px          // Horizontal day spacing
ROW_HEIGHT = 48px         // Vertical ticket row height
FEATURE_HEADER_HEIGHT = 40px  // Feature header height
SIDEBAR_WIDTH = 320px     // Left sidebar fixed width
```

### Key Dependencies
- React 18.3.1
- Vite 6.3.5 (dev server + build tool)
- Tailwind CSS v4 (styling)
- TypeScript (type safety)
- react-dnd (drag and drop)
- lucide-react (icons)

## Pending Features (Priority 3)

- Sprint editing/deletion functionality
- Enhanced conflict visibility (right sidebar panel)
- Timeline zoom controls (Day/Week/Month views)
- Quick actions menu on tickets
- Dependency arrows between tickets

## Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

## Troubleshooting

### Port Already in Use
If port 5173 is occupied, Vite will automatically try 5174, 5175, etc.

### Hot Module Replacement (HMR) Issues
If changes aren't reflecting, try restarting the dev server:
```bash
# Stop with Ctrl+C, then:
npm run dev
```

### Type Errors
Check TypeScript compilation:
```bash
npx tsc --noEmit
```

## Git Workflow

Current branch: `main`
- All features committed and pushed to origin/main
- Working tree is clean
- Ready for clone on new machine

## Next Steps

1. Clone this repository
2. Run `npm install`
3. Run `npm run dev`
4. Start implementing Priority 3 features or make adjustments

---

Last updated: February 9, 2026
Commit: 7780304 - Sprint planning features with unified scroll
