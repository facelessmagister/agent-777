import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import type { NextApiRequest, NextApiResponse } from 'next/types';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db, novel, novelDocument } from '@/lib/db';

export const runtime = 'nodejs';

const schema = z.object({
  novelId: z.string().uuid(),
  title: z.string().min(1),
  premise: z.string().default(''),
  acts: z.number().int().min(1).max(5).default(3),
  keyBeats: z.array(z.string()).default([]),
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
    const { novelId, title, premise, acts, keyBeats } = schema.parse(json);

    const [owned] = await db.select({ id: novel.id }).from(novel).where(and(eq(novel.id, novelId), eq(novel.userId, session.user.id))).limit(1);
    if (!owned) return new NextResponse('Not Found', { status: 404 });

    const actHeadings = Array.from({ length: acts }).map((_, i) => heading(`Act ${i + 1}`, 3));
    const content = pmDoc([
      heading(`${title} — Plot Outline`, 2),
      heading('Premise', 3),
      paragraph(premise),
      heading('Key Beats', 3),
      bulletList(keyBeats),
      ...actHeadings,
    ]);

    const [doc] = await db
      .insert(novelDocument)
      .values({
        novelId,
        type: 'world',
        title: `${title} — Plot Outline`,
        content,
        metadata: { kind: 'plot-outline', acts },
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
    console.error('[AGENT_PLOT_CREATE]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
