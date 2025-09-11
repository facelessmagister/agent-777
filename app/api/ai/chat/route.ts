import { NextResponse } from 'next/server';
import { streamText, smoothStream } from 'ai';
import { myProvider } from '@/lib/ai/providers';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { messages, novelId } = await req.json();
    const userMessage: string = Array.isArray(messages)
      ? String(messages.map((m: any) => m.content).join('\n'))
      : String(messages || '');

    // Simple intent routing for creation actions
    const lower = userMessage.toLowerCase();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';

    // Helper to forward cookies/headers for auth
    const forwardHeaders: HeadersInit = {};
    // Try to forward cookies from the incoming request for session
    const cookie = (req as any)?.headers?.get?.('cookie');
    if (cookie) (forwardHeaders as any).cookie = cookie;

    try {
      if (novelId && lower.includes('create character')) {
        // naive parse: look for name: "..."
        const nameMatch = userMessage.match(/name\s*:\s*"([^"]+)"/i) || userMessage.match(/character\s+named\s+([A-Za-z0-9_-]+)/i);
        const roleMatch = userMessage.match(/role\s*:\s*"([^"]+)"/i);
        const name = nameMatch ? (nameMatch[1] || nameMatch[0].split(' ').pop()) : 'Unnamed Character';
        const role = roleMatch ? roleMatch[1] : 'protagonist';
        const res = await fetch(`${baseUrl}/api/agents/character/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...forwardHeaders },
          body: JSON.stringify({ novelId, name, role, traits: [], goals: [], flaws: [], backstory: '', relationships: [] }),
        });
        if (res.ok) {
          const data = await res.json();
          const msg = `Created character “${data.data?.title}”. Open: /novels/${novelId}/documents/${data.data?.id}`;
          const stream = new ReadableStream({
            start(controller) {
              const encoder = new TextEncoder();
              controller.enqueue(encoder.encode(msg));
              controller.close();
            },
          });
          return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' } });
        }
      }

      if (novelId && (lower.includes('create plot') || lower.includes('plot outline'))) {
        const titleMatch = userMessage.match(/title\s*:\s*"([^"]+)"/i);
        const actsMatch = userMessage.match(/acts?\s*:\s*(\d+)/i);
        const title = titleMatch ? titleMatch[1] : 'Plot Outline';
        const acts = actsMatch ? Number(actsMatch[1]) : 3;
        const res = await fetch(`${baseUrl}/api/agents/plot/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...forwardHeaders },
          body: JSON.stringify({ novelId, title, premise: '', acts, keyBeats: [] }),
        });
        if (res.ok) {
          const data = await res.json();
          const msg = `Created plot outline “${data.data?.title}”. Open: /novels/${novelId}/documents/${data.data?.id}`;
          const stream = new ReadableStream({
            start(controller) {
              const encoder = new TextEncoder();
              controller.enqueue(encoder.encode(msg));
              controller.close();
            },
          });
          return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' } });
        }
      }

      if (novelId && lower.includes('create chapter')) {
        const titleMatch = userMessage.match(/title\s*:\s*"([^"]+)"/i);
        const title = titleMatch ? titleMatch[1] : 'Chapter Draft';
        const res = await fetch(`${baseUrl}/api/agents/chapter/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...forwardHeaders },
          body: JSON.stringify({ novelId, title, synopsis: '', scenes: [] }),
        });
        if (res.ok) {
          const data = await res.json();
          const msg = `Created chapter “${data.data?.title}”. Open: /novels/${novelId}/documents/${data.data?.id}`;
          const stream = new ReadableStream({
            start(controller) {
              const encoder = new TextEncoder();
              controller.enqueue(encoder.encode(msg));
              controller.close();
            },
          });
          return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' } });
        }
      }
    } catch (e) {
      // fall through to chat streaming if routing fails
      console.warn('Intent routing failed, streaming chat fallback.', e);
    }

    const { textStream } = await streamText({
      model: myProvider.languageModel('chat-model'),
      system: 'You are a helpful writing assistant for novel creation. Provide concise, constructive responses and ask clarifying questions when helpful.',
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: userMessage,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const reader = textStream.getReader();
        const encoder = new TextEncoder();
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) controller.enqueue(encoder.encode(value));
          }
        } catch (err) {
          console.error('Chat stream error:', err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[AI_CHAT_POST]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
