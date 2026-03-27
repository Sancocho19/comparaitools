// src/app/api/search/route.ts
// API de búsqueda — usada por el buscador del sitio

import { NextRequest, NextResponse } from 'next/server';
import { searchTools } from '@/lib/tools-storage';
import { getManifest } from '@/lib/kv-storage';

export const runtime = 'edge'; // más rápido para search

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (!q || q.length < 2) {
    return NextResponse.json({ tools: [], posts: [], total: 0 });
  }

  const qLower = q.toLowerCase();

  try {
    // Buscar en tools
    const tools = await searchTools(q);

    // Buscar en blog posts
    const manifest = await getManifest();
    const posts = manifest
      .filter(p =>
        p.title.toLowerCase().includes(qLower) ||
        p.excerpt.toLowerCase().includes(qLower) ||
        p.toolSlugs.some(s => s.includes(qLower))
      )
      .slice(0, 5);

    return NextResponse.json({
      tools: tools.slice(0, 8).map(t => ({
        slug:          t.slug,
        name:          t.name,
        logo:          t.logo,
        description:   t.description,
        category:      t.categoryLabel,
        pricing:       t.pricing,
        rating:        t.rating,
      })),
      posts: posts.map(p => ({
        slug:        p.slug,
        title:       p.title,
        type:        p.type,
        publishedAt: p.publishedAt,
        excerpt:     p.excerpt.slice(0, 120) + '...',
      })),
      total: tools.length + posts.length,
      query: q,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
