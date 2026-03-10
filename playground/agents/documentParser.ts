/**
 * Document Parser Agent
 * 
 * PURPOSE:
 * Extracts text and structure from PDF documents and identifies the basic
 * organization (title, sections, requirements areas).
 * 
 * WHAT IT DOES:
 * 1. Reads PDF file
 * 2. Extracts raw text
 * 3. Uses AI to identify document structure
 * 4. Finds major sections like "Requirements", "User Stories", etc.
 * 
 * LEARNING NOTE:
 * This is our first agent in the pipeline. It doesn't need to be perfect,
 * it just needs to give us clean, structured text for the next agent.
 */

import { BaseAgent } from '../lib/base-agent';
import type { AgentContext, AgentResult } from '../types';
import type { DocumentStructure, DocumentSection } from '../types';

interface DocumentParserInput {
  filePath: string;
  fileName: string;
  fileType: 'pdf' | 'txt' | 'markdown';
}

interface DocumentParserOutput extends DocumentStructure {
  rawText: string;
  extractedAt: Date;
}

/**
 * LEARNING NOTE - What's an Agent?
 * 
 * Think of an agent as a smart worker with a specific job:
 * - Input: PDF file
 * - Process: Use AI to understand the structure
 * - Output: Organized document sections
 * 
 * The AI (Ollama) helps us understand the document structure better than
 * simple regex or string splitting ever could.
 */
export class DocumentParserAgent extends BaseAgent<
  DocumentParserInput,
  DocumentParserOutput
> {
  constructor(model: string = 'llama3.2:3b') {
    super({
      name: 'Document Parser Agent',
      description: `You are an expert at analyzing technical documents, PRDs, and BRDs.
Your job is to extract the structure and organization of documents.
You identify main sections, subsections, and categorize content types.`,
      model,
      temperature: 0.3, // Low temperature = more consistent
    });
  }

  /**
   * Build the prompt for this agent
   * 
   * LEARNING NOTE:
   * "Prompt engineering" is just: explaining to the AI what you want,
   * giving it examples, and being specific about the output format.
   */
  protected async buildPrompt(context: AgentContext): Promise<string> {
    const { extractedText } = context.metadata || {};

    return `Analyze this document and identify its structure.

DOCUMENT TEXT:
${extractedText}

Your task:
1. Identify the document title
2. Find all major sections (look for headings, numbered sections, bold text)
3. Categorize each section (e.g., "Overview", "Requirements", "User Stories", "Technical Specs", "Acceptance Criteria")
4. Extract the content for each section
5. Note any subsections

Return your analysis as JSON in this exact format:
\`\`\`json
{
  "title": "Document title",
  "sections": [
    {
      "id": "section-1",
      "title": "Section name",
      "content": "Section content",
      "level": 1,
      "category": "requirements",
      "subsections": []
    }
  ]
}
\`\`\`

Categories to use: overview, requirements, user-stories, technical-specs, acceptance-criteria, constraints, assumptions, other

Be thorough but concise. Include all important sections.`;
  }

  /**
   * Parse the AI's response into structured data
   * 
   * LEARNING NOTE:
   * AI responses are text. We need to extract JSON from that text
   * and convert it into TypeScript objects we can work with.
   */
  protected async parseResponse(
    response: string,
    context: AgentContext
  ): Promise<DocumentParserOutput> {
    // Extract JSON from the response
    const parsed = this.extractJSON<{
      title: string;
      sections: any[];
    }>(response);

    if (!parsed || !parsed.sections) {
      throw new Error('Failed to parse document structure from AI response');
    }

    // Convert to our DocumentStructure format
    const sections: DocumentSection[] = parsed.sections.map((section: any, index: number) => ({
      id: section.id || `section-${index + 1}`,
      title: section.title || 'Untitled Section',
      content: section.content || '',
      level: section.level || 1,
      subsections: section.subsections || [],
    }));

    return {
      title: parsed.title || 'Untitled Document',
      sections,
      metadata: {
        wordCount: context.metadata?.extractedText?.split(/\s+/).length || 0,
      },
      rawText: context.metadata?.extractedText || '',
      extractedAt: new Date(),
    };
  }

  /**
   * Calculate confidence based on how well-structured the result is
   */
  protected async calculateConfidence(
    data: DocumentParserOutput,
    context: AgentContext
  ): Promise<number> {
    let score = 0.5; // Base score

    // Has a title? +0.1
    if (data.title && data.title !== 'Untitled Document') {
      score += 0.1;
    }

    // Has multiple sections? +0.2
    if (data.sections.length > 1) {
      score += 0.2;
    }

    // Sections have content? +0.2
    const sectionsWithContent = data.sections.filter(s => s.content.length > 50);
    if (sectionsWithContent.length > 0) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }
}

/**
 * HELPER FUNCTION: Extract text from PDF
 * 
 * This is NOT an agent - it's just a utility function to read PDFs.
 * We use the 'pdf-parse' library for this.
 * 
 * LEARNING NOTE:
 * Not everything needs to be an agent! Use agents when you need:
 * - Decision making
 * - Understanding context
 * - Generating creative content
 * 
 * Use regular code when you need:
 * - File I/O
 * - Data transformation
 * - Math calculations
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // Dynamic import to avoid issues if pdf-parse not installed yet
    const fs = await import('fs');
    const path = await import('path');
    const pdfParse = await import('pdf-parse');

    const dataBuffer = fs.readFileSync(filePath);
    // pdf-parse exports as callable module, use type assertion for TS
    const data = await (pdfParse as any)(dataBuffer);

    return data.text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error(`Failed to extract text from PDF: ${error}`);
  }
}

/**
 * HELPER FUNCTION: Extract text from plain text files
 */
export async function extractTextFromFile(filePath: string): Promise<string> {
  const fs = await import('fs');
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * MAIN ENTRY POINT: Parse any document
 * 
 * This is the function you'll call from your UI or tests.
 */
export async function parseDocument(
  filePath: string,
  fileName: string,
  fileType: 'pdf' | 'txt' | 'markdown'
): Promise<AgentResult<DocumentParserOutput>> {
  // Step 1: Extract raw text based on file type
  let extractedText: string;

  if (fileType === 'pdf') {
    extractedText = await extractTextFromPDF(filePath);
  } else {
    extractedText = await extractTextFromFile(filePath);
  }

  console.log(`📄 Extracted ${extractedText.length} characters from ${fileName}`);

  // Step 2: Use the agent to analyze structure
  const agent = new DocumentParserAgent();

  const result = await agent.execute({
    input: { filePath, fileName, fileType },
    metadata: { extractedText },
  });

  return result;
}
