import { useState, useEffect } from 'react';

/**
 * Probes AI availability on mount.
 * - Development: checks Ollama on localhost:11434 (3s timeout)
 * - Production:  the /api/ai Groq proxy is always available — returns true immediately
 */
export function useOllamaStatus(): { isOnline: boolean | null } {
  const [isOnline, setIsOnline] = useState<boolean | null>(
    import.meta.env.DEV ? null : true,  // prod → always online
  );

  useEffect(() => {
    if (!import.meta.env.DEV) return;   // no probe needed in prod

    let cancelled = false;
    const ctrl = new AbortController();
    const timerId = setTimeout(() => ctrl.abort(), 3000);

    fetch('http://localhost:11434/api/tags', { signal: ctrl.signal })
      .then(res => { if (!cancelled) setIsOnline(res.ok); })
      .catch(() => { if (!cancelled) setIsOnline(false); })
      .finally(() => clearTimeout(timerId));

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, []);

  return { isOnline };
}
