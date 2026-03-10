/**
 * 🌉 PRD Agent Bridge
 * 
 * This file connects your React UI to the AI agents in playground/
 * Think of it as a translator between the UI world and AI world
 * 
 * Flow:
 * 1. User uploads file → We read it
 * 2. We send text to AI agents → They process it
 * 3. AI returns tickets → We convert to app format
 * 4. Auto-assign to team members → Round-robin by role
 * 5. UI receives tickets → User reviews and imports
 */

import { Ticket, TeamMember } from '../data/mockData';
import { addDays } from 'date-fns';
import { autoAssignTickets } from './autoAssignmentService';
import { AI_ENDPOINT } from './aiEndpoint';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Point pdfjs at the bundled worker so it doesn't try to fetch a CDN copy
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).href;

/**
 * Progress callback type - so UI can show what's happening
 */
export interface ProcessingProgress {
  stage: 'reading' | 'parsing' | 'extracting' | 'generating' | 'complete' | 'error';
  percent: number;
  message: string;
}

/**
 * Result from AI processing
 */
export interface PRDProcessingResult {
  success: boolean;
  tickets: Ticket[];
  error?: string;
  metadata?: {
    totalRequirements: number;
    totalStoryPoints: number;
    processingTime: number;
  };
}

/**
 * Read file content as plain text.
 * Supports: .txt, .md  → native FileReader
 *           .pdf        → pdfjs-dist (text-layer extraction, fails gracefully on scanned docs)
 *           .docx       → mammoth (Word → plain text)
 */
export async function readFileAsText(file: File): Promise<string> {
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

  // ── Word (.docx) ───────────────────────────────────────────────────────
  if (ext === '.docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (!result.value) throw new Error('Could not extract text from Word document');
    return result.value;
  }

  // ── PDF ────────────────────────────────────────────────────────────────
  if (ext === '.pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      pages.push(pageText);
    }
    const text = pages.join('\n\n');
    if (!text.trim()) {
      throw new Error(
        'No text found in PDF. Scanned/image-only PDFs are not supported — please copy the text into a .txt file instead.',
      );
    }
    return text;
  }

  // ── Plain text (.txt, .md) ─────────────────────────────────────────────
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Simple AI ticket generator (using same logic as lesson-4)
 * Enhanced with role classification
 * 
 * This calls Ollama locally to generate tickets with required roles
 */
async function generateTicketsFromText(
  prdText: string,
  onProgress: (progress: ProcessingProgress) => void
): Promise<Ticket[]> {
  
  // Stage 1: Extract requirements
  onProgress({
    stage: 'extracting',
    percent: 30,
    message: 'Extracting requirements from PRD...'
  });

  const requirementsResponse = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      messages: [
        {
          role: 'system',
          content: 'You extract requirements. Output format: ["req1", "req2"]'
        },
        {
          role: 'user',
          content: `List main requirements from this PRD:\n\n${prdText.substring(0, 3000)}\n\nJSON array only:`
        }
      ],
      stream: false,
      options: { temperature: 0.2 }
    })
  });

  const reqData = await requirementsResponse.json();
  let reqContent = reqData.message.content;
  reqContent = reqContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  
  let requirements: string[];
  try {
    requirements = JSON.parse(reqContent);
  } catch {
    const match = reqContent.match(/\[[\s\S]*?\]/);
    requirements = match ? JSON.parse(match[0]) : [];
  }

  onProgress({
    stage: 'generating',
    percent: 60,
    message: `Generating tickets from ${requirements.length} requirements...`
  });

  // Stage 2: Generate tickets (process first 5 for prototype)
  const tickets: Ticket[] = [];
  const batch = requirements.slice(0, Math.min(5, requirements.length));

  for (let i = 0; i < batch.length; i++) {
    const requirement = batch[i];
    
    const ticketResponse = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        messages: [
          {
            role: 'system',
            content: 'You are a JIRA ticket generator. Classify each ticket by required role. Output only JSON.'
          },
          {
            role: 'user',
            content: `Requirement: "${requirement}"

Classify this as Frontend, Backend, Fullstack, QA, or Designer based on the work needed.

Example:
{"title": "Implement user dashboard", "description": "Create dashboard with widgets", "storyPoints": 5, "requiredRole": "Frontend"}

Generate ticket (JSON only):`
          }
        ],
        stream: false,
        options: { temperature: 0.4 }
      })
    });

    const ticketData = await ticketResponse.json();
    let ticketContent = ticketData.message.content;
    ticketContent = ticketContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let aiTicket: any;
    try {
      aiTicket = JSON.parse(ticketContent);
    } catch {
      const match = ticketContent.match(/\{[\s\S]*?\}/);
      aiTicket = match ? JSON.parse(match[0]) : {
        title: requirement.substring(0, 80),
        storyPoints: 3,
        description: requirement
      };
    }

    // Convert AI ticket to app's Ticket format
    // Calculate end date based on story points (1 SP = 0.5 days)
    const durationDays = (aiTicket.storyPoints || 3) * 0.5;
    const ticket: Ticket = {
      id: `ai-${Date.now()}-${i}`,
      title: aiTicket.title || requirement,
      description: aiTicket.description || requirement,
      storyPoints: aiTicket.storyPoints || 3,
      effortDays: durationDays,
      status: 'planned',
      startDate: new Date(),
      endDate: addDays(new Date(), durationDays),
      assignedTo: '', // Will be auto-assigned based on team
      requiredRole: aiTicket.requiredRole || 'Fullstack', // Default to Fullstack if not classified
      dependencies: {},
    };

    tickets.push(ticket);

    // Update progress
    const progress = 60 + (i + 1) / batch.length * 30;
    onProgress({
      stage: 'generating',
      percent: Math.round(progress),
      message: `Generated ${i + 1}/${batch.length} tickets...`
    });
  }

  onProgress({
    stage: 'complete',
    percent: 100,
    message: `Complete! Generated ${tickets.length} tickets`
  });

  return tickets;
}

/**
 * Main function: Process PRD file and return tickets
 * 
 * This is what your UI component will call!
 */
export async function processPRDFile(
  file: File,
  teamMembers: TeamMember[],
  onProgress: (progress: ProcessingProgress) => void
): Promise<PRDProcessingResult> {
  const startTime = Date.now();

  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File too large (max 10MB)');
    }

    // Check file type
    const validTypes = ['.txt', '.md', '.pdf', '.docx'];
    const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validTypes.includes(fileExt)) {
      throw new Error('Invalid file type. Supported: .txt, .md, .pdf, .docx');
    }

    // Stage 1: Read file
    onProgress({
      stage: 'reading',
      percent: 10,
      message: 'Reading document...'
    });

    const prdText = await readFileAsText(file);

    if (!prdText || prdText.length < 100) {
      throw new Error('Document too short or empty');
    }

    onProgress({
      stage: 'parsing',
      percent: 20,
      message: `Analyzing ${(prdText.length / 1000).toFixed(1)}KB of text...`
    });

    // Stage 2-3: Process with AI
    let tickets = await generateTicketsFromText(prdText, onProgress);

    // Stage 4: Auto-assign to team members (if team provided)
    if (teamMembers && teamMembers.length > 0) {
      onProgress({
        stage: 'generating',
        percent: 95,
        message: 'Assigning tickets to team members...'
      });
      
      tickets = autoAssignTickets(tickets, teamMembers);
    }

    // Calculate metadata
    const totalStoryPoints = tickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const processingTime = Date.now() - startTime;

    return {
      success: true,
      tickets,
      metadata: {
        totalRequirements: tickets.length,
        totalStoryPoints,
        processingTime
      }
    };

  } catch (error: any) {
    onProgress({
      stage: 'error',
      percent: 0,
      message: error.message || 'Processing failed'
    });

    return {
      success: false,
      tickets: [],
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Check if Ollama is running and model is available
 */
export async function checkAgentAvailability(): Promise<{
  available: boolean;
  message: string;
}> {
  try {
    // In production the /api/ai Groq proxy is always reachable
    if (!import.meta.env.DEV) {
      return { available: true, message: 'AI agent ready (Groq)' };
    }

    const response = await fetch('http://localhost:11434/api/tags', { method: 'GET' });
    if (!response.ok) {
      return { available: false, message: 'Ollama not responding. Is it running?' };
    }
    const data = await response.json();
    const hasModel = data.models?.some((m: any) => m.name.includes('llama3.2:3b'));
    if (!hasModel) {
      return { available: false, message: 'Model llama3.2:3b not found. Run: ollama pull llama3.2:3b' };
    }
    return { available: true, message: 'AI agent ready' };

  } catch {
    return {
      available: false,
      message: 'Cannot connect to Ollama. Start it with: brew services start ollama'
    };
  }
}
