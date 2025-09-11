import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { ChapterUpdateSchema } from '@/lib/validations/novel';
import type { NextRequest } from 'next/server';
import { and, eq, desc } from 'drizzle-orm';
import { db, novel, novelDocument, documentVersion } from '@/lib/db';

type Params = {
  params: {
    novelId: string;
    chapterId: string;
  };
};

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Ensure ownership of novel
    const [owned] = await db
      .select({ id: novel.id })
      .from(novel)
      .where(and(eq(novel.id, params.novelId), eq(novel.userId, session.user.id)))
      .limit(1);

    if (!owned) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Load chapter document
    const [doc] = await db
      .select()
      .from(novelDocument)
      .where(and(eq(novelDocument.id, params.chapterId), eq(novelDocument.novelId, params.novelId), eq(novelDocument.type, 'chapter')))
      .limit(1);

    if (!doc) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Load recent versions
    const versions = await db
      .select({ id: documentVersion.id, version: documentVersion.version, updatedAt: documentVersion.updatedAt })
      .from(documentVersion)
      .where(eq(documentVersion.documentId, doc.id))
      .orderBy(desc(documentVersion.version))
      .limit(10);

    return NextResponse.json({
      id: doc.id,
      novelId: doc.novelId,
      title: doc.title,
      content: doc.content ?? {},
      version: doc.version,
      metadata: doc.metadata ?? {},
      updatedAt: doc.updatedAt,
      versions,
    });
  } catch (error) {
    console.error('[CHAPTER_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await req.json();
    const { title, summary, position, status } = ChapterUpdateSchema.parse(json);

    // Ensure ownership
    const [owned] = await db
      .select({ id: novel.id })
      .from(novel)
      .where(and(eq(novel.id, params.novelId), eq(novel.userId, session.user.id)))
      .limit(1);
    if (!owned) return new NextResponse('Not Found', { status: 404 });

    // Fetch current document
    const [current] = await db
      .select()
      .from(novelDocument)
      .where(and(eq(novelDocument.id, params.chapterId), eq(novelDocument.novelId, params.novelId), eq(novelDocument.type, 'chapter')))
      .limit(1);
    if (!current) return new NextResponse('Not Found', { status: 404 });

    // Save snapshot
    await db.insert(documentVersion).values({
      documentId: current.id,
      version: current.version,
      content: current.content ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const nextVersion = current.version + 1;
    const nextMetadata = {
      ...(current.metadata as any),
      ...(summary !== undefined ? { summary } : {}),
      ...(position !== undefined ? { position } : {}),
      ...(status !== undefined ? { status } : {}),
    };

    const [updated] = await db
      .update(novelDocument)
      .set({
        title: title ?? current.title,
        metadata: nextMetadata,
        version: nextVersion,
        isCurrent: true,
        previousVersionId: current.id,
        updatedAt: new Date(),
      })
      .where(and(eq(novelDocument.id, params.chapterId), eq(novelDocument.novelId, params.novelId)))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[CHAPTER_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Ensure ownership
    const [owned] = await db
      .select({ id: novel.id })
      .from(novel)
      .where(and(eq(novel.id, params.novelId), eq(novel.userId, session.user.id)))
      .limit(1);
    if (!owned) return new NextResponse('Not Found', { status: 404 });

    // Get current doc to know position
    const [current] = await db
      .select()
      .from(novelDocument)
      .where(and(eq(novelDocument.id, params.chapterId), eq(novelDocument.novelId, params.novelId), eq(novelDocument.type, 'chapter')))
      .limit(1);
    if (!current) return new NextResponse('Not Found', { status: 404 });

    const currentPos = (current.metadata as any)?.position ?? 0;

    // Delete the document (versions cascade)
    await db
      .delete(novelDocument)
      .where(and(eq(novelDocument.id, params.chapterId), eq(novelDocument.novelId, params.novelId)));

    // Reorder remaining chapters: decrement position for those after the deleted one
    const toReorder = await db
      .select()
      .from(novelDocument)
      .where(and(eq(novelDocument.novelId, params.novelId), eq(novelDocument.type, 'chapter')));

    for (const d of toReorder) {
      const pos = (d.metadata as any)?.position ?? 0;
      if (pos > currentPos) {
        const newMeta = { ...(d.metadata as any), position: pos - 1 };
        await db.update(novelDocument).set({ metadata: newMeta, updatedAt: new Date() }).where(eq(novelDocument.id, d.id));
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[CHAPTER_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

