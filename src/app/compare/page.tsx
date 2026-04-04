import Link from 'next/link';
import type { Metadata } from 'next';
import SearchBar from '@/components/SearchBar';
import { getAllTools, bootstrapStaticTools } from '@/lib/tools-storage';
import { buildCompareSlug } from '@/lib/utils';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Compare AI Tools Side by Side (2026) | ComparAITools',
  description:
    'Head-to-head AI tool comparisons across pricing, positioning, research strength, and switching cost.',
  alternates: { canonical: 'https://comparaitools.com/compare' },
  openGraph: {
    title: 'Compare AI Tools Side by Side | ComparAITools',
    description: 'High-intent AI tool comparisons structured around pricing, positioning, and tradeoffs.',
    url: 'https://comparaitools.com/compare',
    type: 'website',
  },
};

type ToolItem = Awaited<ReturnType<typeof getAllTools>>[number];

type ToolWithResearch = ToolItem & {
  evidenceScore?: number;
  sourceCount?: number;
  research?: {
    evidenceScore?: number;
    sourceCount?: number;
  };
};

function getEvidenceScore(tool: ToolItem): number {
  const typed = tool as ToolWithResearch;
  return Number(typed.evidenceScore ?? typed.research?.evidenceScore ?? 0);
}

function getSourceCount(tool: ToolItem): number {
  const typed = tool as ToolWithResearch;
  return Number(typed.sourceCount ?? typed.research?.sourceCount ?? 0);
}

function compactPricing(value: string): string {
  const text = String(value || '').trim();
  if (!text) return 'Pricing not listed';
  if (text.length <= 24) return text;

  const shortened = text
    .replace(/^free tier\s*\+\s*/i, 'Free + ')
    .replace(/^plans start at\s*/i, 'From ')
    .replace(/^starting from\s*/i, 'From ')
    .replace(/^free self-hosted version available\.\s*/i, '')
    .replace(/^cloud plans start at\s*/i, 'Cloud from ');

  return shortened.length <= 24 ? shortened : `${shortened.slice(0, 21).trim()}…`;
}

function pairScore(a: ToolItem, b: ToolItem): number {
  const sameCategoryBonus = a.category === b.category ? 24 : 0;
  const research = getEvidenceScore(a) + getEvidenceScore(b);
  const ratings = Math.round(a.rating * 10) + Math.round(b.rating * 10);
  const sources = getSourceCount(a) + getSourceCount(b);
  return sameCategoryBonus + research + ratings + sources;
}

function PairCard({
  toolA,
  toolB,
  variant = 'compact',
}: {
  toolA: ToolItem;
  toolB: ToolItem;
  variant?: 'compact' | 'featured';
}) {
  const href = `/compare/${buildCompareSlug(toolA.slug, toolB.slug)}`;

  return (
    <Link
      href={href}
      className="group rounded-[26px] px-5 py-5 md:px-6 md:py-6 transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'none' }}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-center">
        <div className="min-w-0">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-2xl shrink-0 leading-none mt-0.5">{toolA.logo}</span>
            <div className="min-w-0">
              <p className="text-[15px] md:text-base font-bold text-[var(--text)] leading-snug truncate">
                {toolA.name}
              </p>
              <p className="text-[11px] text-[var(--text-dim)] truncate mt-1.5">
                {toolA.categoryLabel}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              ★ {toolA.rating.toFixed(1)}
            </span>
            <span
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              title={toolA.pricing}
            >
              {compactPricing(toolA.pricing)}
            </span>
            <span
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold"
              style={{ background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)', color: 'var(--accent)' }}
            >
              Evidence {getEvidenceScore(toolA)}
            </span>
            {variant === 'featured' ? (
              <span
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
              >
                {getSourceCount(toolA) || '—'} sources
              </span>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-center justify-center gap-2 px-1 md:px-3">
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
          >
            VS
          </span>
          <span className="text-[var(--accent)] text-base group-hover:translate-x-0.5 transition-transform">→</span>
        </div>

        <div className="min-w-0 text-right">
          <div className="flex items-start justify-end gap-3 min-w-0">
            <div className="min-w-0">
              <p className="text-[15px] md:text-base font-bold text-[var(--text)] leading-snug truncate">
                {toolB.name}
              </p>
              <p className="text-[11px] text-[var(--text-dim)] truncate mt-1.5">
                {toolB.categoryLabel}
              </p>
            </div>
            <span className="text-2xl shrink-0 leading-none mt-0.5">{toolB.logo}</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 justify-end">
            <span
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              ★ {toolB.rating.toFixed(1)}
            </span>
            <span
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              title={toolB.pricing}
            >
              {compactPricing(toolB.pricing)}
            </span>
            <span
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold"
              style={{ background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)', color: 'var(--accent)' }}
            >
              Evidence {getEvidenceScore(toolB)}
            </span>
            {variant === 'featured' ? (
              <span
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
              >
                {getSourceCount(toolB) || '—'} sources
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  badge,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div className="mb-9 md:mb-11">
      <div className="flex items-center gap-3 flex-wrap">
        {icon ? <span className="text-xl">{icon}</span> : null}
        <h2 className="text-xl md:text-2xl font-bold text-[var(--text)]">{title}</h2>
        {badge ? (
          <span
            className="text-[12px] font-normal text-[var(--text-dim)] px-2.5 py-1 rounded-lg"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {badge}
          </span>
        ) : null}
      </div>

      {subtitle ? (
        <p className="text-[13px] md:text-sm text-[var(--text-muted)] max-w-[780px] leading-7 mt-4">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export default async function ComparePage() {
  await bootstrapStaticTools();
  const allTools = (await getAllTools()).filter((tool) => (tool as any).verified !== false);

  const sameCategory: Array<{ toolA: ToolItem; toolB: ToolItem; score: number }> = [];
  const crossCategory: Array<{ toolA: ToolItem; toolB: ToolItem; score: number }> = [];

  for (let i = 0; i < allTools.length; i += 1) {
    for (let j = i + 1; j < allTools.length; j += 1) {
      const pair = { toolA: allTools[i], toolB: allTools[j], score: pairScore(allTools[i], allTools[j]) };
      if (allTools[i].category === allTools[j].category) sameCategory.push(pair);
      else crossCategory.push(pair);
    }
  }

  sameCategory.sort((a, b) => b.score - a.score);
  crossCategory.sort((a, b) => b.score - a.score);

  const featuredPairs = sameCategory.slice(0, 6);

  const categoryMap = new Map<string, { label: string; tools: ToolItem[] }>();
  for (const tool of allTools) {
    if (!categoryMap.has(tool.category)) {
      categoryMap.set(tool.category, { label: tool.categoryLabel, tools: [] });
    }
    categoryMap.get(tool.category)!.tools.push(tool);
  }

  const categories = Array.from(categoryMap.entries())
    .map(([category, value]) => ({
      category,
      label: value.label,
      tools: value.tools.sort((a, b) => getEvidenceScore(b) - getEvidenceScore(a) || b.rating - a.rating),
    }))
    .sort((a, b) => b.tools.length - a.tools.length || a.label.localeCompare(b.label));

  return (
    <>
      <div className="grain-overlay" />

      <nav
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'rgba(10,10,15,0.92)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-[1280px] mx-auto px-5 sm:px-7 py-3.5 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))', color: 'var(--bg)' }}
            >
              C
            </div>
            <span className="font-extrabold text-lg hidden sm:block" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>
              <span className="text-[var(--accent)]">Compar</span>
              <span className="text-[var(--text)]">AITools</span>
            </span>
          </Link>

          <div className="flex-1 hidden md:block">
            <SearchBar />
          </div>

          <div className="hidden md:flex gap-6 items-center shrink-0">
            <Link href="/tools" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">
              Tools
            </Link>
            <Link href="/compare" className="text-[var(--accent)] text-[13px] font-medium">
              Compare
            </Link>
            <Link href="/blog" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">
              Blog
            </Link>
          </div>
        </div>
        <div className="md:hidden px-5 pb-3">
          <SearchBar />
        </div>
      </nav>

      <main className="max-w-[1280px] mx-auto px-5 sm:px-7 py-14 md:py-16 relative z-10">
        <section className="mb-16 md:mb-20">
          <div className="text-center max-w-[820px] mx-auto">
            <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] justify-center mb-5">
              <Link href="/" className="hover:text-[var(--accent)]">
                Home
              </Link>
              <span>/</span>
              <span className="text-[var(--text-muted)]">Compare</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ fontFamily: 'var(--font-mono)' }}>
              <span className="text-[var(--text)]">Compare </span>
              <span className="text-[var(--accent)]">AI Tools</span>
            </h1>

            <p className="text-[15px] md:text-base text-[var(--text-muted)] leading-8">
              Head-to-head analysis focused on category overlap, pricing clarity, research strength, and product positioning.
            </p>
          </div>
        </section>

        <section className="mb-16 md:mb-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {[
              { label: 'Tools tracked', value: allTools.length },
              { label: 'Same-category pairs', value: sameCategory.length },
              { label: 'Cross-category pairs', value: crossCategory.length },
              { label: 'Featured now', value: featuredPairs.length },
            ].map((item) => (
              <div
                key={item.label}
                className="text-center rounded-[24px] px-5 py-6 md:px-6 md:py-7"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="text-2xl md:text-3xl font-extrabold text-[var(--accent)] mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                  {item.value}
                </div>
                <div className="text-[12px] text-[var(--text-dim)]">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20 md:mb-24">
          <SectionHeader
            title="Featured same-category comparisons"
            subtitle="These are the cleaner comparison pages to push internally and from the blog because the buyer intent is much stronger."
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6">
            {featuredPairs.map(({ toolA, toolB }) => (
              <PairCard key={`${toolA.slug}-${toolB.slug}`} toolA={toolA} toolB={toolB} variant="featured" />
            ))}
          </div>
        </section>

        <div className="space-y-20 md:space-y-24">
          {categories.map(({ category, label }) => {
            const pairs = sameCategory.filter((pair) => pair.toolA.category === category).slice(0, 6);
            if (!pairs.length) return null;

            return (
              <section key={category}>
                <SectionHeader
                  icon={pairs[0]?.toolA.logo}
                  title={`${label} comparisons`}
                  badge={`${pairs.length} featured`}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
                  {pairs.map(({ toolA, toolB }) => (
                    <PairCard key={`${toolA.slug}-${toolB.slug}`} toolA={toolA} toolB={toolB} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-20 md:mt-24 mb-20 md:mb-24">
          <SectionHeader
            title="Cross-category comparisons"
            subtitle="Useful for exploration, but usually weaker buying pages than same-category matchups. Keep these cleaner and secondary."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
            {crossCategory.slice(0, 6).map(({ toolA, toolB }) => (
              <PairCard key={`${toolA.slug}-${toolB.slug}`} toolA={toolA} toolB={toolB} />
            ))}
          </div>
        </section>

        <section>
          <div className="text-center rounded-[28px] px-6 py-10 md:px-10 md:py-12" style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))' }}>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3" style={{ color: 'var(--bg)' }}>
              Need the underlying tool profiles?
            </h2>
            <p className="text-sm md:text-base mb-7 opacity-90 max-w-[700px] mx-auto leading-7" style={{ color: 'var(--bg)' }}>
              Research-backed tool profiles provide background context for each comparison page.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/tools"
                className="px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                style={{ background: 'var(--bg)', color: 'var(--accent)', textDecoration: 'none' }}
              >
                Browse All Tools →
              </Link>
              <Link
                href="/blog"
                className="px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--bg)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                Read the Blog →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
