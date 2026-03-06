/**
 * Resolves the AI chat endpoint based on environment:
 *   - Development (npm run dev)  → Ollama on localhost:11434
 *   - Production  (Vercel build) → /api/ai  (Groq proxy)
 *
 * Import AI_ENDPOINT in any file that calls the LLM instead of
 * hardcoding localhost.
 */
export const AI_ENDPOINT = import.meta.env.DEV
  ? 'http://localhost:11434/api/chat'
  : '/api/ai';
