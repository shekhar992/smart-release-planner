/**
 * 🎓 LESSON 2: Multi-Agent Pipeline
 * 
 * Now that you understand ONE agent, let's see how THREE agents work together!
 * 
 * Pipeline: Document Text → Agent 1 → Agent 2 → Agent 3 → Tickets
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// MINI PIPELINE: Simplified version of what we built
// ============================================================================

/**
 * Agent 1: Extract sections from document
 */
async function agentParseDocument(text) {
  console.log('\n🤖 AGENT 1: Document Parser');
  console.log('   Task: Find main sections\n');

  const prompt = `Analyze this document and list the main section titles.
  
Document:
${text.substring(0, 1500)}...

Return as JSON array of section titles: ["Section 1", "Section 2", ...]`;

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
  const answer = data.message.content;

  // Try to extract JSON array
  const match = answer.match(/\[(.*?)\]/s);
  const sections = match ? JSON.parse(`[${match[1]}]`) : [];

  console.log(`   ✅ Found ${sections.length} sections:`);
  sections.forEach((s, i) => console.log(`      ${i + 1}. ${s}`));

  return sections;
}

/**
 * Agent 2: Extract requirements from sections
 */
async function agentExtractRequirements(sections, fullText) {
  console.log('\n🤖 AGENT 2: Requirements Extractor');
  console.log('   Task: Find requirements in sections\n');

  // Focus on the requirements section
  const reqSection = fullText.substring(
    fullText.indexOf('Functional Requirements'),
    fullText.indexOf('Non-Functional Requirements')
  );

  const prompt = `Extract 3 main requirements from this text.

Text:
${reqSection.substring(0, 1000)}

Return as JSON:
[{"title": "...", "description": "brief summary"}]`;

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
  const answer = data.message.content;

  // Parse the requirements
  let requirements = [];
  try {
    const match = answer.match(/\[[\s\S]*\]/);
    if (match) {
      requirements = JSON.parse(match[0]);
    }
  } catch (e) {
    requirements = [{ title: 'Parsing Failed', description: 'See raw output' }];
  }

  console.log(`   ✅ Extracted ${requirements.length} requirements:`);
  requirements.forEach((r, i) => {
    console.log(`      ${i + 1}. ${r.title}`);
  });

  return requirements;
}

/**
 * Agent 3: Generate tickets from requirements
 */
async function agentGenerateTickets(requirements) {
  console.log('\n🤖 AGENT 3: Ticket Generator');
  console.log('   Task: Create JIRA tickets\n');

  // Just create a ticket for the first requirement
  const req = requirements[0];

  const prompt = `Create a JIRA ticket for this requirement:

Title: ${req.title}
Description: ${req.description}

Return JSON:
{
  "title": "ticket title",
  "description": "detailed description",
  "storyPoints": 5,
  "acceptanceCriteria": ["criteria 1", "criteria 2"]
}`;

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
  const answer = data.message.content;

  // Parse ticket
  let ticket = {};
  try {
    const match = answer.match(/\{[\s\S]*\}/);
    if (match) {
      ticket = JSON.parse(match[0]);
    }
  } catch (e) {
    console.log('   Raw response:', answer);
    ticket = { title: 'See raw output above' };
  }

  console.log(`   ✅ Generated ticket:`);
  console.log(`      Title: ${ticket.title}`);
  console.log(`      Story Points: ${ticket.storyPoints}`);
  console.log(`      Criteria: ${ticket.acceptanceCriteria?.length || 0} items`);

  return ticket;
}

// ============================================================================
// RUN THE PIPELINE
// ============================================================================

async function main() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║  🎓 LESSON 2: Multi-Agent Pipeline               ║');
  console.log('║  Watch 3 agents work together!                   ║');
  console.log('╚═══════════════════════════════════════════════════╝');

  // Load the sample PRD
  const prdPath = path.join(__dirname, 'test-documents', 'sample-prd.txt');
  const prdText = fs.readFileSync(prdPath, 'utf-8');

  console.log(`\n📄 Loaded PRD: ${prdText.length} characters`);
  console.log('⏳ Starting 3-agent pipeline...');

  try {
    // Run agents in sequence
    const sections = await agentParseDocument(prdText);
    const requirements = await agentExtractRequirements(sections, prdText);
    const ticket = await agentGenerateTickets(requirements);

    console.log('\n' + '═'.repeat(50));
    console.log('✅ PIPELINE COMPLETE!');
    console.log('═'.repeat(50));
    console.log('\n🎯 Results:');
    console.log(`   Sections found: ${sections.length}`);
    console.log(`   Requirements extracted: ${requirements.length}`);
    console.log(`   Tickets generated: 1 (we only did the first one)`);

    console.log('\n🎓 Key Learning:');
    console.log('   → Agent 1 output becomes Agent 2 input');
    console.log('   → Agent 2 output becomes Agent 3 input');
    console.log('   → This is called a "Sequential Pipeline"');

    console.log('\n💡 Experiment Ideas:');
    console.log('   1. Change prompts in each agent function');
    console.log('   2. Add a 4th agent (e.g., Story Point Validator)');
    console.log('   3. Make it process ALL requirements, not just first');
    console.log('   4. Add error handling between stages\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n🔧 Debug tip: Check if Ollama is running');
  }
}

main();
