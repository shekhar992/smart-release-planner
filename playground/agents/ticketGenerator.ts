/**
 * Ticket Generator Agent
 * 
 * PURPOSE:
 * Converts extracted requirements into actionable development tickets
 * with story points, priorities, and dependencies.
 * 
 * WHAT IT DOES:
 * 1. Takes requirements from previous agent
 * 2. Creates properly formatted tickets
 * 3. Estimates story points
 * 4. Identifies dependencies between tickets
 * 5. Assigns priorities and labels
 * 
 * LEARNING NOTE:
 * This is where AI really shines! Estimating story points and finding
 * dependencies requires understanding context - perfect for LLMs.
 */

import { BaseAgent } from '../lib/base-agent';
import type { AgentContext, AgentResult } from '../types';
import type { ExtractedRequirement, UserStory, GeneratedTicket } from '../types';

interface TicketGeneratorInput {
  requirements: ExtractedRequirement[];
  userStories: UserStory[];
  documentTitle: string;
}

interface TicketGeneratorOutput {
  tickets: GeneratedTicket[];
  dependencies: Array<{
    from: string;
    to: string;
    type: 'blocks' | 'requires' | 'related';
    reason: string;
  }>;
  summary: {
    totalTickets: number;
    totalStoryPoints: number;
    epicsCount: number;
    storiesCount: number;
    tasksCount: number;
  };
}

/**
 * LEARNING NOTE - Story Point Estimation
 * 
 * Story points measure complexity, not time:
 * - 1 SP: Trivial change (few lines, no complexity)
 * - 2 SP: Simple feature (single component, clear path)
 * - 3 SP: Small feature (multiple files, some unknowns)
 * - 5 SP: Medium feature (cross-component, moderate complexity)
 * - 8 SP: Large feature (architectural decisions, many unknowns)
 * - 13 SP: Very large (consider breaking down)
 * 
 * The AI learns these patterns from the context we provide.
 */
export class TicketGeneratorAgent extends BaseAgent<
  TicketGeneratorInput,
  TicketGeneratorOutput
> {
  constructor(model: string = 'qwen2.5:14b') {
    super({
      name: 'Ticket Generator Agent',
      description: `You are an expert engineering manager who creates detailed, actionable tickets.
You understand software development complexity and can estimate effort accurately.
You identify dependencies and organize work into logical units.`,
      model,
      temperature: 0.5, // Balanced creativity and consistency
    });
  }

  protected async buildPrompt(context: AgentContext): Promise<string> {
    const input = context.input as TicketGeneratorInput;

    // Format requirements for the prompt
    const requirementsText = input.requirements
      .map((req, i) => {
        return `${i + 1}. [${req.id}] ${req.title}
   Type: ${req.type}
   Description: ${req.description}
   Priority: ${req.priority}
   Acceptance Criteria: ${req.acceptanceCriteria?.join('; ') || 'None'}
   Technical Notes: ${req.technicalNotes || 'None'}`;
      })
      .join('\n\n');

    const userStoriesText = input.userStories
      .map((story, i) => {
        return `${i + 1}. [${story.id}] As a ${story.asA}, I want ${story.iWant}, so that ${story.soThat}
   Acceptance Criteria: ${story.acceptanceCriteria.join('; ')}`;
      })
      .join('\n\n');

    return `Convert these requirements into actionable development tickets for an agile team.

PROJECT: ${input.documentTitle}

REQUIREMENTS:
${requirementsText}

USER STORIES:
${userStoriesText}

Your task:
1. Create tickets from requirements (decide: Epic, Story, or Task)
2. Write clear titles and descriptions
3. Estimate story points (1, 2, 3, 5, 8, 13)
4. Set priority (critical, high, medium, low)
5. Add relevant labels (frontend, backend, api, database, testing, etc.)
6. Identify dependencies (which tickets must be done before others)
7. Suggest assignee skills needed
8. Assess risk factors

TICKET SIZING GUIDE:
- Epic: Large feature spanning multiple sprints (40+ SP total)
- Story: User-facing feature deliverable in 1 sprint (3-8 SP)
- Task: Technical work, non-user-facing (1-5 SP)

STORY POINT GUIDE:
- 1 SP: Few hours, trivial, no unknowns
- 2 SP: 1 day, simple, clear path
- 3 SP: 2-3 days, straightforward
- 5 SP: 3-5 days, moderate complexity
- 8 SP: 1 week+, complex, some unknowns
- 13 SP: Very large, consider splitting

Return as JSON:
\`\`\`json
{
  "tickets": [
    {
      "id": "ticket-1",
      "type": "story",
      "title": "Implement user authentication",
      "description": "Detailed description with context and implementation notes",
      "acceptanceCriteria": [
        "User can log in with email/password",
        "Session persists for 7 days",
        "Failed login shows error message"
      ],
      "storyPoints": 5,
      "priority": "high",
      "labels": ["frontend", "backend", "authentication"],
      "sourceRequirement": "req-1",
      "sourceDocument": "${input.documentTitle}",
      "confidence": 0.9,
      "dependencies": [],
      "blockedBy": [],
      "estimatedComplexity": 6,
      "suggestedAssignee": "Full-stack developer with auth experience",
      "technicalStack": ["React", "Node.js", "JWT"],
      "riskFactors": ["Need to decide on auth provider", "Security review required"],
      "qualityScore": 0.85
    }
  ],
  "dependencies": [
    {
      "from": "ticket-2",
      "to": "ticket-1",
      "type": "requires",
      "reason": "Authentication must be implemented before user profile features"
    }
  ]
}
\`\`\`

IMPORTANT:
- Create tickets for EVERY requirement
- Break large requirements into multiple tickets if needed
- Be specific about what needs to be built
- Include technical details in descriptions
- Think about realistic dependencies (what must be built first)
- Don't inflate story points - be realistic`;
  }

  protected async parseResponse(
    response: string,
    context: AgentContext
  ): Promise<TicketGeneratorOutput> {
    const parsed = this.extractJSON<{
      tickets: any[];
      dependencies: any[];
    }>(response);

    if (!parsed || !parsed.tickets) {
      throw new Error('Failed to parse tickets from AI response');
    }

    // Map to our GeneratedTicket type
    const tickets: GeneratedTicket[] = parsed.tickets.map((ticket: any) => ({
      id: ticket.id,
      type: ticket.type || 'story',
      title: ticket.title,
      description: ticket.description || '',
      acceptanceCriteria: ticket.acceptanceCriteria || [],
      storyPoints: ticket.storyPoints,
      priority: ticket.priority || 'medium',
      labels: ticket.labels || [],
      sourceRequirement: ticket.sourceRequirement || '',
      sourceDocument: ticket.sourceDocument || '',
      confidence: ticket.confidence || 0.75,
      dependencies: ticket.dependencies || [],
      blockedBy: ticket.blockedBy || [],
      parentTicket: ticket.parentTicket,
      estimatedComplexity: ticket.estimatedComplexity,
      suggestedAssignee: ticket.suggestedAssignee,
      suggestedSprint: ticket.suggestedSprint,
      technicalStack: ticket.technicalStack || [],
      riskFactors: ticket.riskFactors || [],
      similarPastTickets: ticket.similarPastTickets || [],
      qualityScore: ticket.qualityScore || 0.7,
    }));

    const dependencies = parsed.dependencies || [];

    // Calculate summary
    const epicsCount = tickets.filter(t => t.type === 'epic').length;
    const storiesCount = tickets.filter(t => t.type === 'story').length;
    const tasksCount = tickets.filter(t => t.type === 'task').length;
    const totalStoryPoints = tickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    return {
      tickets,
      dependencies,
      summary: {
        totalTickets: tickets.length,
        totalStoryPoints,
        epicsCount,
        storiesCount,
        tasksCount,
      },
    };
  }

  /**
   * Calculate confidence based on ticket quality
   */
  protected async calculateConfidence(
    data: TicketGeneratorOutput,
    context: AgentContext
  ): Promise<number> {
    if (data.tickets.length === 0) return 0.2;

    // Check quality indicators
    const ticketsWithAC = data.tickets.filter(t => t.acceptanceCriteria.length > 0).length;
    const ticketsWithPoints = data.tickets.filter(t => t.storyPoints).length;
    const ticketsWithLabels = data.tickets.filter(t => t.labels.length > 0).length;

    const qualityScore = (
      (ticketsWithAC / data.tickets.length) * 0.4 +
      (ticketsWithPoints / data.tickets.length) * 0.3 +
      (ticketsWithLabels / data.tickets.length) * 0.3
    );

    return Math.max(0.5, qualityScore);
  }
}

/**
 * CONVENIENCE FUNCTION: Generate tickets from requirements
 */
export async function generateTickets(
  requirements: ExtractedRequirement[],
  userStories: UserStory[],
  documentTitle: string
): Promise<AgentResult<TicketGeneratorOutput>> {
  const agent = new TicketGeneratorAgent();

  return await agent.execute({
    input: {
      requirements,
      userStories,
      documentTitle,
    },
  });
}
