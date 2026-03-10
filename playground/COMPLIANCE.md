/**
 * COMPLIANCE & SAFETY NOTICE
 * 
 * ⚠️ READ BEFORE USING AI AGENTS ⚠️
 * 
 * This file documents compliance considerations for using AI agents
 * on company hardware.
 */

# AI Agent Compliance Guidelines

## 🔒 Data Privacy

### What Stays Local:
- ✅ ALL AI processing happens on YOUR MacBook (via Ollama)
- ✅ NO data sent to external servers
- ✅ NO API calls to OpenAI, Anthropic, or other cloud services
- ✅ PRD/BRD documents never leave your machine

### How It Works:
```
Your PDF → Ollama (localhost:11434) → Generated Tickets
     ↓
  All local on your MacBook M4
  No internet connection needed
```

## 🛡️ Company Data Protection

### DO:
- ✅ Only test with non-confidential documents
- ✅ Use sample/mock PRDs for development
- ✅ Keep all test documents in `playground/test-documents/` (gitignored)
- ✅ Review all generated tickets before sharing
- ✅ Clear test data regularly

### DON'T:
- ❌ Upload real confidential PRDs until approved by security team
- ❌ Commit test documents to git
- ❌ Share generated tickets that contain proprietary info
- ❌ Use this in production until security review complete

## 📝 Git Safety

### Protected by .gitignore:
```
playground/test-documents/*     ← Your test PDFs/docs
playground/outputs/*            ← Generated results
playground/**/*.local.*         ← Local config files
.env*.local                     ← API keys (if you add any later)
```

### Before Committing:
1. Run: `git status` - verify no sensitive files staged
2. Check: No API keys or credentials in code
3. Review: All test data is excluded

## 🚫 What This Does NOT Do

This experimental setup:
- ❌ Does NOT modify your production app
- ❌ Does NOT connect to external services
- ❌ Does NOT store data in cloud databases
- ❌ Does NOT send telemetry or analytics
- ❌ Does NOT access company networks

## ✅ What IS Safe

- ✅ Installing Ollama (it's like installing Docker or Node.js)
- ✅ Running local LLMs (happens entirely on your machine)
- ✅ Testing with mock/sample documents
- ✅ Learning how AI agents work
- ✅ Building proof-of-concept features

## 🎓 Responsible Development

### Testing Phase:
1. Use ONLY mock PRD documents (create your own)
2. Start with simple examples
3. Validate AI output thoroughly
4. Document what works and what doesn't

### Before Production:
- [ ] Security review by IT team
- [ ] Test with sanitized real documents
- [ ] Validate compliance with company policies
- [ ] Get approval from manager
- [ ] Document all data flows

## 🆘 If Something Goes Wrong

### Immediate Actions:
1. Stop Ollama: `pkill ollama`
2. Delete sensitive test data
3. Check git for uncommitted files
4. Review recent commits

### Prevention:
- Keep backups before major changes
- Test in isolation
- Never rush to production
- When in doubt, ask for review

## 📞 Questions About Compliance?

**Before using with real company data:**
- Talk to your IT security team
- Get written approval if required
- Document the data flow
- Ensure alignment with company policies

---

**Remember:** This is a learning/POC environment. Treat all AI-generated 
content as drafts that need human review. The agents are assistants, not 
replacements for human judgment.

**Your job security matters more than any feature.** When in doubt, be conservative.

---

_Last Updated: 2026-02-25_
_Compliance Officer: [Your Name]_
_Approved For: Local development and POC only_
