import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { ChapterCreateSchema } from '@/lib/validations/novel';
import type { NextRequest } from 'next/server';
import { and, eq, desc } from 'drizzle-orm';
import { db, novel, novelDocument } from '@/lib/db';

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

    // Fetch chapter documents
    const docs = await db
      .select()
      .from(novelDocument)
      .where(and(eq(novelDocument.novelId, params.novelId), eq(novelDocument.type, 'chapter')))
      .orderBy(desc(novelDocument.updatedAt));

    // Map to previous chapter shape (fields from metadata)
    const chapters = await Promise.all(
      docs.map(async (d) => {
        return {
          id: d.id,
          number: (d.metadata as any)?.number ?? null,
          title: d.title,
          status: (d.metadata as any)?.status ?? 'draft',
          position: (d.metadata as any)?.position ?? 0,
          updatedAt: d.updatedAt,
          document: {
            content: d.content ?? {},
            version: d.version,
          },
        };
      })
    );

    return NextResponse.json(chapters);
  } catch (error) {
    console.error('[CHAPTERS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await req.json();
    const { title, summary, position } = ChapterCreateSchema.parse(json);

    // Ensure the novel belongs to the user
    const [owned] = await db
      .select({ id: novel.id })
      .from(novel)
      .where(and(eq(novel.id, params.novelId), eq(novel.userId, session.user.id)))
      .limit(1);

    if (!owned) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Next chapter number
    const existing = await db
      .select({ id: novelDocument.id })
      .from(novelDocument)
      .where(and(eq(novelDocument.novelId, params.novelId), eq(novelDocument.type, 'chapter')));
    const chapterNumber = existing.length + 1;

    // Create the chapter document
    const [doc] = await db
      .insert(novelDocument)
      .values({
        novelId: params.novelId,
        type: 'chapter',
        title,
        content: {},
        metadata: { summary: summary || '', position: position ?? 0, number: chapterNumber, status: 'draft' },
        version: 1,
        isCurrent: true,
        previousVersionId: null,
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        id: doc.id,
        number: (doc.metadata as any)?.number ?? chapterNumber,
        title: doc.title,
        status: (doc.metadata as any)?.status ?? 'draft',
        position: (doc.metadata as any)?.position ?? 0,
        updatedAt: doc.updatedAt,
        document: {
          content: doc.content ?? {},
          version: doc.version,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[CHAPTERS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

