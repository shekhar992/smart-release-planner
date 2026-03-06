/**
 * 🎓 PRACTICAL LESSON: PRD-to-Ticket Agent (Working Version)
 * 
 * This is the SIMPLIFIED, PROVEN approach that works.
 * We'll build the agent step-by-step with REAL techniques.
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 🎯 CORE CONCEPT: Break PRD processing into SMALL steps
// ============================================================================

/**
 * STEP 1: Simple Requirements Extraction
 * 
 * 🎓 LEARNING: Instead of analyzing the WHOLE document at once,
 * ask the AI simple questions about PARTS of it.
 */
async function extractRequirementsSimple(prdText) {
  console.log('📋 Extracting Requirements (Simple Approach)\n');

  // 🎓 TRICK: Split into chunks if too long
  const maxChars = 3000;
  const chunk = prdText.substring(0, maxChars);

  console.log(`   📄 Processing ${chunk.length} characters`);
  console.log(`   (Full doc is ${prdText.length} chars - using chunk for learning)\n`);

  // 🎓 SIMPLE PROMPT: Just find requirements, don't overthink
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      messages: [
        {
          role: 'system',
          content: 'Extract requirements. Output format: ["req 1", "req 2", "req 3"]'
        },
        {
          role: 'user',
          content: `List the main requirements from this PRD:\n\n${chunk}\n\nReturn JSON array only:`
        }
      ],
      stream: false,
      options: { temperature: 0.2 }
    })
  });

  const data = await response.json();
  let content = data.message.content;

  // Clean up response
  content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  console.log('   🤖 AI Response:', content.substring(0, 200) + '...\n');

  // Parse array
  let requirements;
  try {
    requirements = JSON.parse(content);
  } catch {
    // Fallback: extract first array
    const match = content.match(/\[[\s\S]*?\]/);
    requirements = match ? JSON.parse(match[0]) : [];
  }

  console.log(`   ✅ Found ${requirements.length} requirements:`);
  requirements.slice(0, 5).forEach((r, i) => {
    console.log(`      ${i + 1}. ${r.substring(0, 60)}...`);
  });
  console.log();

  return requirements;
}

/**
 * STEP 2: Convert ONE requirement to a ticket
 * 
 * 🎓 LEARNING: Master converting ONE requirement really well,
 * then just loop through all requirements.
 */
async function convertOneRequirement(requirement, index) {
  console.log(`   🎫 [${index}] Processing: "${requirement.substring(0, 50)}..."`);

  // 🎓 SUPER SIMPLE PROMPT with example
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      messages: [
        {
          role: 'system',
          content: 'You are a JIRA ticket generator. Output only JSON.'
        },
        {
          role: 'user',
          content: `Requirement: "${requirement}"

Example ticket:
{"title": "Implement user dashboard", "description": "Create dashboard with widgets", "storyPoints": 5, "priority": "high"}

Generate ticket (JSON only):`
        }
      ],
      stream: false,
      options: { temperature: 0.4 }
    })
  });

  const data = await response.json();
  let content = data.message.content;

  // Clean markdown
  content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  // Parse
  let ticket;
  try {
    ticket = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*?\}/);
    ticket = match ? JSON.parse(match[0]) : {
      title: requirement.substring(0, 80),
      storyPoints: 3,
      description: requirement
    };
  }

  // Add metadata
  ticket.id = `TICKET-${index}`;
  
  console.log(`      ✅ ${ticket.title} [${ticket.storyPoints} SP]`);

  return ticket;
}

/**
 * STEP 3: Process all requirements
 */
async function generateAllTickets(requirements) {
  console.log('\n🎫 Generating Tickets\n');

  const tickets = [];
  
  // Process first 5 for this lesson
  const batch = requirements.slice(0, Math.min(5, requirements.length));

  for (let i = 0; i < batch.length; i++) {
    const ticket = await convertOneRequirement(batch[i], i + 1);
    tickets.push(ticket);
  }

  console.log(`\n   ✅ Generated ${tickets.length} tickets\n`);

  return tickets;
}

/**
 * Display results nicely
 */
function displayTickets(tickets) {
  console.log('═'.repeat(70));
  console.log('🎉 YOUR GENERATED JIRA TICKETS');
  console.log('═'.repeat(70) + '\n');

  tickets.forEach(ticket => {
    console.log(`📋 ${ticket.id}: ${ticket.title}`);
    console.log(`   Story Points: ${ticket.storyPoints}`);
    console.log(`   Priority: ${ticket.priority || 'medium'}`);
    console.log(`   Description: ${ticket.description.substring(0, 100)}...`);
    console.log();
  });

  const totalPoints = tickets.reduce((sum, t) => sum + t.storyPoints, 0);
  
  console.log('═'.repeat(70));
  console.log(`📊 Total Story Points: ${totalPoints}`);
  console.log(`⏱️  Estimated Time: ~${totalPoints * 0.5} developer-days`);
  console.log('═'.repeat(70) + '\n');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🎓 BUILD YOUR FIRST PRD-TO-TICKET AGENT                 ║');
  console.log('║  Simple, working, production-ready approach               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  try {
    // Load PRD
    const prdPath = path.join(__dirname, 'test-documents', 'sample-prd.txt');
    console.log('📄 Loading PRD...');
    const prdText = fs.readFileSync(prdPath, 'utf-8');
    console.log(`   ✅ Loaded ${prdText.length} characters\n`);

    // Extract requirements
    const requirements = await extractRequirementsSimple(prdText);

    // Generate tickets
    const tickets = await generateAllTickets(requirements);

    // Display
    displayTickets(tickets);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  ✅ SUCCESS! YOU BUILT A PRD-TO-TICKET AGENT!            ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log(`⏱️  Completed in ${duration} seconds`);
    console.log(`💰 Cost: $0.00 (all local)`);
    console.log(`📦 Output: ${tickets.length} tickets, ${tickets.reduce((s, t) => s + t.storyPoints, 0)} story points\n`);

    console.log('🎓 KEY LEARNINGS:\n');
    console.log('   1️⃣  BREAK IT DOWN: Don\'t try to parse everything at once');
    console.log('       - First extract simple list of requirements');
    console.log('       - Then convert each one to a ticket');
    console.log('       - Simpler prompts = better results\n');

    console.log('   2️⃣  USE EXAMPLES: AI learns from patterns');
    console.log('       - Show an example ticket in your prompt');
    console.log('       - AI mimics the structure\n');

    console.log('   3️⃣  SYSTEM MESSAGES: Set behavior constraints');
    console.log('       - "You are a JSON API" → AI behaves differently');
    console.log('       - "Output only JSON" → Reduces extra text\n');

    console.log('   4️⃣  LOW TEMPERATURE: For consistency');
    console.log('       - 0.2 for extraction (need accuracy)');
    console.log('       - 0.4 for conversion (balance accuracy + creativity)\n');

    console.log('   5️⃣  ROBUST PARSING: Multiple strategies');
    console.log('       - Try direct JSON.parse');
    console.log('       - Remove markdown code blocks');
    console.log('       - Extract with regex');
    console.log('       - Always have fallback\n');

    console.log('🧪 EXPERIMENTS TO TRY:\n');
    console.log('   A) Change line 46: temperature: 0.8 (see how creativity changes)');
    console.log('   B) Edit system message (line 25): Try different instructions');
    console.log('   C) Add more fields: labels, assignee, acceptance criteria');
    console.log('   D) Try your own PRD file!\n');

    console.log('📖 UNDERSTAND THE PRODUCTION CODE:\n');
    console.log('   - Read: playground/agents/requirementsExtractor.ts');
    console.log('   - Read: playground/agents/ticketGenerator.ts');
    console.log('   - Compare: What did they do differently?\n');

    console.log('🚀 NEXT STEPS:\n');
    console.log('   → Run: npm run learn:advanced (Confidence, validation, etc.)');
    console.log('   → Say: "Show me the production agent code"');
    console.log('   → Say: "Let\'s build the UI for this"');
    console.log('   → Say: "How do I integrate this into the app?"\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 This is actually GOOD for learning!');
    console.log('   Real agents fail sometimes. You need:');
    console.log('   - Error handling (try-catch)');
    console.log('   - Retry logic');
    console.log('   - Fallback values');
    console.log('   - Good logging\n');
    
    console.log('🔧 Quick fixes:');
    console.log('   1. Check Ollama: curl http://localhost:11434/api/tags');
    console.log('   2. Restart Ollama: brew services restart ollama');
    console.log('   3. Try simpler prompt: Edit line 36\n');
  }
}

main();
