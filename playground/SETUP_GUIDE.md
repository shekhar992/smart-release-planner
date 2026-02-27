# 🚀 Quick Start Guide - Setting Up Your AI Agent Environment

## Step 1: Install Ollama (5 minutes)

### On macOS:

```bash
# Option 1: Using Homebrew (recommended)
brew install ollama

# Option 2: Direct download
# Visit https://ollama.com/download and download for Mac
```

### Verify Installation:

```bash
# Check if installed
which ollama
# Should output: /opt/homebrew/bin/ollama (or similar)

# Check version
ollama --version
```

---

## Step 2: Start Ollama Service (30 seconds)

```bash
# Start Ollama in the background
ollama serve &

# Or if the above doesn't work, just run:
ollama serve
# (This will keep running in the terminal)
```

**Keep this terminal open while developing!**

---

## Step 3: Pull Your First Model (5-10 minutes)

These are one-time downloads. Choose based on your needs:

### 🏃 Fast Model (Recommended for learning):
```bash
ollama pull llama3.2:3b
# Size: ~2GB
# Speed: Very fast
# Quality: Good for extraction, parsing
```

### ⚖️ Balanced Model (Recommended for production):
```bash
ollama pull mistral:7b
# Size: ~4GB
# Speed: Fast
# Quality: Better reasoning
```

### 🧠 High Quality Model (For complex tasks):
```bash
ollama pull qwen2.5:14b
# Size: ~8GB
# Speed: Medium
# Quality: Excellent reasoning, best for ticket generation
```

**Your M4 MacBook can easily handle the 14B model!**

---

## Step 4: Test It Works

```bash
# Test the model
ollama run llama3.2:3b "Say hello!"

# Should respond with something like:
# "Hello! How can I help you today?"

# Exit with: /bye
```

---

## Step 5: Install Node Dependencies

```bash
# From your project root
cd /Users/sheksharma/Documents/Release\ Planner

# Install dependencies for PDF parsing and Ollama
npm install pdf-parse
# Note: We're using fetch API (built into Node 18+), no need for ollama npm package
```

---

## Step 6: Verify Everything Works

```bash
# Run this command to check Ollama setup:
curl http://localhost:11434/api/tags

# Should return JSON with your installed models
```

---

## Step 7: Test the Ollama Client

Create a test file to verify:

```bash
# Create a simple test
cat > test-ollama.js << 'EOF'
async function test() {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      messages: [{ role: 'user', content: 'Say "Setup complete!"' }],
      stream: false
    })
  });
  const data = await response.json();
  console.log('✅ Ollama says:', data.message.content);
}
test();
EOF

# Run it
node test-ollama.js

# Clean up
rm test-ollama.js
```

---

## 🎯 You're Ready!

If all steps above worked, you now have:
- ✅ Ollama installed and running
- ✅ At least one model downloaded
- ✅ Able to make API calls from Node.js
- ✅ Ready to build agents!

---

## ⚡ Quick Reference

### Common Ollama Commands:

```bash
# List installed models
ollama list

# Pull a new model
ollama pull <model-name>

# Delete a model (to free space)
ollama rm <model-name>

# Run interactive chat
ollama run <model-name>

# Check if running
curl http://localhost:11434/api/tags

# Stop Ollama
pkill ollama
```

---

## 🆘 Troubleshooting

**"Ollama is not running"**
```bash
ollama serve &
```

**"Model not found"**
```bash
ollama pull llama3.2:3b
```

**"Port already in use"**
```bash
pkill ollama
ollama serve &
```

**"Out of memory"**
- Use smaller model (3b instead of 7b)
- Close other applications
- Restart Ollama

---

## 🎓 Next Steps

Once setup is complete:
1. Read `lib/ollama-client.ts` to understand how we call Ollama
2. Read `agents/base-agent.ts` to understand agent structure
3. Try running the first agent (coming next!)

**Total Cost: $0.00 💰**
