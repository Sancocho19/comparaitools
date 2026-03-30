import tools from '@/data/tools.json';

type OpportunityType =
  | 'best-for-role'
  | 'versus'
  | 'pricing'
  | 'switching-guide'
  | 'workflow-guide'
  | 'free-tools'
  | 'alternatives';

interface Tool {
  id: string;
  slug: string;
  name: string;
  company?: string;
  category: string;
  categoryLabel?: string;
  pricing?: string;
  pricingValue?: number;
  rating?: number;
  users?: string;
  features?: string[];
  url?: string;
  description?: string;
  bestFor?: string;
  lastUpdated?: string;
  trend?: string;
}

interface TopicCluster {
  key: string;
  label: string;
  persona: string;
  competition: 'low' | 'medium' | 'high';
  monetizationPriority: number;
  jobs: string[];
  seedKeywords: string[];
  pagePatterns: OpportunityType[];
  categories: string[];
}

export interface ContentOpportunity {
  key: string;
  clusterKey: string;
  clusterLabel: string;
  title: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  pageType: OpportunityType;
  monetizationPriority: number;
  competition: 'low' | 'medium' | 'high';
  whyThisCanWin: string;
  angle: string;
  toolSlugs: string[];
  score: number;
}

const CURRENT_YEAR = new Date().getFullYear();
const TOOL_LIST = (tools as Tool[]) ?? [];

const CLUSTERS: TopicCluster[] = [
  {
    key: 'ai-coding',
    label: 'AI coding tools',
    persona: 'developers, startup founders, technical teams',
    competition: 'medium',
    monetizationPriority: 10,
    jobs: ['write code faster', 'debug faster', 'ship features', 'review pull requests'],
    seedKeywords: ['best ai coding tools', 'cursor alternatives', 'copilot vs cursor', 'ai code review tools', 'best ai for developers'],
    pagePatterns: ['best-for-role', 'versus', 'pricing', 'switching-guide', 'workflow-guide', 'alternatives'],
    categories: ['coding', 'developer-tools'],
  },
  {
    key: 'ai-video',
    label: 'AI video tools',
    persona: 'creators, marketers, agencies, course builders',
    competition: 'medium',
    monetizationPriority: 9,
    jobs: ['generate videos', 'edit clips faster', 'create ads', 'repurpose long videos'],
    seedKeywords: ['best ai video generator', 'runway alternatives', 'best ai video editor', 'ai ad creative tools', 'text to video ai tools'],
    pagePatterns: ['best-for-role', 'versus', 'pricing', 'workflow-guide', 'free-tools', 'alternatives'],
    categories: ['video', 'creative-tools'],
  },
  {
    key: 'ai-images',
    label: 'AI image tools',
    persona: 'designers, marketers, ecommerce brands, solo creators',
    competition: 'high',
    monetizationPriority: 8,
    jobs: ['generate images', 'improve product shots', 'make thumbnails', 'create brand assets'],
    seedKeywords: ['best ai image generator', 'midjourney alternatives', 'ai product photo tools', 'best ai for thumbnails', 'free ai image generator no watermark'],
    pagePatterns: ['best-for-role', 'pricing', 'alternatives', 'free-tools'],
    categories: ['image', 'design'],
  },
  {
    key: 'ai-writing',
    label: 'AI writing tools',
    persona: 'marketers, founders, agencies, students',
    competition: 'high',
    monetizationPriority: 7,
    jobs: ['write blog posts', 'write emails', 'write ad copy', 'rewrite content faster'],
    seedKeywords: ['best ai writing tools', 'jasper alternatives', 'best ai copywriting tool', 'ai blog writing tools', 'best ai for marketing copy'],
    pagePatterns: ['best-for-role', 'pricing', 'alternatives', 'workflow-guide'],
    categories: ['writing', 'marketing'],
  },
  {
    key: 'ai-research',
    label: 'AI research and search tools',
    persona: 'researchers, analysts, consultants, students',
    competition: 'medium',
    monetizationPriority: 8,
    jobs: ['find sources', 'summarize reports', 'extract insights', 'compare claims'],
    seedKeywords: ['best ai research tools', 'perplexity alternatives', 'ai search tools', 'best ai for research', 'ai literature review tools'],
    pagePatterns: ['best-for-role', 'versus', 'pricing', 'workflow-guide', 'alternatives'],
    categories: ['research', 'search'],
  },
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeCategory(value?: string): string {
  return (value ?? '').toLowerCase().replace(/\s+/g, '-').trim();
}

function numeric(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function findToolsForCluster(cluster: TopicCluster): Tool[] {
  const categorySet = new Set(cluster.categories.map(normalizeCategory));

  return TOOL_LIST.filter((tool) => {
    const category = normalizeCategory(tool.category);
    const categoryLabel = normalizeCategory(tool.categoryLabel);
    return categorySet.has(category) || categorySet.has(categoryLabel);
  });
}

function makeTitle(
  cluster: TopicCluster,
  pattern: OpportunityType,
  toolNames: string[],
): { title: string; keyword: string; angle: string } {
  const [a = cluster.label, b = 'the leading alternative'] = toolNames;
  const primaryPersona = cluster.persona.split(',')[0]?.trim() || 'buyers';
  const primaryJob = cluster.jobs[0] || 'work faster';

  switch (pattern) {
    case 'best-for-role':
      return {
        title: `Best ${cluster.label} for ${primaryPersona} in ${CURRENT_YEAR}`,
        keyword: `best ${cluster.label.toLowerCase()} for ${primaryPersona}`,
        angle: `Commercial shortlist with real jobs-to-be-done for ${cluster.persona}.`,
      };

    case 'versus':
      return {
        title: `${a} vs ${b}: Which One Fits ${primaryPersona} Better in ${CURRENT_YEAR}?`,
        keyword: `${a} vs ${b}`,
        angle: `Head-to-head decision page for buyers already comparing two specific tools.`,
      };

    case 'pricing':
      return {
        title: `${a} Pricing ${CURRENT_YEAR}: Which Plan Makes Sense for ${primaryPersona}?`,
        keyword: `${a} pricing ${CURRENT_YEAR}`,
        angle: `High-intent pricing page for users close to purchase.`,
      };

    case 'switching-guide':
      return {
        title: `Switching from ${a} to ${b}: Cost, Friction, and What You Actually Gain`,
        keyword: `switch from ${a} to ${b}`,
        angle: `Switching-cost article for users unhappy with their current tool.`,
      };

    case 'workflow-guide':
      return {
        title: `How to Use ${a} to ${primaryJob} in ${CURRENT_YEAR}`,
        keyword: `${a} for ${primaryJob}`,
        angle: `Workflow-led guide that can win long-tail queries with strong intent.`,
      };

    case 'free-tools':
      return {
        title: `Best Free ${cluster.label} in ${CURRENT_YEAR} That Still Feel Usable`,
        keyword: `best free ${cluster.label.toLowerCase()} ${CURRENT_YEAR}`,
        angle: `Free-tool roundup with clear tradeoffs and upgrade thresholds.`,
      };

    case 'alternatives':
      return {
        title: `Best ${a} Alternatives in ${CURRENT_YEAR}`,
        keyword: `${a} alternatives ${CURRENT_YEAR}`,
        angle: `High-intent alternatives page for users comparing replacements, pricing, and tradeoffs.`,
      };

    default:
      return {
        title: `Best ${cluster.label} in ${CURRENT_YEAR}`,
        keyword: `best ${cluster.label.toLowerCase()} ${CURRENT_YEAR}`,
        angle: `Fallback opportunity page for the cluster.`,
      };
  }
}

export function buildOpportunityQueue(limit = 60): ContentOpportunity[] {
  const opportunities: ContentOpportunity[] = [];

  for (const cluster of CLUSTERS) {
    const clusterTools = findToolsForCluster(cluster).sort((a, b) => {
      const ratingDelta = numeric(b.rating) - numeric(a.rating);
      if (ratingDelta !== 0) return ratingDelta;
      return numeric(b.pricingValue) - numeric(a.pricingValue);
    });

    const top = clusterTools.slice(0, 5);
    if (!top.length) continue;

    for (const pattern of cluster.pagePatterns) {
      let toolSlugs: string[] = [];
      let toolNames: string[] = [];

      if (pattern === 'versus' || pattern === 'switching-guide') {
        if (top.length < 2) continue;
        toolSlugs = [top[0].slug, top[1].slug];
        toolNames = [top[0].name, top[1].name];
      } else if (pattern === 'pricing' || pattern === 'workflow-guide' || pattern === 'alternatives') {
        toolSlugs = [top[0].slug];
        toolNames = [top[0].name];
      } else {
        toolSlugs = top.slice(0, 4).map((tool) => tool.slug);
        toolNames = top.slice(0, 2).map((tool) => tool.name);
      }

      const built = makeTitle(cluster, pattern, toolNames);
      if (!built) continue;

      const { title, keyword, angle } = built;
      const scoreBase = cluster.monetizationPriority * 10;
      const competitionPenalty =
        cluster.competition === 'high' ? 12 : cluster.competition === 'medium' ? 6 : 0;
      const patternBonus =
        pattern === 'pricing' || pattern === 'versus' || pattern === 'switching-guide' || pattern === 'alternatives'
          ? 8
          : 0;
      const score = Math.max(1, scoreBase + patternBonus - competitionPenalty);

      opportunities.push({
        key: slugify(`${cluster.key}-${pattern}-${toolSlugs.join('-')}`),
        clusterKey: cluster.key,
        clusterLabel: cluster.label,
        title,
        primaryKeyword: keyword,
        secondaryKeywords: cluster.seedKeywords.slice(0, 4),
        pageType: pattern,
        monetizationPriority: cluster.monetizationPriority,
        competition: cluster.competition,
        whyThisCanWin: `${cluster.label} has ${cluster.competition} SERP pressure, while ${pattern} pages target stronger intent than generic best-ai-tools queries.`,
        angle,
        toolSlugs,
        score,
      });
    }
  }

  return opportunities.sort((a, b) => b.score - a.score).slice(0, limit);
}
