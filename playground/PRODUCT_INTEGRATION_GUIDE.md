# 🎯 PRD-to-Ticket Agent: Product Integration Guide

## Your Product Context

**What you have:** Smart Release Planner
- Users create releases
- Users manually add tickets one-by-one
- Users import tickets from CSV (BulkTicketImportModal)
- Users plan sprints with those tickets

**What we're adding:** AI-Powered PRD Import
- Users upload a PRD document (PDF/TXT)
- AI extracts requirements automatically
- AI generates tickets with story points
- User reviews and adds them to the release

---

## 🔍 User Journey - Before & After

### BEFORE (Current - Manual Work):
```
1. Product Manager writes PRD in Google Docs
2. PM/Tech Lead manually reads entire PRD
3. They open Release Planner
4. They click "+ Add Ticket" 50 times
5. For each ticket, they manually:
   - Type title
   - Write description
   - Estimate story points
   - Add acceptance criteria
   
⏰ Time: 2-3 hours for a 10-page PRD
😰 Pain: Error-prone, tedious, inconsistent estimates
```

### AFTER (With AI Agent - Automated):
```
1. Product Manager writes PRD in Google Docs
2. They open Release Planner → Release Planning Canvas
3. Click "🤖 Import from PRD" button (NEW!)
4. Upload PRD file (drag & drop PDF)
5. AI processes in 30 seconds:
   ✓ Extracts 15 requirements
   ✓ Generates 15 tickets with story points
   ✓ Adds descriptions & acceptance criteria
6. User reviews tickets in modal
7. User clicks "Add All to Release"
   
⏰ Time: 5 minutes total
🎉 Value: Fast, consistent, accurate
```

---

## 🏗️ Technical Architecture

### Where It Fits in Your App

```
Your Current App Structure:
┌─────────────────────────────────────────────────┐
│ App.tsx                                         │
│   └── RouterProvider                            │
│       └── Routes:                               │
│           ├── /                                 │
│           │   └── PlanningDashboard            │
│           │                                     │
│           └── /release/:releaseId              │
│               └── ReleasePlanningCanvas        │ ← YOU ARE HERE
│                   ├── Ticket grid              │
│                   ├── Timeline view            │
│                   └── Modals:                  │
│                       ├── TicketCreationModal  │
│                       ├── BulkTicketImportModal│ ← CSV import
│                       └── 🆕 PRDImportModal    │ ← ADD THIS!
└─────────────────────────────────────────────────┘

New Agent Backend:
┌─────────────────────────────────────────────────┐
│ playground/                                     │
│   ├── lib/                                      │
│   │   ├── ollama-client.ts   ← API wrapper     │
│   │   └── base-agent.ts      ← Agent template  │
│   │                                             │
│   ├── agents/                                   │
│   │   ├── documentParser.ts  ← Parse PDF       │
│   │   ├── requirementsExtractor.ts ← Get reqs  │
│   │   └── ticketGenerator.ts ← Make tickets    │
│   │                                             │
│   └── orchestrator.ts        ← Coordinate all  │
└─────────────────────────────────────────────────┘

Connection:
┌──────────────────────┐
│ PRDImportModal.tsx   │
│ (React Component)    │
└──────────┬───────────┘
           │
           └─────> calls orchestrator.processPRDToTickets()
                           │
                           └─────> Returns: Ticket[]
```

---

## 📦 Implementation Plan (Step-by-Step)

### PHASE 1: Create the UI Component (2-3 hours)

**File:** `src/app/components/PRDImportModal.tsx`

**Features:**
```tsx
1. File Upload Area
   - Drag & drop PDF/TXT/DOCX
   - File validation (max 10MB)
   - Preview uploaded file name

2. Processing State
   - Show progress: "Parsing document... 33%"
   - Show progress: "Extracting requirements... 66%"
   - Show progress: "Generating tickets... 100%"

3. Results Preview
   - List generated tickets
   - Show: Title, Story Points, Description
   - Allow editing before import
   - Confidence indicator (🟢 High, 🟡 Medium, 🔴 Low)

4. Actions
   - "Add All to Release" button
   - "Edit Ticket" capability
   - "Regenerate" if user unhappy
   - "Cancel" to abort
```

**Mock UI:**
```
┌────────────────────────────────────────────────────────────┐
│ 🤖 Import Tickets from PRD                          [X]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Step 1: Upload Document                                  │
│  ┌──────────────────────────────────────────────────┐    │
│  │                                                    │    │
│  │   📄 Drag & drop PRD here                         │    │
│  │      or click to browse                           │    │
│  │                                                    │    │
│  │   Supported: PDF, TXT, DOCX (max 10MB)           │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  ─────────────────────────────────────────────────────    │
│                                                            │
│  Step 2: AI Processing                                    │
│  ⏳ Parsing document...                                   │
│  [████████████████████░░░░░░░░░░] 75%                    │
│                                                            │
│  ─────────────────────────────────────────────────────    │
│                                                            │
│  Step 3: Review Generated Tickets (15 tickets)           │
│                                                            │
│  ┌────────────────────────────────────────────────┐      │
│  │ ✓ TICKET-1: Implement customizable dashboard  │      │
│  │   🟢 Confidence: High (92%)                    │      │
│  │   📊 Story Points: 8                            │      │
│  │   📝 Allow users to drag-drop widgets...       │      │
│  │   [Edit] [Remove]                               │      │
│  ├────────────────────────────────────────────────┤      │
│  │ ✓ TICKET-2: Add real-time activity feed       │      │
│  │   🟡 Confidence: Medium (78%)                  │      │
│  │   📊 Story Points: 5                            │      │
│  │   📝 Display live notifications...             │      │
│  │   [Edit] [Remove]                               │      │
│  └────────────────────────────────────────────────┘      │
│                                                            │
│  [Cancel]  [Regenerate All]  [Add 15 Tickets to Release]→│
└────────────────────────────────────────────────────────────┘
```

---

### PHASE 2: Connect Backend Agent (1-2 hours)

**File:** `src/app/lib/prdAgent.ts`

```typescript
import { processPRDToTickets } from '../../../playground/orchestrator';
import { Ticket } from '../domain/types';

export async function importTicketsFromPRD(
  file: File,
  onProgress: (stage: string, percent: number) => void
): Promise<Ticket[]> {
  
  // 1. Read file content
  onProgress('Reading document...', 10);
  const text = await readFileAsText(file);
  
  // 2. Process with AI agents
  onProgress('Analyzing document...', 30);
  const result = await processPRDToTickets(text, {
    onStageComplete: (stage, data) => {
      if (stage === 'parsing') onProgress('Extracting requirements...', 50);
      if (stage === 'extraction') onProgress('Generating tickets...', 70);
      if (stage === 'generation') onProgress('Finalizing...', 90);
    }
  });
  
  // 3. Convert AI tickets to app format
  onProgress('Complete!', 100);
  const tickets = result.tickets.map(aiTicket => ({
    id: generateId(),
    title: aiTicket.title,
    description: aiTicket.description,
    storyPoints: aiTicket.storyPoints,
    status: 'backlog' as const,
    priority: aiTicket.priority || 'medium',
    acceptanceCriteria: aiTicket.acceptanceCriteria || [],
    labels: aiTicket.labels || [],
    // Add any other fields your app needs
    createdBy: 'AI Agent',
    confidence: aiTicket.confidence || 0.8,
  }));
  
  return tickets;
}
```

---

### PHASE 3: Add to Release Canvas (30 min)

**File:** `src/app/components/ReleasePlanningCanvas.tsx`

**Modify the toolbar:**

```tsx
// Add new button next to existing "Bulk Import" button
<button
  onClick={() => setShowPRDImportModal(true)}
  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
>
  <SparklesIcon className="w-5 h-5" />
  🤖 Import from PRD
</button>

// Add the modal
{showPRDImportModal && (
  <PRDImportModal
    isOpen={showPRDImportModal}
    onClose={() => setShowPRDImportModal(false)}
    onImport={(tickets) => {
      // Add tickets to current release
      addTicketsToRelease(currentRelease.id, tickets);
      toast.success(`Added ${tickets.length} tickets from PRD!`);
      setShowPRDImportModal(false);
    }}
  />
)}
```

---

## 🎯 User Flow in Your Product

```
USER OPENS: Release Planning Canvas (/release/Q1-2026)
     ↓
CLICKS: "🤖 Import from PRD" button in toolbar (NEW!)
     ↓
MODAL OPENS: PRDImportModal
     ↓
USER DRAGS: "Q1_Dashboard_PRD.pdf" into upload area
     ↓
AI PROCESSES: (30 seconds)
     [Stage 1]: Parsing PDF → "Found 25 pages"
     [Stage 2]: Extracting requirements → "Found 12 requirements"
     [Stage 3]: Generating tickets → "Created 12 tickets, 37 story points"
     ↓
MODAL SHOWS: Preview of 12 tickets
     ↓
USER REVIEWS: 
     - Ticket 1: "Looks good!" ✓
     - Ticket 5: "Story points too high" → User edits 8 → 5
     - Ticket 9: "Not needed" → User removes
     ↓
USER CLICKS: "Add 11 Tickets to Release"
     ↓
APP UPDATES:
     - Adds 11 tickets to Q1-2026 release
     - Tickets appear in backlog
     - Sprint planning can begin
     - Toast: "✓ Successfully imported 11 tickets (32 story points)"
     ↓
MODAL CLOSES
     ↓
USER SEES: New tickets in the release canvas
```

---

## 🚀 What You Need to Build (Checklist)

### UI Components (Frontend):
- [ ] `PRDImportModal.tsx` - Main modal component
- [ ] `FileUploadZone.tsx` - Drag & drop file upload
- [ ] `AIProgressIndicator.tsx` - Show processing stages
- [ ] `TicketPreviewCard.tsx` - Preview generated tickets
- [ ] `ConfidenceScore.tsx` - Show AI confidence level

### Backend Integration:
- [ ] `prdAgent.ts` - Wrapper connecting React to agents
- [ ] `fileReader.ts` - Read PDF/TXT/DOCX files
- [ ] Update `orchestrator.ts` - Add progress callbacks
- [ ] Error handling - Handle AI failures gracefully

### State Management:
- [ ] Add PRD import state to release context
- [ ] Track imported tickets (mark as AI-generated)
- [ ] Handle optimistic updates

### Testing:
- [ ] Test with real PRD documents
- [ ] Test error cases (invalid file, AI failure)
- [ ] Test ticket editing before import
- [ ] Test performance (large PDFs)

---

## 💡 Quick Start (Build This Week!)

### Day 1-2: Build Basic Modal (4 hours)
```bash
# Create the modal component
code src/app/components/PRDImportModal.tsx

# Features:
# 1. File upload (just TXT for now, skip PDF parsing)
# 2. Hardcode sample output to test UI
# 3. Preview tickets
# 4. Import to release
```

### Day 3: Connect Real Agent (3 hours)
```bash
# Connect to your working lesson-4 agent
# Read uploaded file
# Process with AI
# Show real results in modal
```

### Day 4: Polish & Test (3 hours)
```bash
# Add progress indicators
# Handle errors
# Test with colleagues
# Fix bugs
```

### Day 5: Ship It! (2 hours)
```bash
# Documentation
# User guide
# Demo video
# Launch announcement
```

---

## 🎓 Why This All Made Sense

**The lessons you completed:**
- ✅ Lesson 1-3: Learned agent basics
- ✅ Lesson 4: Built working PRD→Ticket converter
- ✅ Lesson 5: Learned production patterns

**What you Built:**
- The "ENGINE" that powers the feature
- Agents that process PRDs and generate tickets
- All the AI logic is DONE!

**What's Missing:**
- The "USER INTERFACE" that lets users use the engine
- A modal component in your React app
- Connection code between UI and agents

**Analogy:**
```
You built: A powerful car engine (agents) ✓
You need: A steering wheel and dashboard (UI) 
Then: Users can drive it! 
```

---

## 🤝 Let's Build This Together

Tell me what you want to tackle first:

### Option A: "Build the PRDImportModal component" (Most Important!)
I'll guide you step-by-step to create the React component

### Option B: "Show me how to connect the agent to React"
I'll explain the integration layer (`prdAgent.ts`)

### Option C: "Let's build a simple working prototype"
We'll create a minimal version (file upload → show tickets) in 1 hour

### Option D: "I want to understand [specific part]"
Ask me anything about the architecture

---

## 📊 Progress to Launch

```
What You've Built:
├── ✅ Agent System (100%)
│   ├── Document parser
│   ├── Requirements extractor
│   └── Ticket generator
│
What You Need to Build:
├── ⏳ UI Components (0%)
│   ├── PRDImportModal
│   ├── File upload
│   └── Ticket preview
│
├── ⏳ Integration Layer (0%)
│   └── Connect React ↔ Agents
│
└── ⏳ Testing & Polish (0%)
    ├── Real document tests
    └── Error handling

Estimated Time to Launch: 12-15 hours of focused work
```

---

## 🎯 The Value Proposition

**For Your Users:**
- Save 2-3 hours per PRD
- Consistent story point estimates
- No missed requirements
- Faster sprint planning

**For Your Product:**
- Killer differentiator ("AI-powered planning")
- Premium feature (charge more?)
- Demo-able "wow" factor
- Real automation vs manual work

**For Compliance:**
- ✅ All local processing (Ollama)
- ✅ No data leaves machine
- ✅ No API costs
- ✅ Privacy-safe

---

## 🚀 Next Steps

**Right now, tell me:**

1. **"Let's build the PRDImportModal"** ← Start building UI
2. **"Show me the integration code"** ← Understand connections
3. **"Build a quick prototype"** ← 1-hour working demo
4. **"I have questions about [X]"** ← Ask anything

**The engine is built. Let's add the steering wheel!** 🚗💨

