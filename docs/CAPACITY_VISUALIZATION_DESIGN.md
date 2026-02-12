# Sprint Capacity Visualization - Design Documentation

## 🎨 Design Philosophy

> **"Capacity metrics should be informative but not intrusive. They should enhance the timeline view, not compete with it."**

## Problem Statement

### Initial Design Issues
❌ **Floating capacity cards obscured the timeline** - Cards overlaid on ticket bars, breaking primary use case  
❌ **Wrong visual hierarchy** - Secondary info (capacity) had more weight than primary content (tickets)  
❌ **Poor information density** - Cards consumed valuable vertical space  
❌ **Broken scanning pattern** - Eye jumped between header and mid-screen cards  
❌ **Inconsistent layering** - Unclear what was interactive vs informational  

### Design Principles Violated
- **Progressive Disclosure**: Showing all details upfront instead of summary → details on hover
- **Visual Weight**: Heavy cards instead of lightweight indicators
- **Gestalt Proximity**: Sprint name and capacity were spatially separated
- **Fitts's Law**: Hover targets scattered instead of grouped

---

## ✨ Solution: Integrated Sprint Header Design

### Visual Hierarchy (Top to Bottom)
```
┌─────────────────────────────────────────────────┐
│ Sprint 1 (Feb 9-20)                    [⚠ Over] │ ← Sprint identity + Status
├─────────────────────────────────────────────────┤
│ ████████████████░░░░░░░░░  115%                 │ ← Visual capacity bar
│ 23 / 20 SP                                       │ ← Story point summary
└─────────────────────────────────────────────────┘
```

### Key Design Decisions

#### 1. **Location: Sprint Header Row**
- **Why**: Keeps info at eye level, naturally groups sprint name + metrics
- **Benefit**: Timeline area remains clean for primary task (viewing/moving tickets)
- **Trade-off**: Slightly taller header (64px vs 32px), but worth it for clarity

#### 2. **Status Badge System**
- **⚠ Over** (Red): >100% utilization - immediate attention required
- **Near** (Amber): 90-100% - nearing capacity limit
- **Good** (Green): 70-90% - healthy utilization
- **Low** (Gray): <70% - underutilized sprint

**Design Rationale**: Executive stakeholders need instant status recognition without parsing numbers.

#### 3. **Progress Bar with Milestones**
- **Visual encoding**: Bar length = utilization %, color = status
- **Milestone markers**: Subtle vertical lines at 25%, 50%, 75% for quick reference
- **Animation**: Smooth 300ms transition when capacity changes (drag tickets)

**Why not just numbers?** Human brain processes visual patterns 60,000x faster than text.

#### 4. **Compact Story Point Display**
- Format: `23 / 20 SP` (planned / capacity)
- Size: 10px, subtle color to reduce visual weight
- Position: Below bar, provides numeric precision for those who need it

#### 5. **Progressive Disclosure Tooltip**
- **Trigger**: Hover on sprint header area
- **Content**: 
  - Team size (devs)
  - Working days calculation
  - Holiday deductions
  - PTO deductions
  - Total available capacity
  - Over-capacity warning (if applicable)
- **Positioning**: Absolute, below header, z-index 50
- **Styling**: White card with shadow, clean typography hierarchy

**Design Rationale**: PM presenting to executives doesn't need details, but PM doing planning needs deep dive capability.

---

## 📐 Specifications

### Dimensions
- Sprint header row: **64px height**
- Progress bar: **8px height**, rounded ends
- Tooltip: **220px min-width**, auto height

### Typography
- Sprint name: 12px, semi-bold, gray-700
- Dates: 10px, regular, gray-500
- Status badge: 9px, bold, color-matched
- Story points: 10px, gray-600
- Utilization %: 10px, bold, color-matched
- Tooltip labels: 11px, gray-700
- Tooltip values: 11px, medium weight

### Colors (Status-based)
```javascript
Red (Over):    #dc2626  (background: #dc2626 + 15% opacity)
Amber (Near):  #f59e0b  (background: #f59e0b + 15% opacity)
Green (Good):  #10b981  (background: #10b981 + 15% opacity)
Gray (Low):    #6b7280  (background: #6b7280 + 15% opacity)
```

### Spacing
- Header padding: 12px horizontal, 6px vertical
- Bar margin: 6px bottom
- Tooltip padding: 12px all sides
- Row gaps: 6px between elements

---

## 🧠 Cognitive Load Analysis

### Information Scent (Nielsen Norman)
✅ **Strong scent**: Visual bar + color immediately signals capacity state  
✅ **Breadcrumb trail**: Status badge → bar → story points → detailed tooltip  

### Hick's Law (Choice Reaction Time)
✅ **Reduced choices**: 4 status states vs continuous percentage scale  
✅ **Faster decision-making**: Color + label = instant recognition  

### Proximity & Grouping (Gestalt)
✅ **Related info clustered**: Sprint identity + capacity metrics in one region  
✅ **Clear boundaries**: Border-left separates sprints visually  

---

## 🎯 User Scenarios

### Scenario 1: Executive Review
**Goal**: Quick status check across all sprints  
**Experience**: Scan sprint header row → red/amber badges catch attention → focus on problem sprints  
**Time to insight**: ~3 seconds for 5-sprint roadmap

### Scenario 2: PM During Planning
**Goal**: Balance capacity across sprints  
**Experience**: Drag ticket → see bar update → check story points → adjust  
**Feedback loop**: Real-time visual updates while dragging

### Scenario 3: Detailed Analysis
**Goal**: Understand why sprint is over capacity  
**Experience**: Hover sprint → see tooltip → check PTO days → adjust team allocation  
**Cognitive path**: Visual cue → numeric detail → root cause → action

---

## 🔄 Future Enhancements (Backlog)

### Phase 3: Advanced Capacity Features
- [ ] **Team member breakdown**: Hover to see per-developer utilization
- [ ] **Velocity trends**: Show sprint-over-sprint capacity patterns
- [ ] **What-if scenarios**: Toggle team members to see capacity impact
- [ ] **Capacity alerts**: Notification when sprint crosses threshold

### Phase 4: Visualization Options
- [ ] **Compact mode**: 32px header with icon-only status
- [ ] **Detailed mode**: Show team member avatars in header
- [ ] **Chart overlay**: Optional capacity burndown chart on timeline

---

## 📊 Design Validation Checklist

✅ **Scanability**: Can user grasp capacity state in <5 seconds?  
✅ **Minimalism**: Does it add value without visual clutter?  
✅ **Consistency**: Does it match the rest of the UI language?  
✅ **Accessibility**: Is color not the only indicator? (badge text + percentage)  
✅ **Responsiveness**: Does it adapt to narrow sprints gracefully?  
✅ **Actionability**: Does insight lead to clear next action?  

---

## 💡 Design Lessons Learned

1. **Layer Separation is Critical**: Metrics should never overlay primary content
2. **Progressive Disclosure > Full Exposure**: Show summary, hide details until needed
3. **Visual Encoding > Text**: Bar + color outperforms numbers for quick scanning
4. **Status Categorization > Continuous Scale**: 4 states easier to process than 0-200% range
5. **Context Matters**: PM presenting ≠ PM planning; design for both modes

---

## 🛠 Technical Implementation Notes

### File: `TimelinePanel.tsx`
- **Component**: `SprintHeaderRow` (lines 461-630)
- **Dependencies**: `SprintCapacity` type, `getCapacityStatusColor()` utility
- **State**: `hoveredSprint` for tooltip visibility
- **Props**: Receives `sprintCapacities` Map from parent container

### Performance Considerations
- Tooltip renders only on hover (not pre-rendered)
- Progress bar uses CSS transform (GPU-accelerated)
- Sprint hover state local (doesn't trigger parent re-render)
- Capacity calculations memoized in parent component

---

## 📚 References

- *Don't Make Me Think* - Steve Krug (Information scent, scanning patterns)
- *Refactoring UI* - Adam Wathan & Steve Schoger (Visual hierarchy, color theory)
- *The Design of Everyday Things* - Don Norman (Affordances, feedback)
- Nielsen Norman Group - Progressive Disclosure research
- Material Design - Data visualization guidelines
