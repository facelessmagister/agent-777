import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEPRECATION_BODY = {
  success: false,
  error: 'This endpoint is deprecated. Use /api/novels/[novelId]/documents instead.'
};

export async function POST() {
  return new NextResponse(JSON.stringify(DEPRECATION_BODY), { status: 410 });
}
