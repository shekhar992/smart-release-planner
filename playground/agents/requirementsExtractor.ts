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
  constructor(model: string = 'qwen2.5:14b') {
    super({
      name: 'Requirements Extractor Agent',
      description: `You are a certified business analyst (CBAP-equivalent) and senior product analyst with deep expertise in IEEE 830 software requirements specification and agile product delivery.

Your job is precise: extract EVERY explicitly stated requirement from the provided document sections. You never invent or infer requirements beyond what is clearly stated or directly implied.

Standards you always apply:
- Priority inference using MoSCoW: MUST/SHALL/REQUIRED → high, SHOULD/RECOMMENDED → medium, COULD/OPTIONAL → low, WON'T/OUT OF SCOPE → constraint
- All user stories must satisfy INVEST criteria: Independent, Negotiable, Valuable, Estimable, Small, Testable
- Acceptance criteria must be verifiable conditions — never vague statements like "system should work well"
- Deduplication: if the same requirement appears in multiple sections, extract it ONCE and list all source sections in sourceSection as " | " separated values
- Confidence scoring rubric: 0.9–1.0 = explicitly stated verbatim, 0.7–0.89 = clearly implied with direct evidence, 0.5–0.69 = inferred from context, below 0.5 = do not include
- Output ONLY valid JSON — no preamble, no explanation, no markdown outside the JSON block`,
      model,
      temperature: 0.2, // Low: extraction not generation — read what's there, don't invent alternatives
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

CRITICAL RULES (apply before writing any output):
- NEVER fabricate requirements. If it is not in the document, it does not exist.
- DEDUPLICATE: if the same requirement appears in multiple sections, output it once. Set sourceSection to all section names separated by " | ".
- Confidence rubric: 0.9–1.0 = stated verbatim, 0.7–0.89 = clearly implied, 0.5–0.69 = inferred — do NOT include anything below 0.5.

Your task:
1. Identify ALL requirements — functional, non-functional, constraints, and business rules
2. Infer priority from modal verbs: MUST/SHALL/REQUIRED → "high", SHOULD/RECOMMENDED → "medium", COULD/MAY/OPTIONAL → "low"
3. Extract user stories in strict "As a... I want... So that..." format — all three parts required
4. For every requirement, write acceptance criteria as specific, verifiable conditions (not vague statements)
5. Identify all named actors/user roles mentioned anywhere in the document

Return as JSON:
\`\`\`json
{
  "requirements": [
    {
      "id": "req-1",
      "type": "functional",
      "title": "Short, verb-first requirement title",
      "description": "Precise description using the document's own language where possible",
      "sourceSection": "Section name (or 'Section A | Section B' if duplicated)",
      "confidence": 0.95,
      "priority": "high",
      "actors": ["User", "Admin"],
      "acceptanceCriteria": ["Verifiable condition 1", "Verifiable condition 2"],
      "technicalNotes": "Any technical details explicitly stated in the document"
    }
  ],
  "userStories": [
    {
      "id": "story-1",
      "asA": "registered user",
      "iWant": "to reset my password via email",
      "soThat": "I can regain access to my account without contacting support",
      "acceptanceCriteria": ["Reset link expires after 24 hours", "User receives confirmation email after reset"],
      "sourceRequirement": "req-1",
      "confidence": 0.92
    }
  ]
}
\`\`\`

Output ONLY the JSON block — nothing before or after it.`;
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
