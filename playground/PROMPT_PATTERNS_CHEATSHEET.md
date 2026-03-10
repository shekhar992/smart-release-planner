# 🎯 PRD-to-Ticket Agent: Prompt Patterns Cheat Sheet

## Quick Reference for Building Your Agent

---

## 📋 Pattern 1: Extract Requirements (Simple List)

### Use Case:
Get a quick list of requirements from a PRD

### Prompt:
```javascript
{
  role: 'system',
  content: 'You extract requirements. Output format: ["req1", "req2"]'
},
{
  role: 'user', 
  content: `List main requirements from this PRD:\n\n${prdText}\n\nJSON array only:`
}
```

### Settings:
- Temperature: **0.2** (need accuracy)
- Max tokens: 2000

### Expected Output:
```json
["Customizable dashboard", "Real-time notifications", "User analytics"]
```

---

## 🎫 Pattern 2: Basic Ticket Generation

### Use Case:
Convert one requirement to a JIRA ticket

### Prompt:
```javascript
{
  role: 'system',
  content: 'You generate JIRA tickets. Output only JSON.'
},
{
  role: 'user',
  content: `Requirement: "${requirement}"

Example: {"title": "Add login", "points": 3, "desc": "User authentication"}

Your ticket (JSON):`
}
```

### Settings:
- Temperature: **0.4** (balance accuracy + creativity)
- Max tokens: 500

### Expected Output:
```json
{
  "title": "Implement customizable dashboard layout",
  "points": 8,
  "desc": "Users can drag-and-drop widgets to customize their dashboard"
}
```

---

## 📊 Pattern 3: Story Point Estimation

### Use Case:
Estimate complexity with confidence score

### Prompt:
```javascript
{
  role: 'user',
  content: `Estimate story points:

"${requirement}"

Complexity factors:
- UI changes? (1-3 pts)
- Backend API? (2-5 pts)
- Database? (1-3 pts)
- Testing? (1-2 pts)

Sum total. Return:
{"points": 8, "confidence": 0.85, "breakdown": ["UI: 3", "API: 5"]}`
}
```

### Settings:
- Temperature: **0.3** (need consistency)

### Expected Output:
```json
{
  "points": 8,
  "confidence": 0.85,
  "breakdown": ["UI: 3 pts", "Backend: 5 pts"]
}
```

---

## ✅ Pattern 4: Acceptance Criteria Generation

### Use Case:
Create testable acceptance criteria

### Prompt:
```javascript
{
  role: 'system',
  content: 'You write acceptance criteria in Given-When-Then format.'
},
{
  role: 'user',
  content: `Ticket: "${ticketTitle}"

Write 3-5 acceptance criteria:

Example:
["Given user is logged in, When they click X, Then Y happens",
 "Given invalid input, When submitted, Then show error"]

JSON array:`
}
```

### Settings:
- Temperature: **0.5** (need some creativity)

### Expected Output:
```json
[
  "Given user drags widget, When dropped in new location, Then layout updates",
  "Given layout changed, When page refreshes, Then layout persists",
  "Given invalid drag position, When dropped, Then returns to original location"
]
```

---

## 🔍 Pattern 5: Requirement Deep Analysis

### Use Case:
Extract ALL details from a requirement (priority, owner, dependencies)

### Prompt:
```javascript
{
  role: 'user',
  content: `Analyze requirement:

"${requirement}"

Extract:
- Priority (high/medium/low) - Look for "must", "should", "could"
- Component (frontend/backend/database/api)
- User impact (how many users affected)
- Risk level (technical complexity)

Return:
{"priority": "high", "component": "frontend", "impact": "all users", "risk": "medium"}`
}
```

### Expected Output:
```json
{
  "priority": "high",
  "component": "frontend",
  "impact": "all users",
  "risk": "medium"
}
```

---

## 🧠 Pattern 6: Chain-of-Thought Reasoning

### Use Case:
Get better estimates by making AI show its work

### Prompt:
```javascript
{
  role: 'user',
  content: `Estimate story points for: "${requirement}"

THINK STEP BY STEP:
1. List all subtasks
2. Rate complexity of each (simple/medium/hard)
3. Count unknowns/risks
4. Sum points

Return:
{"subtasks": ["task1", "task2"], "complexity": "high", "unknowns": ["API schema unclear"], "points": 8}`
}
```

### Settings:
- Temperature: **0.5**
- Max tokens: 1000 (needs space to think)

### Expected Output:
```json
{
  "subtasks": ["Design UI", "Build drag system", "Save preferences", "Add tests"],
  "complexity": "high",
  "unknowns": ["Performance with 50+ widgets", "Browser compatibility"],
  "points": 8
}
```

---

## 🎨 Pattern 7: Multi-Field Ticket (Complete)

### Use Case:
Generate production-ready ticket with ALL fields

### Prompt:
```javascript
{
  role: 'system',
  content: 'You are a senior engineer creating JIRA tickets. Be thorough.'
},
{
  role: 'user',
  content: `Create complete JIRA ticket:

Requirement: "${requirement}"

Include:
- Actionable title (start with verb)
- Detailed description (what, why, how)
- 3-5 acceptance criteria (testable)
- Story points (1-13 Fibonacci)
- Labels (frontend, backend, api, db, testing)
- Priority (high, medium, low)

Example:
{"title": "Implement OAuth login", "description": "Add OAuth2...", "acceptanceCriteria": ["User can login", "Token persists"], "storyPoints": 5, "labels": ["backend", "security"], "priority": "high"}

Your ticket (JSON only):`
}
```

### Settings:
- Temperature: **0.6** (need creativity for descriptions)
- Max tokens: 800

---

## 🚀 Pattern 8: Batch Processing (Efficient)

### Use Case:
Process multiple requirements quickly

### Approach:
```javascript
// Process in parallel batches of 3
const batchSize = 3;
for (let i = 0; i < requirements.length; i += batchSize) {
  const batch = requirements.slice(i, i + batchSize);
  
  // Send one prompt with multiple requirements
  const prompt = `Convert these ${batch.length} requirements to tickets:

${batch.map((r, idx) => `${idx + 1}. ${r}`).join('\n')}

Return array: [{"title": "...", "points": 3}, ...]`;

  const response = await callAI(prompt);
  tickets.push(...parseTickets(response));
}
```

**⚠️ Trade-off:** Faster but less accurate than one-at-a-time

---

## 🎓 Prompt Engineering Principles for PRD Agents

### ✅ DO:
- Use concrete examples
- Split complex tasks into simple steps
- Add system messages for behavior
- Use low temperature for extraction (0.2-0.3)
- Show expected JSON structure
- Include context about your team's workflow

### ❌ DON'T:
- Ask AI to do everything at once
- Use high temperature for data extraction
- Assume AI will follow format without examples
- Skip validation of AI output
- Forget error handling & fallbacks

---

## 🧪 Quick Experiments (15 min each)

### Experiment 1: Temperature Impact
Run this 3 times with different temps:
```javascript
// Test A: temp = 0.1 (very consistent)
// Test B: temp = 0.5 (balanced)
// Test C: temp = 0.9 (creative)

// Compare: Which gives best story point estimates?
```

### Experiment 2: Prompt Length
```javascript
// Test A: 10-word prompt: "Convert to ticket: ${req}. JSON only:"
// Test B: 50-word prompt with examples
// Test C: 200-word prompt with detailed instructions

// Compare: Does longer = better?
```

### Experiment 3: System Messages
```javascript
// Test A: No system message
// Test B: "You are a JSON API"
// Test C: "You are a senior engineer with 10 years experience"

// Compare: Does persona matter?
```

---

## 🎯 Your Next Steps

1. **Right Now:** Run `npm run learn:advanced` (see all patterns in action)

2. **Next 30 min:** Open [lesson-4-simple-working.cjs](playground/lesson-4-simple-working.cjs) and modify prompts

3. **After that:** Read [agents/ticketGenerator.ts](playground/agents/ticketGenerator.ts) - see production version

4. **Tomorrow:** Build your custom agent with your own prompts!

---

## 📚 More Resources

- [PROMPT_ENGINEERING_GUIDE.md](PROMPT_ENGINEERING_GUIDE.md) - Techniques
- [AGENTS_101.md](AGENTS_101.md) - Architecture patterns
- [PRD_AGENT_LEARNING_PATH.md](PRD_AGENT_LEARNING_PATH.md) - Complete roadmap

---

## 💬 Ask Your Tutor (Me!)

Common questions I can help with:
- "Why isn't my prompt returning JSON?"
- "How do I make estimates more accurate?"
- "Show me examples of good prompts for X"
- "What temperature should I use for Y?"
- "How do I add field Z to tickets?"

I'm here to help you master this! 🚀
