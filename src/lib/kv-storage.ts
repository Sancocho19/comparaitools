// src/lib/kv-storage.ts
// Usa @upstash/redis — ya instalado con: npm install @upstash/redis
// Variables de entorno (se agregan automático al conectar Upstash en Vercel):
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlogPost {
  slug:            string;
  title:           string;
  metaTitle:       string;
  metaDescription: string;
  primaryKeyword:  string;
  keywords:        string[];
  excerpt:         string;
  content:         string;   // HTML semántico completo generado por Claude
  type:            'review' | 'comparison' | 'roundup' | 'guide' | 'pricing';
  toolSlugs:       string[]; // slugs de tools mencionadas
  category:        string;
  publishedAt:     string;   // ISO string
  updatedAt:       string;
  wordCount:       number;
  readingTime:     number;   // minutos
  featured:        boolean;
  schemaOrg:       object;   // JSON-LD para inyectar en <head>
}

export interface ManifestEntry {
  slug:        string;
  title:       string;
  type:        string;
  publishedAt: string;
  category:    string;
  toolSlugs:   string[];
  excerpt:     string;
}

export interface GenerationState {
  reviewedTools:  string[]; // slugs ya reseñados
  comparedPairs:  string[]; // pares normalizados ej: "chatgpt___claude"
  roundupsDone:   string[]; // categorías con roundup ej: "chatbot"
  guidesDone:     string[]; // slugs con guide
  pricingDone:    string[]; // slugs con pricing guide
  publishedSlugs: string[]; // todos los slugs publicados
  lastRunAt:      string;   // ISO string del último run
  totalGenerated: number;
  currentCycle:   number;
}

// ─── Keys de Redis ────────────────────────────────────────────────────────────

const K = {
  POST:     (slug: string) => `cit:post:${slug}`,
  MANIFEST: 'cit:manifest',
  STATE:    'cit:state',
};

// ─── Post Operations ──────────────────────────────────────────────────────────

export async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    return await redis.get<BlogPost>(K.POST(slug));
  } catch {
    return null;
  }
}

export async function savePost(post: BlogPost): Promise<void> {
  await redis.set(K.POST(post.slug), post);

  const manifest = await getManifest();
  const exists   = manifest.some(m => m.slug === post.slug);

  if (!exists) {
    const entry: ManifestEntry = {
      slug:        post.slug,
      title:       post.title,
      type:        post.type,
      publishedAt: post.publishedAt,
      category:    post.category,
      toolSlugs:   post.toolSlugs,
      excerpt:     post.excerpt,
    };
    await redis.set(K.MANIFEST, [...manifest, entry]);
  } else {
    const updated = manifest.map(m =>
      m.slug === post.slug
        ? { ...m, title: post.title, excerpt: post.excerpt }
        : m
    );
    await redis.set(K.MANIFEST, updated);
  }
}

export async function getManifest(): Promise<ManifestEntry[]> {
  return (await redis.get<ManifestEntry[]>(K.MANIFEST)) ?? [];
}

export async function getAllPosts(limit?: number): Promise<BlogPost[]> {
  const manifest = await getManifest();
  const sorted   = [...manifest]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit ?? manifest.length);

  const posts = await Promise.all(sorted.map(m => getPost(m.slug)));
  return posts.filter(Boolean) as BlogPost[];
}

export async function getPostsByType(type: string, limit = 20): Promise<BlogPost[]> {
  const manifest = await getManifest();
  const filtered = manifest
    .filter(m => m.type === type)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);

  const posts = await Promise.all(filtered.map(m => getPost(m.slug)));
  return posts.filter(Boolean) as BlogPost[];
}

export async function getRelatedPosts(
  currentSlug: string,
  toolSlugs:   string[],
  limit = 4
): Promise<ManifestEntry[]> {
  const manifest = await getManifest();
  return manifest
    .filter(m => m.slug !== currentSlug && m.toolSlugs.some(s => toolSlugs.includes(s)))
    .slice(0, limit);
}

// ─── Generation State ─────────────────────────────────────────────────────────

export async function getGenerationState(): Promise<GenerationState> {
  return (await redis.get<GenerationState>(K.STATE)) ?? {
    reviewedTools:  [],
    comparedPairs:  [],
    roundupsDone:   [],
    guidesDone:     [],
    pricingDone:    [],
    publishedSlugs: [],
    lastRunAt:      '',
    totalGenerated: 0,
    currentCycle:   1,
  };
}

export async function saveGenerationState(state: GenerationState): Promise<void> {
  await redis.set(K.STATE, state);
}
