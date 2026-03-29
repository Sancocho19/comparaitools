import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: false,
    message: 'Trending articles were merged into /api/auto-generate. Use the same cron endpoint there.',
  }, { status: 410 });
}
