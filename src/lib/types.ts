export interface Tool {
  id: string;
  slug: string;
  name: string;
  company: string;
  category: string;
  categoryLabel: string;
  pricing: string;
  pricingValue: number;
  rating: number;
  users: string;
  logo: string;
  color: string;
  features: string[];
  pros: string[];
  cons: string[];
  url: string;
  description: string;
  longDescription: string;
  bestFor: string;
  lastUpdated: string;
  trend: string;
  source?: 'static' | 'discovered';
  discoveredAt?: string;
  verified?: boolean;
  status?: 'published' | 'pending';
}

export type ContentType = 'review' | 'comparison' | 'roundup' | 'guide' | 'pricing' | 'alternatives';

export interface ResearchSource {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  publishedAt?: string;
  score?: number;
  reason: string;
}

export interface ResearchBundle {
  provider: string;
  generatedAt: string;
  queries: string[];
  sources: ResearchSource[];
  evidenceScore: number;
  freshness: 'live-web';
  methodology: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  keywords: string[];
  excerpt: string;
  content: string;
  type: ContentType;
  toolSlugs: string[];
  category: string;
  publishedAt: string;
  updatedAt: string;
  wordCount: number;
  readingTime: number;
  featured: boolean;
  schemaOrg: Record<string, unknown>;
  research?: ResearchBundle;
  editorialSummary?: string;
}

export interface ManifestEntry {
  slug: string;
  title: string;
  type: ContentType;
  publishedAt: string;
  category: string;
  toolSlugs: string[];
  excerpt: string;
  featured?: boolean;
}

export interface GenerationState {
  reviewedTools: string[];
  comparedPairs: string[];
  roundupsDone: string[];
  guidesDone: string[];
  pricingDone: string[];
  publishedSlugs: string[];
  lastRunAt: string;
  totalGenerated: number;
  currentCycle: number;
}
