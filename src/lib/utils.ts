import { SITE_URL } from '@/lib/site';

export function stripHtml(input: string | undefined | null): string {
  if (!input) return '';
  return input.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function makePairKey(a: string, b: string): string {
  return [a, b].sort().join('___');
}

export function buildCompareSlug(a: string, b: string): string {
  const [left, right] = [a, b].sort();
  return `${left}-vs-${right}`;
}

export function parseCompareSlug(pair: string): { slugA: string; slugB: string; hadYearSuffix: boolean } {
  const hadYearSuffix = /-\d{4}$/.test(pair);
  const cleaned = pair.replace(/-\d{4}$/, '');
  const [slugA, slugB] = cleaned.split('-vs-');
  return { slugA: slugA || '', slugB: slugB || '', hadYearSuffix };
}

export function absoluteUrl(path = ''): string {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function estimateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 220));
}

export function uniqueBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
