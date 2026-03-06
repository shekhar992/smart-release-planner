# 🎓 Your Learning Path: PRD-to-Ticket Agent Mastery

## 🎯 Your Goal
Build an agent that converts Product Requirements Documents (PRDs) into actionable JIRA tickets with story points, acceptance criteria, and estimates.

---

## ✅ What You've Already Learned

### Phase 1: Foundation (COMPLETED ✅)
- ✅ What AI agents are (abstraction around LLMs)
- ✅ How to run local LLMs (Ollama + llama3.2:3b)
- ✅ Basic prompting (input → AI → output)
- ✅ JSON parsing strategies (code blocks, regex, fallbacks)
- ✅ Debugging techniques (show raw responses, iterate prompts)

### Lessons Completed:
- ✅ Lesson 1: Simple agent (story point estimator)
- ✅ Lesson 2: Multi-agent pipeline
- ✅ Lesson 3: Debugging & prompt engineering
- ✅ Lesson 4: PRD → Tickets (working end-to-end!)

**🎉 You can now build basic agents!**

---

## 🚀 Phase 2: PRD-to-Ticket Specialist (YOUR CURRENT PHASE)

### Module 1: Understanding the Architecture
**Goal:** Learn how the production agents work

#### 📚 Study Materials (Read in order):
1. [playground/types.ts](playground/types.ts) - See data structures
2. [playground/lib/base-agent.ts](playground/lib/base-agent.ts) - Agent template pattern
3. [playground/agents/documentParser.ts](playground/agents/documentParser.ts) - How PDFs are parsed
4. [playground/agents/requirementsExtractor.ts](playground/agents/requirementsExtractor.ts) - How requirements are extracted
5. [playground/agents/ticketGenerator.ts](playground/agents/ticketGenerator.ts) - How tickets are created
6. [playground/orchestrator.ts](playground/orchestrator.ts) - How agents talk to each other

#### 🧪 Hands-on Exercises:
```bash
# Exercise 1: Read the production agent code
cat playground/agents/ticketGenerator.ts | head -100

# Exercise 2: See the prompts they use
grep -A 20 "buildPrompt" playground/agents/ticketGenerator.ts

# Exercise 3: Understand the data flow
grep "execute" playground/orchestrator.ts
```

**Time:** 30-45 minutes
**Outcome:** Understand how your simple lesson relates to production code

---

### Module 2: Advanced Techniques
**Goal:** Learn production-grade patterns

#### 🎓 Run:
```bash
npm run learn:advanced
```

#### Concepts Covered:
- ✅ **Confidence Scoring** - AI self-assesses certainty
- ✅ **Validation** - Auto-check ticket quality (70%+ quality score)
- ✅ **Error Recovery** - Retry with exponential backoff
- ✅ **Chain-of-Thought** - Make AI explain reasoning
- ✅ **Batch Processing** - Efficient multi-item workflows

#### 📚 Deep Dive (Read after running):
- [playground/PROMPT_ENGINEERING_GUIDE.md](playground/PROMPT_ENGINEERING_GUIDE.md)
- [playground/AGENTS_101.md](playground/AGENTS_101.md) - Section on "Production Patterns"

**Time:** 45-60 minutes
**Outcome:** Understand professional agent development

---

### Module 3: Customization Workshop
**Goal:** Modify agents for YOUR specific needs

#### 🧪 Exercise 3A: Customize Ticket Format
Your company might have specific JIRA fields:

1. Open: `playground/lesson-4-simple-working.cjs`
2. Find line 73: Example ticket structure
3. Add your fields:
   ```javascript
   {
     "title": "...",
     "storyPoints": 5,
     "labels": ["frontend", "backend"],  // ADD THIS
     "assignee": "team-alpha",            // ADD THIS
     "sprint": "Sprint 24",               // ADD THIS
     "epic": "User Dashboard"             // ADD THIS
   }
   ```
4. Run: `npm run learn:4`
5. Verify: AI now generates tickets with your custom fields!

#### 🧪 Exercise 3B: Tune Story Point Estimates
Your team might use different scales:

1. Find the ticket generation prompt (line 85)
2. Add story point guidance:
   ```
   Story point scale:
   1 = Less than 4 hours
   2 = Half day
   3 = Full day
   5 = 2-3 days
   8 = Full week
   13 = Too large, needs splitting
   ```
3. Run again and compare estimates

#### 🧪 Exercise 3C: Add Acceptance Criteria
Make tickets more actionable:

1. Add to the example ticket:
   ```javascript
   "acceptanceCriteria": [
     "Given... When... Then...",
     "User can perform action X",
     "System validates input Y"
   ]
   ```
2. Modify prompt to request 3-5 criteria per ticket

**Time:** 1-2 hours (experiment with different configurations)
**Outcome:** Agent generates tickets matching YOUR workflow

---

## 🎯 Phase 3: Production Integration (NEXT PHASE)

### Module 4: Connect to Your React App
**Goal:** Build UI for the agent

#### Steps:
1. Create isolated UI component: `PRDUploaderPanel.tsx`
2. Add file upload (PDF, TXT, DOCX)
3. Show real-time agent progress
4. Display generated tickets with edit capability
5. Save to application state

#### 🎓 Learning:
- React component → Agent orchestrator communication
- Real-time progress updates
- Streaming responses to UI
- Error handling in UI

**Estimated time:** 2-3 hours

---

### Module 5: Quality & Validation
**Goal:** Ensure production-ready output

#### Concepts:
- Pre-flight checks (is document valid?)
- Confidence thresholds (auto-flag low-confidence tickets)
- Human-in-the-loop review workflow
- Ticket quality scoring (completeness, clarity)

#### Implementation:
- Add validation layer before saving
- Create review queue for uncertain tickets
- Implement bulk edit/approve flow

**Estimated time:** 2-3 hours

---

### Module 6: Production Deployment
**Goal:** Launch the feature

#### Checklist:
- [ ] Compliance review (all local, no data leaves machine ✓)
- [ ] Error handling (fallbacks for AI failures)
- [ ] Performance testing (can handle 50-page PRDs?)
- [ ] User testing (5 colleagues try it)
- [ ] Documentation (how to use, limitations)
- [ ] Monitoring (track success rate, confidence scores)

**Estimated time:** 1 week (including testing)

---

## 📊 Your Learning Progress

```
┌──────────────────────────────────────────────────────────┐
│ PHASE 1: FOUNDATION ████████████████████████ 100% ✅     │
│                                                          │
│ PHASE 2: SPECIALIZATION ██████░░░░░░░░░░░░░  40%  ←YOU  │
│   └─ Module 1: Architecture 🎯 START HERE               │
│   └─ Module 2: Advanced techniques                      │
│   └─ Module 3: Customization                            │
│                                                          │
│ PHASE 3: PRODUCTION ░░░░░░░░░░░░░░░░░░░░░░   0%        │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 RECOMMENDED NEXT ACTIONS (Right Now)

### Option A: Deep Understanding (2 hours) 🌟 RECOMMENDED
**Why:** Understand how production code works before building your own

```bash
# 1. Read the main types
code playground/types.ts

# 2. Study the document parser
code playground/agents/documentParser.ts

# 3. Study the ticket generator
code playground/agents/ticketGenerator.ts

# 4. Ask me: "Explain how documentParser.ts works line-by-line"
```

**Outcome:** You'll understand patterns used in production code

---

### Option B: Hands-on Experimentation (1 hour)
**Why:** Learn by doing - modify and test immediately

```bash
# Open lesson 4 in editor
code playground/lesson-4-simple-working.cjs

# Modify the prompt (line 38)
# Change temperature (line 46)
# Add custom fields (line 73)

# Test your changes
npm run learn:4

# See what breaks, what improves!
```

**Outcome:** Practical experience with prompt engineering

---

### Option C: Advanced Techniques (1 hour)
**Why:** Learn pro patterns for production agents

```bash
# Run advanced lesson
npm run learn:advanced

# Study the techniques:
# - Confidence scoring
# - Validation
# - Error recovery
# - Chain-of-thought reasoning
# - Batch processing
```

**Outcome:** Production-ready agent development skills

---

### Option D: Build Custom Agent (2-3 hours)
**Why:** Apply everything you've learned to a real problem

**Task:** Build a "Quality Validator Agent"
- Input: Generated ticket
- Output: Quality score + improvement suggestions
- Apply: Runs after ticket generation, flags issues

**Steps:**
1. I'll guide you through creating the agent file
2. You write the prompt
3. We test and iterate together
4. Integrate into the pipeline

**Outcome:** Your first custom agent from scratch!

---

## 💡 My Recommendation

**Start with Option A** (Deep Understanding):
1. Read [playground/agents/ticketGenerator.ts](playground/agents/ticketGenerator.ts) - ~200 lines
2. Ask me specific questions: "What does line 45 do?" or "Why this prompt structure?"
3. Then move to Option B to experiment
4. Build confidence before Option D (custom agent)

**Tell me:**
- "Let's read ticketGenerator.ts together" ← Start here
- "I want to experiment with lesson 4" ← Hands-on practice
- "Run advanced techniques lesson" ← See pro patterns
- "Let's build a custom agent" ← Apply everything

---

## 📈 Success Metrics

You'll know you're ready for production when you can:
- ✅ Explain how prompts affect output quality
- ✅ Debug JSON parsing failures independently
- ✅ Modify agent prompts to change behavior
- ✅ Add custom fields to generated tickets
- ✅ Validate ticket quality automatically
- ✅ Handle errors gracefully with fallbacks

---

## 🤝 Your Tutor (Me!)

I'm here to:
- Explain any code you don't understand
- Help debug when things break
- Suggest improvements to your prompts
- Guide you through production integration
- Answer "why" questions about architecture

**Just ask!**
- "Why did you use temperature 0.2 here?"
- "What's the difference between these two prompts?"
- "How do I make the agent generate better estimates?"
- "Show me examples of good vs bad prompts"

Let's master this together! 🚀

