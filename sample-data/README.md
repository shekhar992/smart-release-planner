# Sample CSV Data for Import Testing

This directory contains pre-populated CSV templates that you can use to test the import functionality of your Sprint Planning application.

## 📁 Files Included

### 1. **tickets_template.csv** (50 tickets)
Complete set of tickets for a realistic Q1 2026 release covering:
- **Authentication & Identity** (12 tickets)
- **Analytics Dashboard** (8 tickets)
- **Mobile Application** (8 tickets)
- **DevOps & Infrastructure** (8 tickets)
- **QA & Testing** (8 tickets)
- **UI/UX Design** (6 tickets)

**Format:** `Ticket Name, Story Points, Assigned To, Start Date, End Date`

### 2. **team_template.csv** (12 team members)
Diverse team composition:
- 8 Developers
- 2 Designers (Sofia Martinez, David Kim)
- 2 QA Engineers (Lisa Park, Tom Zhang)

**Format:** `Name, Role`

### 3. **pto_template.csv** (10 PTO entries)
Strategic time-off that demonstrates PTO conflict detection:
- Sarah Chen: Spring Break (Mar 24-28)
- Marcus Rivera: Conference (Mar 5-7) - **Conflicts with RBAC task**
- James Wilson: Medical (Mar 27-28) - **Conflicts with Production Deployment**
- Priya Patel: Family Event (Mar 19-21)
- Maria Garcia: Vacation (Apr 27-May 1)
- And 5 more...

**Format:** `Team Member, Start Date, End Date, Reason`

### 4. **holidays_template.csv** (5 holidays)
Company-wide holidays affecting sprint planning:
- Presidents' Day (Feb 16)
- Good Friday (Apr 3)
- Memorial Day (May 25)
- Company All-Hands (Mar 13)
- Team Offsite (Apr 30-May 1)

**Format:** `Holiday Name, Start Date, End Date`

## 🎯 What Does This Data Demonstrate?

### ✅ **Conflict Detection**
The data includes several built-in conflicts to showcase your conflict detection feature:

1. **Developer Over-allocation**
   - Multiple tickets assigned to the same developer with overlapping dates
   - Example: Marcus Rivera has 3 overlapping tasks in early March

2. **PTO Conflicts**
   - Tasks scheduled during developer's planned time off
   - Example: Marcus Rivera's RBAC task (Mar 3-10) overlaps with his conference (Mar 5-7)
   - Example: James Wilson's Production Deployment (Mar 31-Apr 14) overlaps with his medical leave (Mar 27-28)

3. **Holiday Impact**
   - Sprints affected by company holidays
   - Example: Presidents' Day (Feb 16) affects Sprint 1
   - Example: Good Friday (Apr 3) affects Sprint 4

### ✅ **Sprint Capacity Management**
- **Over-allocated sprints:** Feb-March period with high ticket density
- **Under-allocated sprints:** Late April shows lighter load
- **Optimal sprints:** Mid-March has balanced capacity

### ✅ **Multi-feature Coordination**
- Dependencies across features (Auth → Mobile → Testing)
- Parallel development tracks
- Phased rollout strategy

## 🚀 How to Use

### Step 1: Clear Existing Data (Optional)
If you want to start fresh, clear your browser's localStorage:
1. Open Developer Tools (F12)
2. Go to Application → Local Storage
3. Clear all items OR click "Reset Storage" button in the app

### Step 2: Import Data
1. Click "Import Release" in your application
2. Fill in release details:
   - **Product:** Choose existing or create new
   - **Release Name:** "Q1 2026 Release"
   - **Start Date:** 2026-02-10
   - **End Date:** 2026-05-30

3. Upload CSV files:
   - ✅ team_template.csv (REQUIRED)
   - ✅ tickets_template.csv (REQUIRED)
   - ⚠️ pto_template.csv (optional but recommended)
   - ⚠️ holidays_template.csv (optional but recommended)

### Step 3: Verify Import
After import, you should see:
- 12 team members in Team Roster
- 50 tickets across 7 features
- 10 PTO entries across the timeline
- 5 holidays marked on the calendar
- Multiple conflict warnings in the conflict panel

## 📊 Expected Conflicts to Demo

Once imported, navigate to the timeline view to see:

1. **🔴 High Priority Conflicts:**
   - Marcus Rivera: 3 overlapping tasks + PTO conflict
   - James Wilson: Production deployment during medical leave

2. **🟡 Medium Priority:**
   - Elena Zhang: 2 parallel tasks in late February
   - Sprint capacity exceeded in early March

3. **🟢 Holiday Warnings:**
   - 4 holidays affecting sprint schedules
   - Team Offsite spanning 2 days

## 💡 Pro Tips for Demo

1. **Show Conflict Detection:**
   - Navigate to early March to see Marcus Rivera's conflicts
   - Click on conflicting tickets to highlight the issue

2. **Demonstrate PTO Impact:**
   - Scroll to March 24-28 to see Sarah Chen's PTO
   - Show how her tickets are highlighted during PTO

3. **Sprint Capacity:**
   - Open Sprint Manager to see capacity metrics
   - Show over-allocated sprints (Sprint 2 & 3)
   - Compare with under-allocated sprints (Sprint 6)

4. **Drag & Drop:**
   - Move conflicting tickets to resolve issues
   - Show how conflicts update in real-time

5. **Data Persistence:**
   - Make changes
   - Refresh the page
   - Show that all data persists in localStorage

## 🎨 Customization

Feel free to edit these CSV files to:
- Add more team members
- Create additional tickets
- Adjust dates to match your demo timeline
- Add more PTOs or holidays

Just maintain the column headers and date format (YYYY-MM-DD).

## 📝 Notes

- All dates are in **YYYY-MM-DD** format for consistency
- Story points range from 3 to 13 (Fibonacci sequence)
- Developer names match exactly between teams and tickets
- PTO dates strategically placed to create realistic conflicts
- Holidays aligned with US federal calendar (2026)

## 🆘 Troubleshooting

**Issue:** Import fails with "Invalid format"
- **Solution:** Ensure no extra commas or line breaks in CSV

**Issue:** Team members not showing
- **Solution:** Check that team_template.csv is uploaded first

**Issue:** Conflicts not appearing
- **Solution:** Ensure dates overlap correctly; verify localStorage has data

**Issue:** PTO not visible
- **Solution:** Click "Team Roster" button to toggle PTO visualization

---

**Ready to demo!** 🚀 Import these files and showcase all your product's powerful features!
