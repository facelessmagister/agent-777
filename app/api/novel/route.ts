import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEPRECATION_BODY = {
  success: false,
  error: 'This endpoint is deprecated. Use /api/novels and /api/novels/[id] instead.'
};

export async function GET() {
  return new NextResponse(JSON.stringify(DEPRECATION_BODY), { status: 410 });
}

export async function POST() {
  return new NextResponse(JSON.stringify(DEPRECATION_BODY), { status: 410 });
}

export async function PUT() {
  return new NextResponse(JSON.stringify(DEPRECATION_BODY), { status: 410 });
}
