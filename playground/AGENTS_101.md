# 🎓 AI Agents 101 - Complete Learning Guide

**For developers new to AI agents**

---

## What Are AI Agents? (Simple Explanation)

Think of an agent like a smart employee:

```
Regular Function:
Input → Code Logic → Output

AI Agent:
Input → Ask AI → Parse AI Response → Output
```

**The difference?** The AI can understand context, make judgments, and handle variations that would require thousands of lines of code.

---

## Real-World Example

### Without AI (Traditional Code):

```typescript
function extractRequirements(text: string): string[] {
  const requirements = [];
  
  // Need rules for every format...
  if (text.includes('must have')) requirements.push(...)
  if (text.includes('shall')) requirements.push(...)
  if (text.includes('As a user')) requirements.push(...)
  // ... 100+ more rules ...
  
  return requirements;
}
```

Problems:
- Rigid rules
- Misses variations
- Hard to maintain
- Breaks on edge cases

### With AI Agent:

```typescript
class RequirementsAgent extends BaseAgent {
  buildPrompt(text: string) {
    return `Extract all requirements from: ${text}`;
  }
  
  parseResponse(aiResponse: string) {
    return JSON.parse(aiResponse);
  }
}

const agent = new RequirementsAgent();
const requirements = await agent.execute({ input: text });
```

Benefits:
- Understands context
- Handles variations naturally
- Adapts to different formats
- Gets smarter with better prompts

---

## How Our Agent System Works

### Architecture:

```
📄 PDF File
   ↓
🤖 Agent 1: Document Parser
   "Break this into sections"
   ↓
📋 Structured Sections
   ↓
🤖 Agent 2: Requirements Extractor
   "Find all requirements"
   ↓
📝 List of Requirements
   ↓
🤖 Agent 3: Ticket Generator
   "Create JIRA tickets with story points"
   ↓
🎫 Ready-to-Import Tickets
```

### Key Components:

1. **Base Agent Class** (`lib/base-agent.ts`)
   - Template for all agents
   - Handles Ollama communication
   - Manages errors and metrics

2. **Specialized Agents** (`agents/*.ts`)
   - Each has a specific purpose
   - Implements custom prompts
   - Parses responses differently

3. **Orchestrator** (`orchestrator.ts`)
   - Runs agents in sequence
   - Passes data between agents
   - Tracks progress

4. **Ollama Client** (`lib/ollama-client.ts`)
   - Talks to local Ollama server
   - Simple wrapper around HTTP API

---

## Core Concepts

### 1. Prompts

A prompt is instructions to the AI:

**Bad Prompt:**
```
"Extract requirements"
```

**Good Prompt:**
```
"Extract all functional and non-functional requirements from this PRD.
For each requirement, provide:
- A clear title
- Detailed description
- Priority (high/medium/low)

Return as JSON array:
[{ "title": "...", "description": "...", "priority": "..." }]"
```

**Why it matters:** Better prompts = better results

### 2. Temperature

Controls randomness:

- **0.0**: Deterministic (same input → same output)
- **0.3-0.4**: Consistent, good for extraction
- **0.7**: Balanced, good for generation
- **1.0**: Creative, good for brainstorming

```typescript
const response = await ollama.chat(model, messages, {
  temperature: 0.4  // ← Controls this
});
```

### 3. Context

Information passed between agents:

```typescript
const context = {
  input: { /* primary input */ },
  metadata: { /* extra info */ },
  previousResults: { /* from other agents */ }
};
```

### 4. Confidence Scores

How sure the agent is about its output:

- **0.9-1.0**: Very confident
- **0.7-0.9**: Confident
- **0.5-0.7**: Moderate
- **< 0.5**: Uncertain (flag for review)

---

## Agent Design Patterns

### Pattern 1: Sequential Pipeline (What We're Building)

```
Agent A → Agent B → Agent C → Final Result
```

**Use when:** Output of one agent feeds into the next

**Example:** Document → Requirements → Tickets

### Pattern 2: Parallel Agents

```
        ┌→ Agent A →┐
Input →→→ Agent B →→→ Combine → Output
        └→ Agent C →┘
```

**Use when:** Multiple agents analyze same input independently

**Example:** One agent extracts requirements, another estimates complexity

### Pattern 3: Feedback Loop

```
Agent A → Agent B → Validator → If not good → Back to Agent A
```

**Use when:** Quality checking needed

**Example:** Generate tickets → Review quality → Regenerate if poor

### Pattern 4: Hierarchical Agents

```
Supervisor Agent
   ↓ delegates
Worker Agent 1, Worker Agent 2, Worker Agent 3
   ↓ report back
Supervisor decides next steps
```

**Use when:** Complex decision-making needed

**Example:** Manager agent decides which worker agents to call

---

## Code Walkthrough

### Creating Your First Agent

```typescript
// 1. Import base class
import { BaseAgent } from '../lib/base-agent';

// 2. Define input/output types
interface MyInput {
  text: string;
}

interface MyOutput {
  result: string;
}

// 3. Extend BaseAgent
class MyAgent extends BaseAgent<MyInput, MyOutput> {
  
  // 4. Constructor: Define who this agent is
  constructor() {
    super({
      name: 'My First Agent',
      description: 'A simple agent that does X',
      model: 'llama3.2:3b',
      temperature: 0.7
    });
  }

  // 5. Build prompt: What you ask the AI
  protected async buildPrompt(context: AgentContext): Promise<string> {
    const input = context.input as MyInput;
    return `Do something with: ${input.text}`;
  }

  // 6. Parse response: Convert AI text → structured data
  protected async parseResponse(response: string): Promise<MyOutput> {
    return {
      result: response.trim()
    };
  }
}

// 7. Use the agent
const agent = new MyAgent();
const result = await agent.execute({
  input: { text: 'hello' }
});

console.log(result.data.result);
```

---

## Common Patterns You'll Use

### Pattern: JSON Extraction

```typescript
// AI often wraps JSON in markdown:
const response = `Here's the data:
\`\`\`json
{"name": "value"}
\`\`\`
`;

// Use the helper:
const json = this.extractJSON(response);
```

### Pattern: Error Handling

```typescript
const result = await agent.execute(context);

if (!result.success) {
  console.error('Agent failed:', result.error);
  return;
}

// Use the data
const data = result.data;
```

### Pattern: Confidence Checking

```typescript
const result = await agent.execute(context);

if (result.confidence < 0.7) {
  console.warn('Low confidence - review needed');
  // Show to user for manual review
}
```

---

## Debugging Tips

### 1. Log Everything

```typescript
console.log('📥 Input:', context.input);
console.log('📤 Prompt:', prompt);
console.log('🤖 AI Response:', response);
console.log('📊 Parsed Data:', parsedData);
```

### 2. Test Prompts in Ollama CLI First

```bash
ollama run llama3.2:3b
>>> Your prompt here...
# See what the AI returns
```

### 3. Start Simple

Don't build complex agents first. Build:
1. Simple text → summary agent
2. Then add structure
3. Then add complexity

### 4. Check Ollama Logs

```bash
# If agent fails, check Ollama output
tail -f ~/.ollama/logs/server.log
```

---

## Performance Tips for Your M4 MacBook

### Model Selection:

```typescript
// For speed (parsing, simple extraction):
model: 'llama3.2:3b'  // ~2-5 seconds per call

// For quality (complex reasoning):
model: 'mistral:7b'   // ~5-10 seconds per call

// For best results (ticket generation):
model: 'qwen2.5:14b'  // ~10-20 seconds per call
```

### Optimization Tricks:

1. **Use smaller models for simple tasks:**
   ```typescript
   // Document parsing: Use 3B
   // Ticket generation: Use 14B
   ```

2. **Batch when possible:**
   ```typescript
   // Instead of: Call agent 10 times
   // Do: Pass all 10 items in one call
   ```

3. **Cache results:**
   ```typescript
   // If same document processed twice, save results
   const cache = new Map();
   ```

4. **Parallel when independent:**
   ```typescript
   // If agents don't depend on each other:
   const [result1, result2] = await Promise.all([
     agent1.execute(...),
     agent2.execute(...)
   ]);
   ```

---

## Next Level Concepts

### 1. Agent Memory

Make agents remember previous interactions:

```typescript
class AgentWithMemory extends BaseAgent {
  private history: Message[] = [];
  
  protected async buildPrompt(context: AgentContext): Promise<string> {
    // Include conversation history
    return `Previous context: ${this.history}
    New task: ${context.input}`;
  }
}
```

### 2. Self-Critique

Make agents review their own work:

```typescript
// Generate
const tickets = await ticketAgent.execute(req);

// Review
const review = await reviewAgent.execute({
  input: tickets,
  task: 'Are these tickets complete and clear?'
});

// Regenerate if needed
if (review.data.needsImprovement) {
  tickets = await ticketAgent.execute(req, review.data.suggestions);
}
```

### 3. Dynamic Model Selection

Choose model based on task complexity:

```typescript
function selectModel(taskComplexity: number): string {
  if (taskComplexity < 3) return 'llama3.2:3b';
  if (taskComplexity < 7) return 'mistral:7b';
  return 'qwen2.5:14b';
}
```

---

## Measuring Success

### Good Agent Performance:

- ✅ **Confidence > 0.8**: High quality
- ✅ **Duration < 30s**: Fast enough
- ✅ **Parse success rate > 90%**: Reliable
- ✅ **User edits < 20%**: Accurate enough

### Red Flags:

- ❌ Agent fails frequently
- ❌ Low confidence scores
- ❌ Users always have to edit output
- ❌ Takes too long (>60s)

**Solution:** Improve prompts, use better models, or add validation agents

---

## Resources

### Official Docs:
- [Ollama](https://ollama.com/docs) - Local LLM runner
- [LangChain](https://js.langchain.com) - Agent frameworks
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

### Communities:
- r/LocalLLaMA - Reddit community
- Ollama Discord - Official Discord
- LangChain Discord - Framework help

---

## Your Learning Path

**Week 1:** _(You are here!)_
- [x] Understand what agents are
- [ ] Run first agent successfully
- [ ] See end-to-end pipeline work
- [ ] Test with sample document

**Week 2:**
- [ ] Modify prompts to improve results
- [ ] Add custom validation logic
- [ ] Experiment with different models
- [ ] Build UI for the pipeline

**Week 3:**
- [ ] Add new agent types
- [ ] Implement feedback loops
- [ ] Optimize performance
- [ ] Handle edge cases

**Week 4:**
- [ ] Production-ready error handling
- [ ] Testing and validation
- [ ] Documentation
- [ ] Demo to stakeholders

---

**Remember:** Every expert was once a beginner. Build, break, learn, repeat! 🚀
