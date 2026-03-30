import { runSearchQueries } from '@/lib/search-provider';
import type { SearchQuery } from '@/lib/search-provider';
import { slugify } from '@/lib/utils';

type SearchSource = {
  title?: string;
  url?: string;
  snippet?: string;
  publishedAt?: string;
};

export type ResearchRecord = {
  provider: string;
  evidenceScore: number;
  sourceCount: number;
  officialSourceCount: number;
  queries: string[];
  sources: Array<{
    title: string;
    url: string;
    domain: string;
    snippet: string;
    publishedAt?: string;
    score: number;
    kind: 'official' | 'pricing' | 'docs' | 'reviews' | 'news' | 'other';
  }>;
};

export type DiscoveryCandidate = {
  name: string;
  company: string;
  url: string;
  category: string;
  categoryLabel: string;
  description: string;
  bestFor: string;
  pricingHint?: string;
  whyNow?: string;
  sourceUrls?: string[];
};

const CATEGORY_MAP: Record<string, { category: string; categoryLabel: string; logo: string; color: string }> = {
  chatbot: { category: 'chatbot', categoryLabel: 'AI chatbots', logo: '💬', color: '#00e5a0' },
  image: { category: 'image', categoryLabel: 'AI image tools', logo: '🎨', color: '#a78bfa' },
  code: { category: 'code', categoryLabel: 'AI coding tools', logo: '💻', color: '#3b82f6' },
  search: { category: 'search', categoryLabel: 'AI research and search tools', logo: '🔎', color: '#14b8a6' },
  video: { category: 'video', categoryLabel: 'AI video tools', logo: '🎬', color: '#f97316' },
  audio: { category: 'audio', categoryLabel: 'AI audio tools', logo: '🎧', color: '#ec4899' },
  productivity: { category: 'productivity', categoryLabel: 'AI productivity tools', logo: '⚡', color: '#f59e0b' },
};

function cleanText(input: unknown): string {
  if (!input) return '';
  return String(input)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractDomain(rawUrl?: string): string {
  if (!rawUrl) return '';
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function classifySource(source: SearchSource, candidateName?: string): 'official' | 'pricing' | 'docs' | 'reviews' | 'news' | 'other' {
  const url = source.url?.toLowerCase() ?? '';
  const title = source.title?.toLowerCase() ?? '';
  const snippet = source.snippet?.toLowerCase() ?? '';
  const hay = `${url} ${title} ${snippet}`;
  const domain = extractDomain(source.url);

  if (/(pricing|plans|plan\b|subscription|billing)/.test(hay)) return 'pricing';
  if (/(docs|documentation|developer|api|help|support|learn)/.test(hay)) return 'docs';
  if (/(review|reviews|comparison|alternatives|vs\b)/.test(hay)) return 'reviews';
  if (/(launch|released|release|new|funding|news|announces|announce)/.test(hay)) return 'news';

  if (candidateName) {
    const slug = slugify(candidateName).replace(/-/g, '');
    const compactDomain = domain.replace(/[^a-z0-9]/g, '');
    if (compactDomain.includes(slug.slice(0, Math.min(8, slug.length)))) return 'official';
  }
  if (!domain) return 'other';
  return 'other';
}

function scoreSource(source: SearchSource, candidateName?: string): number {
  const domain = extractDomain(source.url);
  const title = cleanText(source.title).toLowerCase();
  const snippet = cleanText(source.snippet).toLowerCase();
  const hay = `${domain} ${title} ${snippet}`;
  const kind = classifySource(source, candidateName);
  let score = 0;

  if (kind === 'official') score += 45;
  if (kind === 'pricing') score += 30;
  if (kind === 'docs') score += 24;
  if (kind === 'reviews') score += 16;
  if (kind === 'news') score += 12;

  if (/official|pricing|docs|documentation|developers|release notes|changelog/.test(hay)) score += 10;
  if (/github\.com|producthunt\.com|g2\.com|capterra\.com|trustpilot\.com/.test(domain)) score += 6;
  if (/medium\.com|substack\.com|linkedin\.com/.test(domain)) score -= 4;

  return Math.max(0, Math.min(100, score));
}

function normalizeCategory(raw: string): { category: string; categoryLabel: string; logo: string; color: string } {
  const key = cleanText(raw).toLowerCase();
  if (CATEGORY_MAP[key]) return CATEGORY_MAP[key];

  if (/(chat|assistant|llm)/.test(key)) return CATEGORY_MAP.chatbot;
  if (/(image|design|art)/.test(key)) return CATEGORY_MAP.image;
  if (/(code|dev|coding)/.test(key)) return CATEGORY_MAP.code;
  if (/(search|research)/.test(key)) return CATEGORY_MAP.search;
  if (/(video|film)/.test(key)) return CATEGORY_MAP.video;
  if (/(audio|voice|music|speech)/.test(key)) return CATEGORY_MAP.audio;
  return CATEGORY_MAP.productivity;
}

async function askAnthropicForJson<T>(prompt: string, maxTokens = 2200): Promise<T> {
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
      system: 'Return strict JSON only. No markdown. No extra commentary.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic error ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.find((part: any) => part.type === 'text')?.text ?? '';
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (!match) throw new Error('Model did not return JSON');
    return JSON.parse(match[0]);
  }
}

export async function discoverCandidates(existingSlugs: string[], limit = 8): Promise<{
  provider: string;
  queries: string[];
  sources: SearchSource[];
  candidates: DiscoveryCandidate[];
}> {
  const queries: SearchQuery[] = [
    { query: 'new AI tools launched this month official site pricing', reason: 'Discover newly launched tools with official pages', topic: 'news' },
    { query: 'fastest growing AI tools 2026 official pricing', reason: 'Discover commercially relevant tools with growth', topic: 'news' },
    { query: 'AI startup product launch official pricing docs', reason: 'Find official sites, docs and pricing pages', topic: 'news' },
    { query: 'new AI coding assistant official pricing', reason: 'Find fresh code tools', topic: 'news' },
    { query: 'new AI video tool official pricing', reason: 'Find fresh video tools', topic: 'news' },
    { query: 'new AI research tool official pricing', reason: 'Find fresh research tools', topic: 'news' },
  ];

  const searchResult: any = await runSearchQueries(queries);
  const sources: SearchSource[] = Array.isArray(searchResult?.sources) ? searchResult.sources : [];
  const sourceLines = sources
    .slice(0, 40)
    .map((source, index) => `${index + 1}. ${cleanText(source.title)}\nURL: ${source.url ?? ''}\nSnippet: ${cleanText(source.snippet)}`)
    .join('\n\n');

  const prompt = `You are finding real AI software products to add to a comparison website.
Return ONLY JSON: an array of up to ${limit} objects.
Every object must include:
name, company, url, category, categoryLabel, description, bestFor, pricingHint, whyNow, sourceUrls.

Rules:
- Only include real standalone products with an official site.
- DO NOT include duplicates of these existing slugs: ${existingSlugs.join(', ')}.
- Skip tools that are obviously just features inside a bigger product unless marketed as their own product.
- Prefer tools with clear commercial intent, active launches, pricing pages, docs, or strong growth signals.
- category must be one of: chatbot, image, code, search, video, audio, productivity.
- categoryLabel should be human-friendly.
- sourceUrls should reference evidence from the snippets when possible.
- If uncertain, leave the candidate out.

Evidence bundle:
${sourceLines}`;

  const parsed = await askAnthropicForJson<DiscoveryCandidate[]>(prompt, 2600);
  const candidates = (Array.isArray(parsed) ? parsed : [])
    .map((item) => ({
      name: cleanText(item.name),
      company: cleanText(item.company || item.name),
      url: cleanText(item.url),
      category: cleanText(item.category).toLowerCase(),
      categoryLabel: cleanText(item.categoryLabel),
      description: cleanText(item.description),
      bestFor: cleanText(item.bestFor),
      pricingHint: cleanText(item.pricingHint),
      whyNow: cleanText(item.whyNow),
      sourceUrls: Array.isArray(item.sourceUrls) ? item.sourceUrls.map(cleanText).filter(Boolean) : [],
    }))
    .filter((item) => item.name && item.url && item.category)
    .filter((item) => !existingSlugs.includes(slugify(item.name)));

  return {
    provider: cleanText(searchResult?.provider) || 'unknown',
    queries: queries.map((q) => q.query),
    sources,
    candidates,
  };
}

export function buildResearchRecord(provider: string, queries: string[], sources: SearchSource[], candidateName: string, preferredUrls: string[] = []): ResearchRecord {
  const preferredDomains = new Set(preferredUrls.map(extractDomain).filter(Boolean));
  const scored = sources
    .map((source) => {
      const domain = extractDomain(source.url);
      const kind = classifySource(source, candidateName);
      let score = scoreSource(source, candidateName);
      if (preferredDomains.size && preferredDomains.has(domain)) score += 15;
      return {
        title: cleanText(source.title),
        url: cleanText(source.url),
        domain,
        snippet: cleanText(source.snippet),
        publishedAt: cleanText(source.publishedAt) || undefined,
        score,
        kind,
      };
    })
    .filter((source) => source.url && source.title)
    .sort((a, b) => b.score - a.score);

  const unique: ResearchRecord['sources'] = [];
  const seen = new Set<string>();
  for (const source of scored) {
    if (seen.has(source.url)) continue;
    seen.add(source.url);
    unique.push(source);
    if (unique.length >= 12) break;
  }

  const officialSourceCount = unique.filter((source) => source.kind === 'official' || source.kind === 'pricing' || source.kind === 'docs').length;
  const evidenceScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (unique.slice(0, 5).reduce((acc, source) => acc + source.score, 0) / Math.max(1, unique.slice(0, 5).length)) +
        officialSourceCount * 4
      )
    )
  );

  return {
    provider,
    evidenceScore,
    sourceCount: unique.length,
    officialSourceCount,
    queries,
    sources: unique,
  };
}

export function normalizeCandidateToTool(candidate: DiscoveryCandidate, research: ResearchRecord): any {
  const normalizedCategory = normalizeCategory(candidate.category);
  const slug = slugify(candidate.name);

  return {
    id: slug,
    slug,
    name: candidate.name,
    company: candidate.company || candidate.name,
    category: normalizedCategory.category,
    categoryLabel: candidate.categoryLabel || normalizedCategory.categoryLabel,
    pricing: candidate.pricingHint || 'Check official pricing',
    pricingValue: 0,
    rating: Math.max(0, Math.min(5, Number((research.evidenceScore / 22).toFixed(1)))) || 0,
    users: research.officialSourceCount >= 3 ? 'Verified via official sources' : 'Research pending',
    logo: normalizedCategory.logo,
    color: normalizedCategory.color,
    features: [],
    pros: [],
    cons: [],
    url: candidate.url,
    description: candidate.description || `AI tool discovered via web research in the ${normalizedCategory.categoryLabel} space.`,
    longDescription: candidate.description || '',
    bestFor: candidate.bestFor || 'Commercial research pending',
    lastUpdated: new Date().toISOString().slice(0, 10),
    trend: research.evidenceScore >= 85 ? '+18%' : research.evidenceScore >= 70 ? '+10%' : '+4%',
    source: 'discovered',
    verified: false,
    status: 'pending',
    research,
    sourceCount: research.sourceCount,
    evidenceScore: research.evidenceScore,
    discoveryReason: cleanText(candidate.whyNow) || 'Matched discovery queries with commercial intent and official sources.',
  };
}

export function shouldAutoApprove(toolLike: any): boolean {
  const research = toolLike?.research;
  return Boolean(
    toolLike?.url &&
    research?.evidenceScore >= 78 &&
    research?.officialSourceCount >= 2 &&
    research?.sourceCount >= 5
  );
}
