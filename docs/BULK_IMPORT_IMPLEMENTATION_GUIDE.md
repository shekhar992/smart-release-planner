# Bulk Import Wizard - Implementation Guide

**Created:** February 10, 2026  
**Status:** Complete & Ready to Integrate  
**Estimated Integration Time:** 30-60 minutes

---

## 📦 What's Been Built

A complete end-to-end bulk import system with:

### ✅ Core Components
1. **csvParser.ts** - CSV parsing and validation engine
2. **importMappings.ts** - Entity-specific column mappings  
3. **BulkImportWizard.tsx** - Full wizard UI with 4 steps

### ✅ Sample Data Files
7 valid sample CSVs + 2 error test files in `/sample-import-data/`:
- tickets-sample.csv (20 tickets)
- team-members-sample.csv (12 team members)
- features-sample.csv (10 features)
- sprints-sample.csv (8 sprints)
- releases-sample.csv (4 releases)
- pto-sample.csv (10 PTO entries)
- holidays-sample.csv (10 holidays)
- tickets-with-errors.csv (for testing validation)
- team-members-with-errors.csv (for testing validation)

### ✅ Documentation
- README.md - User guide with CSV format requirements
- ERROR-EXAMPLES.md - Detailed error testing guide

---

## 🚀 Integration Steps

### Step 1: Add Import Button to Your App

Add an "Import" button to your main navigation or toolbar:

```tsx
// In your main App.tsx or TimelinePanel.tsx

import { BulkImportWizard } from './components/BulkImportWizard';
import { Upload } from 'lucide-react';

const [showImportWizard, setShowImportWizard] = useState(false);

// Add button to your toolbar
<button
  onClick={() => setShowImportWizard(true)}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
>
  <Upload size={16} />
  Import Data
</button>

// Render wizard when shown
{showImportWizard && (
  <BulkImportWizard
    onClose={() => setShowImportWizard(false)}
    onImportComplete={handleImportComplete}
    existingData={{
      tickets: allTickets,
      teamMembers: teamMembers,
      features: features,
      sprints: sprints,
      releases: releases
    }}
  />
)}
```

### Step 2: Implement Import Handler

Handle the imported data in your context/state management:

```tsx
const handleImportComplete = (entityType: ImportEntityType, data: any[]) => {
  switch (entityType) {
    case 'tickets':
      // Add tickets to your state
      setTickets(prev => [...prev, ...data]);
      toast.success(`Imported ${data.length} tickets successfully!`);
      break;
      
    case 'team-members':
      // Add team members to your state
      setTeamMembers(prev => [...prev, ...data]);
      toast.success(`Imported ${data.length} team members successfully!`);
      break;
      
    case 'features':
      setFeatures(prev => [...prev, ...data]);
      toast.success(`Imported ${data.length} features successfully!`);
      break;
      
    case 'sprints':
      setSprints(prev => [...prev, ...data]);
      toast.success(`Imported ${data.length} sprints successfully!`);
      break;
      
    case 'releases':
      setReleases(prev => [...prev, ...data]);
      toast.success(`Imported ${data.length} releases successfully!`);
      break;
      
    case 'pto':
      // Assuming PTO is nested under team members
      // You'll need to match by name and add to correct team member
      data.forEach(ptoEntry => {
        const member = teamMembers.find(tm => tm.name === ptoEntry.name);
        if (member) {
          member.pto = member.pto || [];
          member.pto.push({
            id: ptoEntry.id,
            name: ptoEntry.name,
            startDate: ptoEntry.startDate,
            endDate: ptoEntry.endDate
          });
        }
      });
      toast.success(`Imported ${data.length} PTO entries successfully!`);
      break;
      
    case 'holidays':
      setHolidays(prev => [...prev, ...data]);
      toast.success(`Imported ${data.length} holidays successfully!`);
      break;
  }
  
  // Close the wizard after successful import
  setShowImportWizard(false);
};
```

### Step 3: Install Toast Notifications (if not already installed)

The wizard uses toast notifications for success messages:

```bash
npm install sonner
```

Then add the Toaster component to your app root:

```tsx
// In App.tsx or main.tsx
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      {/* Your app content */}
    </>
  );
}
```

### Step 4: Test the Integration

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Click the Import button** you added

3. **Test with sample files:**
   - Import `team-members-sample.csv` first
   - Then import `tickets-sample.csv`
   - Try other entity types

4. **Test validation:**
   - Try `tickets-with-errors.csv`
   - Verify errors are shown and import is blocked
   - Fix errors and retry

---

## 🎨 UI Customization

### Change Wizard Colors

The wizard uses Tailwind classes. To customize:

```tsx
// Primary button color (currently blue)
className="bg-blue-600 hover:bg-blue-700"
// Change to green:
className="bg-green-600 hover:bg-green-700"

// Destructive actions (currently red)
className="bg-red-600 hover:bg-red-700"

// Step progress circles
className="bg-blue-600"  // Active step
className="bg-green-500" // Completed step
className="bg-gray-300"  // Upcoming step
```

### Adjust Wizard Size

```tsx
// Current: max-w-4xl (1024px)
<div className="max-w-4xl">

// Smaller:
<div className="max-w-2xl">

// Larger:
<div className="max-w-6xl">
```

### Add Custom Validation Rules

Edit `src/app/lib/importMappings.ts`:

```typescript
// Add custom validator
{
  csvColumn: 'storyPoints',
  dataField: 'storyPoints',
  required: true,
  transformer: transformers.toNumber,
  validator: (value) => {
    // Only allow Fibonacci numbers
    const fibonacci = [1, 2, 3, 5, 8, 13, 21];
    return fibonacci.includes(Number(value));
  }
}
```

---

## 📊 Data Structure Considerations

### Current Import Behavior: ADD ONLY

The wizard currently **adds** new items without checking for duplicates.

If you need **update** or **upsert** behavior:

```typescript
// Example: Upsert tickets (update if ID exists, add if new)
const handleTicketImport = (importedTickets: Ticket[]) => {
  setTickets(prev => {
    const ticketMap = new Map(prev.map(t => [t.id, t]));
    
    importedTickets.forEach(ticket => {
      ticketMap.set(ticket.id, ticket); // Overwrites if exists
    });
    
    return Array.from(ticketMap.values());
  });
};
```

### Handling Nested Relationships

Current structure has nested relationships:
- Product → Releases → Features → Tickets

For flat CSV imports, you might need to:

1. **Import hierarchy separately:**
   ```
   1. Import releases
   2. Import features (with releaseId reference)
   3. Import tickets (with featureId reference)
   ```

2. **Add relationship columns to CSV:**
   ```csv
   id,title,featureId,releaseId,startDate,endDate,...
   t1,Task 1,f1,r1,2026-02-15,2026-02-22,...
   ```

3. **Update importMappings.ts** to include these fields:
   ```typescript
   {
     csvColumn: 'featureId',
     dataField: 'featureId',
     required: true,
     transformer: transformers.toString
   }
   ```

---

## 🔧 Advanced Features (Optional)

### Feature 1: Auto-match Team Members by Name

If CSV has developer names but you need IDs:

```typescript
// In importMappings.ts for tickets
{
  csvColumn: 'assignedTo',
  dataField: 'assignedTo',
  required: true,
  transformer: (value, context) => {
    // Look up team member by name and return ID
    const member = context.teamMembers.find(tm => tm.name === value);
    return member ? member.id : value; // Fallback to name if not found
  }
}
```

### Feature 2: Bulk Export

Add an export button that generates CSV from current data:

```tsx
import { exportToCSV } from '../lib/csvParser';

<button onClick={() => exportToCSV(tickets, 'tickets-export.csv')}>
  <Download size={16} />
  Export Tickets
</button>
```

### Feature 3: Import History

Track imports for audit purposes:

```typescript
interface ImportHistory {
  id: string;
  timestamp: Date;
  entityType: ImportEntityType;
  filename: string;
  rowCount: number;
  userId: string;
}

const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);

const handleImportComplete = (entityType, data, filename) => {
  // ... existing import logic
  
  setImportHistory(prev => [...prev, {
    id: uuidv4(),
    timestamp: new Date(),
    entityType,
    filename,
    rowCount: data.length,
    userId: currentUser.id
  }]);
};
```

### Feature 4: Scheduled Imports

For recurring imports (e.g., daily PTO sync):

```typescript
// Use a background job or API endpoint
const scheduledImport = async () => {
  const response = await fetch('/api/import-data');
  const csvContent = await response.text();
  
  const { headers, rows } = parseCSV(csvContent);
  const result = validateAndTransformCSV(headers, rows, ptoImportMapping);
  
  if (result.errors.length === 0) {
    handleImportComplete('pto', result.data);
  }
};
```

---

## 🧪 Testing Checklist

Before deploying to production:

- [ ] Import each entity type with sample files
- [ ] Test validation with error files
- [ ] Verify empty CSV handling
- [ ] Test with large files (100+ rows)
- [ ] Check date parsing in different browsers
- [ ] Test with Excel-exported CSVs
- [ ] Test with Google Sheets-exported CSVs
- [ ] Verify relationship warnings work
- [ ] Test closing wizard at each step
- [ ] Check mobile responsiveness
- [ ] Test with slow file reads (large files)
- [ ] Verify toast notifications appear
- [ ] Check keyboard navigation (Tab, Escape)
- [ ] Test download template button

---

## 🚨 Known Limitations

1. **File Size**: Browser-based parsing may struggle with files >10MB
   - **Solution**: Add file size check before parsing
   - **Future**: Move to server-side processing for large files

2. **Excel Format**: Only CSV is supported, not .xlsx
   - **Solution**: Users must export Excel as CSV
   - **Future**: Add library like `xlsx` for native Excel support

3. **Date Formats**: Only YYYY-MM-DD is supported
   - **Solution**: Clear documentation + error messages
   - **Future**: Add date format detection/conversion

4. **No Undo**: Imported data can't be batch-undone
   - **Solution**: Manual deletion of imported items
   - **Future**: Add "Undo import" feature with import history

5. **Duplicate IDs**: No automatic ID conflict resolution
   - **Solution**: User must ensure unique IDs in CSV
   - **Future**: Add option to auto-generate IDs

---

## 📈 Performance Tips

### For Large Files (1000+ rows):

1. **Add progress indicator:**
   ```tsx
   const [progress, setProgress] = useState(0);
   
   // In parseCSV
   rows.forEach((row, index) => {
     // Process row...
     setProgress((index / rows.length) * 100);
   });
   ```

2. **Use Web Workers:**
   ```typescript
   const worker = new Worker('/csv-parser-worker.js');
   worker.postMessage({ csvContent });
   worker.onmessage = (e) => {
     setParseResult(e.data);
   };
   ```

3. **Batch state updates:**
   ```typescript
   // Instead of: data.forEach(item => addItem(item));
   // Use: addItems(data); // Single batch update
   ```

---

## 🎓 Learning Resources

### CSV Format Specification
- [RFC 4180](https://www.ietf.org/rfc/rfc4180.txt) - Official CSV spec

### Date Formats
- [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) - International date standard

### React File Upload
- [MDN File API](https://developer.mozilla.org/en-US/docs/Web/API/File)

### Validation Best Practices
- Field-level validation (per cell)
- Row-level validation (cross-field checks)
- Batch-level validation (relationship checks)

---

## 📞 Support & Troubleshooting

### Common Integration Issues

**Issue**: "Cannot find module './lib/csvParser'"
**Fix**: Ensure `csvParser.ts` is at `src/app/lib/csvParser.ts`

**Issue**: "Toaster is not defined"
**Fix**: Install sonner: `npm install sonner`

**Issue**: "Type error on ImportEntityType"
**Fix**: Import from correct path: `import { ImportEntityType } from '../lib/importMappings'`

**Issue**: "Wizard doesn't show"
**Fix**: Check that `showImportWizard` state is working and wizard is rendered outside any overflow:hidden containers

---

## ✅ You're Ready!

The bulk import wizard is fully built and documented. Just follow the integration steps above to add it to your app.

**Sample files location:**
```
/sample-import-data/
├── tickets-sample.csv
├── team-members-sample.csv
├── features-sample.csv
├── sprints-sample.csv
├── releases-sample.csv
├── pto-sample.csv
├── holidays-sample.csv
├── tickets-with-errors.csv
├── team-members-with-errors.csv
├── README.md
└── ERROR-EXAMPLES.md
```

**Test it yourself:**
1. Add import button to your app
2. Open wizard
3. Upload any sample CSV
4. See the magic happen! ✨

Happy importing! 🚀
