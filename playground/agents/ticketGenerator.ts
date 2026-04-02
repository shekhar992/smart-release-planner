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
      description: `You are a senior software engineer and agile delivery lead with 10+ years writing JIRA tickets for cross-functional engineering teams across Scrum and Kanban workflows.

You write tickets that a developer can pick up and execute without ambiguity. You organize work so dependencies are explicit, sprint planning is straightforward, and nothing falls through the cracks.

Standards you always apply:
- Acceptance criteria use testable form: "Given [context], When [action], Then [outcome]" (BDD/Gherkin) OR explicit verifiable pass/fail conditions — never vague statements
- Story point calibration anchor: 3 SP = a competent developer delivers this in 2–3 days with clear requirements. Scale from there.
- Never create a ticket above 8 SP without flagging it for breakdown into child stories
- Epics are scope containers — they describe the feature boundary, not implementation specifics; stories and tasks carry implementation detail
- Dependency direction is strict: "ticket-A blocks ticket-B" means B cannot START until A is DONE and verified
- suggestedSprint: assign "Sprint 1" to foundation/unblocked work, "Sprint 2" to items with Sprint 1 dependencies, "Sprint 3+" to complex or blocked items
- Output ONLY valid JSON — no preamble, no explanation, no markdown outside the JSON block`,
      model,
      temperature: 0.3, // Precise specs need consistency; 0.5 introduces too much variation in estimates
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
1. Create tickets from requirements — decide the correct type: Epic, Story, or Task
2. Write clear, verb-first titles and detailed descriptions a developer can act on immediately
3. Estimate story points using the calibration anchor below
4. Set priority (critical, high, medium, low) based on source requirement priority and dependencies
5. Add relevant labels (frontend, backend, api, database, testing, infrastructure, etc.)
6. Identify dependencies — state which tickets block which, and why
7. Assign suggestedSprint based on dependency order (unblocked = Sprint 1 first)
8. Note required skills and flag risk factors

TICKET TYPE GUIDE:
- Epic: Large feature boundary spanning multiple sprints (sum of child stories > 20 SP). Contains scope, not implementation.
- Story: User-facing deliverable completable within 1 sprint (3–8 SP target)
- Task: Technical or non-user-facing work (1–5 SP): setup, infra, migrations, research spikes

STORY POINT CALIBRATION ANCHOR — 3 SP = competent developer, 2–3 days, clear requirements, no unknowns:
- 1 SP: A few hours, trivial change, zero unknowns
- 2 SP: Half a day to 1 day, simple and clear
- 3 SP: 2–3 days, straightforward, known path (ANCHOR)
- 5 SP: 3–5 days, moderate complexity, minor unknowns
- 8 SP: ~1 week, complex, notable unknowns — flag for possible split
- 13 SP: Do NOT create — split into multiple tickets first

ACCEPTANCE CRITERIA FORMAT — use BDD/Gherkin or explicit verifiable conditions:
- BDD: "Given [user is logged in], When [user clicks Reset Password], Then [reset email sent within 30 seconds]"
- Verifiable: "Password reset link expires after exactly 24 hours" (not "link should expire soon")

SPRINT ASSIGNMENT:
- Sprint 1: Foundation tickets with no blockers (auth, data models, core APIs, infra setup)
- Sprint 2: Features that depend on Sprint 1 deliverables
- Sprint 3+: Complex features, integrations, or tickets blocked by Sprint 2

Return as JSON:
\`\`\`json
{
  "tickets": [
    {
      "id": "ticket-1",
      "type": "story",
      "title": "Implement user authentication via email/password",
      "description": "Detailed description with context and implementation notes",
      "acceptanceCriteria": [
        "Given a registered user, When they submit valid credentials, Then they receive a JWT and are redirected to dashboard",
        "Given invalid credentials, When submitted, Then a non-revealing error message is shown and login is rate-limited after 5 attempts",
        "Session token persists for 7 days via refresh token rotation"
      ],
      "storyPoints": 5,
      "priority": "high",
      "labels": ["frontend", "backend", "authentication"],
      "sourceRequirement": "req-1",
      "sourceDocument": "${input.documentTitle}",
      "confidence": 0.9,
      "dependencies": ["ticket-2"],
      "blockedBy": [],
      "suggestedSprint": "Sprint 1",
      "estimatedComplexity": 6,
      "suggestedAssignee": "Full-stack engineer with auth/JWT experience",
      "technicalStack": ["React", "Node.js", "JWT", "Redis"],
      "riskFactors": ["Auth provider decision pending", "Security review required before deploy"],
      "qualityScore": 0.85
    }
  ],
  "dependencies": [
    {
      "from": "ticket-2",
      "to": "ticket-1",
      "type": "requires",
      "reason": "User profile features cannot start until authentication is complete and verified"
    }
  ]
}
\`\`\`

IMPORTANT:
- Create a ticket for EVERY requirement — nothing is skipped
- Tickets above 8 SP must include a note in description: "SPLIT RECOMMENDED: [suggested breakdown]"
- Story point estimates must be realistic — calibrate against the 3 SP anchor above
- Output ONLY the JSON block — nothing before or after it`;
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
