import { NextRequest, NextResponse } from 'next/server';
import { addPendingTool, approvePendingTool, getAllTools } from '@/lib/tools-storage';
import { runSearchQueries } from '@/lib/search-provider';
import { slugify } from '@/lib/utils';
import type { Tool } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return request.headers.get('authorization') === `Bearer ${expected}` || request.nextUrl.searchParams.get('secret') === expected;
}

async function askModelToExtractCandidates(existingSlugs: string[], rawSources: string): Promise<Partial<Tool>[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing');

  const prompt = `You are building a database of real AI software tools.
Return ONLY JSON: an array of up to 8 objects.
Each object must include: name, company, url, category, categoryLabel, description, bestFor.
Rules:
- Only include tools that appear to be real products from the research snippets below.
- Prefer products that look new or recently growing.
- Do NOT include anything already present in these existing slugs: ${existingSlugs.join(', ')}.
- Use broad categories like chatbot, image, code, search, video, audio, productivity.
- If uncertain, leave the tool out.

Research snippets:
${rawSources}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
      max_tokens: 1800,
      temperature: 0,
      system: 'Return strict JSON only.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic error ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.find((part: any) => part.type === 'text')?.text ?? '[]';
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await getAllTools();
  const existingSlugs = existing.map((tool) => tool.slug);
  const searches = await runSearchQueries([
    { query: 'new AI tools launched this month', reason: 'Discover newly launched tools', topic: 'news' },
    { query: 'fastest growing AI tools 2026', reason: 'Discover gaining traction tools', topic: 'news' },
    { query: 'AI startup product launch pricing official site', reason: 'Find commercial tools with real websites' },
  ]);

  const rawSources = searches.sources
    .map((source, index) => `${index + 1}. ${source.title}\n${source.url}\n${source.snippet}`)
    .join('\n\n');

  const candidates = await askModelToExtractCandidates(existingSlugs, rawSources);
  const normalized: Tool[] = candidates
    .filter((candidate) => candidate.name && candidate.url && candidate.category)
    .map((candidate) => ({
      id: slugify(candidate.name!),
      slug: slugify(candidate.name!),
      name: candidate.name!,
      company: candidate.company ?? candidate.name!,
      category: candidate.category!,
      categoryLabel: candidate.categoryLabel ?? candidate.category!,
      pricing: 'Check official site',
      pricingValue: 0,
      rating: 0,
      users: 'N/A',
      logo: '🆕',
      color: '#8b5cf6',
      features: [],
      pros: [],
      cons: [],
      url: candidate.url!,
      description: candidate.description ?? `New AI tool discovered via web research for ${candidate.categoryLabel ?? candidate.category}.`,
      longDescription: candidate.description ?? '',
      bestFor: candidate.bestFor ?? 'Early research pending',
      lastUpdated: new Date().toISOString().slice(0, 10),
      trend: '+0%',
      source: 'discovered',
      verified: false,
      status: 'pending',
    }));

  for (const tool of normalized) {
    await addPendingTool(tool);
    if (request.nextUrl.searchParams.get('approve') === 'true') {
      await approvePendingTool(tool.slug);
    }
  }

  return NextResponse.json({
    success: true,
    discovered: normalized.length,
    provider: searches.provider,
    sourcesReviewed: searches.sources.length,
    tools: normalized.map((tool) => ({ slug: tool.slug, name: tool.name, url: tool.url, category: tool.category })),
  });
}
