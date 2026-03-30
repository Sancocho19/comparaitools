import { NextRequest, NextResponse } from 'next/server';
import { buildOpportunityQueue, type QueueMode } from '@/lib/topic-planner';

export const runtime = 'nodejs';

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const authHeader = request.headers.get('authorization');
  const urlSecret = request.nextUrl.searchParams.get('secret');

  return authHeader === `Bearer ${expected}` || urlSecret === expected;
}

function parseMode(value: string | null): QueueMode {
  if (value === 'balanced' || value === 'coverage') return value;
  return 'money';
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitParam = Number.parseInt(request.nextUrl.searchParams.get('limit') ?? '40', 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 40;
    const mode = parseMode(request.nextUrl.searchParams.get('mode'));
    const opportunities = buildOpportunityQueue(limit, mode);

    return NextResponse.json({
      success: true,
      mode,
      count: opportunities.length,
      opportunities,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown topic queue error';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
