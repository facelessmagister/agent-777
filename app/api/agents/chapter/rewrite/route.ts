import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import type { NextApiRequest, NextApiResponse } from 'next/types';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db, novelDocument } from '@/lib/db';

export const runtime = 'nodejs';

const schema = z.object({
  novelId: z.string().uuid(),
  docId: z.string().uuid(),
  sectionTitle: z.string().min(1),
  newText: z.string().min(1),
  note: z.string().optional(),
});

function heading(text: string, level = 3) {
  return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] } as any;
}
function paragraph(text: string) {
  return { type: 'paragraph', content: text ? [{ type: 'text', text }] : [] } as any;
}

export async function POST(req: Request) {
  try {
    const sessionReq = { headers: Object.fromEntries((req as any).headers.entries()), method: (req as any).method, url: (req as any).url } as unknown as NextApiRequest;
    const sessionRes = { setHeader: () => {}, status: () => ({ json: () => {} }) } as unknown as NextApiResponse;
    const session = await getServerSession(sessionReq, sessionRes);
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    const json = await req.json();
    const { novelId, docId, sectionTitle, newText, note } = schema.parse(json);

    const [doc] = await db
      .select()
      .from(novelDocument)
      .where(and(eq(novelDocument.id, docId), eq(novelDocument.novelId, novelId), eq(novelDocument.userId, session.user.id)))
      .limit(1);
    if (!doc) return new NextResponse('Not Found', { status: 404 });

    const current = (doc.content as any) ?? { type: 'doc', content: [] };
    const next = {
      ...current,
      content: [
        ...(current.content ?? []),
        heading(`Rewritten — ${sectionTitle}`),
        paragraph(newText),
        ...(note ? [paragraph(note)] : []),
      ],
    };

    const [updated] = await db
      .update(novelDocument)
      .set({ content: next, updatedAt: new Date(), version: (doc.version ?? 1) + 1 })
      .where(and(eq(novelDocument.id, docId), eq(novelDocument.novelId, novelId), eq(novelDocument.userId, session.user.id)))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[AGENT_CHAPTER_REWRITE]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
