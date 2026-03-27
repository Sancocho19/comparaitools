// src/lib/tools-storage.ts
// Gestión dinámica de tools en Upstash Redis
// Las tools nuevas descubiertas se guardan aquí, separadas de tools.json

import { Redis } from '@upstash/redis';
import baseTools from '@/data/tools.json';

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DynamicTool {
  id:            string;
  slug:          string;
  name:          string;
  company:       string;
  category:      string;
  categoryLabel: string;
  pricing:       string;
  pricingValue:  number;
  rating:        number;
  users:         string;
  logo:          string;
  color:         string;
  features:      string[];
  pros:          string[];
  cons:          string[];
  description:   string;
  longDescription: string;
  bestFor:       string;
  lastUpdated:   string;
  trend:         string;
  url:           string;
  source:        'static' | 'discovered'; // origen de la tool
  discoveredAt?: string; // ISO string si fue descubierta automáticamente
  verified:      boolean; // si fue validada antes de publicar
}

// ─── Keys Redis ───────────────────────────────────────────────────────────────

const K = {
  TOOL:     (slug: string) => `cit:tool:${slug}`,
  INDEX:    'cit:tools:index',      // lista de todos los slugs
  PENDING:  'cit:tools:pending',    // tools descubiertas sin publicar
  DISCOVERY:'cit:discovery:state',  // estado del discovery
};

// ─── Bootstrap: cargar tools.json en Redis (primera vez) ─────────────────────

export async function bootstrapStaticTools(): Promise<void> {
  const existing = await redis.get<string[]>(K.INDEX);
  if (existing && existing.length > 0) return; // ya está inicializado

  const staticTools = baseTools as DynamicTool[];
  const slugs: string[] = [];

  for (const tool of staticTools) {
    const dynamicTool: DynamicTool = {
      ...tool,
      url:        tool.url ?? `https://${tool.slug}.com`,
      source:     'static',
      verified:   true,
      discoveredAt: undefined,
    };
    await redis.set(K.TOOL(tool.slug), dynamicTool);
    slugs.push(tool.slug);
  }

  await redis.set(K.INDEX, slugs);
}

// ─── Get all tools (static + dynamic) ────────────────────────────────────────

export async function getAllTools(): Promise<DynamicTool[]> {
  try {
    // Intentar desde Redis
    const slugs = await redis.get<string[]>(K.INDEX);
    if (!slugs || slugs.length === 0) {
      // Fallback a tools.json si Redis no está inicializado
      return (baseTools as any[]).map(t => ({ ...t, source: 'static', verified: true }));
    }

    const tools = await Promise.all(slugs.map(s => redis.get<DynamicTool>(K.TOOL(s))));
    return tools.filter(Boolean) as DynamicTool[];
  } catch {
    // Fallback a tools.json en caso de error
    return (baseTools as any[]).map(t => ({ ...t, source: 'static', verified: true }));
  }
}

export async function getTool(slug: string): Promise<DynamicTool | null> {
  try {
    return await redis.get<DynamicTool>(K.TOOL(slug));
  } catch {
    const base = (baseTools as any[]).find(t => t.slug === slug);
    return base ? { ...base, source: 'static', verified: true } : null;
  }
}

export async function getToolsByCategory(category: string): Promise<DynamicTool[]> {
  const all = await getAllTools();
  return all.filter(t => t.category === category && t.verified);
}

export async function getCategories(): Promise<{ category: string; categoryLabel: string; count: number }[]> {
  const all = await getAllTools();
  const map = new Map<string, { categoryLabel: string; count: number }>();

  for (const t of all.filter(t => t.verified)) {
    if (!map.has(t.category)) {
      map.set(t.category, { categoryLabel: t.categoryLabel, count: 0 });
    }
    map.get(t.category)!.count++;
  }

  return Array.from(map.entries()).map(([category, v]) => ({ category, ...v }));
}

// ─── Save new tool ────────────────────────────────────────────────────────────

export async function saveTool(tool: DynamicTool): Promise<void> {
  await redis.set(K.TOOL(tool.slug), tool);

  const slugs = (await redis.get<string[]>(K.INDEX)) ?? [];
  if (!slugs.includes(tool.slug)) {
    await redis.set(K.INDEX, [...slugs, tool.slug]);
  }
}

// ─── Pending tools (discovered but not yet verified) ─────────────────────────

export async function addPendingTool(tool: Partial<DynamicTool>): Promise<void> {
  const pending = (await redis.get<Partial<DynamicTool>[]>(K.PENDING)) ?? [];
  const exists  = pending.some(p => p.slug === tool.slug);
  if (!exists) {
    await redis.set(K.PENDING, [...pending, tool]);
  }
}

export async function getPendingTools(): Promise<Partial<DynamicTool>[]> {
  return (await redis.get<Partial<DynamicTool>[]>(K.PENDING)) ?? [];
}

export async function approvePendingTool(slug: string): Promise<void> {
  const pending = await getPendingTools();
  const tool    = pending.find(p => p.slug === slug);
  if (!tool) return;

  const verified: DynamicTool = {
    ...tool as DynamicTool,
    verified:     true,
    lastUpdated:  new Date().toISOString().split('T')[0],
  };

  await saveTool(verified);
  await redis.set(K.PENDING, pending.filter(p => p.slug !== slug));
}

// ─── Discovery state ──────────────────────────────────────────────────────────

export interface DiscoveryState {
  lastRunAt:       string;
  toolsDiscovered: number;
  searchesRun:     string[];  // queries ya buscadas
  totalAdded:      number;
}

export async function getDiscoveryState(): Promise<DiscoveryState> {
  return (await redis.get<DiscoveryState>(K.DISCOVERY)) ?? {
    lastRunAt:       '',
    toolsDiscovered: 0,
    searchesRun:     [],
    totalAdded:      0,
  };
}

export async function saveDiscoveryState(state: DiscoveryState): Promise<void> {
  await redis.set(K.DISCOVERY, state);
}

// ─── Search (simple pero efectivo) ───────────────────────────────────────────

export async function searchTools(query: string): Promise<DynamicTool[]> {
  const all = await getAllTools();
  const q   = query.toLowerCase().trim();

  if (!q) return all.filter(t => t.verified);

  return all.filter(t => t.verified && (
    t.name.toLowerCase().includes(q)           ||
    t.description.toLowerCase().includes(q)    ||
    t.company.toLowerCase().includes(q)        ||
    t.categoryLabel.toLowerCase().includes(q)  ||
    t.features.some(f => f.toLowerCase().includes(q)) ||
    t.bestFor.toLowerCase().includes(q)
  )).sort((a, b) => {
    // Priorizar matches exactos en nombre
    const aName = a.name.toLowerCase().startsWith(q) ? 1 : 0;
    const bName = b.name.toLowerCase().startsWith(q) ? 1 : 0;
    return bName - aName || b.rating - a.rating;
  });
}
