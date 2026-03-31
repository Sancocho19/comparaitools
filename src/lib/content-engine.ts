import tools from '@/data/tools.json';
import type { BlogPost, GenerationState, ResearchBundle, Tool, ContentType } from '@/lib/types';
import { BRAND_EDITOR, CURRENT_YEAR } from '@/lib/site';
import { estimateReadingTime, makePairKey, slugify, stripHtml } from '@/lib/utils';
import { runSearchQueries, type SearchQuery } from '@/lib/search-provider';

const STATIC_TOOLS = tools as Tool[];
const TODAY = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

type ToolLike = Tool & {
  evidenceScore?: number;
  sourceCount?: number;
  research?: {
    evidenceScore?: number;
    sourceCount?: number;
    provider?: string;
    generatedAt?: string;
    queries?: string[];
    sources?: Array<{
      title: string;
      url: string;
      domain: string;
      snippet: string;
      publishedAt?: string;
      score?: number;
      reason?: string;
      kind?: string;
    }>;
    methodology?: string[];
    freshness?: string;
  };
};

export type Opportunity = {
  key: string;
  title: string;
  pageType: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  angle?: string;
  toolSlugs?: string[];
  score?: number;
  clusterKey?: string;
  clusterLabel?: string;
};

export type GeneratorOptions = {
  minWords?: number;
  faqCount?: number;
  internalLinkCount?: number;
  maxTokens?: number;
  fast?: boolean;
};

export type ContentDecision =
  | { type: 'review'; tool: ToolLike }
  | { type: 'comparison'; toolA: ToolLike; toolB: ToolLike }
  | { type: 'roundup'; category: string; categoryLabel: string; tools: ToolLike[] }
  | { type: 'pricing'; tool: ToolLike }
  | { type: 'alternatives'; tool: ToolLike; alternatives: ToolLike[] }
  | { type: 'guide'; tool: ToolLike; topic: string; keyword: string }
  | null;

async function loadAllTools(): Promise<ToolLike[]> {
  try {
    const mod: any = await import('@/lib/tools-storage');
    if (typeof mod.getAllTools === 'function') {
      const items = await mod.getAllTools();
      if (Array.isArray(items) && items.length) return items as ToolLike[];
    }
  } catch {}

  return STATIC_TOOLS as ToolLike[];
}

function sameCategoryTools(tool: ToolLike, allTools: ToolLike[]): ToolLike[] {
  return allTools
    .filter((candidate) => candidate.category === tool.category && candidate.slug !== tool.slug)
    .sort(
      (a, b) =>
        Number(b.rating ?? 0) - Number(a.rating ?? 0) ||
        Number(b.pricingValue ?? 0) - Number(a.pricingValue ?? 0),
    );
}

export function selectNextContent(state: GenerationState): ContentDecision {
  const reviewTarget = STATIC_TOOLS.find((tool) => !state.reviewedTools.includes(tool.slug));
  if (reviewTarget) return { type: 'review', tool: reviewTarget as ToolLike };

  for (const tool of STATIC_TOOLS) {
    if (!state.pricingDone.includes(tool.slug)) return { type: 'pricing', tool: tool as ToolLike };
  }

  for (const tool of STATIC_TOOLS) {
    const alternatives = STATIC_TOOLS
      .filter((candidate) => candidate.category === tool.category && candidate.slug !== tool.slug)
      .sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0))
      .slice(0, 4) as ToolLike[];
    if (alternatives.length >= 2 && !state.guidesDone.includes(`${tool.slug}-alternatives`)) {
      return { type: 'alternatives', tool: tool as ToolLike, alternatives };
    }
  }

  for (const tool of STATIC_TOOLS) {
    const candidate = STATIC_TOOLS.find(
      (item) => item.category === tool.category && item.slug !== tool.slug,
    ) as ToolLike | undefined;
    if (!candidate) continue;
    const pairKey = makePairKey(tool.slug, candidate.slug);
    if (!state.comparedPairs.includes(pairKey)) {
      return { type: 'comparison', toolA: tool as ToolLike, toolB: candidate };
    }
  }

  const byCategory = new Map<string, ToolLike[]>();
  for (const tool of STATIC_TOOLS) {
    const bucket = byCategory.get(tool.category) ?? [];
    bucket.push(tool as ToolLike);
    byCategory.set(tool.category, bucket);
  }

  for (const [category, items] of byCategory.entries()) {
    if (items.length >= 3 && !state.roundupsDone.includes(category)) {
      return {
        type: 'roundup',
        category,
        categoryLabel: items[0].categoryLabel,
        tools: items.sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0)).slice(0, 6),
      };
    }
  }

  const guideTarget = STATIC_TOOLS[0] as ToolLike;
  return {
    type: 'guide',
    tool: guideTarget,
    topic: `How to use ${guideTarget.name} for real-world workflows in ${CURRENT_YEAR}`,
    keyword: `how to use ${guideTarget.name}`,
  };
}

export function generateSlug(decision: ContentDecision): string {
  if (!decision) return '';
  switch (decision.type) {
    case 'review':
      return `${decision.tool.slug}-review-${CURRENT_YEAR}`;
    case 'comparison':
      return `${[decision.toolA.slug, decision.toolB.slug].sort().join('-vs-')}-${CURRENT_YEAR}`;
    case 'roundup':
      return `best-${slugify(decision.categoryLabel)}-tools-${CURRENT_YEAR}`;
    case 'pricing':
      return `${decision.tool.slug}-pricing-${CURRENT_YEAR}`;
    case 'alternatives':
      return `${decision.tool.slug}-alternatives-${CURRENT_YEAR}`;
    case 'guide':
      return `${decision.tool.slug}-${slugify(decision.keyword)}-${CURRENT_YEAR}`;
  }
}

export function summarizeDecision(decision: ContentDecision): {
  primaryKeyword: string;
  title: string;
  description: string;
  type: ContentType;
  toolSlugs: string[];
  category: string;
} {
  if (!decision) throw new Error('No content decision');

  switch (decision.type) {
    case 'review':
      return {
        primaryKeyword: `${decision.tool.name} review ${CURRENT_YEAR}`,
        title: `${decision.tool.name} Review ${CURRENT_YEAR}: Pricing, Strengths, Weaknesses, and Best Use Cases`,
        description: `Research-backed ${decision.tool.name} review with pricing, strengths, limitations, and best use cases for ${CURRENT_YEAR}.`,
        type: 'review' as ContentType,
        toolSlugs: [decision.tool.slug],
        category: decision.tool.category,
      };
    case 'comparison':
      return {
        primaryKeyword: `${decision.toolA.name} vs ${decision.toolB.name}`,
        title: `${decision.toolA.name} vs ${decision.toolB.name}: Which One Makes More Sense in ${CURRENT_YEAR}?`,
        description: `A research-backed comparison of ${decision.toolA.name} and ${decision.toolB.name}, including pricing, tradeoffs, and who each tool fits best.`,
        type: 'comparison' as ContentType,
        toolSlugs: [decision.toolA.slug, decision.toolB.slug],
        category: decision.toolA.category,
      };
    case 'roundup':
      return {
        primaryKeyword: `best ${decision.categoryLabel.toLowerCase()} ai tools ${CURRENT_YEAR}`,
        title: `Best ${decision.categoryLabel} AI Tools in ${CURRENT_YEAR}: What Actually Stands Out`,
        description: `A researched roundup of the best ${decision.categoryLabel.toLowerCase()} AI tools in ${CURRENT_YEAR}, with fit, tradeoffs, and buying advice.`,
        type: 'roundup' as ContentType,
        toolSlugs: decision.tools.map((tool) => tool.slug),
        category: decision.category,
      };
    case 'pricing':
      return {
        primaryKeyword: `${decision.tool.name} pricing ${CURRENT_YEAR}`,
        title: `${decision.tool.name} Pricing ${CURRENT_YEAR}: Plans, Costs, and Best Fit`,
        description: `A research-backed breakdown of ${decision.tool.name} pricing, plan differences, upgrade thresholds, and value for money in ${CURRENT_YEAR}.`,
        type: 'pricing' as ContentType,
        toolSlugs: [decision.tool.slug],
        category: decision.tool.category,
      };
    case 'alternatives':
      return {
        primaryKeyword: `${decision.tool.name} alternatives ${CURRENT_YEAR}`,
        title: `Best ${decision.tool.name} Alternatives in ${CURRENT_YEAR}: Better Value, Better Fit, or Both?`,
        description: `Research-backed alternatives to ${decision.tool.name}, focused on price, fit, and the situations where switching makes sense.`,
        type: 'guide' as ContentType,
        toolSlugs: [decision.tool.slug, ...decision.alternatives.map((tool) => tool.slug)],
        category: decision.tool.category,
      };
    case 'guide':
      return {
        primaryKeyword: decision.keyword,
        title: decision.topic,
        description: `A practical guide to ${decision.topic} built from live research, official documentation, and product data.`,
        type: 'guide' as ContentType,
        toolSlugs: [decision.tool.slug],
        category: decision.tool.category,
      };
  }
}

function officialDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function dedupeSources(sources: ResearchBundle['sources']): ResearchBundle['sources'] {
  const seen = new Set<string>();
  const unique = [] as ResearchBundle['sources'];

  for (const source of sources) {
    if (!source?.url) continue;
    if (seen.has(source.url)) continue;
    seen.add(source.url);
    unique.push(source);
  }

  return unique;
}

function scoreEvidence(sources: ResearchBundle['sources'], mustIncludeDomain?: string): number {
  const uniqueDomains = new Set(sources.map((source: any) => source.domain)).size;
  const officialBonus =
    mustIncludeDomain && sources.some((source: any) => source.domain === mustIncludeDomain) ? 20 : 0;
  const sourceVolume = Math.min(40, sources.length * 5);
  const diversity = Math.min(20, uniqueDomains * 4);
  return Math.min(100, 20 + officialBonus + sourceVolume + diversity);
}

export async function buildResearchBundle(
  decision: ContentDecision,
  options: GeneratorOptions = {},
): Promise<ResearchBundle> {
  if (!decision) throw new Error('No content decision');
  const queries: SearchQuery[] = [];
  const fast = options.fast === true;

  if (decision.type === 'review' || decision.type === 'pricing') {
    const domain = officialDomain(decision.tool.url);
    queries.push(
      {
        query: `${decision.tool.name} official pricing ${CURRENT_YEAR}`,
        reason: 'Verify current plans and official pricing details',
        includeDomains: domain ? [domain] : undefined,
      },
      {
        query: `${decision.tool.name} official documentation features ${CURRENT_YEAR}`,
        reason: 'Verify current product capabilities from official docs',
        includeDomains: domain ? [domain] : undefined,
      },
    );

    if (!fast) {
      queries.push(
        {
          query: `${decision.tool.name} release notes changelog ${CURRENT_YEAR}`,
          reason: 'Check recent product changes and momentum',
          topic: 'news',
        },
        {
          query: `${decision.tool.name} reviews comparison ${CURRENT_YEAR}`,
          reason: 'Collect third-party commentary on tradeoffs and fit',
        },
      );
    }
  } else if (decision.type === 'comparison') {
    queries.push(
      {
        query: `${decision.toolA.name} vs ${decision.toolB.name} ${CURRENT_YEAR}`,
        reason: 'Map head-to-head comparison intent and market framing',
      },
      {
        query: `${decision.toolA.name} official pricing ${CURRENT_YEAR}`,
        reason: `Verify official pricing for ${decision.toolA.name}`,
        includeDomains: [officialDomain(decision.toolA.url)].filter(Boolean),
      },
    );

    if (!fast) {
      queries.push(
        {
          query: `${decision.toolB.name} official pricing ${CURRENT_YEAR}`,
          reason: `Verify official pricing for ${decision.toolB.name}`,
          includeDomains: [officialDomain(decision.toolB.url)].filter(Boolean),
        },
        {
          query: `${decision.toolA.name} ${decision.toolB.name} release notes ${CURRENT_YEAR}`,
          reason: 'Check current feature momentum and positioning',
          topic: 'news',
        },
      );
    }
  } else if (decision.type === 'roundup') {
    queries.push(
      {
        query: `best ${decision.categoryLabel} ai tools ${CURRENT_YEAR}`,
        reason: 'Map current commercial intent and list framing',
      },
      {
        query: `${decision.categoryLabel} ai tools pricing ${CURRENT_YEAR}`,
        reason: 'Capture pricing and buying angles across the market',
      },
    );

    if (!fast) {
      queries.push(
        {
          query: `${decision.categoryLabel} ai tools use cases ${CURRENT_YEAR}`,
          reason: 'Gather real jobs-to-be-done and decision criteria',
        },
        {
          query: `${decision.categoryLabel} ai tools for teams ${CURRENT_YEAR}`,
          reason: 'Find business-facing intent and team-buying signals',
        },
      );
    }
  } else if (decision.type === 'alternatives') {
    const domain = officialDomain(decision.tool.url);
    queries.push(
      {
        query: `${decision.tool.name} alternatives ${CURRENT_YEAR}`,
        reason: 'Map switch intent and substitute demand',
      },
      {
        query: `${decision.tool.name} official pricing ${CURRENT_YEAR}`,
        reason: 'Verify official pricing for the anchor tool',
        includeDomains: domain ? [domain] : undefined,
      },
    );

    if (!fast) {
      queries.push(
        {
          query: `${decision.tool.name} competitors comparison ${CURRENT_YEAR}`,
          reason: 'Find relevant replacement framing and tradeoffs',
        },
        {
          query: `${decision.tool.name} release notes ${CURRENT_YEAR}`,
          reason: 'Check current product movement and momentum',
          topic: 'news',
        },
      );
    }
  } else if (decision.type === 'guide') {
    const domain = officialDomain(decision.tool.url);
    queries.push(
      {
        query: `${decision.tool.name} official docs tutorial ${CURRENT_YEAR}`,
        reason: 'Get official setup and workflow guidance',
        includeDomains: domain ? [domain] : undefined,
      },
      {
        query: `${decision.tool.name} use cases ${CURRENT_YEAR}`,
        reason: 'Gather practical workflow patterns',
      },
    );

    if (!fast) {
      queries.push({
        query: `${decision.tool.name} release notes ${CURRENT_YEAR}`,
        reason: 'Check freshness of product capabilities',
        topic: 'news',
      });
    }
  }

  const result: any = await runSearchQueries(queries);
  const sources = dedupeSources(
    (result?.sources ?? []).map((source: any, index: number) => ({
      title: source.title,
      url: source.url,
      domain: officialDomain(source.url),
      snippet: source.snippet,
      publishedAt: source.publishedAt,
      reason: queries[index % Math.max(1, queries.length)]?.reason ?? 'Supporting evidence',
    })),
  );

  const mustIncludeDomain =
    decision?.type === 'review' ||
    decision?.type === 'pricing' ||
    decision?.type === 'alternatives' ||
    decision?.type === 'guide'
      ? officialDomain(decision.tool.url)
      : decision?.type === 'comparison'
        ? officialDomain(decision.toolA.url)
        : undefined;
  const evidenceScore = scoreEvidence(sources, mustIncludeDomain);

  return {
    provider: result?.provider ?? 'unknown',
    generatedAt: new Date().toISOString(),
    queries: queries.map((query) => query.query),
    sources,
    evidenceScore,
    freshness: fast ? 'live-web-fast' : 'live-web',
    methodology: [
      'Live web search using the configured search provider',
      'Preference for official pricing pages, documentation, release notes, and high-trust market coverage',
      fast ? 'Fast mode enabled to reduce generation latency' : 'Full research mode enabled',
      'Editorial synthesis based on sourced facts and structured product data',
    ],
  } as ResearchBundle;
}

function relatedInternalLinks(decision: ContentDecision, desiredCount = 4): Array<{ href: string; label: string }> {
  const summary = summarizeDecision(decision);
  const links: Array<{ href: string; label: string }> = [];

  for (const slug of summary.toolSlugs.slice(0, Math.max(1, desiredCount))) {
    links.push({ href: `/tools/${slug}`, label: `See the ${slug.replace(/-/g, ' ')} tool profile` });
    links.push({ href: `/blog/${slug}-review-${CURRENT_YEAR}`, label: `Read the ${slug.replace(/-/g, ' ')} review` });
    links.push({ href: `/blog/${slug}-pricing-${CURRENT_YEAR}`, label: `Check ${slug.replace(/-/g, ' ')} pricing` });
    links.push({ href: `/blog/${slug}-alternatives-${CURRENT_YEAR}`, label: `Explore ${slug.replace(/-/g, ' ')} alternatives` });
  }

  const seen = new Set<string>();
  return links.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  }).slice(0, desiredCount);
}

export function buildPrompt(
  decision: ContentDecision,
  research: ResearchBundle,
  options: GeneratorOptions = {},
): string {
  const summary = summarizeDecision(decision);
  const sourceList = (research.sources ?? [])
    .slice(0, 12)
    .map(
      (source: any, index: number) =>
        `${index + 1}. ${source.title} | ${source.domain} | ${source.url}\nReason: ${source.reason ?? 'Supporting evidence'}\nSnippet: ${source.snippet}`,
    )
    .join('\n\n');

  const minWords = Math.max(900, Number(options.minWords ?? (options.fast ? 1200 : 1800)));
  const faqCount = Math.max(3, Number(options.faqCount ?? 5));
  const internalLinkCount = Math.max(2, Number(options.internalLinkCount ?? 4));
  const internalLinks = relatedInternalLinks(decision, internalLinkCount)
    .map((link, index) => `${index + 1}. ${link.label} -> ${link.href}`)
    .join('\n');

  return `You are ${BRAND_EDITOR ?? 'ComparAITools Research Desk'}, writing a ${summary.type} article for a commercial AI tools site.

Goal:
- Write a genuinely useful, SEO-strong, human-readable article.
- Use only supported facts from the research bundle and tool data.
- Be explicit about tradeoffs.
- No fake personal testing. No pretending you used the product unless evidence explicitly supports it.
- Output clean HTML only for the article body. No markdown. No code fences.

Length and quality rules:
- Write at least ${minWords} words.
- Do not be brief.
- Expand each section with specific buyer guidance, tradeoffs, pricing nuance, and real-world fit.
- Make the article strong enough to compete for bottom-of-funnel and commercial-intent queries.
- Include ${faqCount} FAQ items.
- Naturally include at least ${internalLinkCount} internal links using these URLs where they fit:
${internalLinks}

Article brief:
Title: ${summary.title}
Primary keyword: ${summary.primaryKeyword}
Secondary context: ${(summary.toolSlugs ?? []).join(', ')}
Date context: ${TODAY}

Research bundle:
${sourceList}

Required structure:
- Intro with buying-intent context
- Quick verdict / who it is for
- Pricing and plan breakdown
- Feature depth and workflow fit
- Strengths and tradeoffs
- Who should buy it vs who should skip it
- Best alternatives or comparisons when relevant
- Value for money analysis
- Final verdict
- FAQ section with ${faqCount} short FAQs

Important HTML rules:
- Use semantic HTML: <p>, <h2>, <h3>, <ul>, <li>, <table> only when useful.
- Add internal links with normal <a href="/..."></a> tags.
- Do not mention that you are an AI.
- Do not invent facts not grounded in the research bundle or tool data.
- Do not add raw source URLs inside the main article body.`;
}

export function generateSEOMetadata(
  decision: ContentDecision,
  content: string,
): Pick<
  BlogPost,
  'title' | 'metaTitle' | 'metaDescription' | 'primaryKeyword' | 'keywords' | 'excerpt' | 'wordCount' | 'readingTime' | 'schemaOrg'
> {
  const summary = summarizeDecision(decision);
  const wordCount = stripHtml(content).split(/\s+/).filter(Boolean).length;

  return {
    title: summary.title,
    metaTitle: summary.title,
    metaDescription: summary.description,
    primaryKeyword: summary.primaryKeyword,
    keywords: [summary.primaryKeyword, ...summary.toolSlugs, `${summary.category} ai tools`, `ai tools ${CURRENT_YEAR}`],
    excerpt: summary.description,
    wordCount,
    readingTime: estimateReadingTime(wordCount),
    schemaOrg: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: summary.title,
      description: summary.description,
    },
  };
}

async function askAnthropicForHtml(prompt: string, maxTokens = 3200): Promise<string> {
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
      temperature: 0.2,
      system: 'Return clean HTML only. No markdown. No outer code fences.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic error ${response.status}`);
  }

  const data = await response.json();
  return data.content?.find((part: any) => part.type === 'text')?.text ?? '';
}

async function buildDecisionFromOpportunity(opportunity: Opportunity): Promise<ContentDecision> {
  const allTools = await loadAllTools();
  const bySlug = new Map(allTools.map((tool) => [tool.slug, tool]));
  const pageType = (opportunity.pageType || '').toLowerCase();
  const toolSlugs = opportunity.toolSlugs ?? [];

  if (pageType === 'pricing' || pageType === 'review') {
    const tool =
      bySlug.get(toolSlugs[0] || '') ??
      allTools.find((item) => item.slug === slugify(opportunity.title.split(' Pricing')[0] || opportunity.title.split(' Review')[0] || ''));
    if (!tool) throw new Error(`Tool not found for ${pageType}: ${toolSlugs[0] || opportunity.title}`);
    return pageType === 'pricing' ? { type: 'pricing', tool } : { type: 'review', tool };
  }

  if (pageType === 'alternatives') {
    const tool =
      bySlug.get(toolSlugs[0] || '') ??
      allTools.find((item) => item.slug === slugify(opportunity.title.replace(/^Best\s+/i, '').replace(/ Alternatives.*$/i, '')));
    if (!tool) throw new Error(`Tool not found for alternatives: ${toolSlugs[0] || opportunity.title}`);
    const alternatives = sameCategoryTools(tool, allTools).slice(0, 5);
    return { type: 'alternatives', tool, alternatives };
  }

  if (pageType === 'comparison' || pageType === 'versus') {
    const toolA = bySlug.get(toolSlugs[0] || '');
    const toolB = bySlug.get(toolSlugs[1] || '');
    if (!toolA || !toolB) throw new Error(`Tools not found for comparison: ${toolSlugs.join(', ')}`);
    return { type: 'comparison', toolA, toolB };
  }

  if (pageType === 'best-for-role' || pageType === 'roundup' || pageType === 'free-tools') {
    const category = opportunity.clusterKey?.replace(/^ai-/, '') || opportunity.pageType || 'productivity';
    const tools = allTools.filter(
      (tool) =>
        tool.slug &&
        (!toolSlugs.length ||
          toolSlugs.includes(tool.slug) ||
          tool.category.includes(category) ||
          (tool.categoryLabel || '').toLowerCase().includes(category.replace(/-/g, ' '))),
    );
    const chosen = tools.length ? tools : allTools.slice(0, 5);
    return {
      type: 'roundup',
      category: chosen[0]?.category ?? category,
      categoryLabel: chosen[0]?.categoryLabel ?? opportunity.clusterLabel ?? 'AI tools',
      tools: chosen.slice(0, 6),
    };
  }

  if (pageType === 'workflow-guide' || pageType === 'guide') {
    const tool =
      bySlug.get(toolSlugs[0] || '') ??
      allTools.find((item) => item.slug === slugify(opportunity.title.replace(/^How to Use\s+/i, '').replace(/\s+to\s+.*$/i, '')));
    if (!tool) throw new Error(`Tool not found for guide: ${toolSlugs[0] || opportunity.title}`);
    return {
      type: 'guide',
      tool,
      topic: opportunity.title,
      keyword: opportunity.primaryKeyword || `how to use ${tool.name}`,
    };
  }

  throw new Error(`Unsupported opportunity pageType=${opportunity.pageType}`);
}

function normalizeHtmlContent(html: string): string {
  return String(html || '').replace(/```html/gi, '').replace(/```/g, '').trim();
}

function appendRelatedReadingSection(content: string, decision: ContentDecision, linkCount = 4): string {
  const links = relatedInternalLinks(decision, linkCount);
  if (!links.length) return content;

  const block = `
<section>
  <h2>Related reading</h2>
  <ul>
    ${links.map((link) => `<li><a href="${link.href}">${link.label}</a></li>`).join('\n    ')}
  </ul>
</section>`;

  return `${content}\n${block}`;
}

function deriveTitleFromOpportunity(opportunity: Opportunity, decision: ContentDecision): string {
  const summary = summarizeDecision(decision);
  return opportunity.title || summary.title;
}

export async function generatePostFromOpportunity(
  opportunity: Opportunity,
  options: GeneratorOptions = {},
): Promise<any> {
  const decision = await buildDecisionFromOpportunity(opportunity);
  const research = await buildResearchBundle(decision, options);

  const maxTokens = Math.max(1400, Number(options.maxTokens ?? (options.fast ? 2200 : 3600)));
  const internalLinkCount = Math.max(2, Number(options.internalLinkCount ?? 4));
  const minWords = Math.max(900, Number(options.minWords ?? (options.fast ? 1200 : 1800)));

  const prompt = buildPrompt(decision, research, options);
  let rawHtml = await askAnthropicForHtml(prompt, maxTokens);
  let content = normalizeHtmlContent(rawHtml);
  let seo = generateSEOMetadata(decision, content);

  // Retry once if the draft is much shorter than requested.
  if (seo.wordCount < minWords * 0.75) {
    const retryPrompt = `${prompt}\n\nYour previous draft was too short. Rewrite it with more depth and make sure it exceeds ${minWords} words.`;
    rawHtml = await askAnthropicForHtml(retryPrompt, Math.max(maxTokens, 3000));
    content = normalizeHtmlContent(rawHtml);
    seo = generateSEOMetadata(decision, content);
  }

  content = appendRelatedReadingSection(content, decision, internalLinkCount);
  seo = generateSEOMetadata(decision, content);

  const summary = summarizeDecision(decision);
  const title = deriveTitleFromOpportunity(opportunity, decision);
  const slug = generateSlug(decision);
  const { title: _seoTitle, schemaOrg: seoSchemaOrg, ...seoRest } = seo;

  const post = {
    slug,
    title,
    type: summary.type,
    content,
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toolSlugs: summary.toolSlugs,
    category: summary.category,
    schemaOrg: {
      ...seoSchemaOrg,
      author: { '@type': 'Organization', name: BRAND_EDITOR ?? 'ComparAITools Research Desk' },
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      mainEntityOfPage: `/blog/${slug}`,
    },
    ...seoRest,
    research,
    evidenceScore: research.evidenceScore,
    sourceCount: research.sources.length,
    sourceUrls: research.sources.map((source: any) => source.url),
  } satisfies Partial<BlogPost> & Record<string, any>;

  return {
    slug,
    title,
    type: summary.type,
    wordCount: seo.wordCount,
    readingTime: seo.readingTime,
    sourceCount: research.sources.length,
    evidenceScore: research.evidenceScore,
    research,
    post,
  };
}

export async function generateContentFromOpportunity(opportunity: Opportunity, options: GeneratorOptions = {}): Promise<any> {
  return generatePostFromOpportunity(opportunity, options);
}

export async function generatePost(opportunity: Opportunity, options: GeneratorOptions = {}): Promise<any> {
  return generatePostFromOpportunity(opportunity, options);
}

export async function generateContent(opportunity: Opportunity, options: GeneratorOptions = {}): Promise<any> {
  return generatePostFromOpportunity(opportunity, options);
}
