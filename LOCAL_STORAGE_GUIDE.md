# Local Test Storage Guide

## Overview
Your timeline view now has **persistent local storage** - all your test data is automatically saved to your browser's localStorage and survives:
- ✅ Page refreshes
- ✅ Navigation between screens
- ✅ Browser restarts (until you clear cache)

## How It Works

### Automatic Saving
Every time you make changes (drag tickets, edit dates, add features, etc.), the data is automatically saved to localStorage:
```
Data saved • 10:45:32 AM
```

You'll see this indicator in the top header.

### What Gets Saved
- All ticket modifications (dates, assignees, story points)
- New features and tickets you create
- Sprint changes
- Release planning data

### Storage Location
Data is stored in your browser's localStorage under these keys:
- `timeline_view_products` - All products and releases
- `timeline_view_last_updated` - Timestamp of last save

### Resetting Data
Click the **"Reset" button** in the header to:
1. Clear all your test data
2. Restore original mock data
3. Refresh the page

**⚠️ Warning**: This cannot be undone!

## Testing Workflow

### Adding Test Data

**1. Edit existing tickets:**
- Drag to change dates
- Click to edit details
- Changes save automatically

**2. Add new features:**
- Use "+ Add Feature" button
- Create tickets within features
- All persists across navigation

**3. Create sprints:**
- Use "+ Add Sprint" button
- Set dates and names
- Capacity calculations persist

### Verification Steps

1. Make changes in the timeline view
2. Navigate away (e.g., go to Dashboard)
3. Come back - your changes are still there! ✅
4. Refresh the page - still there! ✅
5. Close and reopen browser - still there! ✅

### Best Practices

**For clean testing sessions:**
1. Start fresh: Click "Reset" button
2. Make your test modifications
3. Test the flow
4. Reset when done

**For ongoing work:**
- Your data persists automatically
- No manual saving needed
- Green indicator shows last save time

## Technical Details

### Data Structure
The storage system handles:
- Proper date serialization/deserialization
- Nested object structures (Products → Releases → Features → Tickets)
- Type safety with TypeScript

### Browser Compatibility
Works in all modern browsers with localStorage API:
- Chrome/Edge
- Firefox
- Safari

### Storage Limits
- ~5-10MB per domain (plenty for planning data)
- If you hit limits, click Reset to clear

### Privacy Note
- Data is stored **only in your browser**
- Not sent to any server
- Clearing browser data will erase it

## Troubleshooting

**Problem**: Changes aren't saving
- **Solution**: Check browser console for errors
- **Fallback**: Click Reset and try again

**Problem**: Can't see old data
- **Solution**: Storage might be full or cleared
- **Action**: Click Reset to restore mock data

**Problem**: Want to export data
- **Solution**: Open browser DevTools → Application → Local Storage → Copy `timeline_view_products`

## Developer Notes

### Storage API
Located in: `src/app/lib/localStorage.ts`

Key functions:
```typescript
saveProducts(products)      // Save all products
loadProducts()              // Load from storage
saveRelease(productId, release)  // Save specific release
clearStorage()              // Reset everything
```

### Integration Points
- **ReleasePlanningCanvas**: Auto-saves on state change
- **useEffect hooks**: Handle save/load lifecycle
- **Header indicator**: Shows save status

---

**Questions?** Check the implementation in:
- `src/app/lib/localStorage.ts` - Storage utilities
- `src/app/components/ReleasePlanningCanvas.tsx` - Integration

Happy testing! 🚀
