// api/ai.ts  —  Vercel Edge Runtime
// Accepts Ollama-shaped request bodies, proxies to Groq, returns Ollama-shaped responses.
// Dev traffic never hits this file — it goes directly to localhost:11434 via aiEndpoint.ts.

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.json();
  const isStream = body.stream === true;

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: body.messages,
      stream: isStream,
      temperature: body.options?.temperature ?? 0.3,
      max_tokens: body.options?.num_predict ?? 1024,
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    return new Response(`Groq error: ${err}`, { status: groqRes.status });
  }

  // ── Non-streaming: reshape Groq → Ollama ──────────────────────────────
  if (!isStream) {
    const data = await groqRes.json();
    return Response.json({
      message: { content: data.choices[0]?.message?.content ?? '' },
      done: true,
    });
  }

  // ── Streaming: transform Groq SSE → Ollama NDJSON ────────────────────
  // Groq sends:  data: {"choices":[{"delta":{"content":"chunk"}}]}
  // Ollama sends: {"message":{"content":"chunk"},"done":false}
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') {
          controller.enqueue(
            encoder.encode(JSON.stringify({ message: { content: '' }, done: true }) + '\n'),
          );
          return;
        }
        try {
          const parsed = JSON.parse(payload);
          const content: string = parsed.choices?.[0]?.delta?.content ?? '';
          if (content) {
            controller.enqueue(
              encoder.encode(JSON.stringify({ message: { content }, done: false }) + '\n'),
            );
          }
        } catch {
          // partial SSE line — skip
        }
      }
    },
  });

  return new Response(groqRes.body!.pipeThrough(transformStream), {
    headers: { 'Content-Type': 'application/x-ndjson' },
  });
}
