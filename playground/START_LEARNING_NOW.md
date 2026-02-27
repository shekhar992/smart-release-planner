# 🎯 START HERE: Your First Hour with PRD-to-Ticket Agents

## What You'll Learn in the Next 60 Minutes

By the end of this guide, you will:
- ✅ Understand how PRD-to-Ticket agents work
- ✅ Run the complete pipeline yourself
- ✅ Modify prompts and see results
- ✅ Know what makes a good ticket
- ✅ Be ready to build your own agents

---

## ⏰ Minute 0-15: Understand the Flow

### 1. Read the Current Lesson Code (10 min)

Open this file and read the comments:
```bash
code playground/lesson-4-simple-working.cjs
```

**Focus on these sections:**
- Lines 20-60: `extractRequirementsSimple()` - How AI parses PRD
- Lines 70-115: `convertOneRequirement()` - How one req becomes a ticket
- Lines 120-135: `generateAllTickets()` - Loop through all requirements

**🎓 Key Questions to Answer:**
1. What does the system message do? (line 25)
2. Why is temperature 0.2 for extraction? (line 46)
3. Why is temperature 0.4 for tickets? (line 91)
4. How does JSON parsing work? (lines 100-110)

### 2. See It Run (5 min)

```bash
npm run learn:4
```

**Watch for:**
- How many requirements extracted?
- What story points assigned?
- How fast did it run?

---

## ⏰ Minute 15-30: Make Your First Modifications

### Experiment 1: Change Story Point Scale

**Goal:** Adjust estimates to your team's velocity

1. Open `lesson-4-simple-working.cjs`
2. Find line 85 (the ticket generation prompt)
3. Add this AFTER "Example ticket:":
   ```javascript
   Story points guide:
   1 = Quick fix (< 4 hours)
   3 = Standard feature (1 day)
   5 = Complex feature (2-3 days)
   8 = Very complex (full week)
   ```
4. Save and run: `npm run learn:4`
5. **Compare:** Do the story points change?

### Experiment 2: Add Custom Fields

**Goal:** Include your company's JIRA fields

1. Find line 75 (Example ticket structure)
2. Modify example to:
   ```javascript
   {
     "title": "Implement user dashboard",
     "description": "Create dashboard with widgets",
     "storyPoints": 5,
     "priority": "high",
     "labels": ["frontend", "react"],      // ADD THIS
     "component": "Dashboard",              // ADD THIS
     "epic": "User Experience Upgrade"      // ADD THIS
   }
   ```
3. Run: `npm run learn:4`
4. **Check:** Does AI include new fields?

### Experiment 3: Temperature Test

**Goal:** See how randomness affects output

1. Find line 91: `temperature: 0.4`
2. Change to: `temperature: 0.8`
3. Run twice: `npm run learn:4`
4. **Compare:** Are results different each time?
5. Change back to `0.4` and run again
6. **Decision:** Which temperature gives better tickets?

---

## ⏰ Minute 30-45: Understand Production Agents

### Read the Real Agent Code

Now that you understand basics, see how production code does it:

#### 1. Ticket Generator Agent (Most important!)
```bash
code playground/agents/ticketGenerator.ts
```

**What to look for:**
- Line ~40: `buildPrompt()` - How is their prompt different?
- Line ~100: `parseResponse()` - How do they parse JSON?
- Line ~150: Validation logic - What makes a "good" ticket?

#### 2. Requirements Extractor
```bash
code playground/agents/requirementsExtractor.ts
```

**Compare with your lesson-4:**
- How do they extract requirements?
- What additional metadata do they capture?
- How do they handle priorities?

#### 3. Document Parser
```bash
code playground/agents/documentParser.ts
```

**Look for:**
- PDF parsing with `pdf-parse` library
- Section detection (headers, numbering)
- Handling different document formats

---

## ⏰ Minute 45-60: Test with Your Own PRD

### Create Your Own Test Document

1. Create a simple PRD:
```bash
cat > playground/test-documents/my-test-prd.txt << 'EOF'
# My Feature: Dark Mode

## Requirements
1. Users can toggle between light and dark themes
2. Theme preference persists across sessions
3. All UI components support both themes
4. Smooth transition animation (300ms)

## Technical Notes
- Use CSS variables for colors
- Store preference in localStorage
- Test on all browsers
EOF
```

2. Modify lesson-4 to use your file:
```javascript
// Change line ~177
const prdPath = path.join(__dirname, 'test-documents', 'my-test-prd.txt');
```

3. Run: `npm run learn:4`

4. **Evaluate:**
   - Did it extract all 4 requirements?
   - Are story points reasonable?
   - Would you use these tickets?

---

## ✅ 60-Minute Checkpoint: What You Should Know

After this hour, you should be able to answer:

### Understanding:
- ✅ How does text → AI → ticket work?
- ✅ What's a system message vs user message?
- ✅ Why use low temperature for extraction?
- ✅ How do you parse JSON from AI responses?

### Practical Skills:
- ✅ Modify prompts to change behavior
- ✅ Add custom fields to tickets
- ✅ Adjust story point scales
- ✅ Test with your own requirements

### Production Awareness:
- ✅ How production agents differ from lessons
- ✅ What additional features they have
- ✅ Where to find the code

---

## 🎯 What to Do Next (Choose One)

### Path A: Deep Dive (2-3 hours)
**For:** People who want to understand everything

```bash
# Study the complete orchestrator
code playground/orchestrator.ts

# Run the full production pipeline
npm run playground

# Read advanced guide
code playground/AGENTS_101.md
```

**Ask me:** "Explain orchestrator.ts line by line"

---

### Path B: Hands-On Building (2-3 hours)
**For:** People who learn by doing

**Task:** Build a "Ticket Quality Validator Agent"
- Reads a ticket
- Checks: Has clear title? 3+ acceptance criteria? Reasonable points?
- Outputs: Quality score + improvement suggestions

**Tell me:** "Let's build a quality validator agent together"

---

### Path C: Production Integration (3-4 hours)
**For:** People ready to ship

**Task:** Build React UI for the agent
- Upload PRD (PDF/TXT)
- Show progress bar (real-time)
- Display tickets (edit before saving)
- Integrate with existing app

**Tell me:** "Let's build the UI component"

---

### Path D: Advanced Techniques (1-2 hours)
**For:** People wanting pro skills

```bash
# Run advanced lesson
npm run learn:advanced

# Study prompt engineering
code playground/PROMPT_ENGINEERING_GUIDE.md

# Compare models
ollama pull mistral:7b  # Takes ~5 min
# Then modify lesson-4 to use mistral, compare quality
```

---

## 📊 Self-Assessment

Rate your confidence (1-5):
- Understanding agents conceptually: ___/5
- Writing effective prompts: ___/5
- Parsing AI responses: ___/5
- Debugging when things fail: ___/5
- Reading TypeScript agent code: ___/5

**If most are 3+:** You're ready for Path B or C
**If most are 1-2:** Stick with Path A, read more docs

---

## 💬 Talk to Your Tutor (Me)

### If you're stuck:
- "I don't understand what line X does"
- "Why isn't my prompt working?"
- "What should I read next?"

### If you're ready:
- "Let's build feature X"
- "How do I integrate this?"
- "Explain this code to me"

### If you want more:
- "Show me advanced prompting techniques"
- "How do I improve accuracy?"
- "What are best practices for production?"

---

## 🎉 You're Already 40% Done!

```
Foundation (Phase 1): ████████████████████ 100% ✅
PRD Agent Learning:   ████████░░░░░░░░░░░░  40%  ← YOU ARE HERE
Production:           ░░░░░░░░░░░░░░░░░░░░   0%
```

**You've completed:**
- Basic agent concepts ✅
- Lesson 1-4 (working examples) ✅
- Your first PRD→Ticket conversion ✅

**Next milestone:**
- Build a custom agent from scratch
- That's when you hit 70% proficiency!

---

## 🚀 Right Now - Do This:

1. **Run the advanced lesson** (10 min):
   ```bash
   npm run learn:advanced
   ```

2. **Pick ONE experiment** from minute 15-30 section above (15 min)

3. **Read ONE production file** (15 min):
   ```bash
   code playground/agents/ticketGenerator.ts
   ```

4. **Tell me what you want to learn next:**
   - "Explain ticketGenerator.ts to me"
   - "Let's build a custom agent"
   - "Show me how to add feature X"
   - "I want to try idea Y"

**I'm your pair programmer - let's build this together!** 🚀

