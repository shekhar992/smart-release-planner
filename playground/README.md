# 🧪 AI Agents Playground

**⚠️ EXPERIMENTAL ZONE - DO NOT DEPLOY**

This folder contains experimental AI agent development work. Nothing here affects the production application.

## What's This?

We're building AI agents to convert PRD/BRD documents into tickets using **Ollama** (free, local LLMs).

## Safety & Compliance

- ✅ All AI processing happens **locally** (Ollama on your machine)
- ✅ No data sent to external services
- ✅ No changes to existing business logic
- ✅ Isolated from production code
- ✅ Test documents are gitignored

## Folder Structure

```
playground/
├── README.md                    # You are here
├── test-documents/              # Sample PRDs (gitignored)
├── agents/                      # Agent implementations
│   ├── base.ts                  # Base Agent class
│   ├── documentParser.ts        # Extracts text from PDFs
│   ├── requirementsExtractor.ts # Finds requirements
│   └── ticketGenerator.ts       # Creates tickets
├── lib/
│   └── ollama-client.ts         # Ollama API wrapper
├── orchestrator.ts              # Multi-agent coordinator
├── types.ts                     # TypeScript interfaces
└── ui/                          # Test UI components
    └── AgentPlayground.tsx      # Isolated testing interface
```

## Getting Started

### 1. Install Ollama

```bash
# Install Ollama (one-time)
brew install ollama

# Start Ollama service
ollama serve &

# Pull a model (choose based on speed vs quality)
ollama pull llama3.2:3b     # Fast, 2GB download
# OR
ollama pull mistral:7b      # Better quality, 4GB download
# OR
ollama pull qwen2.5:14b     # Best quality, 8GB download
```

### 2. Install Dependencies

```bash
npm install ollama pdf-parse
```

### 3. Test It

```bash
# Run the playground
npm run playground
```

## Learning Resources

- [Ollama Docs](https://ollama.com/docs)
- [What Are AI Agents?](./docs/AGENTS_101.md) (to be created)
- [LangChain Concepts](https://js.langchain.com/docs/)

## Models We're Using

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| llama3.2:3b | 2GB | ⚡⚡⚡ | ⭐⭐ | Quick parsing |
| mistral:7b | 4GB | ⚡⚡ | ⭐⭐⭐ | Main agent |
| qwen2.5:14b | 8GB | ⚡ | ⭐⭐⭐⭐ | Complex reasoning |

**Your M4 MacBook can handle all of these easily!**

## Current Status

- [x] Folder structure created
- [ ] Ollama installed
- [ ] First agent built
- [ ] Test UI created
- [ ] Working end-to-end demo

---

**Remember:** This is a learning sandbox. Break things, experiment, have fun! 🧪
