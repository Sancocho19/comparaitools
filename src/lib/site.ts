export const SITE_NAME = 'ComparAITools';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://comparaitools.com';
export const SITE_DESCRIPTION = 'AI tool comparisons, pricing data, reviews, and alternatives across chat, coding, image, video, audio, and productivity categories.';
export const CURRENT_YEAR = new Date().getFullYear();
export const DEFAULT_REVALIDATE_SECONDS = 60 * 60;
export const CONTENT_REVALIDATE_SECONDS = 60 * 60 * 6;

export const BRAND_EDITOR = 'ComparAITools Research Desk';
export const BRAND_EDITOR_URL = `${SITE_URL}/about`;
