import tools from '@/data/tools.json';
import type { BlogPost, GenerationState, ResearchBundle, Tool, ContentType } from '@/lib/types';
import { BRAND_EDITOR, CURRENT_YEAR } from '@/lib/site';
import { estimateReadingTime, makePairKey, slugify, stripHtml } from '@/lib/utils';
import { runSearchQueries, type SearchQuery } from '@/lib/search-provider';

const TOOL_LIST = tools as Tool[];
const TODAY = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export type ContentDecision =
  | { type: 'review'; tool: Tool }
  | { type: 'comparison'; toolA: Tool; toolB: Tool }
  | { type: 'roundup'; category: string; categoryLabel: string; tools: Tool[] }
  | { type: 'pricing'; tool: Tool }
  | { type: 'alternatives'; tool: Tool; alternatives: Tool[] }
  | { type: 'guide'; tool: Tool; topic: string; keyword: string }
  | null;

function sameCategoryTools(tool: Tool): Tool[] {
  return TOOL_LIST
    .filter((candidate) => candidate.category === tool.category && candidate.slug !== tool.slug)
    .sort((a, b) => b.rating - a.rating);
}

export function selectNextContent(state: GenerationState): ContentDecision {
  const reviewTarget = TOOL_LIST.find((tool) => !state.reviewedTools.includes(tool.slug));
  if (reviewTarget) return { type: 'review', tool: reviewTarget };

  for (const tool of TOOL_LIST) {
    if (!state.pricingDone.includes(tool.slug)) {
      return { type: 'pricing', tool };
    }
  }

  for (const tool of TOOL_LIST) {
    const alternatives = sameCategoryTools(tool).slice(0, 4);
    if (alternatives.length >= 2 && !state.guidesDone.includes(`${tool.slug}-alternatives`)) {
      return { type: 'alternatives', tool, alternatives };
    }
  }

  for (const tool of TOOL_LIST) {
    const candidate = sameCategoryTools(tool)[0];
    if (!candidate) continue;
    const pairKey = makePairKey(tool.slug, candidate.slug);
    if (!state.comparedPairs.includes(pairKey)) {
      return { type: 'comparison', toolA: tool, toolB: candidate };
    }
  }

  const byCategory = new Map<string, Tool[]>();
  for (const tool of TOOL_LIST) {
    const bucket = byCategory.get(tool.category) ?? [];
    bucket.push(tool);
    byCategory.set(tool.category, bucket);
  }
  for (const [category, items] of byCategory.entries()) {
    if (items.length >= 3 && !state.roundupsDone.includes(category)) {
      return {
        type: 'roundup',
        category,
        categoryLabel: items[0].categoryLabel,
        tools: items.sort((a, b) => b.rating - a.rating).slice(0, 6),
      };
    }
  }

  const guideTarget = TOOL_LIST[0];
  return {
    type: 'guide',
    tool: guideTarget,
    topic: `${guideTarget.name} for teams in ${CURRENT_YEAR}`,
    keyword: `${guideTarget.name} for teams`,
  };
}

export function generateSlug(decision: ContentDecision): string {
  if (!decision) return '';
  switch (decision.type) {
    case 'review':
      return `${decision.tool.slug}-review-${CURRENT_YEAR}`;
    case 'comparison':
      return `${[decision.toolA.slug, decision.toolB.slug].sort().join('-vs-')}`;
    case 'roundup':
      return `best-${decision.category}-ai-tools-${CURRENT_YEAR}`;
    case 'pricing':
      return `${decision.tool.slug}-pricing-${CURRENT_YEAR}`;
    case 'alternatives':
      return `${decision.tool.slug}-alternatives-${CURRENT_YEAR}`;
    case 'guide':
      return `${decision.tool.slug}-${slugify(decision.keyword)}-${CURRENT_YEAR}`;
  }
}

export function summarizeDecision(decision: ContentDecision): { primaryKeyword: string; title: string; description: string; type: ContentType; toolSlugs: string[]; category: string } {
  if (!decision) throw new Error('No content decision');
  switch (decision.type) {
    case 'review':
      return {
        primaryKeyword: `${decision.tool.name} review ${CURRENT_YEAR}`,
        title: `${decision.tool.name} Review ${CURRENT_YEAR}: Pricing, Strengths, Weaknesses, and Best Use Cases`,
        description: `Source-backed ${decision.tool.name} review with pricing, best use cases, limitations, and alternatives for ${CURRENT_YEAR}.`,
        type: 'review',
        toolSlugs: [decision.tool.slug],
        category: decision.tool.category,
      };
    case 'comparison':
      return {
        primaryKeyword: `${decision.toolA.name} vs ${decision.toolB.name}`,
        title: `${decision.toolA.name} vs ${decision.toolB.name}: Which One Makes More Sense in ${CURRENT_YEAR}?`,
        description: `A source-backed comparison of ${decision.toolA.name} and ${decision.toolB.name}, including pricing, strengths, tradeoffs, and who each tool fits best.`,
        type: 'comparison',
        toolSlugs: [decision.toolA.slug, decision.toolB.slug],
        category: decision.toolA.category,
      };
    case 'roundup':
      return {
        primaryKeyword: `best ${decision.categoryLabel.toLowerCase()} ai tools ${CURRENT_YEAR}`,
        title: `Best ${decision.categoryLabel} AI Tools in ${CURRENT_YEAR}: What Actually Stands Out`,
        description: `A curated, source-backed roundup of the best ${decision.categoryLabel.toLowerCase()} AI tools in ${CURRENT_YEAR}, with tradeoffs and buying advice.`,
        type: 'roundup',
        toolSlugs: decision.tools.map((tool) => tool.slug),
        category: decision.category,
      };
    case 'pricing':
      return {
        primaryKeyword: `${decision.tool.name} pricing ${CURRENT_YEAR}`,
        title: `${decision.tool.name} Pricing ${CURRENT_YEAR}: Plans, Hidden Tradeoffs, and Best Fit`,
        description: `A source-backed breakdown of ${decision.tool.name} pricing, plan differences, upgrade thresholds, and value for money in ${CURRENT_YEAR}.`,
        type: 'pricing',
        toolSlugs: [decision.tool.slug],
        category: decision.tool.category,
      };
    case 'alternatives':
      return {
        primaryKeyword: `${decision.tool.name} alternatives ${CURRENT_YEAR}`,
        title: `Best ${decision.tool.name} Alternatives in ${CURRENT_YEAR}: Better Value, Better Fit, or Both?`,
        description: `Source-backed alternatives to ${decision.tool.name}, focused on price, fit, and the scenarios where switching actually makes sense.`,
        type: 'alternatives',
        toolSlugs: [decision.tool.slug, ...decision.alternatives.map((tool) => tool.slug)],
        category: decision.tool.category,
      };
    case 'guide':
      return {
        primaryKeyword: decision.keyword,
        title: decision.topic,
        description: `A practical guide to ${decision.topic} backed by live research and editorial analysis.`,
        type: 'guide',
        toolSlugs: [decision.tool.slug],
        category: decision.tool.category,
      };
  }
}

export async function buildResearchBundle(decision: ContentDecision): Promise<ResearchBundle> {
  if (!decision) throw new Error('No content decision');
  const queries: SearchQuery[] = [];

  if (decision.type === 'review' || decision.type === 'pricing') {
    queries.push(
      {
        query: `${decision.tool.name} official pricing ${CURRENT_YEAR}`,
        reason: 'Verify current plans and official pricing details',
        includeDomains: [new URL(decision.tool.url).hostname.replace(/^www\./, '')],
      },
      {
        query: `${decision.tool.name} features release notes ${CURRENT_YEAR}`,
        reason: 'Verify current features, launches, and major product changes',
      },
      {
        query: `${decision.tool.name} reviews comparison ${CURRENT_YEAR}`,
        reason: 'Collect third-party market commentary and user-facing tradeoffs',
      },
    );
  }

  if (decision.type === 'comparison') {
    queries.push(
      { query: `${decision.toolA.name} vs ${decision.toolB.name} ${CURRENT_YEAR}`, reason: 'Identify head-to-head market framing and intent' },
      { query: `${decision.toolA.name} official pricing ${CURRENT_YEAR}`, reason: `Verify official pricing for ${decision.toolA.name}`, includeDomains: [new URL(decision.toolA.url).hostname.replace(/^www\./, '')] },
      { query: `${decision.toolB.name} official pricing ${CURRENT_YEAR}`, reason: `Verify official pricing for ${decision.toolB.name}`, includeDomains: [new URL(decision.toolB.url).hostname.replace(/^www\./, '')] },
      { query: `${decision.toolA.name} ${decision.toolB.name} release notes ${CURRENT_YEAR}`, reason: 'Check current feature shifts and momentum' },
    );
  }

  if (decision.type === 'roundup') {
    queries.push(
      { query: `best ${decision.categoryLabel} ai tools ${CURRENT_YEAR}`, reason: 'Map current intent and list framing' },
      { query: `${decision.categoryLabel} ai tools pricing ${CURRENT_YEAR}`, reason: 'Capture commercial angles and buying tradeoffs' },
      { query: `${decision.categoryLabel} ai tools use cases ${CURRENT_YEAR}`, reason: 'Gather practical jobs-to-be-done and selection criteria' },
      { query: `${decision.categoryLabel} ai tools for teams ${CURRENT_YEAR}`, reason: 'Find business-facing intent and buying signals', },
    );
  }

  if (decision.type === 'alternatives') {
    queries.push(
      { query: `${decision.tool.name} alternatives ${CURRENT_YEAR}`, reason: 'Map switching intent and competitive alternatives' },
      { query: `${decision.tool.name} official pricing ${CURRENT_YEAR}`, reason: `Verify official pricing for ${decision.tool.name}`, includeDomains: [new URL(decision.tool.url).hostname.replace(/^www\./, '')] },
      { query: `${decision.tool.categoryLabel} ai tools ${CURRENT_YEAR}`, reason: 'Find current market substitutes with strong fit' },
    );
  }

  if (decision.type === 'guide') {
    queries.push(
      { query: `${decision.topic} ${CURRENT_YEAR}`, reason: 'Gather live market context for the guide topic' },
      { query: `${decision.tool.name} official documentation ${CURRENT_YEAR}`, reason: `Verify current ${decision.tool.name} capabilities`, includeDomains: [new URL(decision.tool.url).hostname.replace(/^www\./, '')] },
    );
  }

  const result = await runSearchQueries(queries);
  const evidenceScore = Math.min(100, result.sources.length * 10);

  return {
    provider: result.provider,
    generatedAt: new Date().toISOString(),
    queries: queries.map((query) => query.query),
    sources: result.sources,
    evidenceScore,
    freshness: 'live-web',
    methodology: [
      'Live web search using a configured search provider',
      'Preference for official pricing pages, release notes, and high-trust product coverage',
      'Editorial synthesis with explicit tradeoffs instead of fake first-person testing claims',
    ],
  };
}

export function buildPrompt(decision: ContentDecision, research: ResearchBundle): string {
  const summary = summarizeDecision(decision);
  const sourceList = research.sources
    .slice(0, 12)
    .map((source, index) => `${index + 1}. ${source.title} | ${source.domain} | ${source.url}
Reason: ${source.reason}
Snippet: ${source.snippet}`)
    .join('\n\n');

  const decisionContext = (() => {
    if (!decision) return '';
    switch (decision.type) {
      case 'review':
      case 'pricing':
        return `Tool data:
${JSON.stringify(decision.tool, null, 2)}`;
      case 'comparison':
        return `Tool A:
${JSON.stringify(decision.toolA, null, 2)}

Tool B:
${JSON.stringify(decision.toolB, null, 2)}`;
      case 'roundup':
        return `Roundup tools:
${JSON.stringify(decision.tools, null, 2)}`;
      case 'alternatives':
        return `Primary tool:
${JSON.stringify(decision.tool, null, 2)}

Alternatives:
${JSON.stringify(decision.alternatives, null, 2)}`;
      case 'guide':
        return `Primary tool:
${JSON.stringify(decision.tool, null, 2)}

Guide topic: ${decision.topic}`;
    }
  })();

  return `You are the editorial research desk for ${BRAND_EDITOR}. Write a genuinely useful, source-backed commercial article designed to rank because it helps buyers make a better software decision.

CURRENT DATE: ${TODAY}
ARTICLE TYPE: ${summary.type}
PRIMARY KEYWORD: ${summary.primaryKeyword}
TITLE GOAL: ${summary.title}
META DESCRIPTION GOAL: ${summary.description}

MANDATORY RULES:
- Do NOT claim personal use, hands-on testing, subscriptions, or fake experiments.
- Do NOT write phrases like "I tested", "we tested", "our team found", or invent a founder persona.
- Base factual statements on the supplied live research sources or the structured tool data.
- Add original value by explaining tradeoffs, fit, switching costs, onboarding friction, and decision criteria.
- When evidence is incomplete or mixed, say so plainly.
- Keep the tone sharp, commercial, and human. No fluff, no AI clichés, no vague hype.
- Mention the exact update date in the intro.
- Output ONLY semantic HTML inside a single <article> element.
- Include one <section id="quick-answer"> near the top with a direct recommendation.
- Include one <section id="who-should-buy"> and one <section id="who-should-skip">.
- Include one <section id="switching-costs"> when another tool is relevant.
- Include one <section id="methodology"> describing how the article was assembled from live research and product data.
- Include one <section id="sources"> with an ordered list of 5-12 cited sources using the supplied titles and URLs.
- Include internal links where natural to /tools/[slug], /compare/[slugA-vs-slugB], /category/[category], and /blog.
- Keep the article between 1,500 and 2,300 words.

STRUCTURE TO FOLLOW:
1. Intro with current context and what changed recently.
2. Quick answer / verdict.
3. Pricing or product snapshot.
4. Best-fit scenarios.
5. Who should buy / who should skip.
6. Where the tool wins / loses.
7. Alternatives or comparison angle.
8. Practical buying advice.
9. Methodology.
10. Sources.

WRITE FOR THESE OUTCOMES:
- Satisfy the searcher without sounding generic.
- Make at least three non-obvious buying points.
- Explain why someone would regret the wrong choice.
- Use short tables or bullet lists when it clarifies a decision.

Use this decision context:
${decisionContext}

Use these live research sources:
${sourceList}
`;
}

export function generateSEOMetadata(decision: ContentDecision, content: string): Pick<BlogPost, 'title' | 'metaTitle' | 'metaDescription' | 'primaryKeyword' | 'keywords' | 'excerpt' | 'wordCount' | 'readingTime' | 'schemaOrg'> {
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
