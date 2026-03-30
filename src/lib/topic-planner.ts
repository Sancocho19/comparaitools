import tools from '@/data/tools.json';
import clusters from '@/data/topic-clusters.json';
import type { Tool } from '@/lib/types';
import { CURRENT_YEAR } from '@/lib/site';
import { slugify } from '@/lib/utils';

export type OpportunityType =
  | 'best-for-role'
  | 'versus'
  | 'pricing'
  | 'switching-guide'
  | 'workflow-guide'
  | 'free-tools';

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

const TOOL_LIST = tools as Tool[];
const CLUSTERS = clusters as TopicCluster[];

function normalizeCategory(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-');
}

function findToolsForCluster(cluster: TopicCluster): Tool[] {
  const categorySet = new Set(cluster.categories.map(normalizeCategory));
  return TOOL_LIST.filter((tool) => categorySet.has(normalizeCategory(tool.category)) || categorySet.has(normalizeCategory(tool.categoryLabel)));
}

function makeTitle(cluster: TopicCluster, pattern: OpportunityType, toolNames: string[]): { title: string; keyword: string; angle: string } {
  const [a = '', b = ''] = toolNames;
  switch (pattern) {
    case 'best-for-role':
      return {
        title: `Best ${cluster.label} for ${cluster.persona.split(',')[0]} in ${CURRENT_YEAR}`,
        keyword: `best ${cluster.label.toLowerCase()} for ${cluster.persona.split(',')[0]}`,
        angle: `Commercial shortlist with real jobs-to-be-done for ${cluster.persona}.`,
      };
    case 'versus':
      return {
        title: `${a} vs ${b}: Which One Fits ${cluster.persona.split(',')[0]} Better in ${CURRENT_YEAR}?`,
        keyword: `${a} vs ${b}`,
        angle: `Head-to-head decision page for buyers already comparing two specific tools.`,
      };
    case 'pricing':
      return {
        title: `${a} Pricing ${CURRENT_YEAR}: Which Plan Makes Sense for ${cluster.persona.split(',')[0]}?`,
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
        title: `How to Use ${a} for ${cluster.jobs[0]} in ${CURRENT_YEAR}`,
        keyword: `${a} for ${cluster.jobs[0]}`,
        angle: `Workflow-led guide that can win long-tail queries with strong intent.`,
      };
    case 'free-tools':
      return {
        title: `Best Free ${cluster.label} in ${CURRENT_YEAR} That Still Feel Usable`,
        keyword: `best free ${cluster.label.toLowerCase()} ${CURRENT_YEAR}`,
        angle: `Free-tool roundup with clear tradeoffs and upgrade thresholds.`,
      };
  }
}

export function buildOpportunityQueue(limit = 60): ContentOpportunity[] {
  const opportunities: ContentOpportunity[] = [];

  for (const cluster of CLUSTERS) {
    const clusterTools = findToolsForCluster(cluster).sort((a, b) => b.rating - a.rating || b.pricingValue - a.pricingValue);
    const top = clusterTools.slice(0, 5);
    if (!top.length) continue;

    for (const pattern of cluster.pagePatterns) {
      let toolSlugs: string[] = [];
      let toolNames: string[] = [];

      if (pattern === 'versus' || pattern === 'switching-guide') {
        if (top.length < 2) continue;
        toolSlugs = [top[0].slug, top[1].slug];
        toolNames = [top[0].name, top[1].name];
      } else if (pattern === 'pricing' || pattern === 'workflow-guide') {
        toolSlugs = [top[0].slug];
        toolNames = [top[0].name];
      } else {
        toolSlugs = top.slice(0, 4).map((tool) => tool.slug);
        toolNames = top.slice(0, 2).map((tool) => tool.name);
      }

      const { title, keyword, angle } = makeTitle(cluster, pattern, toolNames);
      const scoreBase = cluster.monetizationPriority * 10;
      const competitionPenalty = cluster.competition === 'high' ? 12 : cluster.competition === 'medium' ? 6 : 0;
      const patternBonus = pattern === 'pricing' || pattern === 'versus' || pattern === 'switching-guide' ? 8 : 0;
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
        whyThisCanWin: `${cluster.label} has ${cluster.competition} SERP pressure, while ${pattern} pages target stronger intent than generic “best AI tools” queries.`,
        angle,
        toolSlugs,
        score,
      });
    }
  }

  return opportunities.sort((a, b) => b.score - a.score).slice(0, limit);
}
