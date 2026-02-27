/**
 * Ollama Client Wrapper
 * 
 * This is a simple wrapper around Ollama's API to make it easier to use
 * in our agent system. Ollama runs locally on your machine.
 * 
 * LEARNING NOTE:
 * Ollama exposes a REST API at http://localhost:11434
 * We're just making HTTP requests to our local Ollama instance.
 */

const OLLAMA_BASE_URL = 'http://localhost:11434';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  temperature?: number;
  stream?: boolean;
}

export interface OllamaChatResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

/**
 * Simple Ollama Client
 * 
 * Usage:
 * ```typescript
 * const client = new OllamaClient();
 * const result = await client.chat('llama3.2:3b', [
 *   { role: 'user', content: 'What is AI?' }
 * ]);
 * console.log(result.message.content);
 * ```
 */
export class OllamaClient {
  private baseUrl: string;

  constructor(baseUrl: string = OLLAMA_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if Ollama is running and accessible
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * List available models installed locally
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error('Ollama is not running. Please start it with: ollama serve');
      }
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error('Error listing Ollama models:', error);
      return [];
    }
  }

  /**
   * Send a chat request to Ollama
   * 
   * @param model - Model name (e.g., 'llama3.2:3b', 'mistral:7b')
   * @param messages - Array of messages (conversation history)
   * @param options - Optional parameters like temperature
   * @returns The model's response
   */
  async chat(
    model: string,
    messages: OllamaMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<OllamaChatResponse> {
    const requestBody: OllamaChatRequest = {
      model,
      messages,
      temperature: options?.temperature,
      stream: false,
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error calling Ollama:', error);
      throw error;
    }
  }

  /**
   * Stream chat responses (for real-time UI updates)
   * 
   * LEARNING NOTE:
   * Streaming shows the response as it's generated, making the UI feel responsive.
   * Great for longer responses.
   */
  async *chatStream(
    model: string,
    messages: OllamaMessage[],
    options?: {
      temperature?: number;
    }
  ): AsyncGenerator<string, void, unknown> {
    const requestBody: OllamaChatRequest = {
      model,
      messages,
      temperature: options?.temperature,
      stream: true,
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              yield json.message.content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  /**
   * Generate text with a simple prompt
   * Convenience method for simple use cases
   */
  async generate(model: string, prompt: string): Promise<string> {
    const response = await this.chat(model, [
      { role: 'user', content: prompt }
    ]);
    return response.message.content;
  }
}

/**
 * Singleton instance for easy access
 */
export const ollamaClient = new OllamaClient();

/**
 * Utility: Check if Ollama is installed and running
 */
export async function checkOllamaSetup(): Promise<{
  installed: boolean;
  running: boolean;
  models: string[];
  recommendations: string[];
}> {
  const client = new OllamaClient();
  const recommendations: string[] = [];

  const running = await client.isHealthy();
  
  if (!running) {
    return {
      installed: false,
      running: false,
      models: [],
      recommendations: [
        'Install Ollama: brew install ollama',
        'Start Ollama: ollama serve',
        'Pull a model: ollama pull llama3.2:3b'
      ]
    };
  }

  const models = await client.listModels();

  if (models.length === 0) {
    recommendations.push('No models installed. Run: ollama pull llama3.2:3b');
  }

  // Recommend models for different use cases
  const hasSmallModel = models.some(m => m.includes('3b'));
  const hasMediumModel = models.some(m => m.includes('7b'));
  const hasLargeModel = models.some(m => m.includes('14b') || m.includes('13b'));

  if (!hasSmallModel) {
    recommendations.push('For speed: ollama pull llama3.2:3b');
  }
  if (!hasMediumModel) {
    recommendations.push('For balance: ollama pull mistral:7b');
  }
  if (!hasLargeModel) {
    recommendations.push('For quality: ollama pull qwen2.5:14b');
  }

  return {
    installed: true,
    running: true,
    models,
    recommendations
  };
}
