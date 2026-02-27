/**
 * 🎓 YOUR FIRST AGENT - Story Point Estimator
 * 
 * This is intentionally simple so you can understand every line.
 * We'll build more complex ones later!
 */

// Simple function that calls Ollama
async function estimateStoryPoints(requirement) {
  console.log('\n🤖 Asking AI to estimate story points...');
  console.log(`Requirement: "${requirement}"\n`);

  // This is the prompt - instructions for the AI
  const prompt = `You are an expert engineering manager. 
  
Estimate story points for this requirement:
"${requirement}"

Story point scale:
- 1 point: 2-4 hours (trivial)
- 2 points: 1 day (simple)
- 3 points: 2-3 days (medium)
- 5 points: 1 week (complex)
- 8 points: 2 weeks (very complex)

Return ONLY a number (1, 2, 3, 5, or 8) with a brief reason.
Format: "X points - reason"`;

  // Call Ollama
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      messages: [
        { role: 'user', content: prompt }
      ],
      stream: false
    })
  });

  const data = await response.json();
  const answer = data.message.content;

  console.log('💡 AI says:', answer);
  
  // Extract the number
  const pointsMatch = answer.match(/(\d+)\s*point/i);
  const points = pointsMatch ? parseInt(pointsMatch[1]) : 3;

  return {
    points,
    reasoning: answer,
    model: 'llama3.2:3b'
  };
}

// ============================================================================
// TEST IT!
// ============================================================================

async function runTests() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  🎓 Your First AI Agent - Story Points   ║');
  console.log('╚═══════════════════════════════════════════╝');

  // Test case 1: Simple requirement
  const test1 = await estimateStoryPoints(
    'Add a button to the navigation bar'
  );
  console.log(`\n📊 Result: ${test1.points} points`);
  console.log('─'.repeat(50));

  // Test case 2: Complex requirement
  const test2 = await estimateStoryPoints(
    'Implement real-time WebSocket notification system with fallback to polling'
  );
  console.log(`\n📊 Result: ${test2.points} points`);
  console.log('─'.repeat(50));

  // Test case 3: Your turn!
  const test3 = await estimateStoryPoints(
    'Add drag-and-drop dashboard customization with persistent layout'
  );
  console.log(`\n📊 Result: ${test3.points} points`);
  console.log('─'.repeat(50));

  console.log('\n✨ Lesson Complete!');
  console.log('\n🎓 What you learned:');
  console.log('   1. How to call Ollama from JavaScript');
  console.log('   2. How to write effective prompts');
  console.log('   3. How to parse AI responses');
  console.log('   4. How agents make decisions\n');

  console.log('💡 Try this:');
  console.log('   1. Change the story point scale in the prompt');
  console.log('   2. Run this script again: node playground/lesson-1.cjs');
  console.log('   3. See how the estimates change!\n');

  console.log('📚 Next: Open playground/lesson-2.cjs when ready\n');
}

// Run the tests
runTests().catch(console.error);
