import type { Metadata } from 'next';
import { CURRENT_YEAR, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

type SeoTool = {
  name: string;
  slug: string;
  company?: string;
  category?: string;
  categoryLabel?: string;
  pricing?: string;
  pricingValue?: number;
  rating?: number;
  bestFor?: string;
  description?: string;
  features?: string[];
  lastUpdated?: string;
};

function clean(input: string | undefined | null): string {
  return String(input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sentenceCase(input: string): string {
  const text = clean(input);
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function getToolAngle(tool: SeoTool): string {
  const hay = `${tool.categoryLabel || ''} ${tool.category || ''} ${tool.description || ''} ${(tool.features || []).join(' ')}`.toLowerCase();

  if (/voice clon|text-to-speech|tts|speech/.test(hay)) return 'voice cloning';
  if (/music|song|lyrics/.test(hay)) return 'AI music';
  if (/code|coding|developer|programming/.test(hay)) return 'coding';
  if (/video|film|animation/.test(hay)) return 'AI video';
  if (/image|art|photo|design/.test(hay)) return 'image generation';
  if (/chatbot|assistant|reasoning|conversation/.test(hay)) return 'AI chat';
  if (/search|research/.test(hay)) return 'AI search';
  if (/writing|copy|content|marketing/.test(hay)) return 'writing';
  return clean(tool.categoryLabel) || 'AI work';
}

function getPricingText(tool: SeoTool): string {
  const pricing = clean(tool.pricing);
  if (!pricing) return 'Pricing not listed yet';
  return pricing;
}

export function buildHomeMetadata(): Metadata {
  const title = `Compare AI Tools, Pricing, Reviews & Alternatives (${CURRENT_YEAR}) | ${SITE_NAME}`;
  const description = `Compare AI tools by pricing, reviews, pros, cons, and use case across chat, coding, image, video, audio, and productivity categories in ${CURRENT_YEAR}.`;

  return {
    title,
    description,
    alternates: { canonical: SITE_URL },
    openGraph: {
      type: 'website',
      url: SITE_URL,
      siteName: SITE_NAME,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export function buildToolMetadata(tool: SeoTool): Metadata {
  const angle = getToolAngle(tool);
  const title = `${tool.name} Review ${CURRENT_YEAR}: ${sentenceCase(angle)}, Pricing & Pros/Cons | ${SITE_NAME}`;
  const description = `${tool.name} review for ${CURRENT_YEAR}. Pricing: ${getPricingText(tool)}. Coverage includes features, pros, cons, alternatives, best use cases, and overall market positioning.`;
  const canonical = `${SITE_URL}/tools/${tool.slug}`;

  return {
    title,
    description,
    keywords: [
      `${tool.name} review ${CURRENT_YEAR}`,
      `${tool.name} pricing ${CURRENT_YEAR}`,
      `${tool.name} alternatives`,
      `${tool.name} pros and cons`,
      clean(tool.categoryLabel),
    ].filter(Boolean),
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export function buildCompareMetadata(toolA: SeoTool, toolB: SeoTool): Metadata {
  const title = `${toolA.name} vs ${toolB.name} Comparison (${CURRENT_YEAR}): Pricing, Features & Tradeoffs | ${SITE_NAME}`;
  const description = `Compare ${toolA.name} vs ${toolB.name} in ${CURRENT_YEAR} by pricing, features, positioning, tradeoffs, and switching cost.`;
  const canonical = `${SITE_URL}/compare/${[toolA.slug, toolB.slug].sort().join('-vs-')}`;

  return {
    title,
    description,
    keywords: [
      `${toolA.name} vs ${toolB.name}`,
      `${toolA.name} vs ${toolB.name} ${CURRENT_YEAR}`,
      `${toolA.name} comparison`,
      `${toolB.name} comparison`,
    ],
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export function buildCategoryMetadata(label: string, category: string, toolNames: string[]): Metadata {
  const title = `Best ${label} AI Tools ${CURRENT_YEAR}: Reviews, Pricing & Alternatives | ${SITE_NAME}`;
  const description = `Compare the best ${label.toLowerCase()} AI tools in ${CURRENT_YEAR}. Reviews, pricing, alternatives, and top picks including ${toolNames.slice(0, 4).join(', ')}.`;
  const canonical = `${SITE_URL}/category/${category}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export function buildDefaultSiteMetadata(): Metadata {
  const title = {
    default: `Compare AI Tools, Pricing & Reviews (${CURRENT_YEAR}) | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  };

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: SITE_DESCRIPTION,
    openGraph: {
      type: 'website',
      url: SITE_URL,
      siteName: SITE_NAME,
      title: title.default,
      description: SITE_DESCRIPTION,
    },
    twitter: {
      card: 'summary_large_image',
      title: title.default,
      description: SITE_DESCRIPTION,
    },
    alternates: { canonical: SITE_URL },
  };
}
