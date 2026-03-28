// src/app/api/trending-article/route.ts
// V2: Web search research + keyword validation + SEO-optimized metadata + internal linking + dateModified

import { NextRequest, NextResponse } from 'next/server';
import { savePost, getManifest, getPost, type BlogPost } from '@/lib/kv-storage';
import { getGenerationState, saveGenerationState } from '@/lib/kv-storage';

const MODEL = 'claude-sonnet-4-20250514';
const TODAY = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const YEAR  = new Date().getFullYear();

const RESEARCH_ANGLES = [
  'Which AI tool is trending most on social media right now and why',
  'Latest AI tool pricing changes controversies and user reactions this week',
  'AI tools that are losing users or shutting down features recently',
  'New AI tool launches that are disrupting existing tools right now',
  'AI tools being criticized or praised by developers and creators this week',
  'Surprising viral use cases of AI tools going viral this month',
  'AI tools comparison controversies — which is actually winning users',
  'AI tools that overpromised and underdelivered recently',
  'AI tools that got a major update this week and what changed',
  'Which AI companies are growing fastest right now and why',
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
    const startTime = Date.now();

    // Seleccionar ángulo rotativo
    const angleIndex    = manifest.filter(p => p.category === 'trending').length % RESEARCH_ANGLES.length;
    const researchAngle = RESEARCH_ANGLES[angleIndex];

    // ─── PASO 1: Investigación real con web search ────────────────────────────
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
        max_tokens: 2500,
        tools: [{
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 5,
        }],
        system: `You are an AI tools research analyst AND SEO strategist.
Search the web for trending AI tool news, then identify the BEST SEO opportunity from what you find.

Return ONLY a valid JSON object (no other text, no markdown):
{
  "headline": "SEO-optimized article title that matches how people search — include year",
  "slug": "primary-keyword-url-slug-max-55-chars",
  "primary_keyword": "exact phrase people search on Google (5-8 words max)",
  "secondary_keywords": ["keyword 2", "keyword 3", "keyword 4"],
  "meta_description": "Compelling 150-155 char meta description with primary keyword — written to maximize CTR from Google",
  "angle": "The specific controversial or trending angle discovered",
  "key_findings": [
    "Specific finding with number/data point",
    "Specific finding with number/data point", 
    "Specific finding with number/data point",
    "Specific finding with number/data point"
  ],
  "tools_mentioned": ["tool-slug-1", "tool-slug-2", "tool-slug-3"],
  "related_comparisons": [["tool-a-slug", "tool-b-slug"]],
  "verdict": "Clear opinionated 1-sentence takeaway",
  "why_controversial": "Why this generates debate",
  "search_volume_estimate": "high|medium|low",
  "content_sections": ["Section 1 title", "Section 2 title", "Section 3 title", "Section 4 title"]
}`,
        messages: [{
          role: 'user',
          content: `Search for and research: "${researchAngle}"

Today is ${TODAY}. Find the most recent, specific, and SEO-valuable angle about AI tools.
Prioritize topics that:
1. People are actively searching for RIGHT NOW
2. Have a clear controversial or surprising angle
3. Reference specific tools with real data
4. Would make someone click from Google search results

Use web search to find real data, then return ONLY the JSON object.`,
        }],
      }),
    });

    const researchData = await researchResponse.json();
    if (researchData.error) {
      return NextResponse.json({ error: 'Research failed: ' + researchData.error.message }, { status: 500 });
    }

    const researchText = researchData.content
      ?.filter((b: any) => b.type === 'text')
      ?.map((b: any) => b.text)
      ?.join('') ?? '';

    let research: any = {};
    try {
      const jsonMatch = researchText.match(/\{[\s\S]*\}/);
      if (jsonMatch) research = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: 'Failed to parse research JSON', raw: researchText.slice(0, 500) }, { status: 500 });
    }

    if (!research.headline || !research.primary_keyword) {
      return NextResponse.json({ error: 'Incomplete research data', raw: researchText.slice(0, 300) }, { status: 500 });
    }

    // Verificar duplicados
    const slug = slugify(research.slug || research.primary_keyword) + `-${YEAR}`;
    if (!force && state.publishedSlugs.includes(slug)) {
      return NextResponse.json({ success: true, message: 'Already published', slug });
    }

    // ─── PASO 2: Construir internal links dinámicos ───────────────────────────
    // Links a tool pages mencionadas
    const toolLinks = (research.tools_mentioned || [])
      .slice(0, 5)
      .map((s: string) => {
        const name = s.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        return `<a href="/tools/${s}">${name}</a>`;
      })
      .join(', ');

    // Links a comparaciones relacionadas
    const compareLinks = (research.related_comparisons || [])
      .slice(0, 3)
      .map((pair: string[]) => {
        if (pair.length < 2) return '';
        const [a, b] = pair.sort();
        const nameA = a.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        const nameB = b.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        return `<a href="/compare/${a}-vs-${b}-${YEAR}">${nameA} vs ${nameB}</a>`;
      })
      .filter(Boolean)
      .join(' · ') || `<a href="/compare">Compare AI Tools →</a>`;

    // Links a artículos relacionados del blog
    const relatedBlogLinks = (research.tools_mentioned || [])
      .slice(0, 2)
      .map((s: string) => {
        const name = s.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        return `<a href="/blog/${s}-review-${YEAR}">${name} Review ${YEAR}</a>`;
      })
      .join(' · ');

    // ─── PASO 3: Generar artículo SEO-optimizado ──────────────────────────────
    const sections = research.content_sections || [
      'Why This Matters Right Now',
      'What The Data Actually Shows',
      'Who Is Most Affected',
      'Our Verdict',
    ];

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
        system: `You are Alex Morgan, founder of comparaitools.com and senior AI tools analyst with 5+ years of hands-on experience.
You write bold, opinionated, data-driven articles that rank on Google AND generate real debate and shares.

CRITICAL SEO RULES:
1. Output ONLY clean semantic HTML <article>...</article> — zero markdown, zero backticks
2. Use the PRIMARY KEYWORD naturally 6-8 times throughout — never stuffed
3. Use SECONDARY KEYWORDS 2-3 times each
4. H2 headings must contain keywords where natural
5. First 100 words MUST contain the primary keyword
6. Bold opinions backed by specific data from research
7. First person: "I've been tracking this", "here's what I found"
8. Include ALL internal links provided exactly as written
9. Minimum 1,700 words of actual content
10. Every section must have original insight, not generic filler`,
        messages: [{
          role: 'user',
          content: `Write a high-impact, SEO-optimized trending article based on this REAL research:

HEADLINE: ${research.headline}
PRIMARY KEYWORD: "${research.primary_keyword}" — use 6-8 times naturally
SECONDARY KEYWORDS: ${(research.secondary_keywords || []).join(', ')} — use 2-3 times each
ANGLE: ${research.angle}
KEY FINDINGS (use ALL of these as specific data points):
${(research.key_findings || []).map((f: string, i: number) => `${i+1}. ${f}`).join('\n')}
TOOLS: ${(research.tools_mentioned || []).join(', ')}
VERDICT: ${research.verdict}
CONTENT SECTIONS TO COVER: ${sections.join(' | ')}

MANDATORY INTERNAL LINKS (include all):
- Tool pages: ${toolLinks || '<a href="/tools">Browse all AI tools</a>'}
- Head-to-head comparisons: ${compareLinks}
- Related reviews: ${relatedBlogLinks || '<a href="/blog">More AI analysis</a>'}
- Category: <a href="/compare">Compare all AI tools</a>

SEO META:
- Primary keyword in H1, first paragraph, at least 2 H2s
- Last Updated visible: ${TODAY}
- Author: Alex Morgan, comparaitools.com

Structure the article with:
<article>
<div class="last-updated">Last Updated: ${TODAY} · Researched & written by Alex Morgan</div>
<h1>[Headline with primary keyword]</h1>
<div class="quick-verdict">
  <h2>The Short Answer</h2>
  <p>[2-3 sentences — direct, opinionated, no hedging. Primary keyword here.]</p>
</div>
[Then 5-6 H2 sections covering: ${sections.join(', ')}]
[Each section 200-300 words with specific data, internal links, and clear opinions]
[FAQPage schema with 3 questions at the end]
[CTA box with comparison links at the very end]
</article>

Write the full article now.`,
        }],
      }),
    });

    const articleData = await articleResponse.json();
    if (articleData.error) {
      return NextResponse.json({ error: 'Article generation failed: ' + articleData.error.message }, { status: 500 });
    }

    const content = articleData.content?.[0]?.text || '';
    if (!content || content.length < 800) {
      return NextResponse.json({ error: 'Article too short', length: content.length }, { status: 500 });
    }

    // ─── PASO 4: Metadata SEO ultra-optimizada ────────────────────────────────
    const wordCount   = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 220));
    const rawText     = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Meta description optimizada para CTR — usa la de la investigación si es buena
    const metaDescription = research.meta_description?.length >= 140 && research.meta_description?.length <= 160
      ? research.meta_description
      : `${research.verdict} Here's what our research found about ${research.primary_keyword} — with real data, expert analysis, and a clear verdict. Updated ${TODAY}.`.substring(0, 158);

    // Excerpt limpio para el blog listing
    const excerpt = rawText.slice(0, 155).trim() + '...';

    // Keywords combinadas
    const keywords = [
      research.primary_keyword,
      ...(research.secondary_keywords || []),
      ...(research.tools_mentioned || []).map((t: string) => `${t.replace(/-/g, ' ')} ${YEAR}`),
      `ai tools news ${YEAR}`,
      'ai tools trending',
    ].filter(Boolean).slice(0, 10);

    const now = new Date().toISOString();

    const post: BlogPost = {
      slug,
      title:           research.headline,
      metaTitle:       `${research.headline} | ComparAITools`,
      metaDescription,
      primaryKeyword:  research.primary_keyword,
      keywords,
      excerpt,
      content,
      type:        'guide',
      toolSlugs:   research.tools_mentioned || [],
      category:    'trending',
      publishedAt: now,
      updatedAt:   now,
      wordCount,
      readingTime,
      featured:    true,
      schemaOrg: {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline:      research.headline,
        description:   metaDescription,
        datePublished: now,
        dateModified:  now,
        author: {
          '@type': 'Person',
          name:   'Alex Morgan',
          url:    'https://comparaitools.com/about',
          sameAs: [
            'https://twitter.com/alexmorgan_ai',
            'https://linkedin.com/in/alexmorganai',
          ],
        },
        publisher: {
          '@type': 'Organization',
          name:    'ComparAITools',
          url:     'https://comparaitools.com',
          logo: {
            '@type': 'ImageObject',
            url: 'https://comparaitools.com/favicon.svg',
          },
        },
        mainEntityOfPage: {
          '@type': '@id',
          '@id':   `https://comparaitools.com/blog/${slug}`,
        },
        keywords: keywords.join(', '),
        about: research.angle,
      },
    };

    await savePost(post);

    // Actualizar estado
    const updatedState = {
      ...state,
      totalGenerated: state.totalGenerated + 1,
      lastRunAt:       now,
      publishedSlugs:  [...new Set([...state.publishedSlugs, slug])],
    };
    await saveGenerationState(updatedState);

    // Ping Google inmediatamente
    try {
      await fetch(`https://www.google.com/ping?sitemap=https://comparaitools.com/sitemap.xml`);
    } catch {}

    return NextResponse.json({
      success:        true,
      slug,
      title:          research.headline,
      primaryKeyword: research.primary_keyword,
      secondaryKeywords: research.secondary_keywords,
      metaDescription,
      angle:          research.angle,
      verdict:        research.verdict,
      toolsMentioned: research.tools_mentioned,
      searchVolumeEstimate: research.search_volume_estimate,
      wordCount,
      readingTime,
      generationMs:   Date.now() - startTime,
      url:            `/blog/${slug}`,
      seoScore: {
        hasKeywordInH1:    content.toLowerCase().includes(research.primary_keyword?.toLowerCase()),
        hasInternalLinks:  content.includes('/tools/') || content.includes('/compare/'),
        hasFAQSchema:      content.includes('FAQPage'),
        hasDateModified:   content.includes(TODAY),
        wordCountOk:       wordCount >= 1500,
      },
    });

  } catch (error: any) {
    console.error('Trending article error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
