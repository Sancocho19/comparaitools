import { NextRequest, NextResponse } from 'next/server';
import { getManifest } from '@/lib/kv-storage';
import { searchTools } from '@/lib/tools-storage';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ tools: [], posts: [], total: 0, query: q }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300' },
    });
  }

  const [tools, manifest] = await Promise.all([searchTools(q), getManifest()]);
  const needle = q.toLowerCase();
  const posts = manifest
    .filter((post) => post.title.toLowerCase().includes(needle) || post.excerpt.toLowerCase().includes(needle) || post.toolSlugs.some((slug) => slug.includes(needle)))
    .slice(0, 6);

  return NextResponse.json({
    query: q,
    total: tools.length + posts.length,
    tools: tools.slice(0, 8).map((tool) => ({
      slug: tool.slug,
      name: tool.name,
      logo: tool.logo,
      description: tool.description,
      category: tool.categoryLabel,
      pricing: tool.pricing,
      rating: tool.rating,
    })),
    posts: posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      type: post.type,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt,
    })),
  }, {
    headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300' },
  });
}
