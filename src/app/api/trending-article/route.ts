// src/app/api/trending-article/route.ts
// Genera artículos de opinión/análisis investigando tendencias REALES de AI con web search
// Cron: 1 vez al día a las 12pm — o manualmente cuando quieras

import { NextRequest, NextResponse } from 'next/server';
import { savePost, getManifest, type BlogPost } from '@/lib/kv-storage';
import { getGenerationState, saveGenerationState } from '@/lib/kv-storage';

const MODEL = 'claude-sonnet-4-20250514';
const TODAY = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const YEAR  = new Date().getFullYear();

// ─── Categorías de investigación rotativas ────────────────────────────────────
const RESEARCH_ANGLES = [
  'Which AI tool is trending most on social media right now and why',
  'Latest AI tool pricing changes controversies and user reactions',
  'AI tools that are losing users or shutting down features recently',
  'New AI tool launches that are disrupting existing tools',
  'AI tools being criticized or praised by developers and creators right now',
  'Surprising use cases of AI tools going viral this week',
  'AI tools comparison controversies — which is actually winning',
  'AI tools that overpromised and underdelivered recently',
];

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const force  = request.nextUrl.searchParams.get('force') === 'true';

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY missing' }, { status: 500 });

  try {
    const state    = await getGenerationState();
    const manifest = await getManifest();

    // Seleccionar ángulo de investigación rotativo
    const angleIndex = manifest.filter(p => p.category === 'trending').length % RESEARCH_ANGLES.length;
    const researchAngle = RESEARCH_ANGLES[angleIndex];

    const startTime = Date.now();

    // ─── PASO 1: Claude investiga tendencias reales con web search ────────────
    const researchResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        tools: [{
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 4,
        }],
        system: `You are an AI tools research analyst. Search the web for the most current, trending, and controversial news about AI tools.
Focus on: real user reactions, pricing controversies, tool comparisons, viral moments, and industry debates.
Return a JSON object (no other text) with:
{
  "headline": "Compelling controversial article title with year",
  "slug": "url-friendly-slug-max-60-chars",
  "angle": "The specific controversial or trending angle",
  "key_findings": ["Finding 1 with specific data", "Finding 2", "Finding 3", "Finding 4"],
  "tools_mentioned": ["tool-slug-1", "tool-slug-2"],
  "search_queries_used": ["query1", "query2"],
  "verdict": "Clear opinionated takeaway in 1 sentence",
  "why_controversial": "Why this topic generates debate"
}`,
        messages: [{
          role: 'user',
          content: `Search for and research: "${researchAngle}"
          
Today is ${TODAY}. Find the most recent, specific, and controversial angle about AI tools trending RIGHT NOW.
Use web search to find real data, user reactions, pricing info, and specific examples.
Then return ONLY a JSON object with your research findings. No other text.`,
        }],
      }),
    });

    const researchData = await researchResponse.json();
    if (researchData.error) {
      return NextResponse.json({ error: 'Research failed: ' + researchData.error.message }, { status: 500 });
    }

    // Extraer el JSON de la respuesta
    const researchText = researchData.content
      ?.filter((b: any) => b.type === 'text')
      ?.map((b: any) => b.text)
      ?.join('') ?? '';

    let research: any = {};
    try {
      const jsonMatch = researchText.match(/\{[\s\S]*\}/);
      if (jsonMatch) research = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: 'Failed to parse research JSON', raw: researchText.slice(0, 300) }, { status: 500 });
    }

    if (!research.headline) {
      return NextResponse.json({ error: 'No headline found in research', raw: researchText.slice(0, 300) }, { status: 500 });
    }

    // Verificar que no esté duplicado
    const slug = slugify(research.slug || research.headline) + `-${YEAR}`;
    const existing = manifest.find(p => p.slug === slug);
    if (!force && existing) {
      return NextResponse.json({ success: true, message: 'Similar article already exists', slug });
    }

    // ─── PASO 2: Generar el artículo completo basado en la investigación ──────
    const toolLinks = (research.tools_mentioned || [])
      .slice(0, 4)
      .map((s: string) => `<a href="/tools/${s}">${s.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</a>`)
      .join(', ');

    const articleResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        system: `You are Alex Morgan, founder of comparaitools.com and a senior AI tools analyst with 5+ years of hands-on experience. 
You write bold, opinionated, data-driven articles that generate real debate and shares.
RULES:
1. Output ONLY clean semantic HTML <article>...</article> — zero markdown, zero backticks
2. Bold opinions backed by specific data from the research
3. First person: "I've been tracking this", "here's what I actually found", "my take"
4. Controversial but fair — name the winner or loser clearly
5. Every claim must reference specific findings from the research provided
6. Minimum 1,600 words of actual content`,
        messages: [{
          role: 'user',
          content: `Write a high-impact opinion article based on this REAL research about current AI tool trends:

HEADLINE: ${research.headline}
ANGLE: ${research.angle}
KEY FINDINGS: ${JSON.stringify(research.key_findings)}
TOOLS: ${(research.tools_mentioned || []).join(', ')}
VERDICT: ${research.verdict}
WHY CONTROVERSIAL: ${research.why_controversial}

INTERNAL LINKS TO INCLUDE:
- Tool pages: ${toolLinks || '<a href="/tools">Browse all AI tools</a>'}
- Compare: <a href="/compare">Compare AI tools head-to-head</a>
- Blog: <a href="/blog">More AI analysis</a>

SEO:
- Primary keyword: use the main topic naturally 6-8 times
- Include FAQPage schema with 3 questions
- Last Updated: ${TODAY}
- Author: Alex Morgan, comparaitools.com

Write the full article now. Start directly with <article> and end with </article>.
The article must feel like breaking news analysis written by a real expert who just researched this topic.`,
        }],
      }),
    });

    const articleData = await articleResponse.json();
    if (articleData.error) {
      return NextResponse.json({ error: 'Article generation failed: ' + articleData.error.message }, { status: 500 });
    }

    const content = articleData.content?.[0]?.text || '';
    if (!content || content.length < 800) {
      return NextResponse.json({ error: 'Article too short' }, { status: 500 });
    }

    // ─── PASO 3: Guardar el artículo ──────────────────────────────────────────
    const wordCount   = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 220));
    const rawText     = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const excerpt     = rawText.slice(0, 155).trim() + '...';

    const post: BlogPost = {
      slug,
      title:           research.headline,
      metaTitle:       `${research.headline} | ComparAITools`,
      metaDescription: excerpt.substring(0, 155),
      primaryKeyword:  slugify(research.headline).replace(/-/g, ' '),
      keywords:        [
        ...(research.tools_mentioned || []).map((t: string) => `${t.replace(/-/g, ' ')} ${YEAR}`),
        'ai tools trending', `ai tools news ${YEAR}`, 'ai tools analysis',
      ],
      excerpt,
      content,
      type:        'guide',
      toolSlugs:   research.tools_mentioned || [],
      category:    'trending',
      publishedAt: new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
      wordCount,
      readingTime,
      featured:    true,
      schemaOrg: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: research.headline,
        author: {
          '@type': 'Person',
          name: 'Alex Morgan',
          url: 'https://comparaitools.com/about',
          sameAs: ['https://twitter.com/alexmorgan_ai'],
        },
        publisher: {
          '@type': 'Organization',
          name: 'ComparAITools',
          url: 'https://comparaitools.com',
        },
        datePublished: new Date().toISOString(),
        dateModified:  new Date().toISOString(),
        about: research.angle,
      },
    };

    await savePost(post);

    // Actualizar estado
    const updatedState = {
      ...state,
      totalGenerated: state.totalGenerated + 1,
      lastRunAt:       new Date().toISOString(),
      publishedSlugs:  [...new Set([...state.publishedSlugs, slug])],
    };
    await saveGenerationState(updatedState);

    // Ping Google
    try {
      await fetch('https://www.google.com/ping?sitemap=https://comparaitools.com/sitemap.xml');
    } catch {}

    return NextResponse.json({
      success:      true,
      slug,
      title:        research.headline,
      angle:        research.angle,
      verdict:      research.verdict,
      toolsMentioned: research.tools_mentioned,
      wordCount,
      readingTime,
      generationMs: Date.now() - startTime,
      url:          `/blog/${slug}`,
      isTrending:   true,
    });

  } catch (error: any) {
    console.error('Trending article error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
