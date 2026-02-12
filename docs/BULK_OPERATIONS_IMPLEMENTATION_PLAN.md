# Bulk Operations Implementation Plan (Phase 2.2)

**Created:** February 10, 2026  
**Priority:** ⭐⭐⭐⭐  
**Estimated Time:** 3-4 days  
**Status:** Planning

---

## Overview

Implement comprehensive multi-select and bulk operations system to enable efficient management of multiple tickets simultaneously. This phase focuses on selection UI, bulk actions, and context menus.

---

## Architecture & State Management

### Selection State Strategy

```typescript
// Add to GanttContext.tsx or create new SelectionContext.tsx
interface SelectionState {
  selectedTicketIds: Set<string>;
  lastSelectedId: string | null;  // For Shift+Click range selection
  selectionMode: 'none' | 'checkbox' | 'active';
}

interface SelectionActions {
  toggleTicket: (id: string) => void;
  selectRange: (fromId: string, toId: string) => void;
  selectAll: (featureId?: string) => void;
  clearSelection: () => void;
  selectMultiple: (ids: string[]) => void;
}

// Context provider
export const useSelection = () => {
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  
  // Implementation methods...
};
```

### Component Structure

```
src/app/components/
├── selection/
│   ├── SelectionCheckbox.tsx          # Individual ticket checkbox
│   ├── FeatureSelectAllCheckbox.tsx   # Select all in feature
│   ├── FloatingActionBar.tsx          # Bottom action bar when items selected
│   └── SelectionIndicator.tsx         # Visual highlight on selected rows
├── bulk-operations/
│   ├── BulkReassignDialog.tsx         # Reassign multiple tickets
│   ├── BulkMoveSprintDialog.tsx       # Move to different sprint
│   ├── BulkStatusUpdateDialog.tsx     # Update status for multiple
│   ├── BulkExportDialog.tsx           # Export selected to CSV
│   └── BulkOperationsMenu.tsx         # Dropdown with all operations
└── context-menu/
    ├── TicketContextMenu.tsx          # Right-click menu
    ├── ContextMenuItem.tsx            # Individual menu item
    └── ContextMenuSeparator.tsx       # Visual divider
```

---

## Implementation Phases

### **Phase 2.2.1: Multi-Select System (Day 1-2)**

#### Step 1.1: Selection State Context
**File:** `src/app/contexts/SelectionContext.tsx` (NEW)

**Tasks:**
- [ ] Create `SelectionContext` with state management
- [ ] Implement `toggleTicket()` for Cmd+Click selection
- [ ] Implement `selectRange()` for Shift+Click selection
  - Calculate ticket order based on sidebar position
  - Select all tickets between `lastSelectedId` and clicked ticket
- [ ] Implement `selectAll()` with optional feature filter
- [ ] Implement `clearSelection()` 
- [ ] Add `isSelected(id)` helper function
- [ ] Export `useSelection()` hook

**Technical Notes:**
- Use `Set<string>` for O(1) lookup performance
- Store selection in React state (not localStorage initially)
- Track `lastSelectedId` for range selection logic
- Consider keeping selection even when filters change (UX decision)

#### Step 1.2: Checkbox Column UI
**File:** `src/app/components/TimelinePanel.tsx` (EDIT)

**Tasks:**
- [ ] Add checkbox column toggle button in header
  - Icon: `CheckSquare` from lucide-react
  - Label: "Multi-select mode"
  - State: `showCheckboxes` boolean in component state
- [ ] Add 40px checkbox column to sidebar when enabled
  - Position: Left of ticket name
  - Header: "Select all" checkbox for entire view
- [ ] Add `SelectionCheckbox` component to each ticket row
  - Position: Start of sidebar row
  - State: Controlled by `useSelection()`
  - Click handler: `toggleTicket(ticket.id)`

**Styling:**
```tsx
// Checkbox column header
<div className="w-10 flex items-center justify-center">
  <input
    type="checkbox"
    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
    checked={allSelected}
    onChange={handleSelectAll}
  />
</div>

// Individual ticket checkbox
<div className="w-10 flex items-center justify-center">
  <input
    type="checkbox"
    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
    checked={isSelected}
    onChange={() => toggleTicket(ticket.id)}
  />
</div>
```

#### Step 1.3: Shift+Click Range Selection
**File:** `src/app/components/TimelinePanel.tsx` (EDIT)

**Tasks:**
- [ ] Add event listener to ticket rows for click with modifiers
- [ ] Detect `event.shiftKey` on click
  - If true: Call `selectRange(lastSelectedId, clickedId)`
  - If false: Normal click behavior
- [ ] Detect `event.metaKey` (Cmd on Mac) or `event.ctrlKey` (Ctrl on Windows)
  - If true: Call `toggleTicket(clickedId)` without clearing others
  - If false: Normal selection behavior
- [ ] Update `lastSelectedId` state after each selection

**Algorithm for Range Selection:**
```typescript
const selectRange = (fromId: string, toId: string) => {
  // Get flat list of all visible ticket IDs in order
  const visibleTicketIds = getVisibleTicketsInOrder();
  
  const fromIndex = visibleTicketIds.indexOf(fromId);
  const toIndex = visibleTicketIds.indexOf(toId);
  
  const startIndex = Math.min(fromIndex, toIndex);
  const endIndex = Math.max(fromIndex, toIndex);
  
  const rangeIds = visibleTicketIds.slice(startIndex, endIndex + 1);
  selectMultiple(rangeIds);
};
```

#### Step 1.4: Feature-Level Select All
**File:** `src/app/components/TimelinePanel.tsx` (EDIT)

**Tasks:**
- [ ] Add checkbox to feature header row
  - Position: Before feature name
  - State: Checked if all tickets in feature selected
  - State: Indeterminate if some tickets selected
- [ ] Implement `selectAllInFeature(featureId)` function
  - Get all ticket IDs for feature
  - Call `selectMultiple(ticketIds)`
- [ ] Click handler on feature checkbox
  - If all selected: Deselect all
  - If none/some selected: Select all

**Indeterminate State:**
```tsx
const { selectedCount, totalCount } = getFeatureSelectionState(feature.id);
const allSelected = selectedCount === totalCount;
const someSelected = selectedCount > 0 && selectedCount < totalCount;

<input
  type="checkbox"
  checked={allSelected}
  ref={(el) => el && (el.indeterminate = someSelected)}
  onChange={handleFeatureSelectAll}
/>
```

#### Step 1.5: Floating Action Bar
**File:** `src/app/components/selection/FloatingActionBar.tsx` (NEW)

**Tasks:**
- [ ] Create floating action bar component
- [ ] Position: Fixed bottom-center with translate transform
- [ ] Show only when `selectedCount > 0`
- [ ] Display selected count: "{count} tickets selected"
- [ ] Add action buttons:
  - Reassign (UserPlus icon)
  - Move to Sprint (Calendar icon)
  - Update Status (CheckCircle icon)
  - Export (Download icon)
  - Delete (Trash icon)
  - Clear (X icon)
- [ ] Implement slide-up animation on mount
- [ ] Add blur backdrop effect for better contrast

**Component Implementation:**
```tsx
import { UserPlus, Calendar, CheckCircle, Download, Trash, X } from 'lucide-react';
import { useSelection } from '@/contexts/SelectionContext';

export const FloatingActionBar = () => {
  const { selectedTicketIds, clearSelection } = useSelection();
  const [showReassign, setShowReassign] = useState(false);
  const [showMoveSprint, setShowMoveSprint] = useState(false);
  // ... other dialog states

  const selectedCount = selectedTicketIds.size;

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
        <div className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
          <span className="font-semibold text-sm">
            {selectedCount} {selectedCount === 1 ? 'ticket' : 'tickets'} selected
          </span>
          
          <div className="flex items-center gap-2 border-l border-blue-400 pl-4">
            <button
              onClick={() => setShowReassign(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500 hover:bg-blue-700 transition-colors"
            >
              <UserPlus size={16} />
              <span className="text-xs font-medium">Reassign</span>
            </button>
            
            <button
              onClick={() => setShowMoveSprint(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500 hover:bg-blue-700 transition-colors"
            >
              <Calendar size={16} />
              <span className="text-xs font-medium">Move Sprint</span>
            </button>
            
            {/* More buttons... */}
            
            <button
              onClick={clearSelection}
              className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-blue-700 hover:bg-blue-800 transition-colors"
              aria-label="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {showReassign && (
        <BulkReassignDialog
          ticketIds={Array.from(selectedTicketIds)}
          onClose={() => setShowReassign(false)}
        />
      )}
      {/* ... other dialogs */}
    </>
  );
};
```

**Animation:**
```css
/* Add to globals.css */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
```

#### Step 1.6: Visual Selection Feedback
**File:** `src/app/components/TimelinePanel.tsx` (EDIT)

**Tasks:**
- [ ] Add blue background overlay to selected sidebar rows
  - Color: `bg-blue-50` (light blue tint)
  - Border: `border-l-4 border-blue-500` (accent line)
- [ ] Add blue border to selected ticket bars in timeline
  - Border: `border-2 border-blue-500`
  - Z-index: Elevate selected bars above others
- [ ] Add transition for smooth selection/deselection
  - Duration: 150ms
  - Easing: ease-in-out

**Selected Row Styling:**
```tsx
<div
  className={cn(
    "flex items-center gap-2 px-3 py-2 transition-all duration-150",
    isSelected && "bg-blue-50 border-l-4 border-blue-500",
    !isSelected && "border-l-4 border-transparent"
  )}
>
  {/* Row content */}
</div>
```

---

### **Phase 2.2.2: Bulk Operations (Day 2-3)**

#### Step 2.1: Bulk Reassign Dialog
**File:** `src/app/components/bulk-operations/BulkReassignDialog.tsx` (NEW)

**Tasks:**
- [ ] Create dialog component with developer dropdown
- [ ] Pre-populate with list of all developers
- [ ] Show warning if reassigning tickets with existing assignments
- [ ] Display tickets being reassigned (scrollable list)
- [ ] Implement `bulkUpdateTickets()` function
  - Update `assignedTo` for all selected tickets
  - Show success toast with count
  - Clear selection after success
- [ ] Add loading state during update
- [ ] Handle errors gracefully (show which tickets failed)

**Component Structure:**
```tsx
interface BulkReassignDialogProps {
  ticketIds: string[];
  onClose: () => void;
}

export const BulkReassignDialog = ({ ticketIds, onClose }: BulkReassignDialogProps) => {
  const { developers } = useGanttContext();
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReassign = async () => {
    setIsLoading(true);
    try {
      await bulkUpdateTickets(ticketIds, { assignedTo: selectedDeveloper });
      toast.success(`${ticketIds.length} tickets reassigned successfully`);
      clearSelection();
      onClose();
    } catch (error) {
      toast.error('Failed to reassign tickets');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reassign {ticketIds.length} Tickets</AlertDialogTitle>
          <AlertDialogDescription>
            Select a developer to assign all selected tickets to.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <Select value={selectedDeveloper} onValueChange={setSelectedDeveloper}>
            <SelectTrigger>
              <SelectValue placeholder="Select developer..." />
            </SelectTrigger>
            <SelectContent>
              {developers.map(dev => (
                <SelectItem key={dev.id} value={dev.id}>
                  {dev.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Preview list */}
          <div className="max-h-48 overflow-y-auto border rounded p-2">
            <div className="text-xs text-gray-600 mb-1">Tickets to reassign:</div>
            {ticketIds.map(id => {
              const ticket = getTicketById(id);
              return (
                <div key={id} className="text-sm py-1 border-b last:border-0">
                  {ticket.title}
                </div>
              );
            })}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReassign}
            disabled={!selectedDeveloper || isLoading}
          >
            {isLoading ? 'Reassigning...' : 'Reassign'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
```

#### Step 2.2: Bulk Move Sprint Dialog
**File:** `src/app/components/bulk-operations/BulkMoveSprintDialog.tsx` (NEW)

**Tasks:**
- [ ] Create dialog with sprint dropdown
- [ ] Show all available sprints from project
- [ ] Display date range for selected sprint
- [ ] Warn about date conflicts if tickets won't fit
- [ ] Calculate capacity impact (show before/after for sprint)
- [ ] Update ticket sprint assignments on confirm
- [ ] Recalculate sprint conflicts after move
- [ ] Add loading state

**Features:**
- Sprint capacity preview (before/after story points)
- Date range display for target sprint
- Warning badges for conflicts
- Automatic conflict detection after move

#### Step 2.3: Bulk Status Update Dialog
**File:** `src/app/components/bulk-operations/BulkStatusUpdateDialog.tsx` (NEW)

**Tasks:**
- [ ] Create dialog with status radio buttons
- [ ] Options: Planned, In Progress, Completed
- [ ] Show current status distribution (e.g., "3 Planned, 2 In Progress")
- [ ] Update status for all selected tickets
- [ ] Update ticket bar colors automatically
- [ ] Add confirmation step if marking as Completed
  - "Are you sure you want to mark X tickets as completed?"
- [ ] Update progress bars for affected sprints

#### Step 2.4: Bulk Export to CSV
**File:** `src/app/components/bulk-operations/BulkExportDialog.tsx` (NEW)

**Tasks:**
- [ ] Create export dialog with column selection
- [ ] Default columns: ID, Title, Feature, Developer, Status, Sprint, Start Date, End Date, Story Points
- [ ] Optional columns: Description, Priority, Epic, Tags
- [ ] Generate CSV client-side using library or native JS
- [ ] Trigger browser download
- [ ] Add filename customization (default: `tickets-export-YYYY-MM-DD.csv`)

**CSV Generation:**
```typescript
const exportToCSV = (tickets: Ticket[], columns: string[]) => {
  const headers = columns.join(',');
  const rows = tickets.map(ticket => {
    return columns.map(col => {
      const value = ticket[col];
      // Escape commas and quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csv = [headers, ...rows].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};
```

#### Step 2.5: Bulk Delete with Confirmation
**File:** `src/app/components/bulk-operations/BulkDeleteDialog.tsx` (NEW)

**Tasks:**
- [ ] Create destructive action dialog
- [ ] Show warning about permanent deletion
- [ ] Require typing "DELETE" to confirm (prevent accidents)
- [ ] Display list of tickets being deleted
- [ ] Show impact: "This will delete X tickets from Y features"
- [ ] Remove tickets from context state
- [ ] Update sprint capacity calculations
- [ ] Show success toast with undo option (optional enhancement)

**Safety Features:**
```tsx
const [confirmText, setConfirmText] = useState('');
const canDelete = confirmText === 'DELETE';

<Input
  placeholder="Type DELETE to confirm"
  value={confirmText}
  onChange={(e) => setConfirmText(e.target.value)}
  className={cn(confirmText && !canDelete && "border-red-500")}
/>
<AlertDialogAction
  onClick={handleDelete}
  disabled={!canDelete}
  className="bg-red-600 hover:bg-red-700"
>
  Delete {ticketIds.length} Tickets
</AlertDialogAction>
```

---

### **Phase 2.2.3: Context Menu (Day 3-4)**

#### Step 3.1: Context Menu Component
**File:** `src/app/components/context-menu/TicketContextMenu.tsx` (NEW)

**Tasks:**
- [ ] Create right-click context menu component
- [ ] Position menu at cursor location
- [ ] Detect right-click on ticket bars and sidebar rows
- [ ] Menu items:
  - Duplicate Ticket
  - Copy Link to Ticket
  - Reassign to...
  - Move to Sprint...
  - Change Status...
  - ---
  - Delete (red text, destructive)
- [ ] Close menu on click outside
- [ ] Close menu on Escape key
- [ ] Close menu after action selected

**Implementation using Radix UI:**
```tsx
import * as ContextMenu from '@radix-ui/react-context-menu';
import { Copy, Link, UserPlus, Calendar, CheckCircle, Trash } from 'lucide-react';

export const TicketContextMenu = ({ ticket, children }) => {
  const handleDuplicate = () => {
    // Create copy of ticket with new ID
    duplicateTicket(ticket.id);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/ticket/${ticket.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content
          className="min-w-[220px] bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
        >
          <ContextMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer outline-none"
            onClick={handleDuplicate}
          >
            <Copy size={16} />
            Duplicate
          </ContextMenu.Item>

          <ContextMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer outline-none"
            onClick={handleCopyLink}
          >
            <Link size={16} />
            Copy link
          </ContextMenu.Item>

          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer outline-none">
              <UserPlus size={16} />
              Reassign to
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent className="min-w-[180px] bg-white rounded-md shadow-lg border border-gray-200 py-1">
                {developers.map(dev => (
                  <ContextMenu.Item
                    key={dev.id}
                    onClick={() => reassignTicket(ticket.id, dev.id)}
                    className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer outline-none"
                  >
                    {dev.name}
                  </ContextMenu.Item>
                ))}
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>

          {/* More items... */}

          <ContextMenu.Separator className="h-px bg-gray-200 my-1" />

          <ContextMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none"
            onClick={() => deleteTicket(ticket.id)}
          >
            <Trash size={16} />
            Delete
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};
```

#### Step 3.2: Integrate Context Menu
**File:** `src/app/components/TimelinePanel.tsx` (EDIT)

**Tasks:**
- [ ] Wrap sidebar ticket rows with `TicketContextMenu`
- [ ] Wrap timeline ticket bars with `TicketContextMenu`
- [ ] Prevent default browser context menu
  - `onContextMenu={(e) => e.preventDefault()}`
- [ ] Test menu positioning at screen edges (should flip to stay in viewport)

#### Step 3.3: Duplicate Ticket Functionality
**File:** `src/app/contexts/GanttContext.tsx` (EDIT)

**Tasks:**
- [ ] Implement `duplicateTicket(ticketId)` function
- [ ] Create new ticket with same properties
- [ ] Generate new unique ID
- [ ] Append " (Copy)" to title
- [ ] Place duplicate right after original in position
- [ ] Keep same feature, developer, sprint
- [ ] Mark as Planned status (regardless of original)
- [ ] Add to context state
- [ ] Show success toast

---

## Testing Checklist

### Multi-Select Testing
- [ ] Click checkbox selects/deselects individual ticket
- [ ] Shift+Click selects range of tickets
- [ ] Cmd+Click toggles individual ticket without clearing others
- [ ] Feature header checkbox selects/deselects all tickets in feature
- [ ] "Select all" header checkbox selects all visible tickets
- [ ] Selection persists when scrolling timeline
- [ ] Selection clears after bulk operation completes
- [ ] Floating action bar appears when tickets selected
- [ ] Floating action bar shows correct count
- [ ] Selected tickets have visual highlight (blue background)

### Bulk Operations Testing
- [ ] Bulk reassign updates developer for all selected tickets
- [ ] Bulk reassign shows loading state
- [ ] Bulk reassign shows success/error toast
- [ ] Bulk move sprint updates sprint for all tickets
- [ ] Bulk move sprint recalculates conflicts
- [ ] Bulk move sprint shows capacity warnings
- [ ] Bulk status update changes ticket colors
- [ ] Bulk status update recalculates sprint progress
- [ ] Bulk export generates valid CSV file
- [ ] Bulk export includes all selected columns
- [ ] Bulk delete requires confirmation ("DELETE" text)
- [ ] Bulk delete removes tickets from view
- [ ] All operations handle errors gracefully

### Context Menu Testing
- [ ] Right-click on ticket bar shows menu
- [ ] Right-click on sidebar row shows menu
- [ ] Menu positioned correctly at cursor
- [ ] Menu stays in viewport at screen edges
- [ ] Click outside closes menu
- [ ] Escape key closes menu
- [ ] Duplicate creates copy with "(Copy)" suffix
- [ ] Copy link saves to clipboard
- [ ] Reassign submenu shows all developers
- [ ] Move to sprint submenu shows all sprints
- [ ] Delete shows confirmation dialog
- [ ] All actions close menu after execution

---

## Performance Considerations

### Large Selection Sets
- Use `Set<string>` for O(1) lookups instead of arrays
- Debounce selection updates if selecting 100+ tickets at once
- Virtual scrolling for preview lists in dialogs
- Batch updates for bulk operations (don't update one by one)

### Context Menu
- Portal rendering to avoid DOM nesting issues
- Lazy load submenu content (only render when opened)
- Position calculation should be fast (<16ms)

### Visual Feedback
- Use CSS transforms for selection highlights (GPU-accelerated)
- Avoid layout thrashing when toggling multiple checkboxes
- Throttle scroll handlers if any

---

## Dependencies to Install

```bash
npm install @radix-ui/react-context-menu
npm install sonner  # For toast notifications
```

Already available:
- @radix-ui/react-alert-dialog ✅
- @radix-ui/react-select ✅
- lucide-react ✅

---

## Integration Points

### GanttContext.tsx Updates Needed
```typescript
// Add these functions to context
interface GanttContextType {
  // ... existing properties
  
  // Bulk operations
  bulkUpdateTickets: (ticketIds: string[], updates: Partial<Ticket>) => Promise<void>;
  bulkDeleteTickets: (ticketIds: string[]) => Promise<void>;
  duplicateTicket: (ticketId: string) => Promise<Ticket>;
  
  // Helpers
  getTicketById: (id: string) => Ticket | undefined;
  getVisibleTicketsInOrder: () => Ticket[];
  recalculateSprintConflicts: () => void;
}
```

### TimelinePanel.tsx Updates Needed
- Import `SelectionContext` and `useSelection` hook
- Add checkbox column toggle button in header
- Add 40px checkbox column to sidebar
- Wrap rows with context menu
- Add selection highlight classes
- Import and render `FloatingActionBar`

---

## Rollout Strategy

### Phase 1: Core Selection (Day 1-2)
- Implement selection context
- Add checkboxes to UI
- Add floating action bar (buttons disabled initially)
- Test multi-select interactions thoroughly

### Phase 2: Bulk Operations (Day 2-3)
- Implement reassign dialog
- Implement move sprint dialog
- Implement status update dialog
- Implement export functionality
- Implement delete with confirmation
- Wire up floating action bar buttons

### Phase 3: Context Menu (Day 3-4)
- Add context menu component
- Integrate with ticket rows and bars
- Implement quick actions (duplicate, copy link)
- Add submenu navigation
- Polish positioning and animations

### Phase 4: Testing & Polish (Day 4)
- Comprehensive testing of all features
- Edge case handling (empty selections, errors)
- Accessibility review (keyboard navigation)
- Performance optimization if needed
- Documentation and code comments

---

## Success Metrics

**User Efficiency:**
- Reduce time to reassign 10 tickets from 3 minutes → 30 seconds
- Enable bulk sprint moves without individual drag-and-drop
- Quick access to common actions via context menu

**Technical Quality:**
- Zero UI freezes during bulk operations
- Sub-16ms selection updates
- Proper error handling with user feedback
- Clean undo/redo support (future enhancement)

**User Experience:**
- Intuitive Shift+Click and Cmd+Click behaviors (match OS standards)
- Clear visual feedback for all selection states
- Confirmation for destructive actions
- Toast notifications for all operations

---

## Future Enhancements (Post-Phase 2.2)

- **Undo/Redo:** Implement command pattern for bulk operations
- **Copy/Paste:** Cmd+C/Cmd+V keyboard shortcuts
- **Drag Multiple:** Drag selection to move all tickets at once
- **Selection History:** Recent selections dropdown
- **Smart Select:** "Select all unassigned", "Select all high priority"
- **Bulk Edit Form:** Single form to edit all properties at once
- **Selection Persistence:** Remember selections across page refreshes
- **Collaborative Selection:** Show other users' selections in real-time

---

## Questions for Product Owner

1. **Selection Persistence:** Should selection persist when:
   - Switching releases?
   - Applying filters?
   - Refreshing page?

2. **Bulk Delete Undo:** Should we implement undo for deleted tickets (requires backend support)?

3. **Selection Limits:** Should there be a max selection count (e.g., 100 tickets max)?

4. **Keyboard Shortcuts:** Any specific shortcuts preferred beyond Shift+Click and Cmd+Click?

5. **Export Format:** CSV only, or also JSON/Excel?

6. **Context Menu:** Any additional quick actions needed?

---

**Ready to implement?** This plan provides a clear roadmap for adding robust bulk operations to the timeline view. Estimated completion: 3-4 days with testing.
