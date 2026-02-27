# 🎯 Prompt Engineering for PRD-to-Ticket Agents

## The Problem You Just Encountered

**What happened:** AI returned formatted text instead of JSON
**Why:** The model doesn't always follow format instructions
**Solution:** Better prompt engineering techniques

---

## ✅ TECHNIQUE 1: Pre-format Example (Few-Shot Learning)

**Instead of:**
```
Return JSON:
{"title": "...", "points": 5}
```

**Use this:**
```
Example output:
{"title": "Add login button", "points": 3}
{"title": "Create API endpoint", "points": 5}

Now analyze this requirement:
"${requirement}"

Output format (JSON only):
```

**Why it works:** AI sees concrete examples and mimics the pattern

---

## ✅ TECHNIQUE 2: System Role + User Prompt

**Two-message pattern:**
```javascript
messages: [
  {
    role: 'system',
    content: 'You are a JSON generator. Output ONLY valid JSON, no explanations.'
  },
  {
    role: 'user', 
    content: 'Convert this to ticket: "Add login"'
  }
]
```

**Why it works:** System message sets behavioral constraints

---

## ✅ TECHNIQUE 3: Post-Processing Instructions

**Add to your prompt:**
```
CRITICAL: Your response must be parseable by JSON.parse()
- No markdown
- No code blocks
- No explanations before or after
- Start with { and end with }
```

---

## ✅ TECHNIQUE 4: Structured Extraction with Marker Tags

**Use markers:**
```
After your analysis, output:

<JSON>
{your json here}
</JSON>

Then I'll extract only that section.
```

**Parse with:**
```javascript
const jsonMatch = response.match(/<JSON>([\s\S]*?)<\/JSON>/);
const json = JSON.parse(jsonMatch[1]);
```

---

## ✅ TECHNIQUE 5: Temperature Control

**For different tasks:**
- **Extraction (0.1-0.3):** Requirements, data parsing → Need consistency
- **Conversion (0.3-0.5):** Req → Ticket → Balance accuracy and creativity  
- **Generation (0.6-0.8):** Acceptance criteria, descriptions → Need variety

---

## 🎓 PRODUCTION PATTERN: The Robust Approach

Combine multiple techniques:

```javascript
async function robustConversion(requirement) {
  const messages = [
    {
      role: 'system',
      content: 'You are a JSON API. Return only valid JSON, nothing else.'
    },
    {
      role: 'user',
      content: `Convert to ticket:
"${requirement}"

Example: {"title": "Add login", "points": 3}

Your output:`
    }
  ];

  const response = await callOllama(messages, { temperature: 0.3 });
  
  // Try 3 parsing strategies
  let result;
  try {
    result = JSON.parse(response);
  } catch {
    const match = response.match(/\{[\s\S]*?\}/);
    result = match ? JSON.parse(match[0]) : null;
  }
  
  // Validate result
  if (!result?.title || !result?.points) {
    throw new Error('Invalid ticket format');
  }
  
  return result;
}
```

---

## 📊 When to Use Which Technique

| Scenario | Best Technique | Why |
|----------|---------------|-----|
| Small model (3B) | Examples + Low temp | Needs guidance |
| Large model (13B+) | System role | Can follow instructions |
| Complex parsing | Marker tags | Easier extraction |
| Unreliable format | Multiple strategies | Fallback options |
| Production | All combined | Maximum reliability |

---

## 🧪 EXPERIMENT NOW

Let's fix lesson-4 together. I'll show you the improved version.

**Original prompt issue:** Too verbose, model got confused

**Fixed prompt:** Direct, example-driven, clear format

Your task: Understand WHY each change improves results.

