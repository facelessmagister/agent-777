import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import type { NextApiRequest, NextApiResponse } from 'next/types';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db, novel, novelDocument } from '@/lib/db';

export const runtime = 'nodejs';

const schema = z.object({
  novelId: z.string().uuid(),
  name: z.string().min(1),
  role: z.string().default('protagonist'),
  traits: z.array(z.string()).default([]),
  backstory: z.string().default(''),
  goals: z.array(z.string()).default([]),
  flaws: z.array(z.string()).default([]),
  relationships: z.array(z.object({ name: z.string(), relation: z.string() })).default([]),
});

function pmDoc(children: any[] = []) { return { type: 'doc', content: children }; }
function heading(text: string, level = 2) { return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] }; }
function paragraph(text: string) { return { type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }; }
function bulletList(items: string[]) { return { type: 'bullet_list', content: items.map((t) => ({ type: 'list_item', content: [paragraph(t)] })) }; }

export async function POST(req: Request) {
  try {
    const sessionReq = { headers: Object.fromEntries((req as any).headers.entries()), method: (req as any).method, url: (req as any).url } as unknown as NextApiRequest;
    const sessionRes = { setHeader: () => {}, status: () => ({ json: () => {} }) } as unknown as NextApiResponse;
    const session = await getServerSession(sessionReq, sessionRes);
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    const json = await req.json();
    const { novelId, name, role, traits, backstory, goals, flaws, relationships } = schema.parse(json);

    // ownership
    const [owned] = await db.select({ id: novel.id }).from(novel).where(and(eq(novel.id, novelId), eq(novel.userId, session.user.id))).limit(1);
    if (!owned) return new NextResponse('Not Found', { status: 404 });

    const content = pmDoc([
      heading(`${name} — ${role}`, 2),
      heading('Core Traits', 3),
      bulletList(traits),
      heading('Backstory', 3),
      paragraph(backstory),
      heading('Goals', 3),
      bulletList(goals),
      heading('Flaws', 3),
      bulletList(flaws),
      heading('Relationships', 3),
      ...relationships.map((r) => paragraph(`${r.name}: ${r.relation}`)),
    ]);

    const [doc] = await db
      .insert(novelDocument)
      .values({
        novelId,
        type: 'character',
        title: name,
        content,
        metadata: { role },
        version: 1,
        isCurrent: true,
        previousVersionId: null,
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error) {
    console.error('[AGENT_CHARACTER_CREATE]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
