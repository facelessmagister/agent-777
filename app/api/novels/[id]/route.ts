import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { db, novel, insertNovelSchema } from '@/lib/db';
import { and, eq } from 'drizzle-orm';

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const [row] = await db
      .select()
      .from(novel)
      .where(and(eq(novel.id, params.id), eq(novel.userId, session.user.id)))
      .limit(1);

    if (!row) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.json({ success: true, data: row });
  } catch (error) {
    console.error('[NOVEL_GET]', error);
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
    const updateData = insertNovelSchema.partial().parse(json);

    const [updated] = await db
      .update(novel)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(novel.id, params.id), eq(novel.userId, session.user.id)))
      .returning();

    if (!updated) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[NOVEL_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const result = await db
      .delete(novel)
      .where(and(eq(novel.id, params.id), eq(novel.userId, session.user.id)))
      .returning({ id: novel.id });

    if (!result.length) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[NOVEL_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
