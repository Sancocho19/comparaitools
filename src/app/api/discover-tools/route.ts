
import { NextRequest, NextResponse } from 'next/server';
import { addPendingTool, approvePendingTool, getAllTools } from '@/lib/tools-storage';
import { discoverCandidates, buildResearchRecord, normalizeCandidateToTool, shouldAutoApprove } from '@/lib/tool-discovery';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return request.headers.get('authorization') === `Bearer ${expected}` || request.nextUrl.searchParams.get('secret') === expected;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = Math.min(12, Math.max(1, Number(request.nextUrl.searchParams.get('limit') ?? '8')));
  const autoApprove = request.nextUrl.searchParams.get('approve') === 'true';

  try {
    const existing = await getAllTools();
    const existingSlugs = existing.map((tool) => tool.slug);

    const discovery = await discoverCandidates(existingSlugs, limit);
    const accepted: any[] = [];
    const skipped: any[] = [];

    for (const candidate of discovery.candidates) {
      const research = buildResearchRecord(
        discovery.provider,
        discovery.queries,
        discovery.sources,
        candidate.name,
        candidate.sourceUrls
      );

      const tool = normalizeCandidateToTool(candidate, research);
      const duplicate = existing.some((item) =>
        item.slug === tool.slug ||
        item.url === tool.url ||
        item.name.toLowerCase() === tool.name.toLowerCase()
      );

      if (duplicate) {
        skipped.push({ slug: tool.slug, reason: 'duplicate' });
        continue;
      }

      await addPendingTool(tool as any);
      accepted.push({
        slug: tool.slug,
        name: tool.name,
        url: tool.url,
        category: tool.category,
        evidenceScore: research.evidenceScore,
        sourceCount: research.sourceCount,
        officialSourceCount: research.officialSourceCount,
      });

      if (autoApprove && shouldAutoApprove(tool)) {
        await approvePendingTool(tool.slug);
      }
    }

    return NextResponse.json({
      success: true,
      discovered: accepted.length,
      skipped: skipped.length,
      provider: discovery.provider,
      sourcesReviewed: discovery.sources.length,
      queriesRun: discovery.queries.length,
      tools: accepted,
      skippedTools: skipped,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Unknown discovery error' }, { status: 500 });
  }
}
