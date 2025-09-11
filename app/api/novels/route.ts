import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { db, novel, insertNovelSchema } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const rows = await db
      .select()
      .from(novel)
      .where(eq(novel.userId, session.user.id))
      .orderBy(desc(novel.updatedAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('[NOVELS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await req.json();
    const body = insertNovelSchema.parse({ ...json, userId: session.user.id });

    const [created] = await db
      .insert(novel)
      .values({
        title: body.title,
        description: body.description ?? '',
        genre: body.genre ?? [],
        status: body.status ?? 'draft',
        coverImageUrl: body.coverImageUrl ?? '',
        userId: body.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('[NOVELS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
