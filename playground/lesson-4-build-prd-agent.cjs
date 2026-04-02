/**
 * 🎓 LESSON 4: Build PRD-to-Ticket Agent From Scratch
 * 
 * In this lesson, YOU will build a working agent that:
 * 1. Takes a PRD document
 * 2. Extracts requirements
 * 3. Generates JIRA tickets with story points
 * 
 * We'll build it step by step, testing at each stage.
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// PART 1: Extract Text from Document (No AI needed yet!)
// ============================================================================

function loadPRD(filePath) {
  console.log('📄 STEP 1: Load the PRD document\n');
  
  const text = fs.readFileSync(filePath, 'utf-8');
  console.log(`   ✅ Loaded ${text.length} characters`);
  console.log(`   ✅ First 100 chars: "${text.substring(0, 100)}..."\n`);
  
  return text;
}

// ============================================================================
// PART 2: Use AI to Understand the PRD Structure
// ============================================================================

async function analyzePRDStructure(prdText) {
  console.log('🤖 STEP 2: AI analyzes document structure\n');
  
  // 🎓 LEARNING: Use system message to set behavior
  const systemMessage = 'You are a JSON API that extracts requirements from documents. Output ONLY valid JSON, no explanations or markdown.';
  
  const userMessage = `Extract requirements from this PRD:

${prdText}

Example output:
{"projectTitle": "Dashboard Redesign", "requirements": [{"id": "req-1", "title": "Add dark mode", "description": "Users can toggle dark theme", "priority": "high", "section": "UI"}]}

Your output (JSON only):`;

  console.log('   📤 Sending document to AI with improved prompt...');

  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen2.5:14b',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      stream: false,
      options: {
        temperature: 0.2  // Very low for extraction
      }
    })
  });

  const data = await response.json();
  const aiResponse = data.message.content;

  console.log('   ✅ AI finished analyzing\n');

  // 🎓 LEARNING: Robust parsing with multiple strategies
  let parsed;
  
  try {
    // Strategy 1: Direct parse
    parsed = JSON.parse(aiResponse);
    console.log('   ✅ Direct JSON parse successful');
  } catch (e) {
    console.log('   ⚠️  Direct parse failed, trying extraction...');
    
    // Strategy 2: Remove markdown code blocks
    let cleaned = aiResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    try {
      parsed = JSON.parse(cleaned);
      console.log('   ✅ Parsed after removing markdown');
    } catch (e2) {
      // Strategy 3: Extract first complete JSON object
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
        console.log('   ✅ Extracted JSON object');
      } else {
        // Show what we got to help debug
        console.log('\n   📝 AI returned:');
        console.log('   ' + aiResponse.substring(0, 300));
        throw new Error('Could not extract JSON - AI returned non-JSON format');
      }
    }
  }

  console.log(`   📊 Success!`);
  console.log(`   📋 Project: ${parsed.projectTitle}`);
  console.log(`   📋 Requirements found: ${parsed.requirements?.length || 0}\n`);

  return parsed;
}

// ============================================================================
// PART 3: Convert Requirements to Tickets
// ============================================================================

async function convertToTickets(projectTitle, requirements) {
  console.log('🎫 STEP 3: Generate JIRA tickets\n');

  // We'll process requirements in batches (for this lesson, just do first 3)
  const batch = requirements.slice(0, 3);

  console.log(`   📊 Processing ${batch.length} requirements...\n`);

  const tickets = [];

  for (let i = 0; i < batch.length; i++) {
    const req = batch[i];
    console.log(`   🔄 [${i + 1}/${batch.length}] Processing: ${req.title}`);

    // 🎓 LEARNING: This prompt converts one requirement into a ticket
    const prompt = `You are creating a JIRA ticket for an engineering team.

REQUIREMENT:
Title: ${req.title}
Description: ${req.description}
Priority: ${req.priority}

Create a professional JIRA ticket with:
- Clear, actionable title (start with verb: "Implement", "Add", "Create")
- Detailed description (what, why, how)
- 3-5 specific acceptance criteria
- Story point estimate (1, 2, 3, 5, 8, 13)
- Suggested labels (frontend, backend, database, api, testing, etc.)

Story point guide:
- 1-2: Quick, clear, no unknowns
- 3: Standard feature, few days
- 5: Complex feature, some unknowns
- 8+: Very complex, might need splitting

Return ONLY valid JSON:
{
  "title": "Implement X feature",
  "description": "Detailed multi-line description\\n\\nContext: ...\\n\\nImplementation notes: ...",
  "acceptanceCriteria": ["AC 1", "AC 2", "AC 3"],
  "storyPoints": 5,
  "labels": ["frontend", "api"],
  "priority": "high"
}`;

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:14b',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: {
          temperature: 0.6  // Slightly higher for creative descriptions
        }
      })
    });

    const data = await response.json();
    const aiResponse = data.message.content;

    // Parse the ticket
    let ticket;
    try {
      const match = aiResponse.match(/\{[\s\S]*\}/);
      ticket = match ? JSON.parse(match[0]) : null;
    } catch (e) {
      console.log(`   ⚠️  Parsing failed, using fallback`);
      ticket = {
        title: req.title,
        description: req.description,
        storyPoints: 3,
        acceptanceCriteria: [],
        labels: []
      };
    }

    // Add metadata
    ticket.id = `TICKET-${i + 1}`;
    ticket.sourceRequirement = req.id;
    ticket.generatedBy = 'AI Agent';

    tickets.push(ticket);
    console.log(`   ✅ Created: ${ticket.title} [${ticket.storyPoints} SP]`);
  }

  console.log(`\n   📊 Generated ${tickets.length} tickets\n`);

  return tickets;
}

// ============================================================================
// PART 4: Display Results in Nice Format
// ============================================================================

function displayResults(projectTitle, tickets) {
  console.log('═'.repeat(70));
  console.log('🎉 RESULTS - Generated JIRA Tickets');
  console.log('═'.repeat(70));
  console.log(`\nProject: ${projectTitle}\n`);

  const totalPoints = tickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  tickets.forEach((ticket, i) => {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📋 TICKET ${i + 1}: ${ticket.title}`);
    console.log(`${'─'.repeat(70)}`);
    console.log(`🔢 Story Points: ${ticket.storyPoints}`);
    console.log(`⚡ Priority: ${ticket.priority}`);
    console.log(`🏷️  Labels: ${ticket.labels.join(', ')}`);
    console.log(`\n📝 Description:`);
    console.log(`   ${ticket.description.substring(0, 150)}...`);
    console.log(`\n✓ Acceptance Criteria:`);
    ticket.acceptanceCriteria.forEach((ac, idx) => {
      console.log(`   ${idx + 1}. ${ac}`);
    });
  });

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📊 SUMMARY`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`Total Tickets: ${tickets.length}`);
  console.log(`Total Story Points: ${totalPoints}`);
  console.log(`Estimated Sprints: ${Math.ceil(totalPoints / 20)} sprints (assuming 20 SP per sprint)`);
  console.log(`Estimated Time: ${Math.ceil(totalPoints / 20) * 2} weeks\n`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🎓 LESSON 4: Build PRD-to-Ticket Agent                  ║');
  console.log('║  You\'re about to see the COMPLETE process!              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  try {
    // Load the sample PRD
    const prdPath = path.join(__dirname, 'test-documents', 'sample-prd.txt');
    const prdText = loadPRD(prdPath);

    // Analyze with AI
    const analysis = await analyzePRDStructure(prdText);

    // Convert to tickets
    const tickets = await convertToTickets(
      analysis.projectTitle,
      analysis.requirements
    );

    // Show results
    displayResults(analysis.projectTitle, tickets);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  ✅ LESSON COMPLETE!                                      ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('🎓 What You Just Built:');
    console.log('   ✓ Document loader');
    console.log('   ✓ AI-powered PRD analyzer');
    console.log('   ✓ Requirement → Ticket converter');
    console.log('   ✓ Result formatter\n');

    console.log('📊 Performance:');
    console.log(`   ⏱️  Total time: ${duration} seconds`);
    console.log(`   💰 Cost: $0.00`);
    console.log(`   🤖 Model: qwen2.5:14b (local)`);
    console.log(`   📦 Tickets: ${tickets.length} created\n`);

    console.log('🧪 NOW IT\'S YOUR TURN - Experiments to Try:\n');
    console.log('1️⃣  MODIFY THE PROMPT (Line 70-80):');
    console.log('   - Change story point scale');
    console.log('   - Add more requirements to acceptance criteria');
    console.log('   - Make descriptions more technical');
    console.log('   Then run: npm run learn:4\n');

    console.log('2️⃣  TRY DIFFERENT MODEL:');
    console.log('   - Change line 89: model: "qwen2.5:14b"');
    console.log('   - First run: ollama pull qwen2.5:14b');
    console.log('   - Compare quality!\n');

    console.log('3️⃣  PROCESS MORE REQUIREMENTS:');
    console.log('   - Change line 136: batch = requirements.slice(0, 5)');
    console.log('   - Generate more tickets!\n');

    console.log('4️⃣  ADD YOUR OWN PRD:');
    console.log('   - Create: playground/test-documents/my-prd.txt');
    console.log('   - Change line 180: const prdPath = ...');
    console.log('   - Process your own document!\n');

    console.log('📚 Next Steps:');
    console.log('   A) Experiment with the code above');
    console.log('   B) Read: playground/agents/ticketGenerator.ts (production version)');
    console.log('   C) Ask me: "How do I improve accuracy?"');
    console.log('   D) Say: "Let\'s build the UI for this"\n');

    console.log('🎯 You now understand the CORE of PRD-to-Ticket generation!');
    console.log('   Everything else is just improvements on this foundation.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n🔧 Debugging:');
    console.log('   1. Is Ollama running? Check: curl http://localhost:11434/api/tags');
    console.log('   2. Is the model installed? Check: ollama list');
    console.log('   3. Try the prompt manually: ollama run llama3.2:3b "test"\n');
  }
}

main();
