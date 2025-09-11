import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { and, eq } from 'drizzle-orm';
import { db, novel, novelDocument, documentVersion, insertNovelDocumentSchema } from '@/lib/db';

export const runtime = 'nodejs';

type Params = {
  params: {
    novelId: string;
    docId: string;
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

    const [doc] = await db
      .select()
      .from(novelDocument)
      .where(and(eq(novelDocument.id, params.docId), eq(novelDocument.novelId, params.novelId)))
      .limit(1);

    if (!doc) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    console.error('[DOC_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
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

    const payload = await req.json();
    // Allow partial update of document fields: title, content, metadata
    const partialSchema = insertNovelDocumentSchema.pick({ title: true, content: true, metadata: true }).partial();
    const update = partialSchema.parse(payload);

    // Fetch current document
    const [current] = await db
      .select()
      .from(novelDocument)
      .where(and(eq(novelDocument.id, params.docId), eq(novelDocument.novelId, params.novelId)))
      .limit(1);

    if (!current) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Save current state as a version snapshot
    await db.insert(documentVersion).values({
      documentId: current.id,
      version: current.version,
      content: current.content ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Prepare next version and apply update
    const nextVersion = current.version + 1;

    const [updated] = await db
      .update(novelDocument)
      .set({
        title: update.title ?? current.title,
        content: update.content ?? current.content,
        metadata: update.metadata ?? current.metadata,
        version: nextVersion,
        isCurrent: true,
        previousVersionId: current.id,
        updatedAt: new Date(),
      })
      .where(and(eq(novelDocument.id, params.docId), eq(novelDocument.novelId, params.novelId)))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[DOC_UPDATE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
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

    const result = await db
      .delete(novelDocument)
      .where(and(eq(novelDocument.id, params.docId), eq(novelDocument.novelId, params.novelId)))
      .returning({ id: novelDocument.id });

    if (!result.length) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[DOC_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
