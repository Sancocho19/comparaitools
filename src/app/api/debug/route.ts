import { NextRequest, NextResponse } from 'next/server';
import { getManifest, getGenerationState } from '@/lib/kv-storage';
import { getAllTools, getPendingTools } from '@/lib/tools-storage';

export const runtime = 'nodejs';

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return request.headers.get('authorization') === `Bearer ${expected}` || request.nextUrl.searchParams.get('secret') === expected;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [manifest, state, tools, pending] = await Promise.all([
    getManifest(),
    getGenerationState(),
    getAllTools(),
    getPendingTools(),
  ]);

  return NextResponse.json({
    ok: true,
    toolCount: tools.length,
    pendingCount: pending.length,
    publishedCount: manifest.length,
    lastRunAt: state.lastRunAt,
    totalGenerated: state.totalGenerated,
    recentPosts: manifest.slice(-5).reverse(),
  });
}
