import type { ResearchSource } from '@/lib/types';
import { uniqueBy } from '@/lib/utils';

export interface SearchQuery {
  query: string;
  reason: string;
  includeDomains?: string[];
  topic?: 'general' | 'news';
}

export interface SearchResponse {
  provider: string;
  sources: ResearchSource[];
}

const TRUSTED_NEWS = new Set([
  'techcrunch.com',
  'theverge.com',
  'venturebeat.com',
  'wired.com',
  'reuters.com',
  'openai.com',
  'anthropic.com',
  'google.com',
  'blog.google',
  'microsoft.com',
  'notion.so',
  'zapier.com',
]);

async function tavilySearch(search: SearchQuery): Promise<SearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('TAVILY_API_KEY missing');

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query: search.query,
      topic: search.topic ?? 'general',
      search_depth: 'advanced',
      include_answer: false,
      include_raw_content: false,
      max_results: 8,
      include_domains: search.includeDomains,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.status}`);
  }

  const data = await response.json();
  const sources: ResearchSource[] = (data.results ?? []).map((item: any) => ({
    title: item.title ?? item.url,
    url: item.url,
    domain: safeDomain(item.url),
    snippet: item.content ?? '',
    publishedAt: item.published_date,
    score: typeof item.score === 'number' ? item.score : undefined,
    reason: search.reason,
  }));

  return { provider: 'tavily', sources: rankSources(sources, search) };
}

async function serpApiSearch(search: SearchQuery): Promise<SearchResponse> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error('SERPAPI_KEY missing');

  const params = new URLSearchParams({
    engine: 'google',
    q: search.query,
    num: '8',
    api_key: apiKey,
    hl: 'en',
    gl: 'us',
  });
  if (search.includeDomains?.length) {
    params.set('q', `${search.query} ${search.includeDomains.map((domain) => `site:${domain}`).join(' OR ')}`);
  }

  const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`SerpApi search failed: ${response.status}`);
  }

  const data = await response.json();
  const sources: ResearchSource[] = (data.organic_results ?? []).map((item: any) => ({
    title: item.title ?? item.link,
    url: item.link,
    domain: safeDomain(item.link),
    snippet: item.snippet ?? '',
    publishedAt: item.date,
    reason: search.reason,
  }));
  return { provider: 'serpapi', sources: rankSources(sources, search) };
}

function safeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function rankSources(sources: ResearchSource[], search: SearchQuery): ResearchSource[] {
  return sources
    .map((source) => ({
      source,
      weight: scoreSource(source, search),
    }))
    .sort((a, b) => b.weight - a.weight)
    .map((entry) => entry.source);
}

function scoreSource(source: ResearchSource, search: SearchQuery): number {
  let score = source.score ?? 0;
  const domain = source.domain;
  const url = source.url.toLowerCase();
  const title = source.title.toLowerCase();
  const snippet = source.snippet.toLowerCase();

  if (search.includeDomains?.some((candidate) => domain.includes(candidate.replace(/^www\./, '')))) score += 50;
  if (TRUSTED_NEWS.has(domain)) score += 15;
  if (/(pricing|plans|billing|subscription)/.test(url + ' ' + title)) score += 10;
  if (/(docs|documentation|help|support|release|changelog|updates)/.test(url + ' ' + title)) score += 8;
  if (/official|pricing|compare|alternatives/.test(snippet)) score += 3;
  if (domain.includes('reddit.com') || domain.includes('quora.com')) score -= 10;
  if (domain.includes('youtube.com')) score -= 6;
  return score;
}

function capPerDomain(sources: ResearchSource[], maxPerDomain = 2): ResearchSource[] {
  const counts = new Map<string, number>();
  const out: ResearchSource[] = [];
  for (const source of sources) {
    const count = counts.get(source.domain) ?? 0;
    if (count >= maxPerDomain) continue;
    counts.set(source.domain, count + 1);
    out.push(source);
  }
  return out;
}

export async function runSearchQueries(queries: SearchQuery[]): Promise<SearchResponse> {
  const provider = process.env.SEARCH_PROVIDER ?? (process.env.TAVILY_API_KEY ? 'tavily' : process.env.SERPAPI_KEY ? 'serpapi' : 'none');
  if (provider === 'none') {
    throw new Error('No search provider configured. Set SEARCH_PROVIDER and TAVILY_API_KEY or SERPAPI_KEY.');
  }

  const allSources: ResearchSource[] = [];
  for (const query of queries) {
    const result = provider === 'serpapi' ? await serpApiSearch(query) : await tavilySearch(query);
    allSources.push(...result.sources);
  }

  const deduped = uniqueBy(allSources, (source) => source.url);
  const reranked = rankSources(deduped, { query: 'global', reason: 'global' });

  return {
    provider,
    sources: capPerDomain(reranked, 2).slice(0, 18),
  };
}
