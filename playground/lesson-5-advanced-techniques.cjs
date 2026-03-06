/**
 * 🎓 LESSON 5: ADVANCED AGENT TECHNIQUES
 * 
 * Now that you understand basic agents, let's learn PRO techniques:
 * ✅ Confidence scoring - Know when AI is uncertain
 * ✅ Validation - Check output quality automatically
 * ✅ Error recovery - Handle failures gracefully
 * ✅ Batch processing - Process multiple items efficiently
 * ✅ Chain-of-thought - Make AI explain its reasoning
 */

const fs = require('fs');

// ============================================================================
// TECHNIQUE 1: CONFIDENCE SCORING
// ============================================================================

async function estimateWithConfidence(requirement) {
  console.log('\n📊 TECHNIQUE 1: Confidence Scoring\n');
  console.log(`   Estimating: "${requirement}"\n`);

  // 🎓 Ask AI to self-assess confidence
  const prompt = `Estimate story points for this requirement:

"${requirement}"

Think through:
1. How clear are the requirements?
2. What implementation complexity?
3. What unknowns exist?

Return JSON:
{
  "storyPoints": 5,
  "confidence": 0.85,
  "reasoning": "Brief explanation",
  "concerns": ["What I'm unsure about"]
}

Confidence scale:
- 0.9-1.0: Very clear requirements
- 0.7-0.9: Some assumptions needed
- 0.5-0.7: Significant unknowns
- Below 0.5: Needs clarification`;

  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      messages: [
        {
          role: 'system',
          content: 'You estimate story points. Output only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false,
      options: { temperature: 0.3 }
    })
  });

  const data = await response.json();
  const content = data.message.content;
  
  // Robust parsing
  let result = null;
  try {
    // Remove markdown
    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const match = cleaned.match(/\{[\s\S]*?\}/);
    if (match) {
      result = JSON.parse(match[0]);
    }
  } catch (e) {
    console.log(`   ⚠️  JSON parsing failed, using basic response`);
    result = {
      storyPoints: 8,
      confidence: 0.5,
      reasoning: 'Complex feature with unknowns',
      concerns: ['Parsing error - estimates may be inaccurate']
    };
  }

  console.log(`   📈 Story Points: ${result.storyPoints}`);
  console.log(`   🎯 Confidence: ${(result.confidence * 100).toFixed(0)}%`);
  console.log(`   💭 Reasoning: ${result.reasoning}`);
  
  if (result.concerns && result.concerns.length > 0) {
    console.log(`   ⚠️  Concerns:`);
    result.concerns.forEach(c => console.log(`      - ${c}`));
  }

  console.log('\n   🎓 LEARNING: Use confidence to flag tickets needing human review!');

  return result;
}

// ============================================================================
// TECHNIQUE 2: VALIDATION
// ============================================================================

function validateTicket(ticket) {
  console.log('\n✅ TECHNIQUE 2: Automatic Validation\n');
  
  const issues = [];
  let qualityScore = 100;

  // Check 1: Title quality
  if (!ticket.title || ticket.title.length < 10) {
    issues.push('Title too short (min 10 chars)');
    qualityScore -= 20;
  }

  // Check 2: Actionable verb
  const actionVerbs = ['implement', 'create', 'add', 'build', 'develop', 'update', 'fix'];
  const hasVerb = actionVerbs.some(v => ticket.title.toLowerCase().includes(v));
  if (!hasVerb) {
    issues.push('Title should start with action verb');
    qualityScore -= 10;
  }

  // Check 3: Acceptance criteria
  if (!ticket.acceptanceCriteria || ticket.acceptanceCriteria.length < 3) {
    issues.push('Need at least 3 acceptance criteria');
    qualityScore -= 30;
  }

  // Check 4: Description length
  if (!ticket.description || ticket.description.length < 50) {
    issues.push('Description too brief');
    qualityScore -= 20;
  }

  // Check 5: Story points reasonable
  if (ticket.storyPoints > 13) {
    issues.push('Story points > 13, consider splitting');
    qualityScore -= 20;
  }

  console.log(`   📋 Validating: ${ticket.title.substring(0, 50)}...`);
  console.log(`   📊 Quality Score: ${qualityScore}/100`);
  
  if (issues.length > 0) {
    console.log(`   ⚠️  Issues found:`);
    issues.forEach(issue => console.log(`      - ${issue}`));
  } else {
    console.log(`   ✅ Perfect ticket!`);
  }

  console.log('\n   🎓 LEARNING: Validate before saving to database!');

  return { qualityScore, issues, passed: qualityScore >= 70 };
}

// ============================================================================
// TECHNIQUE 3: ERROR RECOVERY
// ============================================================================

async function generateWithRetry(requirement, maxRetries = 2) {
  console.log('\n🔄 TECHNIQUE 3: Error Recovery with Retry\n');
  console.log(`   Requirement: "${requirement}"\n`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`   🎯 Attempt ${attempt}/${maxRetries}`);

    try {
      const prompt = `Convert to JIRA ticket JSON only:

"${requirement}"

Format:
{"title": "...", "storyPoints": 3, "description": "...", "acceptanceCriteria": ["AC1", "AC2"]}`;

      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2:3b',
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          options: { temperature: 0.4 }
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const match = data.message.content.match(/\{[\s\S]*\}/);
      
      if (!match) throw new Error('No JSON found in response');

      const ticket = JSON.parse(match[0]);
      
      // Validate
      if (!ticket.title || !ticket.storyPoints) {
        throw new Error('Invalid ticket structure');
      }

      console.log(`   ✅ Success!`);
      console.log(`   📋 ${ticket.title} [${ticket.storyPoints} SP]\n`);

      return ticket;

    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      
      if (attempt === maxRetries) {
        console.log(`   🔥 Max retries reached, using fallback\n`);
        
        // 🎓 LEARNING: Always have a fallback!
        return {
          title: requirement,
          storyPoints: 3,
          description: 'Auto-generated fallback ticket',
          acceptanceCriteria: ['Manual review required'],
          needsReview: true
        };
      }
      
      console.log(`   🔄 Retrying...\n`);
    }
  }
}

// ============================================================================
// TECHNIQUE 4: CHAIN-OF-THOUGHT REASONING
// ============================================================================

async function estimateWithReasoning(requirement) {
  console.log('\n🧠 TECHNIQUE 4: Chain-of-Thought Reasoning\n');
  console.log(`   Estimating: "${requirement}"\n`);

  // 🎓 Ask AI to show its work
  const prompt = `Estimate story points for:

"${requirement}"

THINK STEP-BY-STEP:

Step 1: Break down into sub-tasks
- What components need work?
- What knowledge is needed?

Step 2: Assess complexity
- UI changes?
- Backend APIs?
- Database changes?
- Testing scope?

Step 3: Count unknowns
- What assumptions are you making?
- What might go wrong?

Step 4: Final estimate
- Story points (1, 2, 3, 5, 8, 13)

Return JSON:
{
  "subtasks": ["task 1", "task 2"],
  "complexity": {"ui": "medium", "backend": "high"},
  "unknowns": ["assumption 1"],
  "storyPoints": 5,
  "reasoning": "Why this estimate"
}`;

  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      messages: [
        {
          role: 'system',
          content: 'You estimate complexity. Output only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false,
      options: { temperature: 0.5 }
    })
  });

  const data = await response.json();
  const content = data.message.content;
  
  // Robust parsing
  let result = null;
  try {
    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const match = cleaned.match(/\{[\s\S]*?\}/);
    if (match) {
      result = JSON.parse(match[0]);
    }
  } catch (e) {
    console.log(`   ⚠️  JSON parsing failed, using defaults`);
    result = {
      subtasks: ['Design UI', 'Build backend', 'Add tests'],
      complexity: { ui: 'medium', backend: 'high' },
      unknowns: ['Parsing error - estimate may be inaccurate'],
      storyPoints: 8,
      reasoning: 'Default estimate due to parsing error'
    };
  }

  console.log(`   📦 Subtasks identified:`);
  (result.subtasks || []).forEach(t => console.log(`      - ${t}`));
  
  console.log(`\n   🔍 Complexity assessment:`);
  if (result.complexity) {
    Object.entries(result.complexity).forEach(([area, level]) => {
      console.log(`      - ${area}: ${level}`);
    });
  }

  console.log(`\n   ⚠️  Unknowns:`);
  (result.unknowns || []).forEach(u => console.log(`      - ${u}`));

  console.log(`\n   📊 Final Estimate: ${result.storyPoints} SP`);
  console.log(`   💭 ${result.reasoning}\n`);

  console.log('   🎓 LEARNING: Chain-of-thought produces better estimates!');

  return result;
}

// ============================================================================
// TECHNIQUE 5: BATCH PROCESSING
// ============================================================================

async function batchProcess(requirements) {
  console.log('\n⚡ TECHNIQUE 5: Efficient Batch Processing\n');
  console.log(`   Processing ${requirements.length} requirements...\n`);

  // 🎓 Process sequentially but with progress tracking
  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < requirements.length; i++) {
    const start = Date.now();
    
    // Improved prompt with system message
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        messages: [
          {
            role: 'system',
            content: 'You generate JIRA tickets. Output only JSON.'
          },
          {
            role: 'user',
            content: `Requirement: "${requirements[i]}"

Example: {"title": "Add login feature", "storyPoints": 3}

Your ticket (JSON only):`
          }
        ],
        stream: false,
        options: { temperature: 0.4 }
      })
    });

    const data = await response.json();
    
    // Robust parsing with try-catch
    let ticket = null;
    try {
      const match = data.message.content.match(/\{[\s\S]*?\}/);
      if (match) {
        ticket = JSON.parse(match[0]);
      }
    } catch (parseError) {
      // JSON parsing failed, ticket stays null
      console.log(`      ⚠️  JSON parse failed`);
    }

    const duration = Date.now() - start;
    
    // Progress bar
    const progress = Math.round((i + 1) / requirements.length * 100);
    const bar = '█'.repeat(progress / 5) + '░'.repeat(20 - progress / 5);
    
    const title = ticket?.title || 'Failed to parse';
    console.log(`   [${bar}] ${progress}% | ${title} (${duration}ms)`);

    if (ticket) {
      results.push(ticket);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const avgTime = (totalTime / requirements.length).toFixed(2);

  console.log(`\n   ⏱️  Total: ${totalTime}s | Average: ${avgTime}s per ticket`);
  console.log(`   💰 Cost: $0.00 (local processing)`);
  console.log('\n   🎓 LEARNING: Track metrics for production monitoring!\n');

  return results;
}

// ============================================================================
// MAIN DEMO
// ============================================================================

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🎓 LESSON 5: ADVANCED PRD-TO-TICKET TECHNIQUES          ║');
  console.log('║  Professional-grade agent development patterns            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Technique 1: Confidence Scoring
    try {
      await estimateWithConfidence(
        'Build a real-time collaborative editing feature like Google Docs'
      );
    } catch (e) {
      console.log(`   ❌ Technique 1 failed: ${e.message}`);
      console.log(`   💡 This is OK - we'll continue with other techniques\n`);
    }

    // Technique 2: Validation
    const sampleTicket = {
      title: 'Add button',  // Too short!
      description: 'Button',  // Too brief!
      storyPoints: 1,
      acceptanceCriteria: ['Works']  // Need more!
    };
    validateTicket(sampleTicket);

    // Technique 3: Error Recovery
    try {
      await generateWithRetry('Implement OAuth2 authentication flow');
    } catch (e) {
      console.log(`   ❌ Technique 3 failed: ${e.message}\n`);
    }

    // Technique 4: Chain-of-Thought
    try {
      await estimateWithReasoning(
        'Create a drag-and-drop dashboard builder with customizable widgets'
      );
    } catch (e) {
      console.log(`   ❌ Technique 4 failed: ${e.message}\n`);
    }

    // Technique 5: Batch Processing
    try {
      const requirements = [
        'Add user login page',
        'Create password reset flow',
        'Implement 2FA authentication',
        'Add session management'
      ];
      await batchProcess(requirements);
    } catch (e) {
      console.log(`   ❌ Technique 5 failed: ${e.message}\n`);
    }

    // ========================================================================
    // FINAL LEARNING SUMMARY
    // ========================================================================

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║  🎓 LESSON COMPLETE - You Now Know:                      ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('1️⃣  CONFIDENCE SCORING → Flag uncertain tickets for review');
    console.log('2️⃣  VALIDATION → Auto-check quality before saving');
    console.log('3️⃣  ERROR RECOVERY → Graceful failures with fallbacks');
    console.log('4️⃣  CHAIN-OF-THOUGHT → Better reasoning = better results');
    console.log('5️⃣  BATCH PROCESSING → Efficient multi-item workflows\n');

    console.log('🎯 PRODUCTION CHECKLIST:\n');
    console.log('   ✓ Agent executes task');
    console.log('   ✓ Agent scores its own confidence');
    console.log('   ✓ Output is validated automatically');
    console.log('   ✓ Errors are caught and handled');
    console.log('   ✓ Performance metrics tracked');
    console.log('   ✓ All processing is local & compliant\n');

    console.log('📚 NEXT LEARNING OPTIONS:\n');
    console.log('   A) PROMPT ENGINEERING MASTERCLASS');
    console.log('      "Show me advanced prompting techniques"');
    console.log('      Learn: Few-shot learning, role prompting, constraints\n');

    console.log('   B) MULTI-AGENT COORDINATION');
    console.log('      "How do agents pass data to each other?"');
    console.log('      Learn: Pipeline patterns, state management, error handling\n');

    console.log('   C) MODEL COMPARISON LAB');
    console.log('      "Let\'s compare llama vs mistral vs qwen"');
    console.log('      Learn: When to use which model, quality vs speed\n');

    console.log('   D) BUILD PRODUCTION AGENT');
    console.log('      "Let\'s build the real PRD agent for the app"');
    console.log('      Learn: Integration, UI connection, saving tickets\n');

    console.log('   E) UI COMPONENT');
    console.log('      "Let\'s build the React UI for this"');
    console.log('      Learn: Real-time progress, streaming UI, ticket editing\n');

    console.log('🚀 You\'re ready to build production agents now!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n🎓 LEARNING: Even this error handling is a lesson!');
    console.log('   - Always wrap AI calls in try-catch');
    console.log('   - Provide helpful error messages');
    console.log('   - Have fallback strategies\n');
  }
}

main();
