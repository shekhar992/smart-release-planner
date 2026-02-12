# Import Functionality Analysis & Issues

**Date:** February 10, 2026  
**Status:** ⚠️ Critical Issues Found

---

## 🔍 Current State Analysis

### Existing Import System (ImportReleaseWizard.tsx)

**Purpose:** Import complete release with tickets, team, PTO, holidays  
**Location:** `src/app/components/ImportReleaseWizard.tsx`  
**Flow:** 3-step wizard for release creation

**Current CSV Format (from templates):**

#### Tickets Template
```csv
Ticket Name,Story Points,Assigned To,Start Date,End Date,Feature
User Authentication,5,Alice Chen,2024-03-01,2024-03-05,Auth System
```

#### Team Template
```csv
Name,Role
Alice Chen,Engineer
```

#### PTO Template
```csv
Team Member,Start Date,End Date,Reason
Alice Chen,2024-03-15,2024-03-17,Vacation
```

#### Holidays Template
```csv
Holiday Name,Start Date,End Date
Memorial Day,2024-05-27,2024-05-27
```

---

### New Bulk Import System (BulkImportWizard.tsx)

**Purpose:** Import individual entity types with robust validation  
**Location:** `src/app/components/BulkImportWizard.tsx`  
**Flow:** 4-step wizard for validated imports

**CSV Format (from sample files):**

#### tickets-sample.csv
```csv
id,title,startDate,endDate,status,storyPoints,assignedTo
t1,Implement OAuth2 authentication,2026-02-15,2026-02-22,planned,8,Sarah Chen
```

#### team-members-sample.csv
```csv
id,name,role,notes
tm1,Sarah Chen,Developer,Senior full-stack engineer
```

---

## ⚠️ CRITICAL ISSUES IDENTIFIED

### Issue 1: **Column Name Mismatch**

**Existing ImportReleaseWizard expects:**
- `Ticket Name` → New system uses: `title`
- `Assigned To` → New system uses: `assignedTo`
- `Story Points` → New system uses: `storyPoints`
- `Name` (team) → New system uses: `name`
- `Role` (team) → New system uses: `role`

**Impact:** Sample CSV files won't work with existing ImportReleaseWizard  
**Severity:** 🔴 Critical

---

### Issue 2: **Missing Required Field - ID**

**Existing system:** No ID field in templates  
**New system:** Requires unique `id` field for all entities

**Problem:** The existing ImportReleaseWizard doesn't generate or require IDs, but the data structures need them.

**Impact:** Data imported via existing wizard may have ID conflicts  
**Severity:** 🔴 Critical

---

### Issue 3: **Validation Differences**

**Existing ImportReleaseWizard:**
- ✅ Basic CSV parsing with `line.split(',')`
- ❌ No validation for required fields
- ❌ No date format validation
- ❌ No enum validation (status, role)
- ❌ No relationship checking
- ❌ Doesn't handle quoted CSV values
- ❌ No error reporting beyond file count

**New BulkImportWizard:**
- ✅ Proper CSV parsing with quoted value support
- ✅ Field-level validation with error messages
- ✅ Date format validation (YYYY-MM-DD)
- ✅ Enum validation with clear error messages
- ✅ Relationship warnings (e.g., developer not found)
- ✅ Row-by-row error reporting

**Impact:** Existing wizard allows invalid data to be imported  
**Severity:** 🟡 High

---

### Issue 4: **Status Field Missing**

**Existing tickets template:** No status field  
**New tickets template:** Requires `status` (planned/in-progress/completed)

**Current data structure needs status:**
```typescript
export interface Ticket {
  status: 'in-progress' | 'planned' | 'completed';
  // other fields...
}
```

**Impact:** Imported tickets have no status, may cause runtime errors  
**Severity:** 🟡 High

---

### Issue 5: **Feature Grouping Not Handled**

**Existing template:** Has "Feature" column but doesn't create Feature objects  
**New system:** Features are separate entities that need to be imported first

**Impact:** Feature groupings lost during import  
**Severity:** 🟡 Medium

---

### Issue 6: **Role Value Mismatch**

**Existing template uses:** "Engineer", "Designer" (generic)  
**Data structure expects:** "Developer", "Designer", "QA" (specific)

```typescript
role: 'Developer' | 'Designer' | 'QA';
```

**Impact:** "Engineer" role invalid, will fail validation in proper system  
**Severity:** 🟡 Medium

---

### Issue 7: **Documentation Inconsistency**

**BULK_IMPORT_IMPLEMENTATION_GUIDE.md** references:
- BulkImportWizard component ✅
- New CSV format with validation ✅
- Sample files in `/sample-import-data/` ✅

**But doesn't mention:**
- Existing ImportReleaseWizard ❌
- Format incompatibility ❌
- Migration path ❌

**Impact:** Confusion about which system to use  
**Severity:** 🟡 Medium

---

## 🎯 RECOMMENDED SOLUTIONS

### Solution 1: Update ImportReleaseWizard Templates (Quick Fix)

**Update the templates to match the data structure:**

#### New Tickets Template
```csv
id,title,startDate,endDate,status,storyPoints,assignedTo,feature
t1,User Authentication,2024-03-01,2024-03-05,planned,5,Alice Chen,Auth System
t2,Database Schema,2024-03-04,2024-03-08,planned,8,Bob Smith,Backend
t3,Dashboard UI,2024-03-06,2024-03-10,planned,3,Carol White,Frontend
```

#### New Team Template
```csv
id,name,role,notes
tm1,Alice Chen,Developer,Full-stack engineer
tm2,Bob Smith,Developer,Backend specialist
tm3,Carol White,Designer,UI/UX designer
```

#### New PTO Template
```csv
id,name,startDate,endDate
pto1,Alice Chen,2024-03-15,2024-03-17
pto2,Bob Smith,2024-03-20,2024-03-20
```

#### New Holidays Template
```csv
id,name,startDate,endDate
h1,Memorial Day,2024-05-27,2024-05-27
h2,Independence Day,2024-07-04,2024-07-04
```

**Files to modify:**
- `src/app/components/ImportReleaseWizard.tsx` (lines 240-280 templates array)

---

### Solution 2: Integrate Validation into ImportReleaseWizard

**Use the CSV parser and validators from BulkImportWizard:**

```tsx
import { parseCSV, validateAndTransformCSV } from '../lib/csvParser';
import { 
  ticketImportMapping, 
  teamMemberImportMapping,
  ptoImportMapping,
  holidayImportMapping 
} from '../lib/importMappings';

// In handleFileUpload function:
const handleFileUpload = async (type: 'tickets' | 'team' | 'pto' | 'holidays', file: File | null) => {
  if (file) {
    const text = await file.text();
    const { headers, rows } = parseCSV(text);
    
    let mapping;
    switch(type) {
      case 'tickets': mapping = ticketImportMapping; break;
      case 'team': mapping = teamMemberImportMapping; break;
      case 'pto': mapping = ptoImportMapping; break;
      case 'holidays': mapping = holidayImportMapping; break;
    }
    
    const result = validateAndTransformCSV(headers, rows, mapping);
    
    if (result.errors.length > 0) {
      // Show validation errors
      alert(`Validation errors found: ${result.errors.length} issues`);
      return;
    }
    
    // Store validated data
    setParsedData(prev => ({
      ...prev,
      [`${type}Count`]: result.data.length,
      [type]: result.data
    }));
  }
};
```

---

### Solution 3: Deprecate Old Format, Use New System Only

**Recommended approach:**

1. **Keep ImportReleaseWizard** for the 3-step release creation flow
2. **Replace CSV parsing** with robust validation from BulkImportWizard
3. **Update templates** to match new format
4. **Use sample CSV files** as the standard format
5. **Add migration note** in docs

**Benefits:**
- ✅ Single source of truth for CSV format
- ✅ Robust validation across all import paths
- ✅ Consistent user experience
- ✅ Better error messages

---

### Solution 4: Create Unified Import System

**Long-term solution (if time permits):**

Merge both wizards into one comprehensive system:

```
Import Options:
│
├─ Quick Import (BulkImportWizard)
│  ├─ Import Tickets
│  ├─ Import Team Members
│  ├─ Import Features
│  ├─ Import Sprints
│  └─ Import Releases
│
└─ Create Release (ImportReleaseWizard)
   ├─ Download Templates
   ├─ Upload All Files Together
   └─ Create Complete Release
```

Both flows use the same:
- CSV parser
- Validation rules
- Error handling
- Sample CSVs

---

## 📋 ACTION ITEMS

### Immediate (Required for functionality):

1. **✅ Update ImportReleaseWizard Templates** (30 min)
   - Add `id` column to all templates
   - Change `Ticket Name` → `title`
   - Change `Assigned To` → `assignedTo`
   - Add `status` column to tickets
   - Change `Role: Engineer` → `Developer`

2. **✅ Integrate CSV Parser** (1 hour)
   - Import parseCSV and validators
   - Replace `line.split(',')` with proper parsing
   - Add validation error display
   - Handle quoted values properly

3. **✅ Update Sample CSV Files** (15 min)
   - Ensure all sample files use consistent format
   - Add example with Features
   - Update ERROR-EXAMPLES.md

4. **✅ Update Documentation** (30 min)
   - Add note about ImportReleaseWizard vs BulkImportWizard
   - Document which wizard to use when
   - Add migration guide

### Enhancement (Nice to have):

5. **⏳ Add ID Auto-Generation** (30 min)
   - If ID column missing, generate IDs automatically
   - Show warning about auto-generated IDs

6. **⏳ Feature Import Support** (1 hour)
   - Parse feature column from tickets CSV
   - Auto-create Feature objects
   - Group tickets under features

---

## 🚦 Quick Decision Matrix

### When to use ImportReleaseWizard:
- ✅ Creating a new release from scratch
- ✅ Have all data ready (tickets + team + optionally PTO/holidays)
- ✅ Want guided 3-step flow

### When to use BulkImportWizard:
- ✅ Importing one entity type at a time
- ✅ Need detailed validation feedback
- ✅ Updating existing data
- ✅ Want flexibility in import order

---

## 💾 Files That Need Updates

1. `/src/app/components/ImportReleaseWizard.tsx`
   - Lines 240-305: Update template definitions
   - Lines 50-115: Integrate CSV parser and validation

2. `/sample-import-data/tickets-sample.csv`
   - Add `feature` column (optional but useful)

3. `/BULK_IMPORT_IMPLEMENTATION_GUIDE.md`
   - Add section: "Existing ImportReleaseWizard vs New BulkImportWizard"
   - Add migration guide

4. Create new file: `/IMPORT_SYSTEMS_COMPARISON.md`
   - Side-by-side comparison
   - When to use which system
   - CSV format reference

---

## 📊 Impact Summary

**Current State:**
- ❌ Two incompatible import systems
- ❌ Sample CSVs don't work with existing wizard
- ❌ No validation in existing wizard
- ❌ Documentation doesn't mention both systems

**After Fixes:**
- ✅ Consistent CSV format across both systems
- ✅ Robust validation everywhere
- ✅ Sample CSVs work with both wizards
- ✅ Clear documentation on which to use
- ✅ Better error messages
- ✅ Production-ready import functionality

---

## 🎯 Recommended Priority: HIGH

**Why:** The import functionality is broken - sample CSV files provided to the user won't work with the existing ImportReleaseWizard that's already in the app.

**Risk if not fixed:** User tries to import data and gets confusing errors or data corruption.

**Time to fix:** ~2-3 hours for comprehensive solution

---

Would you like me to proceed with implementing these fixes?
