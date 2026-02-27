/**
 * TEST RUNNER - Your First Agent Test!
 * 
 * This file helps you test the agents without building a UI first.
 * Run it with: node test-runner.js
 * 
 * LEARNING NOTE:
 * Before building complex UIs, always test your logic with simple scripts.
 * This is called "unit testing" or "integration testing".
 */

// This is a CommonJS file for easy Node execution
// We'll convert to TypeScript later

const fs = require('fs');
const path = require('path');

/**
 * Simple test to check if Ollama is running
 */
async function testOllamaConnection() {
  console.log('🔍 Testing Ollama connection...');
  
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) {
      throw new Error('Ollama not responding');
    }
    
    const data = await response.json();
    const models = data.models?.map(m => m.name) || [];
    
    console.log('✅ Ollama is running!');
    console.log(`📦 Models installed: ${models.join(', ')}`);
    return { success: true, models };
  } catch (error) {
    console.error('❌ Ollama is not running!');
    console.error('   Run: ollama serve');
    return { success: false, models: [] };
  }
}

/**
 * Test a simple prompt
 */
async function testSimplePrompt() {
  console.log('\n🧪 Testing simple prompt...');
  
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        messages: [
          {
            role: 'user',
            content: 'Extract the main requirement from this text: "Users must be able to login with email and password"'
          }
        ],
        stream: false
      })
    });

    const data = await response.json();
    console.log('✅ AI Response:', data.message.content);
    return { success: true };
  } catch (error) {
    console.error('❌ Prompt test failed:', error.message);
    return { success: false };
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🚀 AI Agent Test Runner');
  console.log('========================\n');

  // Test 1: Check Ollama
  const ollamaTest = await testOllamaConnection();
  if (!ollamaTest.success) {
    console.log('\n⚠️  Please start Ollama first:');
    console.log('   1. Run: ollama serve');
    console.log('   2. In another terminal, run: ollama pull llama3.2:3b');
    console.log('   3. Then run this test again');
    process.exit(1);
  }

  // Test 2: Check if we have a model
  if (ollamaTest.models.length === 0) {
    console.log('\n⚠️  No models installed!');
    console.log('   Run: ollama pull llama3.2:3b');
    process.exit(1);
  }

  // Test 3: Simple prompt
  const promptTest = await testSimplePrompt();
  if (!promptTest.success) {
    console.log('\n⚠️  Prompt test failed. Check Ollama logs.');
    process.exit(1);
  }

  console.log('\n🎉 All tests passed! You\'re ready to build agents!\n');
  console.log('Next steps:');
  console.log('1. Read playground/README.md');
  console.log('2. Look at playground/agents/ to see example agents');
  console.log('3. Run the full pipeline with a test PDF\n');
}

// Run tests
main().catch(console.error);
