# 🎓 Interactive AI Agent Tutorial

**Welcome to your hands-on learning journey!**

This tutorial will take you from zero to hero in building AI agents.  
Time commitment: 2-3 hours (split across multiple sessions)

---

## 🗺️ Learning Path

```
Session 1: Understanding [30 min] ← START HERE
    ↓
Session 2: Experimenting [45 min]
    ↓
Session 3: Building [60 min]
    ↓
Session 4: Mastering [45 min]
```

---

## 📖 SESSION 1: Understanding the Magic (30 minutes)

### **What You'll Learn:**
- How Ollama works
- What prompts are
- How agents structure output
- The pipeline flow

### **Step 1.1: Talk to the AI Directly (5 min)**

Let's have a conversation with your AI model:

```bash
# Start interactive chat
ollama run llama3.2:3b
```

**Try these prompts:**
```
>>> Extract the main requirement from: "Users must be able to login with email and password"

>>> Convert this to a JIRA ticket title: "Users must be able to login"

>>> Estimate story points for: "Add drag and drop dashboard customization"

>>> /bye  (to exit)
```

**💡 What You're Learning:**
- The AI understands natural language
- You don't need perfect syntax
- It can follow instructions

---

### **Step 1.2: Understanding Prompts (10 min)**

A "prompt" is just instructions to the AI. Let's compare:

**❌ Bad Prompt:**
```
"Extract requirements"
```

**✅ Good Prompt:**
```
"Extract requirements from this PRD. 
For each requirement, provide a title and description.
Return as JSON array."
```

**🏆 Great Prompt:**
```
"Extract all functional and non-functional requirements from this PRD.

For each requirement provide:
- title (brief, under 10 words)
- description (detailed)
- priority (high/medium/low based on words like 'must', 'should', 'could')

Return as JSON:
[{"title": "...", "description": "...", "priority": "..."}]

Only extract explicit requirements. Don't invent new ones."
```

**🧪 Try it yourself:**

```bash
# Test bad vs good prompt
ollama run llama3.2:3b "extract requirements" < playground/test-documents/sample-prd.txt

# Then try:
ollama run llama3.2:3b "Extract requirements from this text and return as JSON array with title and description fields" < playground/test-documents/sample-prd.txt
```

**Notice the difference?** Specific prompts = better results!

---

### **Step 1.3: Read Your First Agent (15 min)**

Open this file: `playground/agents/documentParser.ts`

**🔍 Things to look for:**

1. **Line ~55: The `buildPrompt()` method**
   - This is where we tell the AI what to do
   - See how specific we are?
   - Notice the JSON format example

2. **Line ~120: The `parseResponse()` method**
   - This converts AI text → TypeScript objects
   - Handles errors gracefully
   - Validates the structure

3. **Line ~160: Helper functions**
   - `extractTextFromPDF()` - Just a utility, not AI
   - Not everything needs AI!

**✏️ Exercise:**
Read through the file and add comments where you don't understand something. We'll review together!

---

## 🧪 SESSION 2: Experimenting (45 minutes)

### **What You'll Learn:**
- Modifying prompts
- Comparing models
- Measuring quality
- Debugging agents

### **Step 2.1: Modify a Prompt (15 min)**

Let's make the ticket generator more opinionated!

**Task:** Open `playground/agents/ticketGenerator.ts`

**Find this line** (around line 120):
```typescript
// Story points guide in the prompt
- 1 SP: Few hours, trivial, no unknowns
- 2 SP: 1 day, simple, clear path
```

**Change it to:**
```typescript
- 1 SP: Less than 2 hours
- 2 SP: Half day
- 3 SP: 1 day
- 5 SP: 2-3 days
- 8 SP: 1 week (consider splitting)
- 13 SP: Too large, must split into smaller tickets
```

**Test it:**
```bash
npm run playground
```

**Notice:** Story points might change! This is prompt engineering.

---

### **Step 2.2: Try a Better Model (15 min)**

Your M4 can handle larger models. Let's upgrade!

```bash
# Pull a better model (4GB, will take 3-5 minutes)
ollama pull mistral:7b
```

**While it downloads, read this:**

**Model Comparison:**

| Model | Params | Memory | Speed | Quality | Best For |
|-------|--------|--------|-------|---------|----------|
| llama3.2:3b | 3B | 2GB | ⚡⚡⚡ | ⭐⭐ | Quick tests, parsing |
| mistral:7b | 7B | 4GB | ⚡⚡ | ⭐⭐⭐⭐ | Production quality |
| qwen2.5:14b | 14B | 8GB | ⚡ | ⭐⭐⭐⭐⭐ | Complex reasoning |

**After download completes:**

Open `playground/agents/requirementsExtractor.ts`

**Change line ~45:**
```typescript
constructor(model: string = 'mistral:7b') {  // ← Changed from llama3.2:3b
```

**Test again:**
```bash
npm run playground
```

**Compare the results!** Mistral should give better, more detailed requirements.

---

### **Step 2.3: Interactive Debugging (15 min)**

Let's see what the AI actually "sees":

**Create this test file:**

```bash
cat > playground/debug-agent.cjs << 'EOF'
// Quick debug script to see AI responses

async function debugPrompt(prompt) {
  console.log('📝 SENDING TO AI:');
  console.log('─'.repeat(50));
  console.log(prompt);
  console.log('─'.repeat(50));
  console.log('\n🤖 AI RESPONSE:');
  
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      messages: [{ role: 'user', content: prompt }],
      stream: false
    })
  });
  
  const data = await response.json();
  console.log(data.message.content);
  console.log('\n' + '─'.repeat(50));
}

// Test it
const testPrompt = `Create a JIRA ticket for this requirement:
"Users should be able to export data as CSV"

Return JSON with: title, description, storyPoints (1-13)`;

debugPrompt(testPrompt);
EOF

node playground/debug-agent.cjs
```

**This shows you EXACTLY what the AI sees and returns!**

---

## 🏗️ SESSION 3: Building Your First Custom Agent (60 minutes)

### **What You'll Learn:**
- Create an agent from scratch
- Integrate it into the pipeline
- Test it end-to-end

### **Step 3.1: Design Your Agent (10 min)**

**Let's build:** "Story Point Validator Agent"

**Purpose:** Reviews generated tickets and flags unrealistic estimates

**Input:** List of tickets  
**Output:** Validation report with suggestions

**Think through:**
- What makes a story point realistic?
- What patterns indicate over/under estimation?
- How do you explain your reasoning?

**Sketch the flow:**
```
Tickets → Validator Agent → Checks each ticket → Returns warnings
```

---

### **Step 3.2: Create the Agent File (20 min)**

**I'll help you build this together. Let me know when you're ready!**

We'll create: `playground/agents/storyPointValidator.ts`

**You'll learn:**
- How to structure a new agent
- How to iterate over data
- How to provide helpful feedback
- How to integrate with the pipeline

---

### **Step 3.3: Integrate & Test (20 min)**

**Add your agent to the orchestrator:**

```typescript
// In orchestrator.ts
// Stage 4: Validate story points
const validatorResult = await validateTickets(tickets);
```

**Test it:**
```bash
npm run playground
```

**See your agent in action!**

---

### **Step 3.4: Iterate & Improve (10 min)**

**Try these experiments:**
1. Change temperature (0.3 vs 0.7) - see difference?
2. Add more examples to the prompt
3. Make it check for missing acceptance criteria
4. Add quality scoring

---

## 🎯 SESSION 4: Mastering Agent Patterns (45 minutes)

### **Advanced Concepts:**

1. **Agent Chaining** - Output of Agent A → Input of Agent B
2. **Agent Collaboration** - Multiple agents work on same data
3. **Self-Critique** - Agents review their own output
4. **Dynamic Routing** - Choose which agent based on input

**We'll build these together when you're ready!**

---

## 🎬 Let's Start RIGHT NOW!

### **Your First Lesson - Understanding the Document Parser**

Run this command:
```bash
code playground/agents/documentParser.ts
```

**I want you to:**

1. **Read lines 1-50** (the comments and class definition)
2. **Find the `buildPrompt()` method** (around line 55)
3. **Read the prompt we send to AI** 
4. **Notice:** 
   - How we structure the request
   - The JSON format we expect
   - The categories we define

**Then tell me:**
- What do you think the AI actually does?
- Why do we specify JSON format?
- What would happen if we removed the example format?

**Let's discuss! I'll wait for your thoughts before moving to the next step. 🤔**

---

## 🎯 Quick Exercise Options (Choose Your Path)

**Path A: Understand First (Recommended for beginners)**
→ Read code, discuss concepts, then experiment

**Path B: Experiment First (Learn by doing)**
→ Start modifying, break things, understand why

**Path C: Build Immediately (For experienced devs)**
→ Create new agent right away, learn as you go

**Which path feels right for you?** 🚀