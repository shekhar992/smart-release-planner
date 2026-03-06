/**
 * AICommandBar
 *
 * Persistent natural-language command bar that lives in the main toolbar
 * (Option B: always visible, centered).
 *
 * Features:
 *  - Suggestion chips on focus
 *  - Loading state during LLM call
 *  - Floating result card with severity colour
 *  - Keyboard: Enter to submit, Escape to clear
 */

import { useState, useRef } from 'react';
import { Sparkles, X, Loader2, ArrowRight } from 'lucide-react';
import type { Release, TeamMember } from '../data/mockData';
import { processCommand, type CommandResult, type Severity } from '../lib/aiCommandProcessor';

// ── Styled helpers ─────────────────────────────────────────────────────────

const SEVERITY_CARD: Record<Severity, string> = {
  green:  'border-emerald-200 bg-emerald-50/90 dark:border-emerald-800 dark:bg-emerald-950/40',
  yellow: 'border-amber-200 bg-amber-50/90 dark:border-amber-800 dark:bg-amber-950/40',
  red:    'border-red-200 bg-red-50/90 dark:border-red-800 dark:bg-red-950/40',
};

const SEVERITY_DOT: Record<Severity, string> = {
  green:  'bg-emerald-500',
  yellow: 'bg-amber-500',
  red:    'bg-red-500',
};

const SEVERITY_TEXT: Record<Severity, string> = {
  green:  'text-slate-800 dark:text-slate-200',
  yellow: 'text-amber-900 dark:text-amber-200',
  red:    'text-red-900 dark:text-red-200',
};

const SUGGESTIONS = [
  "Who's most overloaded?",
  'What are the main risks?',
  'Any unassigned tickets?',
  'How is Sprint 1 looking?',
];

// ── Component ─────────────────────────────────────────────────────────────

interface AICommandBarProps {
  release:     Release;
  teamMembers: TeamMember[];
}

export function AICommandBar({ release, teamMembers }: AICommandBarProps) {
  const [query,   setQuery]   = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<CommandResult | null>(null);
  const [focused, setFocused] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Core query runner ──────────────────────────────────────────────────

  const runQuery = async (text: string) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setFocused(false);

    try {
      const res = await processCommand(text.trim(), release, teamMembers);
      setResult(res);
    } catch {
      setError('Could not reach AI. Is Ollama running?');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => runQuery(query);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
    if (e.key === 'Escape') { setFocused(false); setResult(null); setQuery(''); }
  };

  const handleSuggestion = (s: string) => {
    setQuery(s);
    setFocused(false);
    runQuery(s);
  };

  const handleClear = () => {
    setQuery('');
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  };

  // ── Derived ────────────────────────────────────────────────────────────

  const severity: Severity = result?.severity ?? 'green';
  const showSuggestions    = focused && !result && !loading && !query;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full max-w-xs">
      {/* ── Input ──────────────────────────────────────────────────────── */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-150 ${
          focused
            ? 'border-blue-400 bg-white dark:bg-slate-800 shadow-md shadow-blue-500/10 ring-1 ring-blue-400/30'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
        )}

        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 160)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI about this release…"
          className="flex-1 min-w-0 bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
          disabled={loading}
        />

        {query && !loading && (
          <button
            onClick={handleClear}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="Clear"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {query && !loading && (
          <button
            onClick={handleSubmit}
            className="flex-shrink-0 p-1 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors shadow-sm"
            title="Ask"
          >
            <ArrowRight className="w-3 h-3 text-white" />
          </button>
        )}
      </div>

      {/* ── Suggestion chips ───────────────────────────────────────────── */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[100] py-1 overflow-hidden">
          <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Try asking…
          </p>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onMouseDown={e => { e.preventDefault(); handleSuggestion(s); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 opacity-70" />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Result card ────────────────────────────────────────────────── */}
      {result && (
        <div
          className={`absolute top-full left-0 right-0 mt-1.5 border rounded-xl shadow-xl z-[100] p-3 ${SEVERITY_CARD[severity]}`}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${SEVERITY_DOT[severity]}`} />
              <p className={`text-sm font-semibold ${SEVERITY_TEXT[severity]}`}>
                {result.headline}
              </p>
            </div>
            <button
              onClick={() => { setResult(null); setQuery(''); }}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 ml-4 leading-relaxed">
            {result.summary}
          </p>

          {result.bullets.length > 0 && (
            <ul className="mt-2 ml-4 space-y-1">
              {result.bullets.map((b, i) => (
                <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                  <span className="text-slate-400 mt-0.5 flex-shrink-0">•</span>
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Error state ────────────────────────────────────────────────── */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1.5 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 rounded-xl shadow-xl z-[100] p-3 flex items-center gap-2">
          <span className="text-red-500 text-sm flex-shrink-0">⚠</span>
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
