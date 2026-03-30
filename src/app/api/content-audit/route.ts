import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/kv-storage';

export const runtime = 'nodejs';

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${expected}` || request.nextUrl.searchParams.get('secret') === expected;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const posts = await getAllPosts(500);
  const audited = posts.map((post) => {
    const issues: string[] = [];
    if ((post.wordCount ?? 0) < 1200) issues.push('word_count_below_1200');
    if (!post.research?.sources?.length) issues.push('missing_research_sources');
    if ((post.research?.evidenceScore ?? 0) < 40) issues.push('evidence_score_below_40');
    if (!post.metaTitle || post.metaTitle.length < 35) issues.push('weak_meta_title');
    if (!post.metaDescription || post.metaDescription.length < 120) issues.push('weak_meta_description');
    if (!post.toolSlugs?.length) issues.push('missing_tool_links');
    return {
      slug: post.slug,
      title: post.title,
      type: post.type,
      issues,
      score: Math.max(0, 100 - issues.length * 15),
    };
  });

  const needsWork = audited.filter((item) => item.issues.length > 0).sort((a, b) => a.score - b.score);

  return NextResponse.json({
    success: true,
    audited: audited.length,
    needsWorkCount: needsWork.length,
    needsWork,
  });
}
