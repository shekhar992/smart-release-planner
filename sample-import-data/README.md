# Bulk Import Sample Data

This directory contains sample CSV files for testing the Bulk Import Wizard feature.

## 📁 Available Sample Files

### ✅ Valid Sample Files (Ready to Import)

1. **tickets-sample.csv** - 20 sample tickets with realistic data
2. **team-members-sample.csv** - 12 team members with different roles
3. **features-sample.csv** - 10 feature groupings
4. **sprints-sample.csv** - 8 sprint iterations
5. **releases-sample.csv** - 4 quarterly releases
6. **pto-sample.csv** - 10 PTO/leave entries
7. **holidays-sample.csv** - 10 company holidays

### ⚠️ Test Files with Errors (For Validation Testing)

8. **tickets-with-errors.csv** - Contains validation errors to test error handling
9. **team-members-invalid.csv** - Has missing required fields and invalid roles

---

## 🚀 How to Use

### Step 1: Access the Bulk Import Wizard
- Click the "Import" button in your application
- Or navigate to the Import page

### Step 2: Select Entity Type
Choose what you want to import:
- 📋 Tickets
- 👥 Team Members
- 🎯 Features
- 🏃 Sprints
- 🚀 Releases
- 🌴 PTO/Leave
- 🎉 Holidays

### Step 3: Upload CSV File
- Download a template or use one of the sample files
- Click "Choose File" and select your CSV
- The wizard will automatically validate your data

### Step 4: Review Validation Results
- ✅ **Green**: Valid rows that will be imported
- ❌ **Red**: Errors that must be fixed before importing
- ⚠️ **Yellow**: Warnings that you should review

### Step 5: Confirm and Import
- Review the preview of your data
- Click "Import Data" to complete the process

---

## 📋 CSV Format Requirements

### Tickets
| Column | Required | Type | Example |
|--------|----------|------|---------|
| id | ✅ Yes | String | t1 |
| title | ✅ Yes | String | Implement OAuth2 |
| startDate | ✅ Yes | Date (YYYY-MM-DD) | 2026-02-15 |
| endDate | ✅ Yes | Date (YYYY-MM-DD) | 2026-02-22 |
| status | ✅ Yes | Enum: planned, in-progress, completed | planned |
| storyPoints | ✅ Yes | Number (positive) | 8 |
| assignedTo | ✅ Yes | String (team member name) | Sarah Chen |

**Validation Rules:**
- End date must be after start date
- Status must be one of: planned, in-progress, completed
- Story points must be a positive number
- Assigned developer should exist in team members

---

### Team Members
| Column | Required | Type | Example |
|--------|----------|------|---------|
| id | ✅ Yes | String | tm1 |
| name | ✅ Yes | String | Sarah Chen |
| role | ✅ Yes | Enum: Developer, Designer, QA | Developer |
| notes | ❌ No | String | Senior full-stack engineer |

**Validation Rules:**
- Role must be one of: Developer, Designer, QA

---

### Features
| Column | Required | Type | Example |
|--------|----------|------|---------|
| id | ✅ Yes | String | f1 |
| name | ✅ Yes | String | Authentication System |

---

### Sprints
| Column | Required | Type | Example |
|--------|----------|------|---------|
| id | ✅ Yes | String | s1 |
| name | ✅ Yes | String | Sprint 1 - Foundation |
| startDate | ✅ Yes | Date (YYYY-MM-DD) | 2026-02-10 |
| endDate | ✅ Yes | Date (YYYY-MM-DD) | 2026-02-21 |

**Validation Rules:**
- End date must be after start date

---

### Releases
| Column | Required | Type | Example |
|--------|----------|------|---------|
| id | ✅ Yes | String | r1 |
| name | ✅ Yes | String | Q1 2026 Release |
| startDate | ✅ Yes | Date (YYYY-MM-DD) | 2026-02-01 |
| endDate | ✅ Yes | Date (YYYY-MM-DD) | 2026-03-31 |

**Validation Rules:**
- End date must be after start date

---

### PTO/Leave Entries
| Column | Required | Type | Example |
|--------|----------|------|---------|
| id | ✅ Yes | String | pto1 |
| name | ✅ Yes | String (team member name) | Sarah Chen |
| startDate | ✅ Yes | Date (YYYY-MM-DD) | 2026-03-15 |
| endDate | ✅ Yes | Date (YYYY-MM-DD) | 2026-03-19 |

**Validation Rules:**
- End date must be after start date
- Team member should exist in system

---

### Holidays
| Column | Required | Type | Example |
|--------|----------|------|---------|
| id | ✅ Yes | String | h1 |
| name | ✅ Yes | String | Presidents Day |
| startDate | ✅ Yes | Date (YYYY-MM-DD) | 2026-02-16 |
| endDate | ✅ Yes | Date (YYYY-MM-DD) | 2026-02-16 |

**Validation Rules:**
- End date must be after start date

---

## 💡 Tips for Successful Imports

### Date Formatting
- ✅ **Correct**: `2026-02-15` (YYYY-MM-DD)
- ❌ **Wrong**: `02/15/2026`, `Feb 15 2026`, `15-02-2026`

### CSV Encoding
- Save your CSV files with **UTF-8** encoding
- Use commas (`,`) as delimiters
- Quote values that contain commas: `"Chen, Sarah"`

### Excel Users
When exporting from Excel:
1. File → Save As
2. Choose "CSV UTF-8 (Comma delimited) (*.csv)"
3. Confirm any warnings about Excel features

### Google Sheets Users
1. File → Download → Comma Separated Values (.csv)

### Handling Errors
If you see validation errors:
1. Note the row number and field name
2. Open your CSV in a text editor or spreadsheet app
3. Fix the error according to the validation rules
4. Save and re-upload

---

## 🧪 Testing Scenarios

### Scenario 1: Import Team Members First
```
1. Import team-members-sample.csv
2. Then import tickets-sample.csv
   → No warnings because team members exist
```

### Scenario 2: Import Tickets Without Team Members
```
1. Import tickets-sample.csv first
   → You'll see warnings about missing team members
   → Import still succeeds, but you should add team members later
```

### Scenario 3: Test Error Handling
```
1. Import tickets-with-errors.csv
   → You'll see validation errors
   → Import is blocked until errors are fixed
```

### Scenario 4: Import Full Project Setup
```
Order for best results:
1. releases-sample.csv (defines release boundaries)
2. features-sample.csv (groups tickets)
3. sprints-sample.csv (defines iterations)
4. team-members-sample.csv (defines who can be assigned)
5. tickets-sample.csv (actual work items)
6. pto-sample.csv (time off)
7. holidays-sample.csv (non-working days)
```

---

## 🔧 Troubleshooting

### "Required column not found"
- Check your CSV header row matches exactly (case-sensitive)
- Required columns: `id`, `name`, `startDate`, etc.

### "Invalid date format"
- Use YYYY-MM-DD format only
- Example: `2026-02-15`

### "Invalid value for status"
- For tickets, status must be exactly: `planned`, `in-progress`, or `completed`
- Check for typos or extra spaces

### "Cannot convert to number"
- For storyPoints, use numbers without quotes
- ✅ Correct: `5`
- ❌ Wrong: `"5"`, `five`, `5 points`

### "Developer not found"
- Import team members before tickets
- Or ignore the warning and add team members later

---

## 📝 Creating Your Own CSV Files

### Method 1: Download Template
1. In the wizard, click "Download Template"
2. Opens a CSV with correct column headers
3. Fill in your data below the headers

### Method 2: Use Samples as Starting Point
1. Copy one of the sample files
2. Rename it (e.g., `my-tickets.csv`)
3. Edit the data to match your project
4. Keep the header row unchanged

### Method 3: Export from Excel/Sheets
1. Create columns matching the required fields
2. Add your data
3. Export as CSV UTF-8

---

## 🎯 Advanced Tips

### Large Imports (100+ rows)
- The wizard can handle large files
- Preview shows first 5 rows only
- All rows are validated before import

### Updating Existing Data
- Current version adds new items only
- Does not update existing items with same ID
- For updates, delete old items first

### Batch Imports
- Import multiple files in sequence
- Close wizard and reopen between imports
- Or click "Import More Data" after success

### Data Relationships
- Tickets can reference features (future enhancement)
- Tickets can reference sprints (future enhancement)
- PTO entries link to team members by name

---

## 📞 Need Help?

If you encounter issues:
1. Check this README for solutions
2. Review validation error messages carefully
3. Try the sample files to ensure the feature works
4. Compare your CSV format to the samples

Happy importing! 🚀
