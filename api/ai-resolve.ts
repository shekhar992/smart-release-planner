// api/ai-resolve.ts  —  Vercel Edge Runtime
// Dedicated endpoint for AI-assisted conflict resolution.
// Unlike /api/ai (which proxies the Ollama shape), this endpoint accepts a
// structured payload and returns structured JSON — no shape translation needed.

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.json();

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: body.messages,
      stream: false,
      temperature: 0,
      max_tokens: body.max_tokens ?? 2048,
      response_format: { type: 'json_object' },
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    return new Response(JSON.stringify({ error: `Groq error: ${err}` }), {
      status: groqRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await groqRes.json();
  const content = data.choices[0]?.message?.content ?? '{}';

  return new Response(content, {
    headers: { 'Content-Type': 'application/json' },
  });
}
