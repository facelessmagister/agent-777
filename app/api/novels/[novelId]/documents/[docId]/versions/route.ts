import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import type { NextApiRequest, NextApiResponse } from 'next/types';
import { and, desc, eq } from 'drizzle-orm';
import { db, novel, novelDocument, documentVersion } from '@/lib/db';

export const runtime = 'nodejs';

type Params = {
  params: {
    novelId: string;
    docId: string;
  };
};

async function getSession(req: NextRequest) {
  const sessionReq = {
    headers: Object.fromEntries(req.headers.entries()),
    method: req.method,
    url: req.url,
  } as unknown as NextApiRequest;
  const sessionRes = { setHeader: () => {}, status: () => ({ json: () => {} }) } as unknown as NextApiResponse;
  return getServerSession(sessionReq, sessionRes);
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession(req);
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    // Ownership check
    const [owned] = await db
      .select({ id: novel.id })
      .from(novel)
      .where(and(eq(novel.id, params.novelId), eq(novel.userId, session.user.id)))
      .limit(1);
    if (!owned) return new NextResponse('Not Found', { status: 404 });

    // Ensure document exists under that novel
    const [doc] = await db
      .select({ id: novelDocument.id })
      .from(novelDocument)
      .where(and(eq(novelDocument.id, params.docId), eq(novelDocument.novelId, params.novelId)))
      .limit(1);
    if (!doc) return new NextResponse('Not Found', { status: 404 });

    const versions = await db
      .select()
      .from(documentVersion)
      .where(eq(documentVersion.documentId, params.docId))
      .orderBy(desc(documentVersion.version));

    return NextResponse.json({ success: true, data: versions });
  } catch (error) {
    console.error('[VERSIONS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession(req);
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const targetVersion: number | undefined = body?.version;
    if (!targetVersion || typeof targetVersion !== 'number') {
      return NextResponse.json({ success: false, error: 'version is required' }, { status: 400 });
    }

    // Ownership check
    const [owned] = await db
      .select({ id: novel.id })
      .from(novel)
      .where(and(eq(novel.id, params.novelId), eq(novel.userId, session.user.id)))
      .limit(1);
    if (!owned) return new NextResponse('Not Found', { status: 404 });

    const [current] = await db
      .select()
      .from(novelDocument)
      .where(and(eq(novelDocument.id, params.docId), eq(novelDocument.novelId, params.novelId)))
      .limit(1);
    if (!current) return new NextResponse('Not Found', { status: 404 });

    const [ver] = await db
      .select()
      .from(documentVersion)
      .where(and(eq(documentVersion.documentId, params.docId), eq(documentVersion.version, targetVersion)))
      .limit(1);
    if (!ver) return NextResponse.json({ success: false, error: 'Version not found' }, { status: 404 });

    // Save current as version snapshot first
    await db.insert(documentVersion).values({
      documentId: current.id,
      version: current.version,
      content: current.content ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const nextVersion = current.version + 1;

    const [updated] = await db
      .update(novelDocument)
      .set({
        content: ver.content,
        version: nextVersion,
        previousVersionId: current.id,
        updatedAt: new Date(),
      })
      .where(and(eq(novelDocument.id, params.docId), eq(novelDocument.novelId, params.novelId)))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[VERSIONS_RESTORE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
