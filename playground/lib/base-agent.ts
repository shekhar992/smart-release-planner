/**
 * Base Agent Class
 * 
 * LEARNING NOTE:
 * An "Agent" is just a class that:
 * 1. Has a specific role/purpose
 * 2. Takes input
 * 3. Uses an LLM to process that input
 * 4. Returns structured output
 * 
 * Think of it like a smart function that uses AI to make decisions.
 */

import { OllamaClient } from '../lib/ollama-client';
import type { AgentConfig, AgentContext, AgentResult } from '../types';

/**
 * Abstract base class for all agents
 * 
 * To create a new agent:
 * 1. Extend this class
 * 2. Implement the buildPrompt() method
 * 3. Implement the parseResponse() method
 * 4. The execute() method handles the rest
 */
export abstract class BaseAgent<TInput = any, TOutput = any> {
  protected config: AgentConfig;
  protected ollamaClient: OllamaClient;

  constructor(config: AgentConfig, ollamaClient?: OllamaClient) {
    this.config = config;
    this.ollamaClient = ollamaClient || new OllamaClient();
  }

  /**
   * Main execution method - this is what you call to run the agent
   * 
   * LEARNING NOTE:
   * This method coordinates the entire agent workflow:
   * 1. Build the prompt from input
   * 2. Call Ollama
   * 3. Parse the response
   * 4. Track metrics (time, tokens, etc.)
   */
  async execute(context: AgentContext): Promise<AgentResult<TOutput>> {
    const startTime = Date.now();

    try {
      // Step 1: Build the prompt based on input
      const prompt = await this.buildPrompt(context);

      // Step 2: Call Ollama with the prompt
      const response = await this.ollamaClient.chat(
        this.config.model,
        [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          temperature: this.config.temperature || 0.7,
        }
      );

      // Step 3: Parse the LLM's response into structured data
      const parsedData = await this.parseResponse(
        response.message.content,
        context
      );

      // Step 4: Calculate confidence score
      const confidence = await this.calculateConfidence(parsedData, context);

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: parsedData,
        confidence,
        metadata: {
          model: this.config.model,
          agentName: this.config.name,
        },
        tokensUsed: (response.prompt_eval_count || 0) + (response.eval_count || 0),
        durationMs: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Agent ${this.config.name} failed:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: duration,
      };
    }
  }

  /**
   * System prompt defines the agent's role and behavior
   * 
   * LEARNING NOTE:
   * This is like giving the AI its "job description".
   * It tells the AI what it is and how it should behave.
   */
  protected getSystemPrompt(): string {
    return `You are ${this.config.name}.
${this.config.description}

Your responses must be accurate, well-structured, and based only on the information provided.
If you're unsure about something, indicate your confidence level.`;
  }

  /**
   * Build the prompt from input context
   * Each agent implements this differently based on their purpose
   */
  protected abstract buildPrompt(context: AgentContext): Promise<string>;

  /**
   * Parse the LLM's text response into structured data
   * Each agent implements this differently based on expected output
   */
  protected abstract parseResponse(
    response: string,
    context: AgentContext
  ): Promise<TOutput>;

  /**
   * Calculate confidence score for the result
   * Override this to implement custom confidence logic
   */
  protected async calculateConfidence(
    data: TOutput,
    context: AgentContext
  ): Promise<number> {
    // Default: return 0.8 as baseline
    // Subclasses can implement more sophisticated confidence calculations
    return 0.8;
  }

  /**
   * Helper method to extract JSON from LLM responses
   * 
   * LEARNING NOTE:
   * LLMs sometimes wrap JSON in markdown code blocks like:
   * ```json
   * { "data": "here" }
   * ```
   * 
   * This method extracts just the JSON part.
   */
  protected extractJSON<T>(text: string): T | null {
    try {
      // Try direct parse first
      return JSON.parse(text);
    } catch {
      // Try to find JSON in markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch {
          return null;
        }
      }

      // Try to find raw JSON
      const rawJsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (rawJsonMatch) {
        try {
          return JSON.parse(rawJsonMatch[1]);
        } catch {
          return null;
        }
      }

      return null;
    }
  }

  /**
   * Helper method to clean and normalize text
   */
  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }
}

/**
 * LEARNING EXAMPLE: Simple Agent
 * 
 * Here's how you would create a simple agent that summarizes text:
 * 
 * ```typescript
 * class SummarizerAgent extends BaseAgent<string, string> {
 *   protected async buildPrompt(context: AgentContext): Promise<string> {
 *     return `Summarize this text in 2-3 sentences:\n\n${context.input}`;
 *   }
 * 
 *   protected async parseResponse(response: string): Promise<string> {
 *     return response.trim();
 *   }
 * }
 * 
 * // Usage:
 * const agent = new SummarizerAgent({
 *   name: 'Summarizer',
 *   description: 'Summarizes long text',
 *   model: 'llama3.2:3b'
 * });
 * 
 * const result = await agent.execute({
 *   input: 'very long text here...'
 * });
 * 
 * console.log(result.data); // The summary
 * ```
 */
