import type { MetadataRoute } from 'next';
import { getManifest } from '@/lib/kv-storage';
import { SITE_URL } from '@/lib/site';
import { getAllTools, getCategories } from '@/lib/tools-storage';
import { buildCompareSlug } from '@/lib/utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [manifest, tools, categories] = await Promise.all([getManifest(), getAllTools(), getCategories()]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/tools`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/compare`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
  ];

  const toolPages = tools.map((tool) => ({
    url: `${SITE_URL}/tools/${tool.slug}`,
    lastModified: tool.lastUpdated,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categoryPages = categories
    .filter((category) => category.count >= 2)
    .map((category) => ({
      url: `${SITE_URL}/category/${category.category}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  const comparisonPages = [] as MetadataRoute.Sitemap;
  for (let i = 0; i < tools.length; i += 1) {
    for (let j = i + 1; j < tools.length; j += 1) {
      if (tools[i].category !== tools[j].category) continue;
      comparisonPages.push({
        url: `${SITE_URL}/compare/${buildCompareSlug(tools[i].slug, tools[j].slug)}`,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  const blogPages = manifest.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.publishedAt,
    changeFrequency: 'weekly' as const,
    priority: post.featured ? 0.75 : 0.65,
  }));

  return [...staticPages, ...toolPages, ...categoryPages, ...comparisonPages, ...blogPages];
}
