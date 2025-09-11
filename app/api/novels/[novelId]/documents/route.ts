import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { and, desc, eq } from 'drizzle-orm';
import { db, novel, novelDocument, insertNovelDocumentSchema } from '@/lib/db';

export const runtime = 'nodejs';

type Params = {
  params: {
    novelId: string;
  };
};

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Ensure the novel belongs to the user
    const [owned] = await db
      .select({ id: novel.id })
      .from(novel)
      .where(and(eq(novel.id, params.novelId), eq(novel.userId, session.user.id)))
      .limit(1);

    if (!owned) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const docs = await db
      .select()
      .from(novelDocument)
      .where(eq(novelDocument.novelId, params.novelId))
      .orderBy(desc(novelDocument.updatedAt));

    return NextResponse.json({ success: true, data: docs });
  } catch (error) {
    console.error('[DOCS_LIST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Ensure the novel belongs to the user
    const [owned] = await db
      .select({ id: novel.id })
      .from(novel)
      .where(and(eq(novel.id, params.novelId), eq(novel.userId, session.user.id)))
      .limit(1);

    if (!owned) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const json = await req.json();
    const body = insertNovelDocumentSchema.parse({ ...json, novelId: params.novelId, userId: session.user.id });

    const [created] = await db
      .insert(novelDocument)
      .values({
        novelId: body.novelId,
        type: body.type,
        title: body.title,
        content: body.content ?? {},
        metadata: body.metadata ?? {},
        version: 1,
        isCurrent: true,
        previousVersionId: null,
        userId: body.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('[DOCS_CREATE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
