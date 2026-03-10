# 🏁 START HERE - Your First Steps

## ⚡ Quick Start (15 minutes)

### Step 1: Install Ollama

```bash
# Install via Homebrew
brew install ollama

# Start Ollama service (keep this terminal open)
ollama serve
```

### Step 2: Download a Model

Open a NEW terminal:

```bash
# Quick model (2GB) - good for learning
ollama pull llama3.2:3b

# Better model (4GB) - better quality
ollama pull mistral:7b

# Best model (8GB) - production quality
ollama pull qwen2.5:14b
```

**Your M4 MacBook can handle all three!** Start with 3b for speed.

### Step 3: Install Dependencies

```bash
cd /Users/sheksharma/Documents/Release\ Planner

# Install PDF parsing library
npm install pdf-parse
```

### Step 4: Test It!

```bash
# Test Ollama is working
npm run test:ollama

# Run the full agent pipeline
npm run playground
```

You should see agents process the sample PRD and generate tickets! 🎉

---

## 📚 Learning Path

### Phase 1: Understand (30 minutes)
1. ✅ Read [playground/README.md](README.md) - Overview
2. ✅ Read [playground/AGENTS_101.md](AGENTS_101.md) - Core concepts
3. ✅ Read [playground/COMPLIANCE.md](COMPLIANCE.md) - Safety first!

### Phase 2: Explore Code (1 hour)
1. `lib/ollama-client.ts` - How we talk to Ollama
2. `lib/base-agent.ts` - Agent foundation
3. `agents/documentParser.ts` - First agent (simplest)
4. `agents/requirementsExtractor.ts` - Second agent
5. `agents/ticketGenerator.ts` - Third agent (most complex)
6. `orchestrator.ts` - How agents work together

### Phase 3: Experiment (2-3 hours)
1. **Modify prompts** in agents - see how results change
2. **Try different models** - compare quality
3. **Add your own PRD** to test-documents/
4. **Create a new agent** using the patterns

### Phase 4: Build (This week)
1. Create UI component for upload
2. Display agent progress in real-time
3. Show preview of generated tickets
4. Add edit/refinement features

---

## 🛠️ Project Structure

```
playground/
├── START_HERE.md                ← You are here
├── README.md                    ← Project overview
├── SETUP_GUIDE.md              ← Installation instructions
├── AGENTS_101.md               ← Learning guide
├── COMPLIANCE.md               ← Safety guidelines
│
├── lib/
│   ├── ollama-client.ts        ← Talks to Ollama
│   └── base-agent.ts           ← Agent template
│
├── agents/
│   ├── documentParser.ts       ← Agent 1: Parse PDFs
│   ├── requirementsExtractor.ts← Agent 2: Extract requirements
│   └── ticketGenerator.ts      ← Agent 3: Generate tickets
│
├── orchestrator.ts             ← Coordinates all agents
├── types.ts                    ← TypeScript definitions
│
├── test-runner.js              ← Quick connectivity test
├── quick-start.js              ← Full pipeline demo
│
└── test-documents/
    └── sample-prd.txt          ← Example PRD to test with
```

---

## 🎯 What You're Building

```
┌─────────────────────────────────────────────────────┐
│  USER UPLOADS PRD.PDF                               │
└───────────────┬─────────────────────────────────────┘
                ↓
        ┌───────────────┐
        │  🤖 Agent 1   │  Parse document structure
        │  Document     │  Find sections, headers, content
        │  Parser       │  Output: Structured sections
        └───────┬───────┘
                ↓
        ┌───────────────┐
        │  🤖 Agent 2   │  Identify requirements
        │  Requirements │  Extract user stories
        │  Extractor    │  Find acceptance criteria
        └───────┬───────┘
                ↓
        ┌───────────────┐
        │  🤖 Agent 3   │  Create tickets
        │  Ticket       │  Estimate story points
        │  Generator    │  Find dependencies
        └───────┬───────┘
                ↓
┌─────────────────────────────────────────────────────┐
│  USER SEES PREVIEW OF 23 TICKETS                    │
│  ✏️  Can edit before importing to JIRA              │
└─────────────────────────────────────────────────────┘
```

---

## 💰 Cost Tracker

| Action | Cost | Status |
|--------|------|--------|
| Install Ollama | $0 | ✅ One-time |
| Download models | $0 | ✅ One-time |
| Run agents | $0 | ✅ Unlimited |
| Process documents | $0 | ✅ Unlimited |
| **TOTAL** | **$0** | **🎉 FREE!** |

---

## 🚨 Safety Reminders

Before you start:
- [ ] Read COMPLIANCE.md thoroughly
- [ ] Only use sample/mock documents for testing
- [ ] Never commit test documents to git
- [ ] Review generated code before sharing
- [ ] Keep this on AI-Enhancements branch

---

## 🆘 Troubleshooting

### "Ollama not running"
```bash
ollama serve &
```

### "Model not found"
```bash
ollama list  # See what's installed
ollama pull llama3.2:3b  # Install model
```

### "TypeScript errors"
```bash
# The playground uses .ts files but they're not compiled yet
# Test with the .js scripts first
npm run test:ollama
npm run playground
```

### "Agent returns gibberish"
- Try a larger model (mistral:7b)
- Improve the prompt (add more examples)
- Check prompt is clear and specific

---

## 🎉 Success Checklist

Once you complete the Quick Start:
- [ ] Ollama installed and running
- [ ] At least one model downloaded
- [ ] `npm run test:ollama` passes
- [ ] `npm run playground` generates tickets
- [ ] You understand what each agent does
- [ ] You've read the code and added comments

---

## 🤝 Let's Build Together!

You're at the start of an exciting journey. AI agents are powerful, and you're going to build something amazing.

**Remember:**
- Start small, iterate fast
- Break things in the playground (it's safe!)
- Ask questions, experiment, learn
- Document what works

**When stuck:** Read the code, follow the console logs, check Ollama output.

**When excited:** Share your progress, get feedback, iterate!

---

## 📞 Next Conversation Topics

After you've tested the basics:
1. "How do I improve agent accuracy?"
2. "Let's build the UI for this"
3. "How do I add streaming progress?"
4. "Can we make agents collaborative?"

---

**You've got this! Now go run `npm run playground` and see the magic happen!** ✨

_Built with ❤️ on MacBook Pro M4_
_Cost: $0 | Privacy: 100% Local | Performance: Blazing Fast_
