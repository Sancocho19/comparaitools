import tools from '@/data/tools.json';

export type OpportunityType =
  | 'best-for-role'
  | 'versus'
  | 'pricing'
  | 'switching-guide'
  | 'workflow-guide'
  | 'free-tools'
  | 'alternatives';

export type QueueMode = 'money' | 'balanced' | 'coverage';

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
    pagePatterns: ['pricing', 'alternatives', 'versus', 'best-for-role', 'switching-guide', 'workflow-guide'],
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
    pagePatterns: ['pricing', 'alternatives', 'best-for-role', 'workflow-guide', 'versus', 'free-tools'],
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
    pagePatterns: ['pricing', 'alternatives', 'best-for-role', 'free-tools'],
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
    pagePatterns: ['pricing', 'alternatives', 'best-for-role', 'workflow-guide'],
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
    pagePatterns: ['pricing', 'alternatives', 'best-for-role', 'workflow-guide', 'versus'],
    categories: ['research', 'search'],
  },
];

const JOB_TITLE_MAP: Record<string, string> = {
  'write code faster': 'write code faster',
  'debug faster': 'debug software faster',
  'ship features': 'ship features faster',
  'review pull requests': 'review pull requests',
  'generate videos': 'create videos',
  'edit clips faster': 'edit video clips faster',
  'create ads': 'create ad creatives',
  'repurpose long videos': 'repurpose long-form videos',
  'generate images': 'create images',
  'improve product shots': 'improve product photos',
  'make thumbnails': 'make thumbnails',
  'create brand assets': 'create brand assets',
  'write blog posts': 'write blog posts',
  'write emails': 'write emails',
  'write ad copy': 'write ad copy',
  'rewrite content faster': 'rewrite content faster',
  'find sources': 'do research',
  'summarize reports': 'summarize reports',
  'extract insights': 'extract insights',
  'compare claims': 'compare claims',
};

const JOB_KEYWORD_MAP: Record<string, string> = {
  'write code faster': 'coding',
  'debug faster': 'debugging',
  'ship features': 'shipping software faster',
  'review pull requests': 'code review',
  'generate videos': 'video creation',
  'edit clips faster': 'video editing',
  'create ads': 'ad creatives',
  'repurpose long videos': 'video repurposing',
  'generate images': 'image generation',
  'improve product shots': 'product photos',
  'make thumbnails': 'thumbnails',
  'create brand assets': 'brand asset creation',
  'write blog posts': 'blog writing',
  'write emails': 'email writing',
  'write ad copy': 'ad copy',
  'rewrite content faster': 'content rewriting',
  'find sources': 'research',
  'summarize reports': 'report summarization',
  'extract insights': 'insight extraction',
  'compare claims': 'fact-checking',
};

const MONEY_FIRST_ORDER: OpportunityType[] = [
  'pricing',
  'alternatives',
  'versus',
  'best-for-role',
  'switching-guide',
  'workflow-guide',
  'free-tools',
];

const BALANCED_ORDER: OpportunityType[] = [
  'pricing',
  'alternatives',
  'best-for-role',
  'versus',
  'workflow-guide',
  'switching-guide',
  'free-tools',
];

const COVERAGE_ORDER: OpportunityType[] = [
  'best-for-role',
  'pricing',
  'alternatives',
  'versus',
  'workflow-guide',
  'switching-guide',
  'free-tools',
];

function getPatternOrder(mode: QueueMode): OpportunityType[] {
  if (mode === 'balanced') return BALANCED_ORDER;
  if (mode === 'coverage') return COVERAGE_ORDER;
  return MONEY_FIRST_ORDER;
}

function getPatternWeight(pattern: OpportunityType, mode: QueueMode): number {
  if (mode === 'coverage') {
    switch (pattern) {
      case 'best-for-role':
        return 10;
      case 'pricing':
        return 9;
      case 'alternatives':
        return 9;
      case 'versus':
        return 8;
      case 'workflow-guide':
        return 7;
      case 'switching-guide':
        return 6;
      case 'free-tools':
        return 5;
    }
  }

  switch (pattern) {
    case 'pricing':
      return mode === 'money' ? 22 : 18;
    case 'alternatives':
      return mode === 'money' ? 20 : 16;
    case 'versus':
      return 10;
    case 'best-for-role':
      return 8;
    case 'switching-guide':
      return 6;
    case 'workflow-guide':
      return 4;
    case 'free-tools':
      return 2;
  }
}

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

function titleCase(text: string): string {
  return text
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function cleanToolName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

function cleanPhrase(text: string): string {
  return text
    .replace(/\bAI\b/g, 'AI')
    .replace(/\s+/g, ' ')
    .replace(/\bml\b/gi, 'ML')
    .trim();
}

function naturalJobTitle(job: string): string {
  return JOB_TITLE_MAP[job] ?? job;
}

function naturalJobKeyword(job: string): string {
  return JOB_KEYWORD_MAP[job] ?? job;
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
  const [rawA = cluster.label, rawB = 'the leading alternative'] = toolNames;
  const a = cleanToolName(rawA);
  const b = cleanToolName(rawB);
  const primaryPersona = cluster.persona.split(',')[0]?.trim() || 'buyers';
  const primaryJob = cluster.jobs[0] || 'work faster';
  const jobTitle = naturalJobTitle(primaryJob);
  const jobKeyword = naturalJobKeyword(primaryJob);

  switch (pattern) {
    case 'best-for-role':
      return {
        title: `Best ${cluster.label} for ${primaryPersona} in ${CURRENT_YEAR}`,
        keyword: `best ${cluster.label.toLowerCase()} for ${primaryPersona}`,
        angle: `Commercial shortlist with real jobs-to-be-done for ${cluster.persona}.`,
      };

    case 'versus':
      return {
        title: `${a} vs ${b} in ${CURRENT_YEAR}: Which Is Better for ${primaryPersona}?`,
        keyword: `${a} vs ${b}`,
        angle: `Head-to-head decision page for buyers already comparing two specific tools.`,
      };

    case 'pricing':
      return {
        title: `${a} Pricing ${CURRENT_YEAR}: Plans, Costs, and Best Fit`,
        keyword: `${a} pricing ${CURRENT_YEAR}`,
        angle: `High-intent pricing page for users close to purchase.`,
      };

    case 'switching-guide':
      return {
        title: `Switching from ${a} to ${b} in ${CURRENT_YEAR}: What Changes?`,
        keyword: `switch from ${a} to ${b}`,
        angle: `Switching-cost article for users unhappy with their current tool.`,
      };

    case 'workflow-guide':
      return {
        title: `How to Use ${a} for ${titleCase(jobTitle)} in ${CURRENT_YEAR}`,
        keyword: `how to use ${a} for ${jobKeyword}`,
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

function patternExplanation(pattern: OpportunityType): string {
  switch (pattern) {
    case 'pricing':
      return 'pricing pages target bottom-of-funnel visitors with strong purchase intent';
    case 'alternatives':
      return 'alternatives pages catch users actively looking to switch or compare replacements';
    case 'versus':
      return 'versus pages capture direct comparison intent';
    case 'best-for-role':
      return 'best-for-role pages match real jobs-to-be-done instead of generic head terms';
    case 'switching-guide':
      return 'switching guides attract dissatisfied users close to a change';
    case 'workflow-guide':
      return 'workflow guides can win useful long-tail searches when written well';
    case 'free-tools':
      return 'free-tools pages can bring awareness traffic with upgrade potential';
  }
}

function dedupeAndSortPatterns(patterns: OpportunityType[], mode: QueueMode): OpportunityType[] {
  const order = getPatternOrder(mode);
  return [...new Set(patterns)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export function buildOpportunityQueue(limit = 60, mode: QueueMode = 'money'): ContentOpportunity[] {
  const opportunities: ContentOpportunity[] = [];

  for (const cluster of CLUSTERS) {
    const clusterTools = findToolsForCluster(cluster).sort((a, b) => {
      const ratingDelta = numeric(b.rating) - numeric(a.rating);
      if (ratingDelta !== 0) return ratingDelta;
      return numeric(b.pricingValue) - numeric(a.pricingValue);
    });

    const top = clusterTools.slice(0, 5);
    if (!top.length) continue;

    const patterns = dedupeAndSortPatterns(cluster.pagePatterns, mode);

    for (const pattern of patterns) {
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
      const patternWeight = getPatternWeight(pattern, mode);
      const score = Math.max(1, scoreBase + patternWeight - competitionPenalty);

      opportunities.push({
        key: slugify(`${cluster.key}-${pattern}-${toolSlugs.join('-')}`),
        clusterKey: cluster.key,
        clusterLabel: cluster.label,
        title: cleanPhrase(title),
        primaryKeyword: cleanPhrase(keyword),
        secondaryKeywords: cluster.seedKeywords.slice(0, 4),
        pageType: pattern,
        monetizationPriority: cluster.monetizationPriority,
        competition: cluster.competition,
        whyThisCanWin: `${cluster.label} has ${cluster.competition} SERP pressure, and ${patternExplanation(pattern)}.`,
        angle,
        toolSlugs,
        score,
      });
    }
  }

  return opportunities
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Compatibility aliases for auto-generate route and older callers.
export function buildTopicQueue(limit = 60, mode: QueueMode = 'money') {
  return buildOpportunityQueue(limit, mode);
}

export function getTopicQueue(limit = 60, mode: QueueMode = 'money') {
  return buildOpportunityQueue(limit, mode);
}
