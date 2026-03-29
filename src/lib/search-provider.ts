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
      max_results: 6,
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

  return { provider: 'tavily', sources };
}

async function serpApiSearch(search: SearchQuery): Promise<SearchResponse> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error('SERPAPI_KEY missing');
  const params = new URLSearchParams({
    engine: 'google',
    q: search.query,
    num: '6',
    api_key: apiKey,
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
  return { provider: 'serpapi', sources };
}

function safeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
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

  return {
    provider,
    sources: uniqueBy(allSources, (source) => source.url).slice(0, 18),
  };
}
