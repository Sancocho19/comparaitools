import { NextRequest, NextResponse } from 'next/server';
import { bootstrapStaticTools, getAllTools, saveTool } from '@/lib/tools-storage';
import { runSearchQueries } from '@/lib/search-provider';
import type { SearchQuery } from '@/lib/search-provider';
import { buildResearchRecord } from '@/lib/tool-discovery';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return request.headers.get('authorization') === `Bearer ${expected}` || request.nextUrl.searchParams.get('secret') === expected;
}

function cleanStr(input: unknown): string {
  if (!input) return '';
  return String(input).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanArr(input: unknown, max = 6): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((value) => cleanStr(value))
    .filter((value) => value.length > 2)
    .slice(0, max);
}

async function askAnthropicForObject(prompt: string, maxTokens = 1800): Promise<any> {
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
      max_tokens: maxTokens,
      temperature: 0,
      system: 'Return strict JSON only. No markdown. No HTML. Use only the evidence bundle provided.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic error ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.find((part: any) => part.type === 'text')?.text ?? '{}';
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Model did not return JSON');
    return JSON.parse(match[0]);
  }
}

function needsEnrichment(tool: any): boolean {
  const researchScore = Number(tool?.evidenceScore ?? tool?.research?.evidenceScore ?? 0);
  return (
    !tool?.description ||
    !tool?.longDescription ||
    !tool?.bestFor ||
    !Array.isArray(tool?.features) ||
    tool.features.length < 3 ||
    researchScore < 70
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get('slug');
  const autoPublish = request.nextUrl.searchParams.get('publish') === 'true';

  try {
    await bootstrapStaticTools();
    const allTools = await getAllTools();
    const candidates = slug
      ? allTools.filter((tool) => tool.slug === slug)
      : allTools.filter((tool) => tool.source === 'discovered' && needsEnrichment(tool)).slice(0, 10);

    if (!candidates.length) {
      return NextResponse.json({ success: true, message: 'No tools need enrichment right now.' });
    }

    const enriched: any[] = [];
    const failed: any[] = [];

    for (const tool of candidates) {
      try {
        const queries: SearchQuery[] = [
          { query: `${tool.name} official site`, reason: 'Find official product page', topic: 'general' },
          { query: `${tool.name} pricing official`, reason: 'Find official pricing page', topic: 'general' },
          { query: `${tool.name} docs official`, reason: 'Find docs or help center', topic: 'general' },
          { query: `${tool.name} release notes OR changelog`, reason: 'Find recent update evidence', topic: 'news' },
        ];

        const result: any = await runSearchQueries(queries);
        const research = buildResearchRecord(
          result?.provider ?? 'unknown',
          queries.map((q) => q.query),
          result?.sources ?? [],
          tool.name,
          [tool.url],
        );

        const evidenceBundle = research.sources
          .map((source, index) => `${index + 1}. ${source.title}\nURL: ${source.url}\nDomain: ${source.domain}\nKind: ${source.kind}\nSnippet: ${source.snippet}`)
          .join('\n\n');

        const prompt = `You are enriching a database entry for an AI tool.
Use ONLY the evidence bundle below. If something is not supported, leave it conservative and generic.
Return ONLY JSON with:
{
  "description": string,
  "longDescription": string,
  "bestFor": string,
  "features": string[],
  "pros": string[],
  "cons": string[],
  "pricing": string,
  "pricingValue": number,
  "company": string,
  "url": string
}

Tool:
Name: ${tool.name}
Current company: ${tool.company}
Current website: ${tool.url}
Current category: ${tool.categoryLabel}

Evidence bundle:
${evidenceBundle}`;

        const payload = await askAnthropicForObject(prompt, 2200);
        const updatedTool: any = {
          ...tool,
          company: cleanStr(payload.company) || tool.company,
          url: cleanStr(payload.url) || tool.url,
          description: cleanStr(payload.description) || tool.description,
          longDescription: cleanStr(payload.longDescription) || tool.longDescription || tool.description,
          bestFor: cleanStr(payload.bestFor) || tool.bestFor,
          features: cleanArr(payload.features, 6).length ? cleanArr(payload.features, 6) : tool.features,
          pros: cleanArr(payload.pros, 4).length ? cleanArr(payload.pros, 4) : tool.pros,
          cons: cleanArr(payload.cons, 4).length ? cleanArr(payload.cons, 4) : tool.cons,
          pricing: cleanStr(payload.pricing) || tool.pricing,
          pricingValue: Number.isFinite(Number(payload.pricingValue)) ? Number(payload.pricingValue) : tool.pricingValue,
          lastUpdated: new Date().toISOString().slice(0, 10),
          evidenceScore: research.evidenceScore,
          sourceCount: research.sourceCount,
          research,
        };

        if (autoPublish && research.evidenceScore >= 78 && research.officialSourceCount >= 2) {
          updatedTool.verified = true;
          updatedTool.status = 'published';
        }

        await saveTool(updatedTool as any);
        enriched.push({
          slug: updatedTool.slug,
          name: updatedTool.name,
          evidenceScore: research.evidenceScore,
          sourceCount: research.sourceCount,
          officialSourceCount: research.officialSourceCount,
        });

        await new Promise((resolve) => setTimeout(resolve, 350));
      } catch (error: any) {
        failed.push({ slug: tool.slug, name: tool.name, error: error?.message ?? 'Unknown error' });
      }
    }

    return NextResponse.json({
      success: true,
      enrichedCount: enriched.length,
      failedCount: failed.length,
      enriched,
      failed,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Unknown enrichment error' }, { status: 500 });
  }
}
