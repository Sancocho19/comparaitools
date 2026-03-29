import { getRedis } from '@/lib/redis';
import type { BlogPost, GenerationState, ManifestEntry } from '@/lib/types';

const redis = getRedis();

const K = {
  POST: (slug: string) => `cit:post:${slug}`,
  MANIFEST: 'cit:manifest',
  STATE: 'cit:state',
};

function emptyState(): GenerationState {
  return {
    reviewedTools: [],
    comparedPairs: [],
    roundupsDone: [],
    guidesDone: [],
    pricingDone: [],
    publishedSlugs: [],
    lastRunAt: '',
    totalGenerated: 0,
    currentCycle: 1,
  };
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  if (!redis) return null;
  return (await redis.get<BlogPost>(K.POST(slug))) ?? null;
}

export async function savePost(post: BlogPost): Promise<void> {
  if (!redis) return;
  await redis.set(K.POST(post.slug), post);
  const manifest = await getManifest();
  const entry: ManifestEntry = {
    slug: post.slug,
    title: post.title,
    type: post.type,
    publishedAt: post.publishedAt,
    category: post.category,
    toolSlugs: post.toolSlugs,
    excerpt: post.excerpt,
    featured: post.featured,
  };
  const existingIndex = manifest.findIndex((item) => item.slug === post.slug);
  if (existingIndex >= 0) {
    manifest[existingIndex] = entry;
  } else {
    manifest.push(entry);
  }
  await redis.set(K.MANIFEST, manifest);
}

export async function getManifest(): Promise<ManifestEntry[]> {
  if (!redis) return [];
  return (await redis.get<ManifestEntry[]>(K.MANIFEST)) ?? [];
}

export async function getAllPosts(limit?: number): Promise<BlogPost[]> {
  if (!redis) return [];
  const manifest = (await getManifest())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit ?? Number.MAX_SAFE_INTEGER);
  const posts = await Promise.all(manifest.map((entry) => getPost(entry.slug)));
  return posts.filter(Boolean) as BlogPost[];
}

export async function getRelatedPosts(currentSlug: string, toolSlugs: string[], limit = 4): Promise<ManifestEntry[]> {
  const manifest = await getManifest();
  return manifest
    .filter((entry) => entry.slug !== currentSlug && entry.toolSlugs.some((slug) => toolSlugs.includes(slug)))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

export async function getGenerationState(): Promise<GenerationState> {
  if (!redis) return emptyState();
  return (await redis.get<GenerationState>(K.STATE)) ?? emptyState();
}

export async function saveGenerationState(state: GenerationState): Promise<void> {
  if (!redis) return;
  await redis.set(K.STATE, state);
}
