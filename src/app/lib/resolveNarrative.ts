/**
 * Hybrid Narrative Layer — AI analyst commentary on top of the math resolver
 *
 * The math greedy pass produces a guaranteed-correct scheduling plan.
 * This module adds a single streaming Ollama call that interprets that plan
 * into human-readable rationale, risk flags, and a PM recommendation.
 *
 * Architecture intent:
 *   - Math is always the executor   (fast, correct, deterministic)
 *   - LLM is always the narrator    (explains tradeoffs, flags risks)
 *   - LLM never makes scheduling decisions — it only has the final plan
 */

import type { AutoResolveResult } from './autoResolver';
import { AI_ENDPOINT } from './aiEndpoint';

// ─── Prompt builder ────────────────────────────────────────────────────────

function buildPrompt(result: AutoResolveResult): string {
  const {
    resolutions,
    unresolvable,
    sprintSnapshotsBefore,
    sprintSnapshotsAfter,
    devWindowStart,
    devWindowEnd,
  } = result;

  const assigned         = resolutions.filter(r => r.changeType === 'assigned').length;
  const reassigned       = resolutions.filter(r => r.changeType === 'reassigned').length;
  const moved            = resolutions.filter(r => r.changeType === 'moved' || r.changeType === 'reassigned_and_moved').length;

  // Aggregate per-dev utilization across all sprints
  const devMap = new Map<string, { name: string; role: string; before: number[]; after: number[] }>();
  for (let i = 0; i < sprintSnapshotsBefore.length; i++) {
    const snap = sprintSnapshotsBefore[i];
    const snapAfter = sprintSnapshotsAfter[i];
    for (const dc of snap.devCapacities) {
      if (dc.capacityDays === 0) continue;
      if (!devMap.has(dc.devId))
        devMap.set(dc.devId, { name: dc.devName, role: dc.role, before: [], after: [] });
      const entry = devMap.get(dc.devId)!;
      entry.before.push(dc.utilizationPct);
      const afterDc = snapAfter?.devCapacities.find(d => d.devId === dc.devId);
      entry.after.push(afterDc?.utilizationPct ?? dc.utilizationPct);
    }
  }

  const devLines: string[] = [];
  for (const { name, role, before, after } of devMap.values()) {
    const avgBefore = Math.round(before.reduce((s, v) => s + v, 0) / before.length);
    const avgAfter  = Math.round(after.reduce((s, v) => s + v, 0) / after.length);
    const delta     = avgAfter - avgBefore;
    const deltaStr  = delta >= 0 ? `+${delta}%` : `${delta}%`;
    devLines.push(`  ${name} (${role}): ${avgBefore}% → ${avgAfter}% (${deltaStr})`);
  }

  // Notable reassignments (cap at 6 to keep prompt short)
  const notableMoves = resolutions
    .filter(r => r.changeType === 'reassigned' || r.changeType === 'reassigned_and_moved')
    .slice(0, 6)
    .map(r => `  "${r.ticketTitle}" [${r.effortDays}d]: ${r.fromAssignee} → ${r.toAssignee}`);

  const lines = [
    `Dev window: ${devWindowStart.toDateString()} – ${devWindowEnd.toDateString()}`,
    `Tickets resolved: ${resolutions.length} (${assigned} newly assigned, ${reassigned} reassigned, ${moved} sprint-moved)`,
    `Tickets unresolvable: ${unresolvable.length}`,
    '',
    'Team utilization (avg across sprints):',
    ...devLines,
  ];

  if (notableMoves.length > 0) {
    lines.push('', 'Notable reassignments made:');
    lines.push(...notableMoves);
  }

  if (unresolvable.length > 0) {
    lines.push('', 'Tickets requiring manual review:');
    for (const u of unresolvable) {
      lines.push(`  "${u.ticketTitle}" [${u.effortDays}d]: ${u.reason}`);
    }
  }

  return lines.join('\n');
}

// ─── Streaming call ────────────────────────────────────────────────────────

/**
 * Streams an analyst narrative from Ollama based on the resolved plan.
 *
 * Returns an AbortController — call `.abort()` to cancel (e.g. on modal close).
 * Calls onChunk for each streaming token, onDone when complete, onError on failure.
 */
export function streamResolveNarrative(
  result: AutoResolveResult,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (e: unknown) => void,
): AbortController {
  const controller = new AbortController();
  const prompt = buildPrompt(result);

  (async () => {
    try {
      const res = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llama3.2:3b',
          messages: [
            {
              role: 'system',
              content: `You are a release planning analyst. Output ONLY 2-3 risk bullets, nothing else.
Format: each line starts with • and is under 15 words.
Focus only on: tight capacity buffers, unresolvable tickets, devs near 90%, critical path risks.
Use exact names and numbers. No headers. No rationale. No recommendations.`,
            },
            {
              role: 'user',
              content: `Flag risks in this resolution plan:\n\n${prompt}`,
            },
          ],
          stream: true,
          options: { temperature: 0.2, num_predict: 150, num_ctx: 2048 },
        }),
      });

      if (!res.ok) throw new Error(`Ollama responded with HTTP ${res.status}`);
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        for (const line of raw.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const json = JSON.parse(trimmed);
            const chunk: string = json.message?.content ?? '';
            if (chunk) onChunk(chunk);
            if (json.done) { onDone(); return; }
          } catch {
            // partial JSON line from the stream boundary — skip
          }
        }
      }

      onDone();
    } catch (e) {
      if ((e as Error).name !== 'AbortError') onError(e);
    }
  })();

  return controller;
}
