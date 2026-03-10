/**
 * Type Definitions for AI Agent System
 * 
 * These types define the structure of our agents and their outputs.
 * Keep these separate from your main domain types to avoid conflicts.
 */

// ============================================================================
// AGENT TYPES
// ============================================================================

export type AgentStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface AgentConfig {
  name: string;
  description: string;
  model: string; // Ollama model to use (e.g., 'llama3.2:3b')
  temperature?: number; // 0.0 = deterministic, 1.0 = creative
  maxTokens?: number;
}

export interface AgentContext {
  input: any;
  previousResults?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AgentResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  confidence?: number; // 0-1 score
  metadata?: Record<string, any>;
  tokensUsed?: number;
  durationMs?: number;
}

// ============================================================================
// DOCUMENT PROCESSING TYPES
// ============================================================================

export interface UploadedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'markdown' | 'txt';
  size: number;
  uploadedAt: Date;
  path: string;
}

export interface DocumentStructure {
  title: string;
  sections: DocumentSection[];
  metadata: {
    pageCount?: number;
    wordCount?: number;
    authors?: string[];
    version?: string;
  };
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  level: number; // heading level (1-6)
  pageNumber?: number;
  subsections?: DocumentSection[];
}

// ============================================================================
// REQUIREMENTS EXTRACTION TYPES
// ============================================================================

export interface ExtractedRequirement {
  id: string;
  type: 'functional' | 'non-functional' | 'user-story' | 'constraint';
  title: string;
  description: string;
  sourceSection: string; // Which document section it came from
  confidence: number; // 0-1
  priority?: 'high' | 'medium' | 'low';
  actors?: string[]; // User roles involved
  acceptanceCriteria?: string[];
  technicalNotes?: string;
}

export interface UserStory {
  id: string;
  asA: string; // "As a [role]"
  iWant: string; // "I want [feature]"
  soThat: string; // "So that [benefit]"
  acceptanceCriteria: string[];
  sourceRequirement: string; // Links to ExtractedRequirement
  confidence: number;
}

// ============================================================================
// TICKET GENERATION TYPES
// ============================================================================

export interface GeneratedTicket {
  id: string;
  type: 'epic' | 'story' | 'task' | 'bug';
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints?: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  labels: string[];
  
  // Source tracking
  sourceRequirement: string;
  sourceDocument: string;
  confidence: number;
  
  // Relationships
  dependencies: string[]; // IDs of tickets this depends on
  blockedBy: string[]; // IDs of tickets blocking this
  parentTicket?: string; // For stories under epics
  
  // Metadata
  estimatedComplexity?: number; // 1-10
  suggestedAssignee?: string;
  suggestedSprint?: number;
  technicalStack?: string[];
  
  // AI Insights
  riskFactors?: string[];
  similarPastTickets?: string[];
  qualityScore?: number; // 0-1, how complete the ticket is
}

export interface TicketDependency {
  from: string; // ticket ID
  to: string; // ticket ID
  type: 'blocks' | 'requires' | 'related';
  reason: string;
  confidence: number;
}

// ============================================================================
// ORCHESTRATION TYPES
// ============================================================================

export interface OrchestrationPipeline {
  id: string;
  stages: PipelineStage[];
  currentStage: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  results?: Record<string, any>;
}

export interface PipelineStage {
  id: string;
  name: string;
  agent: string; // Agent class name
  status: AgentStatus;
  input?: any;
  output?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface PlaygroundState {
  document: UploadedDocument | null;
  pipeline: OrchestrationPipeline | null;
  requirements: ExtractedRequirement[];
  tickets: GeneratedTicket[];
  dependencies: TicketDependency[];
  selectedTicket: GeneratedTicket | null;
  isProcessing: boolean;
  error: string | null;
}

// ============================================================================
// OLLAMA CLIENT TYPES
// ============================================================================

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaResponse {
  model: string;
  message: OllamaMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaStreamChunk {
  model: string;
  message: { content: string };
  done: boolean;
}
