import { NextRequest, NextResponse } from 'next/server';
import {
  buildPrompt,
  buildResearchBundle,
  generateSEOMetadata,
  generateSlug,
  selectNextContent,
  summarizeDecision,
} from '@/lib/content-engine';
import { makePairKey } from '@/lib/utils';
import { getGenerationState, saveGenerationState, savePost } from '@/lib/kv-storage';
import type { BlogPost } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorized(request: NextRequest, bodySecret?: string | null): boolean {
  const authHeader = request.headers.get('authorization');
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return authHeader === `Bearer ${expected}` || bodySecret === expected || request.nextUrl.searchParams.get('secret') === expected;
}

async function generateArticle(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      temperature: 0.3,
      system: 'You write high-trust editorial HTML for a software comparison site. Be accurate, specific, and commercially useful. Never invent hands-on testing or fake people. Output only semantic HTML.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.content?.find((part: any) => part.type === 'text')?.text ?? '';
  if (!content.includes('<article')) {
    throw new Error('Model did not return HTML article content');
  }
  return content;
}

async function handleGeneration(request: NextRequest, bodySecret?: string | null) {
  if (!isAuthorized(request, bodySecret ?? null)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const state = await getGenerationState();
  const decision = selectNextContent(state);
  if (!decision) {
    return NextResponse.json({ success: true, message: 'No content to generate' });
  }

  const slug = generateSlug(decision);
  if (state.publishedSlugs.includes(slug)) {
    return NextResponse.json({ success: true, message: 'Already published', slug });
  }

  const research = await buildResearchBundle(decision);
  const prompt = buildPrompt(decision, research);
  const content = await generateArticle(prompt);
  const seo = generateSEOMetadata(decision, content);
  const summary = summarizeDecision(decision);

  const post: BlogPost = {
    slug,
    title: seo.title,
    metaTitle: seo.metaTitle,
    metaDescription: seo.metaDescription,
    primaryKeyword: seo.primaryKeyword,
    keywords: seo.keywords,
    excerpt: seo.excerpt,
    content,
    type: summary.type,
    toolSlugs: summary.toolSlugs,
    category: summary.category,
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    wordCount: seo.wordCount,
    readingTime: seo.readingTime,
    featured: summary.type === 'comparison' || summary.type === 'roundup',
    schemaOrg: seo.schemaOrg,
    research,
    editorialSummary: seo.excerpt,
  };

  await savePost(post);

  const nextState = {
    ...state,
    publishedSlugs: [...new Set([...state.publishedSlugs, slug])],
    totalGenerated: state.totalGenerated + 1,
    currentCycle: state.currentCycle + 1,
    lastRunAt: new Date().toISOString(),
  };

  switch (decision.type) {
    case 'review':
      nextState.reviewedTools = [...new Set([...state.reviewedTools, decision.tool.slug])];
      break;
    case 'pricing':
      nextState.pricingDone = [...new Set([...state.pricingDone, decision.tool.slug])];
      break;
    case 'alternatives':
      nextState.guidesDone = [...new Set([...state.guidesDone, `${decision.tool.slug}-alternatives`])];
      break;
    case 'comparison':
      nextState.comparedPairs = [...new Set([...state.comparedPairs, makePairKey(decision.toolA.slug, decision.toolB.slug)])];
      break;
    case 'roundup':
      nextState.roundupsDone = [...new Set([...state.roundupsDone, decision.category])];
      break;
    case 'guide':
      nextState.guidesDone = [...new Set([...state.guidesDone, slug])];
      break;
  }

  await saveGenerationState(nextState);

  return NextResponse.json({
    success: true,
    slug,
    type: summary.type,
    title: post.title,
    wordCount: post.wordCount,
    readingTime: post.readingTime,
    sourceCount: research.sources.length,
    evidenceScore: research.evidenceScore,
    url: `/blog/${slug}`,
  });
}

export async function GET(request: NextRequest) {
  return handleGeneration(request);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (!isAuthorized(request, body.secret ?? null)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return handleGeneration(request, body.secret ?? null);
}
