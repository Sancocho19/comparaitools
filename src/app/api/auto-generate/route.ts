// src/app/api/auto-generate/route.ts
// REEMPLAZA el archivo existente completo

import { NextRequest, NextResponse } from 'next/server';
import {
  getGenerationState, saveGenerationState,
  savePost, type BlogPost,
} from '@/lib/kv-storage';
import {
  selectNextContent, generateSlug,
  buildPrompt, generateSEOMetadata, makePairKey,
} from '@/lib/content-engine';

const MODEL     = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4000;

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
    const decision = selectNextContent(state);
    if (!decision) return NextResponse.json({ success: true, message: 'Nothing to generate' });

    const slug = generateSlug(decision);
    if (!force && state.publishedSlugs.includes(slug)) {
      const nextState = { ...state, totalGenerated: state.totalGenerated + 1 };
      const next = selectNextContent(nextState);
      if (!next) return NextResponse.json({ success: true, message: 'All content up to date' });
    }

    const prompt   = buildPrompt(decision);
    const startTime = Date.now();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: `You are a senior AI tools analyst at comparaitools.com with 5+ years of hands-on experience testing AI software.
You write comprehensive, SEO-optimized content with real E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness).
CRITICAL RULES:
1. Output ONLY clean semantic HTML — no markdown, no backticks, no text outside the HTML tags
2. Always write in first-person plural: "we tested", "our team found", "in our experience"
3. Include specific test results and observations — never be generic
4. Include ALL internal links specified in the prompt exactly as written
5. Meet minimum word count — do not cut corners
6. Every article must feel like it was written by a human expert who actually used the tool`,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 });

    const content = data.content?.[0]?.text || '';
    if (!content || content.length < 800) {
      return NextResponse.json({ error: 'Content too short' }, { status: 500 });
    }

    const seoMeta = generateSEOMetadata(decision, content);

    // Determine toolSlugs, category, type
    let toolSlugs: string[] = [];
    let category  = '';
    let type: BlogPost['type'] = 'review';

    switch (decision.type) {
      case 'review':
        toolSlugs = [decision.tool.slug]; category = decision.tool.category; type = 'review'; break;
      case 'comparison':
        toolSlugs = [decision.toolA.slug, decision.toolB.slug]; category = decision.toolA.category; type = 'comparison'; break;
      case 'roundup':
        toolSlugs = decision.tools.map(t => t.slug); category = decision.category; type = 'roundup'; break;
      case 'guide':
        toolSlugs = [decision.tool.slug]; category = decision.tool.category; type = 'guide'; break;
      case 'pricing':
        toolSlugs = [decision.tool.slug]; category = decision.tool.category; type = 'pricing'; break;
      case 'alternatives':
        toolSlugs = [decision.tool.slug, ...decision.alternatives.map(t => t.slug)];
        category  = decision.tool.category; type = 'guide'; break;
    }

    const post: BlogPost = {
      slug,
      title:           seoMeta.metaTitle.replace(/ \[.*\]$/, ''),
      metaTitle:       seoMeta.metaTitle,
      metaDescription: seoMeta.metaDescription,
      primaryKeyword:  seoMeta.primaryKeyword,
      keywords:        seoMeta.keywords,
      excerpt:         seoMeta.excerpt,
      content,
      type,
      toolSlugs,
      category,
      publishedAt:     new Date().toISOString(),
      updatedAt:       new Date().toISOString(),
      wordCount:       seoMeta.wordCount,
      readingTime:     seoMeta.readingTime,
      featured:        false,
      schemaOrg:       seoMeta.schemaOrg,
    };

    await savePost(post);

    // Update state
    const updatedState = { ...state };
    updatedState.totalGenerated  += 1;
    updatedState.lastRunAt        = new Date().toISOString();
    updatedState.publishedSlugs   = [...new Set([...state.publishedSlugs, slug])];

    switch (decision.type) {
      case 'review':
        updatedState.reviewedTools = [...new Set([...state.reviewedTools, decision.tool.slug])]; break;
      case 'comparison':
        updatedState.comparedPairs = [...new Set([...state.comparedPairs, makePairKey(decision.toolA.slug, decision.toolB.slug)])]; break;
      case 'roundup':
        updatedState.roundupsDone = [...new Set([...state.roundupsDone, decision.category])]; break;
      case 'guide':
        updatedState.guidesDone = [...new Set([...state.guidesDone, `${decision.tool.slug}-${decision.topicType}`])]; break;
      case 'pricing':
        updatedState.pricingDone = [...new Set([...state.pricingDone, decision.tool.slug])]; break;
      case 'alternatives':
        updatedState.publishedSlugs = [...new Set([...updatedState.publishedSlugs, slug])]; break;
    }

    await saveGenerationState(updatedState);

    // Ping Google para indexación inmediata
    try {
      await fetch(`https://www.google.com/ping?sitemap=https://comparaitools.com/sitemap.xml`);
    } catch {}

    return NextResponse.json({
      success:        true,
      slug,
      type:           decision.type,
      title:          post.title,
      wordCount:      post.wordCount,
      readingTime:    post.readingTime,
      generationMs:   Date.now() - startTime,
      primaryKeyword: post.primaryKeyword,
      totalGenerated: updatedState.totalGenerated,
      url:            `/blog/${slug}`,
    });

  } catch (error: any) {
    console.error('Auto-generate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (body.secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(request.url);
  url.searchParams.set('secret', body.secret);
  url.searchParams.set('force', 'true');
  return GET(new NextRequest(url));
}
