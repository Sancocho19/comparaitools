import Link from 'next/link';
import type { Metadata } from 'next';
import SearchBar from '@/components/SearchBar';
import { getAllTools, bootstrapStaticTools } from '@/lib/tools-storage';
import { buildCompareSlug } from '@/lib/utils';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Compare AI Tools Side by Side (2026) | ComparAITools',
  description:
    'Find stronger head-to-head AI tool comparisons by pricing, fit, research strength, and tradeoffs that matter before you switch.',
  alternates: { canonical: 'https://comparaitools.com/compare' },
  openGraph: {
    title: 'Compare AI Tools Side by Side | ComparAITools',
    description: 'High-intent AI tool comparisons built to help you choose faster and smarter.',
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
  if (text.length <= 28) return text;
  const short = text
    .replace(/^free tier\s*\+\s*/i, 'Free + ')
    .replace(/^plans start at\s*/i, 'From ')
    .replace(/^starting from\s*/i, 'From ');
  return short.length <= 28 ? short : `${short.slice(0, 25).trim()}…`;
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
      className="group rounded-2xl p-4 transition-all hover:scale-[1.01]"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'none' }}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{toolA.logo}</span>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-[var(--text)] leading-tight truncate">{toolA.name}</p>
              <p className="text-[10px] text-[var(--text-dim)] truncate">{toolA.categoryLabel}</p>
            </div>
          </div>

          {variant === 'featured' ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span
                className="px-2 py-1 rounded-lg text-[10px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                ★ {toolA.rating.toFixed(1)}
              </span>
              <span
                className="px-2 py-1 rounded-lg text-[10px] font-semibold truncate max-w-[150px]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                title={toolA.pricing}
              >
                {compactPricing(toolA.pricing)}
              </span>
              <span
                className="px-2 py-1 rounded-lg text-[10px] font-semibold"
                style={{ background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)', color: 'var(--accent)' }}
              >
                Evidence {getEvidenceScore(toolA)}
              </span>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--text-dim)]">
              <span>Evidence {getEvidenceScore(toolA)}</span>
              <span>•</span>
              <span className="truncate">{compactPricing(toolA.pricing)}</span>
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-center gap-1 px-1">
          <span className="text-[11px] font-bold text-[var(--text-dim)]">VS</span>
          <span className="text-[var(--accent)] text-sm group-hover:translate-x-1 transition-transform">→</span>
        </div>

        <div className="min-w-0 flex-1 text-right">
          <div className="flex items-center justify-end gap-2 min-w-0">
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-[var(--text)] leading-tight truncate">{toolB.name}</p>
              <p className="text-[10px] text-[var(--text-dim)] truncate">{toolB.categoryLabel}</p>
            </div>
            <span className="text-xl shrink-0">{toolB.logo}</span>
          </div>

          {variant === 'featured' ? (
            <div className="mt-3 flex flex-wrap gap-1.5 justify-end">
              <span
                className="px-2 py-1 rounded-lg text-[10px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                ★ {toolB.rating.toFixed(1)}
              </span>
              <span
                className="px-2 py-1 rounded-lg text-[10px] font-semibold truncate max-w-[150px]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                title={toolB.pricing}
              >
                {compactPricing(toolB.pricing)}
              </span>
              <span
                className="px-2 py-1 rounded-lg text-[10px] font-semibold"
                style={{ background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)', color: 'var(--accent)' }}
              >
                Evidence {getEvidenceScore(toolB)}
              </span>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-[var(--text-dim)]">
              <span className="truncate">{compactPricing(toolB.pricing)}</span>
              <span>•</span>
              <span>Evidence {getEvidenceScore(toolB)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
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
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-4">
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
        <div className="md:hidden px-4 pb-3">
          <SearchBar />
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="text-center mb-12">
          <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] justify-center mb-4">
            <Link href="/" className="hover:text-[var(--accent)]">
              Home
            </Link>
            <span>/</span>
            <span className="text-[var(--text-muted)]">Compare</span>
          </div>

          <h1 className="text-4xl font-extrabold mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
            <span className="text-[var(--text)]">Compare </span>
            <span className="text-[var(--accent)]">AI Tools</span>
          </h1>

          <p className="text-[15px] text-[var(--text-muted)] max-w-2xl mx-auto leading-7">
            Focus on head-to-head decisions that actually matter: same-category rivals, pricing clarity, and stronger workflow fit.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Tools tracked', value: allTools.length },
            { label: 'Same-category pairs', value: sameCategory.length },
            { label: 'Cross-category pairs', value: crossCategory.length },
            { label: 'Featured now', value: featuredPairs.length },
          ].map((item) => (
            <div key={item.label} className="text-center p-5 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-2xl font-extrabold text-[var(--accent)] mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
                {item.value}
              </div>
              <div className="text-[12px] text-[var(--text-dim)]">{item.label}</div>
            </div>
          ))}
        </div>

        <section className="mb-12">
          <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
            <div>
              <span className="text-[11px] tracking-[3px] text-[var(--accent)] font-bold uppercase block" style={{ fontFamily: 'var(--font-mono)' }}>
                Highest intent
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] mt-2">Featured same-category comparisons</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {featuredPairs.map(({ toolA, toolB }) => (
              <PairCard key={`${toolA.slug}-${toolB.slug}`} toolA={toolA} toolB={toolB} variant="featured" />
            ))}
          </div>
        </section>

        {categories.map(({ category, label }) => {
          const pairs = sameCategory.filter((pair) => pair.toolA.category === category).slice(0, 6);
          if (!pairs.length) return null;

          return (
            <section key={category} className="mb-12">
              <h2 className="text-lg font-bold text-[var(--text)] mb-5 flex items-center gap-3">
                <span>{pairs[0]?.toolA.logo}</span>
                <span>{label} comparisons</span>
                <span
                  className="text-[12px] font-normal text-[var(--text-dim)] px-2 py-0.5 rounded-lg"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  {pairs.length} featured
                </span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {pairs.map(({ toolA, toolB }) => (
                  <PairCard key={`${toolA.slug}-${toolB.slug}`} toolA={toolA} toolB={toolB} />
                ))}
              </div>
            </section>
          );
        })}

        <section className="mb-12">
          <h2 className="text-lg font-bold text-[var(--text)] mb-2">Cross-category comparisons</h2>
          <p className="text-[13px] text-[var(--text-muted)] mb-5">
            Useful for exploration, but usually weaker buying pages than same-category matchups.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {crossCategory.slice(0, 6).map(({ toolA, toolB }) => (
              <PairCard key={`${toolA.slug}-${toolB.slug}`} toolA={toolA} toolB={toolB} />
            ))}
          </div>
        </section>

        <div className="text-center p-10 rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))' }}>
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--bg)' }}>
            Need the underlying tool profiles?
          </h2>
          <p className="text-sm mb-6 opacity-85" style={{ color: 'var(--bg)' }}>
            Browse research-backed tool profiles before you jump into a comparison.
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
      </main>
    </>
  );
}
