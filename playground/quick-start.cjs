#!/usr/bin/env node

/**
 * 🧪 QUICK START - Test Your First AI Agent!
 * 
 * This script runs the complete PRD → Tickets pipeline with our sample document.
 * Run with: node playground/quick-start.js
 * 
 * Make sure Ollama is running first!
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// STEP 1: Check Prerequisites
// ============================================================================

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...\n');
  
  const checks = {
    ollama: false,
    models: [],
    sampleDoc: false
  };

  // Check Ollama
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = await response.json();
      checks.ollama = true;
      checks.models = data.models?.map(m => m.name) || [];
    }
  } catch (error) {
    console.error('❌ Ollama is not running!');
    console.log('\n📋 Setup steps:');
    console.log('   1. brew install ollama');
    console.log('   2. ollama serve &');
    console.log('   3. ollama pull llama3.2:3b');
    console.log('   4. Run this script again\n');
    return false;
  }

  console.log('✅ Ollama is running');

  // Check models
  if (checks.models.length === 0) {
    console.error('❌ No models installed!');
    console.log('\n📋 Install a model:');
    console.log('   ollama pull llama3.2:3b\n');
    return false;
  }

  console.log(`✅ Models installed: ${checks.models.join(', ')}`);

  // Check for sample document
  const samplePath = path.join(__dirname, 'test-documents', 'sample-prd.txt');
  if (fs.existsSync(samplePath)) {
    checks.sampleDoc = true;
    console.log('✅ Sample PRD found');
  } else {
    console.error('❌ Sample document not found');
    return false;
  }

  console.log('\n🎉 All prerequisites met!\n');
  return true;
}

// ============================================================================
// STEP 2: Test Document Parsing
// ============================================================================

async function testDocumentParsing() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📄 STAGE 1: Document Parsing');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const samplePath = path.join(__dirname, 'test-documents', 'sample-prd.txt');
  const content = fs.readFileSync(samplePath, 'utf-8');

  console.log(`📖 Document length: ${content.length} characters`);
  console.log(`📝 Analyzing structure with AI...\n`);

  // Call Ollama to analyze structure
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      messages: [{
        role: 'system',
        content: 'You analyze document structure. Return JSON with title and sections array.'
      }, {
        role: 'user',
        content: `Analyze this PRD and identify main sections (Overview, Requirements, User Stories, etc.):

${content.substring(0, 3000)}... 

Return JSON: {"title": "...", "sections": ["section1", "section2"]}`
      }],
      stream: false
    })
  });

  const data = await response.json();
  const aiResponse = data.message.content;

  // Try to find sections in response
  const sectionMatch = aiResponse.match(/"sections":\s*\[(.*?)\]/);
  const titleMatch = aiResponse.match(/"title":\s*"([^"]+)"/);

  console.log('🤖 AI Analysis:');
  if (titleMatch) {
    console.log(`   Title: ${titleMatch[1]}`);
  }
  console.log(`   Response preview: ${aiResponse.substring(0, 200)}...\n`);

  return { success: true };
}

// ============================================================================
// STEP 3: Test Requirements Extraction
// ============================================================================

async function testRequirementsExtraction() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 STAGE 2: Requirements Extraction');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const samplePath = path.join(__dirname, 'test-documents', 'sample-prd.txt');
  const content = fs.readFileSync(samplePath, 'utf-8');

  console.log(`🔍 Extracting requirements with AI...\n`);

  // Extract just the requirements section for testing
  const reqSection = content.substring(
    content.indexOf('## 4. Functional Requirements'),
    content.indexOf('## 5. Non-Functional Requirements')
  );

  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      messages: [{
        role: 'user',
        content: `Extract 2-3 requirements from this text. Return as JSON array:

${reqSection.substring(0, 1000)}

Format: [{"title": "...", "description": "...", "priority": "high|medium|low"}]`
      }],
      stream: false
    })
  });

  const data = await response.json();
  const aiResponse = data.message.content;

  console.log('🤖 AI Extracted Requirements:');
  console.log(aiResponse.substring(0, 400));
  console.log('\n');

  return { success: true };
}

// ============================================================================
// STEP 4: Test Ticket Generation
// ============================================================================

async function testTicketGeneration() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎫 STAGE 3: Ticket Generation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`🎯 Generating tickets with AI...\n`);

  // Simple test ticket generation
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      messages: [{
        role: 'user',
        content: `Create 1 JIRA ticket for this requirement:

"Users must be able to customize dashboard layout with drag-and-drop"

Return JSON:
{
  "title": "...",
  "description": "...",
  "storyPoints": 5,
  "acceptanceCriteria": ["...", "..."]
}`
      }],
      stream: false
    })
  });

  const data = await response.json();
  const aiResponse = data.message.content;

  console.log('🎫 Generated Ticket:');
  console.log(aiResponse);
  console.log('\n');

  return { success: true };
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

async function main() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║  🚀 AI AGENT QUICK START TEST        ║');
  console.log('║  PRD → Tickets Pipeline Demo         ║');
  console.log('╚═══════════════════════════════════════╝\n');

  // Check if everything is set up
  const ready = await checkPrerequisites();
  if (!ready) {
    process.exit(1);
  }

  console.log('Starting pipeline test...\n');

  try {
    // Run each stage
    await testDocumentParsing();
    await testRequirementsExtraction();
    await testTicketGeneration();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS! All stages completed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎓 What you just saw:');
    console.log('   1. AI parsed document structure');
    console.log('   2. AI extracted requirements');
    console.log('   3. AI generated JIRA tickets\n');

    console.log('📚 Next steps:');
    console.log('   1. Read: playground/AGENTS_101.md');
    console.log('   2. Look at: playground/agents/ code');
    console.log('   3. Modify prompts and see different results');
    console.log('   4. Build the full UI!\n');

    console.log('💰 Cost so far: $0.00');
    console.log('🏃 Total time: ~15-30 seconds\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Debugging tips:');
    console.log('   1. Check Ollama is running: ollama ps');
    console.log('   2. Try manually: ollama run llama3.2:3b "hello"');
    console.log('   3. Check logs: tail ~/.ollama/logs/server.log\n');
    process.exit(1);
  }
}

// Run it!
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
