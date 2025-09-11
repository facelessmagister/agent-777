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
  synopsis: z.string().default(''),
  scenes: z.array(z.object({ title: z.string(), summary: z.string().default('') })).default([]),
});

function pmDoc(children: any[] = []) { return { type: 'doc', content: children }; }
function heading(text: string, level = 2) { return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] }; }
function paragraph(text: string) { return { type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }; }
function sceneBlock(title: string, content: string) { return [heading(title, 3), paragraph(content)]; }

export async function POST(req: Request) {
  try {
    const sessionReq = { headers: Object.fromEntries((req as any).headers.entries()), method: (req as any).method, url: (req as any).url } as unknown as NextApiRequest;
    const sessionRes = { setHeader: () => {}, status: () => ({ json: () => {} }) } as unknown as NextApiResponse;
    const session = await getServerSession(sessionReq, sessionRes);
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    const json = await req.json();
    const { novelId, title, synopsis, scenes } = schema.parse(json);

    const [owned] = await db.select({ id: novel.id }).from(novel).where(and(eq(novel.id, novelId), eq(novel.userId, session.user.id))).limit(1);
    if (!owned) return new NextResponse('Not Found', { status: 404 });

    const content = pmDoc([
      heading(title, 2),
      heading('Synopsis', 3),
      paragraph(synopsis),
      ...scenes.flatMap((s) => sceneBlock(s.title, s.summary)),
    ]);

    const [doc] = await db
      .insert(novelDocument)
      .values({
        novelId,
        type: 'chapter',
        title,
        content,
        metadata: { kind: 'chapter-draft' },
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
    console.error('[AGENT_CHAPTER_CREATE]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
