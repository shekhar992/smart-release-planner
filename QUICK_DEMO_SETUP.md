# 🎯 QUICK DEMO SETUP

## 🚀 5-Minute Setup Before Demo

### Step 1: Switch to Demo Data (2 minutes)

**File**: `src/app/components/ReleasePlanningCanvas.tsx`

**Line 7** - Change this:
```typescript
import { mockProducts, Ticket, Feature, Sprint, mockHolidays, mockTeamMembers, Holiday, TeamMember } from '../data/mockData';
```

**To this**:
```typescript
import { demoProducts as mockProducts, demoHolidays as mockHolidays, demoTeamMembers as mockTeamMembers } from '../data/demoData';
import { Ticket, Feature, Sprint, Holiday, TeamMember } from '../data/mockData';
```

Save file. Dev server will auto-reload.

---

### Step 2: Clear Browser Data (1 minute)

1. Open http://localhost:5177/
2. Open Console: `Cmd + Option + J`
3. Run: `localStorage.clear(); location.reload();`

Or simply:
1. Click **"Reset"** button (top right)
2. Confirm

---

### Step 3: Verify Demo Data Loaded (1 minute)

You should see:
- ✅ Product: "TechPlatform 2.0"
- ✅ Release: "Q1/Q2 2026 - Platform Modernization"
- ✅ 8 sprints (Sprint 1 through Sprint 8)
- ✅ 6 features (Auth, Analytics, API, Mobile, DevOps, Testing)
- ✅ 28 tickets total
- ✅ Red conflict badges in Sprint 1
- ✅ PTO icons on several tickets

---

### Step 4: Quick Test (1 minute)

1. **Conflict Detection**: See Sarah Chen's red badge in Sprint 1
2. **PTO Impact**: See Marcus Rivera's 📅 icon in Sprint 2
3. **Capacity**: Sprint 1 should show RED (over-capacity)
4. **Drag & Drop**: Move a ticket, see "Data saved" update

---

## 🎬 Demo Key Points (Cheat Sheet)

### Slide 1: The Problem
"Excel sprint planning is broken. No conflict detection, no capacity management."

### Slide 2: Conflict Detection
Point to **Sarah Chen, Sprint 1** → Red badge → Overlapping tickets

### Slide 3: PTO Impact
Point to **Marcus Rivera, Sprint 2 (t8)** → 📅 +3d badge → Conference Feb 23-28

### Slide 4: Capacity Management
Point to **Sprint 1 header** → RED bar → Over 100% capacity

### Slide 5: Critical Path Risk
Point to **James Wilson, Sprint 7 (t24)** → Production deploy during PTO

### Slide 6: Live Editing
Drag any ticket → Auto-save → Navigate away → Navigate back → Still there

### Slide 7: The Ask
"$500K to build JIRA integration, real-time collab, 10x capacity. 3 design partners ready."

---

## 🔄 Switch Back to Mock Data (After Demo)

**File**: `src/app/components/ReleasePlanningCanvas.tsx`

**Line 7** - Change back to:
```typescript
import { mockProducts, Ticket, Feature, Sprint, mockHolidays, mockTeamMembers, Holiday, TeamMember } from '../data/mockData';
```

Save and refresh.

---

## 🐛 Emergency Fixes

### "Nothing changed after editing imports"
```bash
# Kill dev server
lsof -ti:5177 | xargs kill -9

# Restart
npm run dev
```

### "Wrong data showing"
```javascript
// Browser console
localStorage.clear();
location.reload();
```

### "Buttons not working"
```
Hard refresh: Cmd + Shift + R
```

---

## 📞 Backup Plan

If demo breaks:
1. Have screenshots ready
2. Have screen recording backup
3. Pivot to pitch deck
4. "We'll send you a video walkthrough"

---

## ✅ Pre-Demo Checklist

- [ ] Closed all other applications
- [ ] Do Not Disturb mode ON
- [ ] Full screen browser
- [ ] Demo data loaded (verify TechPlatform 2.0)
- [ ] Practiced 3+ times
- [ ] Backup materials ready
- [ ] Zoom/meeting link tested
- [ ] Screen share tested

---

**Time**: Demo should be 5-7 minutes max  
**Energy**: High, confident, fast-paced  
**Focus**: Business value > Technology  
**Close**: Always end with the ask ($500K)

---

**GOOD LUCK! 🚀**
