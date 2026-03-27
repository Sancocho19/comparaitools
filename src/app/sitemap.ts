// ════════════════════════════════════════════════════════════════════
// ARCHIVO 1: src/app/sitemap.ts
// REEMPLAZA el archivo existente
// ════════════════════════════════════════════════════════════════════

import { MetadataRoute } from 'next';
import tools from '@/data/tools.json';
import { getManifest } from '@/lib/kv-storage';

const BASE_URL = 'https://comparaitools.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();
  const toolList = tools as any[];

  // ─── Blog posts from KV ──────────────────────────────────────────
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const manifest = await getManifest();
    blogEntries = manifest.map(post => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.publishedAt,
      changeFrequency: post.type === 'roundup' ? 'weekly' : 'monthly',
      priority: post.type === 'comparison' ? 0.85 : post.type === 'review' ? 0.8 : 0.75,
    }));
  } catch {
    // KV not available during build — empty blog entries
    blogEntries = [];
  }

  // ─── Tool pages ──────────────────────────────────────────────────
  const toolEntries: MetadataRoute.Sitemap = toolList.map(tool => ({
    url: `${BASE_URL}/tools/${tool.slug}`,
    lastModified: tool.lastUpdated ?? now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // ─── Comparison pages (same-category pairs) ───────────────────────
  const compareEntries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();
  const year = new Date().getFullYear();

  for (let i = 0; i < toolList.length; i++) {
    for (let j = i + 1; j < toolList.length; j++) {
      const pair = `${toolList[i].slug}-vs-${toolList[j].slug}-${year}`;
      if (!seen.has(pair)) {
        seen.add(pair);
        compareEntries.push({
          url: `${BASE_URL}/compare/${pair}`,
          lastModified: now,
          changeFrequency: 'monthly',
          priority: 0.8,
        });
      }
    }
  }

  // ─── Category pages ──────────────────────────────────────────────
  const categories = [...new Set(toolList.map(t => t.category))];
  const categoryEntries: MetadataRoute.Sitemap = categories.map(cat => ({
    url: `${BASE_URL}/category/${cat}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.75,
  }));

  return [
    // Static pages — highest priority
    { url: BASE_URL,                    lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/blog`,          lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/compare`,       lastModified: now, changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE_URL}/about`,         lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/terms`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },

    // Dynamic pages
    ...toolEntries,
    ...categoryEntries,
    ...compareEntries,
    ...blogEntries,
  ];
}


// ════════════════════════════════════════════════════════════════════
// ARCHIVO 2: src/app/robots.ts
// REEMPLAZA el archivo existente
// ════════════════════════════════════════════════════════════════════

/*
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
    ],
    sitemap: 'https://comparaitools.com/sitemap.xml',
    host: 'https://comparaitools.com',
  };
}
*/
