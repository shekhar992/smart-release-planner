/**
 * 🎓 LESSON 3: Debugging & Improving Agents
 * 
 * Things don't always work perfectly. Let's learn how to fix them!
 */

/**
 * DEBUGGING TECHNIQUE #1: See the raw AI response
 */
async function debugAgentResponse() {
  console.log('🔍 DEBUGGING TECHNIQUE #1: Inspect Raw Response\n');

  const prompt = `Create a JIRA ticket for: "Add login button"
  
Return JSON: {"title": "...", "points": 3}`;

  console.log('📤 Sending prompt:');
  console.log(prompt);
  console.log('\n⏳ Waiting for AI...\n');

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
  const rawResponse = data.message.content;

  console.log('📥 RAW AI RESPONSE:');
  console.log('─'.repeat(60));
  console.log(rawResponse);
  console.log('─'.repeat(60));

  console.log('\n🎓 Notice:');
  console.log('   - AI might wrap JSON in ```json blocks');
  console.log('   - AI might add explanation before/after JSON');
  console.log('   - AI might not use exact field names you asked for');

  return rawResponse;
}

/**
 * DEBUGGING TECHNIQUE #2: Improve the prompt
 */
async function improvedPrompt() {
  console.log('\n🔍 DEBUGGING TECHNIQUE #2: Better Prompt\n');

  // IMPROVED: More specific, stricter format
  const prompt = `Create a JIRA ticket for: "Add login button"

RESPOND WITH ONLY VALID JSON. NO EXPLANATIONS.

Exact format:
{"title": "string", "points": number}

Example:
{"title": "Implement OAuth login", "points": 5}

Now create the ticket:`;

  console.log('📤 Improved prompt sent...\n');

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
  const rawResponse = data.message.content;

  console.log('📥 AI RESPONSE:');
  console.log(rawResponse);
  console.log();

  // Try to parse it
  try {
    const match = rawResponse.match(/\{[^}]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      console.log('✅ Successfully parsed!');
      console.log('   Title:', parsed.title);
      console.log('   Points:', parsed.points);
    }
  } catch (e) {
    console.log('❌ Still couldn\'t parse. Need even better prompt!');
  }
}

/**
 * DEBUGGING TECHNIQUE #3: Robust parsing
 */
function robustJsonExtractor(text) {
  console.log('\n🔍 DEBUGGING TECHNIQUE #3: Robust Parsing\n');

  console.log('Input text:', text.substring(0, 100) + '...');

  // Try multiple extraction strategies
  const strategies = [
    // Strategy 1: Direct parse
    () => JSON.parse(text),
    
    // Strategy 2: Find JSON in code blocks
    () => {
      const match = text.match(/```(?:json)?\s*(\{[\s\S]*?\})/);
      return match ? JSON.parse(match[1]) : null;
    },
    
    // Strategy 3: Find any JSON object
    () => {
      const match = text.match(/\{[^}]*\}/);
      return match ? JSON.parse(match[0]) : null;
    },
    
    // Strategy 4: Clean and try
    () => {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    }
  ];

  for (let i = 0; i < strategies.length; i++) {
    try {
      const result = strategies[i]();
      if (result) {
        console.log(`✅ Strategy ${i + 1} worked!`);
        console.log('   Extracted:', result);
        return result;
      }
    } catch (e) {
      console.log(`❌ Strategy ${i + 1} failed`);
    }
  }

  console.log('⚠️  All strategies failed. Prompt needs improvement!');
  return null;
}

// ============================================================================
// RUN DEBUGGING LESSON
// ============================================================================

async function main() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║  🎓 LESSON 3: Debugging AI Agents                ║');
  console.log('║  Learn to fix common problems                    ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // Technique 1
  const rawResponse = await debugAgentResponse();

  // Technique 2
  await improvedPrompt();

  // Technique 3
  robustJsonExtractor(rawResponse);

  console.log('\n' + '═'.repeat(60));
  console.log('🎓 LESSON COMPLETE!');
  console.log('═'.repeat(60));

  console.log('\n📚 What You Learned:');
  console.log('   1. AI responses aren\'t always perfect');
  console.log('   2. Specific prompts get better results');
  console.log('   3. Robust parsing handles variations');
  console.log('   4. Debugging is part of development');

  console.log('\n🚀 Next Steps:');
  console.log('   1. Open lesson-1.cjs and modify the prompt');
  console.log('   2. Run it: node playground/lesson-1.cjs');
  console.log('   3. See how your changes affect output');
  console.log('   4. Read the full agent code in agents/ folder\n');

  console.log('💰 Cost: $0.00 | ⏱️  Time: ~1 minute | 🧠 Knowledge: +50%\n');
}

main();
