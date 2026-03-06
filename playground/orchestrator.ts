/**
 * Agent Orchestrator
 * 
 * PURPOSE:
 * Coordinates multiple agents to work together in a pipeline.
 * Manages state between agents and handles errors.
 * 
 * LEARNING NOTE - What's an Orchestrator?
 * 
 * Think of it like a project manager:
 * - Agent 1 does their job → passes results to Agent 2
 * - Agent 2 does their job → passes results to Agent 3
 * - Agent 3 does their job → final output
 * 
 * The orchestrator manages this flow and tracks progress.
 * 
 * This is called "Sequential Agent Workflow" or "Agent Chain".
 */

import { DocumentParserAgent, parseDocument } from './agents/documentParser';
import { RequirementsExtractorAgent, extractRequirements } from './agents/requirementsExtractor';
import { TicketGeneratorAgent, generateTickets } from './agents/ticketGenerator';
import type { GeneratedTicket, OrchestrationPipeline, PipelineStage } from './types';

export type ProgressCallback = (stage: PipelineStage) => void;

/**
 * Main Orchestrator Class
 * 
 * This runs the complete pipeline: Document → Requirements → Tickets
 */
export class PRDToTicketOrchestrator {
  private pipeline: OrchestrationPipeline;
  private progressCallback?: ProgressCallback;

  constructor(progressCallback?: ProgressCallback) {
    this.progressCallback = progressCallback;
    this.pipeline = {
      id: `pipeline-${Date.now()}`,
      stages: [
        {
          id: 'stage-1',
          name: 'Document Parsing',
          agent: 'DocumentParserAgent',
          status: 'idle',
        },
        {
          id: 'stage-2',
          name: 'Requirements Extraction',
          agent: 'RequirementsExtractorAgent',
          status: 'idle',
        },
        {
          id: 'stage-3',
          name: 'Ticket Generation',
          agent: 'TicketGeneratorAgent',
          status: 'idle',
        },
      ],
      currentStage: 0,
      status: 'pending',
    };
  }

  /**
   * Run the complete pipeline
   * 
   * LEARNING NOTE:
   * This is the main function that ties everything together.
   * It runs each agent in sequence, passing data from one to the next.
   */
  async execute(
    filePath: string,
    fileName: string,
    fileType: 'pdf' | 'txt' | 'markdown'
  ): Promise<{
    success: boolean;
    tickets: GeneratedTicket[];
    dependencies: any[];
    pipeline: OrchestrationPipeline;
    error?: string;
  }> {
    this.pipeline.status = 'running';
    this.pipeline.startedAt = new Date();

    try {
      // ========================================
      // STAGE 1: Parse Document
      // ========================================
      await this.updateStage(0, 'processing');
      console.log('🔄 Stage 1: Parsing document...');

      const parseResult = await parseDocument(filePath, fileName, fileType);

      if (!parseResult.success || !parseResult.data) {
        throw new Error(`Document parsing failed: ${parseResult.error}`);
      }

      await this.updateStage(0, 'completed', {
        output: {
          sectionsCount: parseResult.data.sections.length,
          title: parseResult.data.title,
        },
        durationMs: parseResult.durationMs
      });

      console.log(`✅ Stage 1: Found ${parseResult.data.sections.length} sections`);

      // ========================================
      // STAGE 2: Extract Requirements
      // ========================================
      await this.updateStage(1, 'processing');
      console.log('🔄 Stage 2: Extracting requirements...');

      const reqResult = await extractRequirements(parseResult.data);

      if (!reqResult.success || !reqResult.data) {
        throw new Error(`Requirements extraction failed: ${reqResult.error}`);
      }

      await this.updateStage(1, 'completed', {
        output: {
          requirementsCount: reqResult.data.requirements.length,
          userStoriesCount: reqResult.data.userStories.length,
        },
        durationMs: reqResult.durationMs
      });

      console.log(`✅ Stage 2: Extracted ${reqResult.data.requirements.length} requirements`);

      // ========================================
      // STAGE 3: Generate Tickets
      // ========================================
      await this.updateStage(2, 'processing');
      console.log('🔄 Stage 3: Generating tickets...');

      const ticketResult = await generateTickets(
        reqResult.data.requirements,
        reqResult.data.userStories,
        parseResult.data.title
      );

      if (!ticketResult.success || !ticketResult.data) {
        throw new Error(`Ticket generation failed: ${ticketResult.error}`);
      }

      await this.updateStage(2, 'completed', {
        output: {
          ticketsCount: ticketResult.data.tickets.length,
          totalStoryPoints: ticketResult.data.summary.totalStoryPoints,
        },
        durationMs: ticketResult.durationMs
      });

      console.log(`✅ Stage 3: Generated ${ticketResult.data.tickets.length} tickets`);

      // ========================================
      // COMPLETE
      // ========================================
      this.pipeline.status = 'completed';
      this.pipeline.completedAt = new Date();

      return {
        success: true,
        tickets: ticketResult.data.tickets,
        dependencies: ticketResult.data.dependencies,
        pipeline: this.pipeline,
      };
    } catch (error) {
      console.error('❌ Pipeline failed:', error);

      this.pipeline.status = 'failed';
      this.pipeline.completedAt = new Date();

      // Mark current stage as failed
      if (this.pipeline.currentStage < this.pipeline.stages.length) {
        this.pipeline.stages[this.pipeline.currentStage].status = 'error';
        this.pipeline.stages[this.pipeline.currentStage].error =
          error instanceof Error ? error.message : 'Unknown error';
      }

      return {
        success: false,
        tickets: [],
        dependencies: [],
        pipeline: this.pipeline,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update stage status and notify via callback
   */
  private async updateStage(
    stageIndex: number,
    status: 'idle' | 'processing' | 'completed' | 'error',
    updates?: Partial<PipelineStage>
  ): Promise<void> {
    this.pipeline.currentStage = stageIndex;
    const stage = this.pipeline.stages[stageIndex];

    stage.status = status;

    if (status === 'processing') {
      stage.startedAt = new Date();
    }

    if (status === 'completed') {
      stage.completedAt = new Date();
      if (stage.startedAt) {
        stage.durationMs = stage.completedAt.getTime() - stage.startedAt.getTime();
      }
    }

    if (updates) {
      Object.assign(stage, updates);
    }

    // Notify UI of progress
    if (this.progressCallback) {
      this.progressCallback(stage);
    }
  }

  /**
   * Get current pipeline state (useful for UI)
   */
  getPipelineState(): OrchestrationPipeline {
    return this.pipeline;
  }
}

/**
 * SIMPLE API: One function to rule them all
 * 
 * LEARNING NOTE:
 * This is the function you'll call from your UI:
 * 
 * ```typescript
 * const result = await processPRDToTickets('/path/to/prd.pdf', 'My PRD.pdf', 'pdf');
 * console.log(result.tickets); // Array of tickets ready to import
 * ```
 */
export async function processPRDToTickets(
  filePath: string,
  fileName: string,
  fileType: 'pdf' | 'txt' | 'markdown',
  onProgress?: ProgressCallback
): Promise<{
  success: boolean;
  tickets: GeneratedTicket[];
  dependencies: any[];
  pipeline: OrchestrationPipeline;
  error?: string;
}> {
  const orchestrator = new PRDToTicketOrchestrator(onProgress);
  return await orchestrator.execute(filePath, fileName, fileType);
}
