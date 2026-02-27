/**
 * Requirements Extractor Agent
 * 
 * PURPOSE:
 * Takes structured document sections and extracts individual requirements,
 * user stories, and acceptance criteria.
 * 
 * WHAT IT DOES:
 * 1. Analyzes each document section
 * 2. Identifies functional and non-functional requirements
 * 3. Extracts user stories (As a... I want... So that...)
 * 4. Finds acceptance criteria
 * 5. Assigns confidence scores
 * 
 * LEARNING NOTE:
 * This agent uses NLP understanding (via LLM) to identify requirements
 * that might be written in many different formats. Traditional code would
 * need complex regex patterns for each format - AI handles this naturally.
 */

import { BaseAgent } from '../lib/base-agent';
import type { AgentContext, AgentResult, DocumentStructure } from '../types';
import type { ExtractedRequirement, DocumentSection, UserStory } from '../types';

interface RequirementsExtractorInput {
  sections: DocumentSection[];
  documentTitle: string;
}

interface RequirementsExtractorOutput {
  requirements: ExtractedRequirement[];
  userStories: UserStory[];
  summary: {
    totalRequirements: number;
    functionalCount: number;
    nonFunctionalCount: number;
    userStoryCount: number;
  };
}

/**
 * LEARNING NOTE - Why This is Powerful:
 * 
 * Traditional parsing would need rules like:
 * - "Must have" = functional requirement
 * - "As a user" = user story
 * - "SHALL" / "MUST" = mandatory requirement
 * 
 * LLMs understand context and intent, so they can identify requirements
 * even when written in non-standard ways.
 */
export class RequirementsExtractorAgent extends BaseAgent<
  RequirementsExtractorInput,
  RequirementsExtractorOutput
> {
  constructor(model: string = 'mistral:7b') {
    super({
      name: 'Requirements Extractor Agent',
      description: `You are an expert product analyst who extracts requirements from documents.
You identify functional requirements, non-functional requirements, user stories, and constraints.
You understand various requirement formats (user stories, use cases, traditional requirements).`,
      model,
      temperature: 0.4, // Slightly higher for better extraction
    });
  }

  /**
   * Build the prompt with document sections
   */
  protected async buildPrompt(context: AgentContext): Promise<string> {
    const input = context.input as RequirementsExtractorInput;

    // Prepare sections text
    const sectionsText = input.sections
      .map((section) => {
        return `## ${section.title}
${section.content}
${section.subsections?.map(sub => `### ${sub.title}\n${sub.content}`).join('\n\n') || ''}`;
      })
      .join('\n\n---\n\n');

    return `Extract all requirements from this PRD/BRD document.

DOCUMENT: ${input.documentTitle}

SECTIONS:
${sectionsText}

Your task:
1. Identify ALL requirements (functional and non-functional)
2. Extract user stories in "As a... I want... So that..." format
3. Find acceptance criteria for each requirement
4. Identify actors/user roles mentioned
5. Note any constraints or assumptions

For each requirement, determine:
- Type: functional, non-functional, user-story, or constraint
- Priority: high, medium, or low (infer from words like "must", "should", "could")
- Clear, concise title and description

Return as JSON:
\`\`\`json
{
  "requirements": [
    {
      "id": "req-1",
      "type": "functional",
      "title": "Short requirement title",
      "description": "Detailed description",
      "sourceSection": "Section name it came from",
      "confidence": 0.95,
      "priority": "high",
      "actors": ["User", "Admin"],
      "acceptanceCriteria": ["Criteria 1", "Criteria 2"],
      "technicalNotes": "Any technical details mentioned"
    }
  ],
  "userStories": [
    {
      "id": "story-1",
      "asA": "registered user",
      "iWant": "to reset my password",
      "soThat": "I can regain access to my account",
      "acceptanceCriteria": ["Criteria 1", "Criteria 2"],
      "sourceRequirement": "req-1",
      "confidence": 0.9
    }
  ]
}
\`\`\`

IMPORTANT:
- Extract EVERY requirement, even small ones
- Be specific in descriptions
- Don't make up requirements not in the document
- If a user story is implied but not explicit, mark confidence lower
- Include technical requirements (performance, security, etc.)`;
  }

  /**
   * Parse AI response into structured requirements
   */
  protected async parseResponse(
    response: string,
    context: AgentContext
  ): Promise<RequirementsExtractorOutput> {
    const parsed = this.extractJSON<{
      requirements: any[];
      userStories: any[];
    }>(response);

    if (!parsed) {
      throw new Error('Failed to extract JSON from AI response');
    }

    // Map to our types
    const requirements: ExtractedRequirement[] = (parsed.requirements || []).map(
      (req: any, index: number) => ({
        id: req.id || `req-${index + 1}`,
        type: req.type || 'functional',
        title: req.title || 'Untitled Requirement',
        description: req.description || '',
        sourceSection: req.sourceSection || 'Unknown',
        confidence: req.confidence || 0.7,
        priority: req.priority || 'medium',
        actors: req.actors || [],
        acceptanceCriteria: req.acceptanceCriteria || [],
        technicalNotes: req.technicalNotes,
      })
    );

    const userStories: UserStory[] = (parsed.userStories || []).map(
      (story: any, index: number) => ({
        id: story.id || `story-${index + 1}`,
        asA: story.asA || '',
        iWant: story.iWant || '',
        soThat: story.soThat || '',
        acceptanceCriteria: story.acceptanceCriteria || [],
        sourceRequirement: story.sourceRequirement || '',
        confidence: story.confidence || 0.7,
      })
    );

    // Calculate summary
    const functionalCount = requirements.filter(r => r.type === 'functional').length;
    const nonFunctionalCount = requirements.filter(r => r.type === 'non-functional').length;

    return {
      requirements,
      userStories,
      summary: {
        totalRequirements: requirements.length,
        functionalCount,
        nonFunctionalCount,
        userStoryCount: userStories.length,
      },
    };
  }

  /**
   * Calculate confidence based on extraction quality
   */
  protected async calculateConfidence(
    data: RequirementsExtractorOutput,
    context: AgentContext
  ): Promise<number> {
    // Average confidence of all requirements
    const allConfidences = [
      ...data.requirements.map(r => r.confidence),
      ...data.userStories.map(s => s.confidence),
    ];

    if (allConfidences.length === 0) return 0.3;

    const avgConfidence = allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length;

    // Penalize if we found very few requirements (might have missed some)
    if (data.requirements.length < 3) {
      return avgConfidence * 0.8;
    }

    return avgConfidence;
  }
}

/**
 * CONVENIENCE FUNCTION: Extract requirements from document structure
 */
export async function extractRequirements(
  documentStructure: DocumentStructure
): Promise<AgentResult<RequirementsExtractorOutput>> {
  const agent = new RequirementsExtractorAgent();

  return await agent.execute({
    input: {
      sections: documentStructure.sections,
      documentTitle: documentStructure.title,
    },
  });
}
