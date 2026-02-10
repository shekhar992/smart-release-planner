# Test Files with Validation Errors

These files contain intentional errors to help you test the validation system.

## 📋 tickets-with-errors.csv

This file contains 10 rows with various validation errors:

### Row-by-Row Error Analysis:

1. **Row 2 (t1)** - ✅ Valid (no errors)

2. **Row 3 (t2)** - ❌ **ERROR: Missing startDate**
   - `startDate` field is empty (required field)
   - Fix: Add a valid date like `2026-02-10`

3. **Row 4 (t3)** - ❌ **ERROR: End date before start date**
   - `startDate`: 2026-02-19
   - `endDate`: 2026-02-15 (3 days before start!)
   - Fix: Change endDate to `2026-02-19` or later

4. **Row 5 (t4)** - ❌ **ERROR: Invalid status value**
   - `status`: "in-review" (not a valid option)
   - Valid options: `planned`, `in-progress`, `completed`
   - Fix: Change to one of the valid statuses

5. **Row 6 (t5)** - ❌ **ERROR: Invalid storyPoints**
   - `storyPoints`: "invalid" (must be a number)
   - Fix: Change to a number like `5`

6. **Row 7 (t6)** - ❌ **MULTIPLE ERRORS:**
   - Invalid date format: "invalid-date"
   - Missing assignedTo (empty string)
   - Fix both issues

7. **Row 8 (t7)** - ❌ **ERROR: Negative story points**
   - `storyPoints`: -5 (must be positive)
   - Fix: Change to a positive number like `5`

8. **Row 9 (Missing ID)** - ❌ **ERROR: Missing required field**
   - `id` field is empty
   - Fix: Add an ID like `t8`

9. **Row 10 (t9)** - ⚠️ **WARNING: Developer not found**
   - `assignedTo`: "NonExistentDeveloper"
   - This is a warning, not an error
   - Import will succeed, but you should fix the assignment

10. **Row 11 (t10)** - ⚠️ **WARNING: Zero story points**
    - `storyPoints`: 0 (technically valid, but unusual)
    - Consider if this is intentional

### Expected Validation Summary:
- ✅ **Valid rows**: 1 (only t1)
- ❌ **Errors**: 7 rows with blocking errors
- ⚠️ **Warnings**: 2 rows with non-blocking issues

---

## 👥 team-members-with-errors.csv

This file contains 8 rows with various validation errors:

### Row-by-Row Error Analysis:

1. **Row 2 (tm1)** - ✅ Valid (no errors)

2. **Row 3 (Missing ID)** - ❌ **ERROR: Missing required field**
   - `id` field is empty
   - Fix: Add an ID like `tm2`

3. **Row 4 (tm3)** - ❌ **ERROR: Invalid role**
   - `role`: "Engineer" (not a valid option)
   - Valid options: `Developer`, `Designer`, `QA`
   - Fix: Change to `Developer`

4. **Row 5 (tm4)** - ✅ Valid (notes can be empty)

5. **Row 6 (tm5)** - ✅ Valid

6. **Row 7 (tm6)** - ❌ **ERROR: Invalid role**
   - `role`: "Manager" (not a valid option)
   - Fix: Change to a valid role

7. **Row 8 (Missing name)** - ❌ **ERROR: Missing required field**
   - `name` field is empty
   - Fix: Add a name like `Lisa Anderson`

8. **Row 9 (tm8)** - ❌ **ERROR: Invalid role**
   - `role`: "QA Engineer" (must be exactly "QA")
   - Fix: Change to `QA`

### Expected Validation Summary:
- ✅ **Valid rows**: 3 (tm1, tm4, tm5)
- ❌ **Errors**: 5 rows with blocking errors
- ⚠️ **Warnings**: 0

---

## 🧪 How to Use These Test Files

### Test 1: See validation errors in action
```
1. Open Bulk Import Wizard
2. Select "Tickets"
3. Upload tickets-with-errors.csv
4. Observe the validation results:
   - Red errors list showing 7 blocking issues
   - Yellow warnings showing 2 non-blocking issues
   - Only 1 valid row ready to import
5. Notice that "Continue" button is DISABLED (errors block import)
```

### Test 2: Fix errors and retry
```
1. Download tickets-with-errors.csv
2. Open in Excel or text editor
3. Fix the errors listed above
4. Save and upload again
5. See validation pass with all rows valid
```

### Test 3: Test team member validation
```
1. Select "Team Members"
2. Upload team-members-with-errors.csv
3. See 5 validation errors
4. Try to proceed - button should be disabled
```

### Test 4: Import order dependencies
```
1. First upload tickets-sample.csv (without team members imported)
   → See warnings about missing developers
   → Import still works (warnings don't block)
2. Then upload team-members-sample.csv
   → Now developers exist in system
3. Upload tickets again
   → No more warnings!
```

---

## 📚 Error Types Demonstrated

### Type 1: Required field missing
- Example: Empty `id`, `startDate`, or `name`
- **Blocks import**: Yes
- **Fix**: Fill in the required field

### Type 2: Invalid format
- Example: "invalid-date" instead of "2026-02-15"
- **Blocks import**: Yes
- **Fix**: Use correct format (YYYY-MM-DD for dates)

### Type 3: Invalid enum value
- Example: "in-review" instead of "planned"
- **Blocks import**: Yes
- **Fix**: Use one of the allowed values

### Type 4: Invalid number
- Example: "invalid" or negative number for storyPoints
- **Blocks import**: Yes
- **Fix**: Use a valid positive number

### Type 5: Logical error
- Example: End date before start date
- **Blocks import**: Yes
- **Fix**: Ensure dates are in correct order

### Type 6: Relationship warning
- Example: Assigned to non-existent developer
- **Blocks import**: No (warning only)
- **Should fix**: Yes, for data integrity

---

## 💡 Learning Objectives

By testing with these files, you'll learn:

1. **Validation is strict** - All required fields must be present
2. **Format matters** - Dates must be YYYY-MM-DD, enums must match exactly
3. **Errors block import** - You can't proceed until all errors are fixed
4. **Warnings allow import** - Warnings highlight issues but don't block
5. **Clear feedback** - Error messages tell you exactly what's wrong and where

---

## 🔧 Quick Fixes Reference

### Fix Missing Required Fields:
```csv
❌ ,Marcus Rivera,Developer
✅ tm2,Marcus Rivera,Developer
```

### Fix Invalid Dates:
```csv
❌ invalid-date,2026-03-07
✅ 2026-03-01,2026-03-07
```

### Fix Invalid Status:
```csv
❌ in-review
✅ in-progress
```

### Fix Invalid Role:
```csv
❌ Engineer
✅ Developer

❌ QA Engineer
✅ QA

❌ Manager
✅ Developer  (or Designer, QA)
```

### Fix Date Order:
```csv
❌ 2026-02-19,2026-02-15  (end before start)
✅ 2026-02-15,2026-02-19  (start before end)
```

### Fix Invalid Numbers:
```csv
❌ invalid
✅ 5

❌ -5
✅ 5

❌ 0  (technically valid, but unusual)
✅ 3
```

---

## ✅ Success Criteria

A file is ready for import when:
- ✅ **Zero errors** in validation results
- ✅ **At least one valid row** to import
- ✅ **Continue button is enabled**

Warnings are okay if you:
- ⚠️ Plan to fix them after import
- ⚠️ Understand the data integrity implications

---

Happy testing! 🧪
