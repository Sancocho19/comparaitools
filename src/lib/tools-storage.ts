import baseTools from '@/data/tools.json';
import { getRedis } from '@/lib/redis';
import type { Tool } from '@/lib/types';
import { uniqueBy } from '@/lib/utils';

const redis = getRedis();

const K = {
  TOOL: (slug: string) => `cit:tool:${slug}`,
  INDEX: 'cit:tools:index',
  PENDING: 'cit:tools:pending',
};

function normalizeBaseTools(): Tool[] {
  return (baseTools as Tool[]).map((tool) => ({
    ...tool,
    source: (tool as any).source ?? 'static',
    verified: (tool as any).verified ?? true,
    status: 'published',
  }));
}

export async function bootstrapStaticTools(): Promise<void> {
  if (!redis) return;
  const existing = await redis.get<string[]>(K.INDEX);
  if (existing?.length) return;
  const tools = normalizeBaseTools();
  for (const tool of tools) {
    await redis.set(K.TOOL(tool.slug), tool);
  }
  await redis.set(K.INDEX, tools.map((tool) => tool.slug));
}

async function getRedisTools(): Promise<Tool[]> {
  if (!redis) return [];
  const slugs = (await redis.get<string[]>(K.INDEX)) ?? [];
  if (!slugs.length) return [];
  const items = await Promise.all(slugs.map((slug) => redis.get<Tool>(K.TOOL(slug))));
  return items.filter(Boolean) as Tool[];
}

function dedupeTools(tools: Tool[]): Tool[] {
  return uniqueBy(
    tools,
    (tool) => `${tool.slug}|${tool.url?.replace(/^https?:\/\//, '').replace(/^www\./, '')}`
  );
}

function pickBetterString(incoming: any, existing: any, minLen = 8): string {
  const a = typeof incoming === 'string' ? incoming.trim() : '';
  const b = typeof existing === 'string' ? existing.trim() : '';
  if (a.length >= minLen) return a;
  return b;
}

function pickBetterArray(incoming: any, existing: any, minItemLen = 3): string[] {
  const a = Array.isArray(incoming)
    ? incoming.map((x) => String(x).trim()).filter((x) => x.length >= minItemLen)
    : [];
  const b = Array.isArray(existing)
    ? existing.map((x) => String(x).trim()).filter((x) => x.length >= minItemLen)
    : [];
  return a.length ? a : b;
}

function pickBetterNumber(incoming: any, existing: any): number {
  const a = Number(incoming);
  if (Number.isFinite(a) && a > 0) return a;
  const b = Number(existing);
  return Number.isFinite(b) ? b : 0;
}

function pickBetterBoolean(incoming: any, existing: any, fallback = true): boolean {
  if (typeof incoming === 'boolean') return incoming;
  if (typeof existing === 'boolean') return existing;
  return fallback;
}

export async function getAllTools(): Promise<Tool[]> {
  const staticTools = normalizeBaseTools();
  const dynamicTools = await getRedisTools();
  return dedupeTools(
    [...staticTools, ...dynamicTools].filter((tool) => (tool as any).verified !== false)
  ).sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
}

export async function getTool(slug: string): Promise<Tool | null> {
  const all = await getAllTools();
  return all.find((tool) => tool.slug === slug) ?? null;
}

export async function getToolsByCategory(category: string): Promise<Tool[]> {
  const all = await getAllTools();
  return all.filter((tool) => tool.category === category);
}

export async function getCategories(): Promise<{ category: string; categoryLabel: string; count: number }[]> {
  const all = await getAllTools();
  const map = new Map<string, { categoryLabel: string; count: number }>();
  for (const tool of all) {
    const current = map.get(tool.category) ?? { categoryLabel: tool.categoryLabel, count: 0 };
    current.count += 1;
    map.set(tool.category, current);
  }
  return [...map.entries()]
    .map(([category, value]) => ({ category, ...value }))
    .sort((a, b) => b.count - a.count || a.categoryLabel.localeCompare(b.categoryLabel));
}

export async function saveTool(tool: Tool): Promise<void> {
  if (!redis) return;
  const incoming: any = tool;
  const existing = incoming.slug ? await redis.get<any>(K.TOOL(incoming.slug)) : null;

  const normalized: any = {
    ...(existing ?? {}),
    ...incoming,
    id: pickBetterString(incoming.id, existing?.id, 2),
    slug: pickBetterString(incoming.slug, existing?.slug, 2),
    name: pickBetterString(incoming.name, existing?.name, 2),
    company: pickBetterString(incoming.company, existing?.company, 2),
    category: pickBetterString(incoming.category, existing?.category, 2),
    categoryLabel: pickBetterString(incoming.categoryLabel, existing?.categoryLabel, 2),
    pricing: pickBetterString(incoming.pricing, existing?.pricing, 8),
    pricingValue: pickBetterNumber(incoming.pricingValue, existing?.pricingValue),
    description: pickBetterString(incoming.description, existing?.description, 24),
    longDescription: pickBetterString(incoming.longDescription, existing?.longDescription, 40),
    bestFor: pickBetterString(incoming.bestFor, existing?.bestFor, 10),
    url: pickBetterString(incoming.url, existing?.url, 8),
    users: pickBetterString(incoming.users, existing?.users, 3),
    features: pickBetterArray(incoming.features, existing?.features, 3),
    pros: pickBetterArray(incoming.pros, existing?.pros, 3),
    cons: pickBetterArray(incoming.cons, existing?.cons, 3),
    research: incoming.research ?? existing?.research,
    evidenceScore: pickBetterNumber(incoming.evidenceScore, existing?.evidenceScore),
    sourceCount: pickBetterNumber(incoming.sourceCount, existing?.sourceCount),
    rating: pickBetterNumber(incoming.rating, existing?.rating),
    verified: pickBetterBoolean(incoming.verified, existing?.verified, true),
    source: incoming.source ?? existing?.source ?? 'discovered',
    status: incoming.status ?? existing?.status ?? 'published',
    lastUpdated: incoming.lastUpdated ?? existing?.lastUpdated ?? new Date().toISOString().slice(0, 10),
  };

  await redis.set(K.TOOL(normalized.slug), normalized);
  const slugs = (await redis.get<string[]>(K.INDEX)) ?? [];
  if (!slugs.includes(normalized.slug)) {
    await redis.set(K.INDEX, [...slugs, normalized.slug]);
  }
}

export async function getPendingTools(): Promise<Tool[]> {
  if (!redis) return [];
  return (await redis.get<Tool[]>(K.PENDING)) ?? [];
}

export async function addPendingTool(tool: Tool): Promise<void> {
  if (!redis) return;
  const incoming: any = tool;
  const pending = await getPendingTools();
  const existingIndex = pending.findIndex((item: any) =>
    item.slug === incoming.slug ||
    item.url === incoming.url ||
    item.name?.toLowerCase() === incoming.name?.toLowerCase()
  );

  const normalized: any = {
    ...incoming,
    verified: false,
    status: 'pending',
    source: incoming.source ?? 'discovered',
  };

  if (existingIndex >= 0) {
    const current: any = pending[existingIndex] ?? {};
    const merged = [...pending];
    merged[existingIndex] = {
      ...current,
      ...normalized,
      company: pickBetterString(normalized.company, current.company, 2),
      category: pickBetterString(normalized.category, current.category, 2),
      categoryLabel: pickBetterString(normalized.categoryLabel, current.categoryLabel, 2),
      pricing: pickBetterString(normalized.pricing, current.pricing, 8),
      pricingValue: pickBetterNumber(normalized.pricingValue, current.pricingValue),
      description: pickBetterString(normalized.description, current.description, 24),
      longDescription: pickBetterString(normalized.longDescription, current.longDescription, 40),
      bestFor: pickBetterString(normalized.bestFor, current.bestFor, 10),
      features: pickBetterArray(normalized.features, current.features, 3),
      pros: pickBetterArray(normalized.pros, current.pros, 3),
      cons: pickBetterArray(normalized.cons, current.cons, 3),
      research: normalized.research ?? current.research,
      evidenceScore: pickBetterNumber(normalized.evidenceScore, current.evidenceScore),
      sourceCount: pickBetterNumber(normalized.sourceCount, current.sourceCount),
      verified: false,
      status: 'pending',
    } as any;
    await redis.set(K.PENDING, merged);
    return;
  }

  await redis.set(K.PENDING, [...pending, normalized]);
}

export async function approvePendingTool(slug: string): Promise<void> {
  if (!redis) return;
  const pending = await getPendingTools();
  const match = pending.find((tool) => tool.slug === slug);
  if (!match) return;
  await saveTool({
    ...(match as any),
    verified: true,
    status: 'published',
    lastUpdated: new Date().toISOString().slice(0, 10),
  } as Tool);
  await redis.set(K.PENDING, pending.filter((tool) => tool.slug !== slug));
}

export async function searchTools(query: string): Promise<Tool[]> {
  const q = query.toLowerCase().trim();
  const all = await getAllTools();
  if (!q) return all;
  return all
    .filter((tool) => {
      const haystack = [
        tool.name,
        tool.company,
        tool.categoryLabel,
        tool.description,
        tool.bestFor,
        ...tool.features,
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    })
    .sort((a, b) => {
      const aName = a.name.toLowerCase().startsWith(q) ? 1 : 0;
      const bName = b.name.toLowerCase().startsWith(q) ? 1 : 0;
      return bName - aName || b.rating - a.rating;
    });
}
