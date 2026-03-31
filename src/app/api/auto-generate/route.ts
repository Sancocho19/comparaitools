import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return (
    request.headers.get('authorization') === `Bearer ${expected}` ||
    request.nextUrl.searchParams.get('secret') === expected
  );
}

function clean(value: unknown): string {
  if (!value) return '';
  return String(value).trim();
}

function slugifyFallback(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

type Opportunity = {
  key: string;
  title: string;
  pageType: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  angle?: string;
  toolSlugs?: string[];
  score?: number;
  clusterKey?: string;
  clusterLabel?: string;
  competition?: string;
  monetizationPriority?: number;
  whyThisCanWin?: string;
};

type ManualSelection = {
  pageType: string;
  tool?: string;
  slugA?: string;
  slugB?: string;
};

type GeneratorOptions = {
  minWords?: number;
  faqCount?: number;
  internalLinkCount?: number;
  maxTokens?: number;
  fast?: boolean;
};

async function loadTopicQueue(queueMode: string): Promise<Opportunity[]> {
  const topicPlannerMod: any = await import('@/lib/topic-planner');

  const queueFns = [
    topicPlannerMod.buildTopicQueue,
    topicPlannerMod.getTopicQueue,
    topicPlannerMod.buildOpportunityQueue,
  ].filter((fn) => typeof fn === 'function');

  if (!queueFns.length) {
    throw new Error('No compatible topic queue builder found in src/lib/topic-planner.ts');
  }

  for (const fn of queueFns) {
    const data = await fn(60, queueMode);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.opportunities)) return data.opportunities;
  }

  throw new Error('Topic queue builder returned no usable opportunities');
}

function chooseRandomOpportunity(opportunities: Opportunity[], requestedPageType?: string): Opportunity | null {
  const filtered = requestedPageType
    ? opportunities.filter((item) => item.pageType === requestedPageType)
    : opportunities;

  if (!filtered.length) return null;

  const sorted = [...filtered].sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0));
  const topSlice = sorted.slice(0, Math.min(6, sorted.length));
  return topSlice[Math.floor(Math.random() * topSlice.length)] ?? null;
}

function buildManualOpportunity(selection: ManualSelection): Opportunity {
  const pageType = clean(selection.pageType).toLowerCase();
  const tool = clean(selection.tool);
  const slugA = clean(selection.slugA);
  const slugB = clean(selection.slugB);

  if (!pageType) {
    throw new Error('pageType is required in mode=manual');
  }

  if (pageType === 'comparison') {
    if (!slugA || !slugB) throw new Error('slugA and slugB are required for comparison');
    return {
      key: `manual-comparison-${slugA}-${slugB}`,
      title: `${slugA} vs ${slugB}`,
      pageType: 'comparison',
      primaryKeyword: `${slugA} vs ${slugB}`,
      toolSlugs: [slugA, slugB],
      angle: 'Manual comparison request.',
    };
  }

  if (!tool) {
    throw new Error('tool is required in mode=manual for non-comparison pages');
  }

  const toolSlug = slugifyFallback(tool);
  const pretty = tool.replace(/-/g, ' ');

  const titleMap: Record<string, string> = {
    pricing: `${pretty} Pricing 2026: Plans, Costs, and Best Fit`,
    alternatives: `Best ${pretty} Alternatives in 2026`,
    review: `${pretty} Review 2026: Is It Worth It?`,
    guide: `How to Use ${pretty} in 2026`,
    roundup: `Best ${pretty} Alternatives and Competitors in 2026`,
  };

  return {
    key: `manual-${pageType}-${toolSlug}`,
    title: titleMap[pageType] ?? `${pretty} ${pageType} 2026`,
    pageType,
    primaryKeyword: `${pretty} ${pageType} 2026`,
    toolSlugs: [toolSlug],
    angle: 'Manual controlled generation.',
  };
}

async function selectOpportunity(request: NextRequest): Promise<{ selection: Opportunity; selectionMode: string; queueSize: number }> {
  const mode = clean(request.nextUrl.searchParams.get('mode') ?? 'random').toLowerCase();
  const queueMode = clean(request.nextUrl.searchParams.get('queueMode') ?? 'money').toLowerCase();
  const requestedPageType = clean(request.nextUrl.searchParams.get('pageType')).toLowerCase() || undefined;
  const requestedKey = clean(request.nextUrl.searchParams.get('key'));

  const opportunities = await loadTopicQueue(queueMode);
  const queueSize = opportunities.length;

  if (mode === 'key') {
    if (!requestedKey) throw new Error('key is required when mode=key');
    const match = opportunities.find((item) => item.key === requestedKey);
    if (!match) throw new Error(`Opportunity not found for key=${requestedKey}`);
    return { selection: match, selectionMode: 'key', queueSize };
  }

  if (mode === 'manual') {
    const manual = buildManualOpportunity({
      pageType: clean(request.nextUrl.searchParams.get('pageType')),
      tool: clean(request.nextUrl.searchParams.get('tool')),
      slugA: clean(request.nextUrl.searchParams.get('slugA')),
      slugB: clean(request.nextUrl.searchParams.get('slugB')),
    });
    return { selection: manual, selectionMode: 'manual', queueSize };
  }

  const picked = chooseRandomOpportunity(opportunities, requestedPageType);
  if (!picked) {
    throw new Error(requestedPageType ? `No opportunities found for pageType=${requestedPageType}` : 'No opportunities found');
  }
  return { selection: picked, selectionMode: requestedPageType ? 'random-filtered' : 'random', queueSize };
}

async function generateFromSelection(selection: Opportunity, options?: GeneratorOptions): Promise<any> {
  const contentEngineMod: any = await import('@/lib/content-engine');

  const candidateFns = [
    contentEngineMod.generatePostFromOpportunity,
    contentEngineMod.generateContentFromOpportunity,
    contentEngineMod.generatePost,
    contentEngineMod.generateContent,
  ].filter((fn) => typeof fn === 'function');

  if (!candidateFns.length) {
    throw new Error('No compatible generator found in src/lib/content-engine.ts');
  }

  const generator = candidateFns[0];
  return await generator(selection, options);
}

async function persistGeneratedPost(generated: any): Promise<{ saved: boolean; method: string }> {
  try {
    const kvMod: any = await import('@/lib/kv-storage');
    const persistFns: Array<{ name: string; fn: Function }> = [
      { name: 'savePost', fn: kvMod.savePost },
      { name: 'upsertPost', fn: kvMod.upsertPost },
      { name: 'persistPost', fn: kvMod.persistPost },
      { name: 'saveGeneratedPost', fn: kvMod.saveGeneratedPost },
      { name: 'putPost', fn: kvMod.putPost },
      { name: 'addPost', fn: kvMod.addPost },
    ].filter((item) => typeof item.fn === 'function');

    for (const item of persistFns) {
      await item.fn(generated);
      return { saved: true, method: item.name };
    }

    return { saved: false, method: 'none' };
  } catch {
    return { saved: false, method: 'none' };
  }
}

function buildPreviewResponse(selection: Opportunity, selectionMode: string, queueSize: number, options: GeneratorOptions) {
  const slug = clean(selection.key) || slugifyFallback(selection.title);
  return {
    success: true,
    previewOnly: true,
    mode: selectionMode,
    queueSize,
    key: selection.key,
    pageType: selection.pageType,
    title: selection.title,
    slug,
    url: `/blog/${slug}`,
    primaryKeyword: selection.primaryKeyword ?? '',
    secondaryKeywords: selection.secondaryKeywords ?? [],
    toolSlugs: selection.toolSlugs ?? [],
    score: Number(selection.score ?? 0),
    competition: selection.competition ?? undefined,
    monetizationPriority: selection.monetizationPriority ?? undefined,
    whyThisCanWin: selection.whyThisCanWin ?? undefined,
    generatorOptions: options,
    selection,
  };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const previewOnly = request.nextUrl.searchParams.get('preview') === 'true';
  const fast = request.nextUrl.searchParams.get('fast') === 'true';
  const minWords = Number(request.nextUrl.searchParams.get('minWords') || 0);
  const faqCount = Number(request.nextUrl.searchParams.get('faqCount') || 0);
  const internalLinkCount = Number(request.nextUrl.searchParams.get('internalLinkCount') || 0);
  const maxTokens = Number(request.nextUrl.searchParams.get('maxTokens') || 0);

  const options: GeneratorOptions = {
    fast,
    minWords: Number.isFinite(minWords) && minWords > 0 ? minWords : undefined,
    faqCount: Number.isFinite(faqCount) && faqCount > 0 ? faqCount : undefined,
    internalLinkCount: Number.isFinite(internalLinkCount) && internalLinkCount > 0 ? internalLinkCount : undefined,
    maxTokens: Number.isFinite(maxTokens) && maxTokens > 0 ? maxTokens : undefined,
  };

  try {
    const { selection, selectionMode, queueSize } = await selectOpportunity(request);

    // Fast preview: do not generate the article body.
    if (previewOnly) {
      return NextResponse.json(buildPreviewResponse(selection, selectionMode, queueSize, options));
    }

    const generated = await generateFromSelection(selection, options);

    const slug = clean(generated?.slug || generated?.post?.slug || selection.key || slugifyFallback(selection.title));
    const title = clean(generated?.title || generated?.post?.title || selection.title);
    const type = clean(generated?.type || generated?.post?.type || selection.pageType || 'article');
    const wordCount = Number(generated?.wordCount || generated?.post?.wordCount || 0);
    const readingTime = Number(generated?.readingTime || generated?.post?.readingTime || 0);
    const sourceCount = Number(generated?.sourceCount || generated?.post?.sourceCount || generated?.research?.sourceCount || 0);
    const evidenceScore = Number(generated?.evidenceScore || generated?.post?.evidenceScore || generated?.research?.evidenceScore || 0);

    const persistence = await persistGeneratedPost(generated?.post ?? generated);

    return NextResponse.json({
      success: true,
      mode: selectionMode,
      queueSize,
      key: selection.key,
      pageType: selection.pageType,
      slug,
      type,
      title,
      wordCount,
      readingTime,
      sourceCount,
      evidenceScore,
      saved: persistence.saved,
      saveMethod: persistence.method,
      url: slug ? `/blog/${slug}` : undefined,
      previewOnly: false,
      generatorOptions: options,
      selection,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Unknown auto-generate error' },
      { status: 500 },
    );
  }
}
