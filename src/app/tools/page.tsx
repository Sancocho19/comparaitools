export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from "next/link";
import type { Metadata } from "next";
import SearchBar from "@/components/SearchBar";
import { getAllTools, bootstrapStaticTools } from "@/lib/tools-storage";

export const metadata: Metadata = {
  title: "All AI Tools 2026 — Reviews, Pricing & Comparisons | ComparAITools",
  description: "Browse AI tools reviewed and rated. Find the best AI tools by category — chatbots, image generators, coding assistants, and more. Updated 2026.",
  alternates: { canonical: "https://comparaitools.com/tools" },
  openGraph: {
    title: "All AI Tools 2026 | ComparAITools",
    description: "AI tools reviewed, rated, and compared. Find the best AI tool for your needs.",
    type: "website",
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

function buildToolsUrl(category: string, source: string, sort: string): string {
  const params = new URLSearchParams();
  if (category !== 'all') params.set('category', category);
  if (source !== 'all') params.set('source', source);
  if (sort !== 'evidence') params.set('sort', sort);
  const query = params.toString();
  return query ? `/tools?${query}` : '/tools';
}

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; source?: string; sort?: string }>;
}) {
  await bootstrapStaticTools();

  const allTools = await getAllTools();
  const verified = allTools.filter((t) => t.verified);

  const params = await searchParams;
  const activeCategory = params.category ?? "all";
  const activeSource = params.source ?? "all";
  const activeSort = params.sort ?? "evidence";

  let filtered = activeCategory === "all"
    ? verified
    : verified.filter((t) => t.category === activeCategory);

  if (activeSource !== "all") {
    filtered = filtered.filter((t) => t.source === activeSource);
  }

  const sorted = [...filtered].sort((a, b) => {
    if (activeSort === 'rating') return b.rating - a.rating || getEvidenceScore(b) - getEvidenceScore(a);
    if (activeSort === 'new') return String(b.lastUpdated).localeCompare(String(a.lastUpdated));
    if (activeSort === 'pricing') return Number(a.pricingValue ?? 0) - Number(b.pricingValue ?? 0);
    if (activeSort === 'sources') return getSourceCount(b) - getSourceCount(a) || getEvidenceScore(b) - getEvidenceScore(a);
    return getEvidenceScore(b) - getEvidenceScore(a) || b.rating - a.rating;
  });

  const categoryMap = new Map<string, { label: string; count: number }>();
  for (const t of verified) {
    if (!categoryMap.has(t.category)) {
      categoryMap.set(t.category, { label: t.categoryLabel, count: 0 });
    }
    categoryMap.get(t.category)!.count++;
  }
  const categories = Array.from(categoryMap.entries()).map(([cat, v]) => ({
    category: cat, label: v.label, count: v.count,
  }));

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Best AI Tools 2026",
    description: "Comprehensive list of AI tools reviewed and rated by ComparAITools",
    numberOfItems: verified.length,
    itemListElement: sorted.map((tool, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: tool.name,
      url: `https://comparaitools.com/tools/${tool.slug}`,
    })),
  };

  const pillBase = {
    border: '1px solid var(--border)',
    textDecoration: 'none',
  } as const;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      <div className="grain-overlay" />

      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: "rgba(10,10,15,0.9)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))", color: "var(--bg)" }}>
              C
            </div>
            <span className="font-extrabold text-lg" style={{ fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>
              <span className="text-[var(--accent)]">Compar</span>
              <span className="text-[var(--text)]">AITools</span>
            </span>
          </Link>
          <div className="flex-1 hidden md:block">
            <SearchBar />
          </div>
          <div className="hidden md:flex gap-6 items-center shrink-0">
            <Link href="/tools" className="text-[var(--accent)] text-[13px] font-medium">Tools</Link>
            <Link href="/compare" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Compare</Link>
            <Link href="/blog" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Blog</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 py-12 relative z-10">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-4">
            <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
            <span>/</span>
            <span className="text-[var(--text-muted)]">All Tools</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-mono)" }}>
            All AI Tools <span className="text-[var(--accent)]">2026</span>
          </h1>
          <p className="text-[var(--text-muted)] text-[15px] max-w-2xl">
            {verified.length} verified tools reviewed, compared, and ranked by research strength, pricing clarity, and commercial relevance.
          </p>
        </div>

        <section className="rounded-2xl p-4 sm:p-5 mb-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="grid gap-5 lg:grid-cols-[1.8fr_1fr_1fr] lg:items-start">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--text-dim)] mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
                Categories
              </div>
              <div className="flex flex-wrap gap-2 items-start content-start">
                <Link
                  href={buildToolsUrl('all', activeSource, activeSort)}
                  className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold leading-none whitespace-nowrap"
                  style={{
                    ...pillBase,
                    background: activeCategory === 'all' ? 'var(--accent)' : 'rgba(255,255,255,0.02)',
                    color: activeCategory === 'all' ? 'var(--bg)' : 'var(--text-muted)',
                  }}
                >
                  All ({verified.length})
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.category}
                    href={buildToolsUrl(cat.category, activeSource, activeSort)}
                    className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold leading-none whitespace-nowrap"
                    style={{
                      ...pillBase,
                      background: activeCategory === cat.category ? 'var(--accent)' : 'rgba(255,255,255,0.02)',
                      color: activeCategory === cat.category ? 'var(--bg)' : 'var(--text-muted)',
                    }}
                  >
                    {cat.label} ({cat.count})
                  </Link>
                ))}
              </div>
            </div>

            <div className="self-start">
              <div className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--text-dim)] mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
                Source
              </div>
              <div className="flex flex-wrap gap-2 items-start content-start">
                {[
                  { key: 'all', label: 'All sources' },
                  { key: 'static', label: 'Static' },
                  { key: 'discovered', label: 'Discovered' },
                ].map((item) => (
                  <Link
                    key={item.key}
                    href={buildToolsUrl(activeCategory, item.key, activeSort)}
                    className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold leading-none whitespace-nowrap self-start h-auto"
                    style={{
                      ...pillBase,
                      background: activeSource === item.key ? 'var(--accent)' : 'rgba(255,255,255,0.02)',
                      color: activeSource === item.key ? 'var(--bg)' : 'var(--text-muted)',
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="self-start">
              <div className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--text-dim)] mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
                Sort
              </div>
              <div className="flex flex-wrap gap-2 items-start content-start">
                {[
                  { key: 'evidence', label: 'Top evidence' },
                  { key: 'rating', label: 'Top rated' },
                  { key: 'sources', label: 'Most sources' },
                  { key: 'new', label: 'Newest' },
                ].map((item) => (
                  <Link
                    key={item.key}
                    href={buildToolsUrl(activeCategory, activeSource, item.key)}
                    className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold leading-none whitespace-nowrap self-start h-auto"
                    style={{
                      ...pillBase,
                      background: activeSort === item.key ? 'var(--accent)' : 'rgba(255,255,255,0.02)',
                      color: activeSort === item.key ? 'var(--bg)' : 'var(--text-muted)',
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((tool) => {
            const evidence = getEvidenceScore(tool);
            const sources = getSourceCount(tool);
            return (
              <Link key={tool.id} href={`/tools/${tool.slug}`}
                className="group rounded-2xl p-6 flex flex-col gap-3 transition-all hover:scale-[1.02]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl">{tool.logo}</span>
                    <div className="min-w-0">
                      <h2 className="text-[var(--text)] font-bold text-[15px] leading-tight truncate">{tool.name}</h2>
                      <p className="text-[var(--text-dim)] text-[11px]">{tool.company}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: tool.trend.startsWith("+") ? "rgba(0,229,160,0.1)" : "rgba(239,68,68,0.1)",
                        color: tool.trend.startsWith("+") ? "var(--accent)" : "var(--red)",
                      }}>
                      {tool.trend}
                    </span>
                    {tool.source === 'discovered' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(139,92,246,0.15)", color: "var(--purple)" }}>
                        NEW
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[var(--text-muted)] text-[13px] leading-relaxed line-clamp-2">
                  {tool.description}
                </p>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                    <div className="text-[var(--text-dim)]">Evidence</div>
                    <div className="text-[var(--text)] font-semibold">{evidence || '—'}/100</div>
                  </div>
                  <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                    <div className="text-[var(--text-dim)]">Sources</div>
                    <div className="text-[var(--text)] font-semibold">{sources || '—'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--orange)] text-sm">{"★".repeat(Math.floor(tool.rating))}</span>
                    <span className="text-[var(--text-dim)] text-[12px]">{tool.rating}/5</span>
                  </div>
                  <span className="text-[12px] font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
                    {tool.pricing}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg"
                    style={{ background: `${tool.color}15`, color: `${tool.color}cc`, border: `1px solid ${tool.color}22` }}>
                    {tool.categoryLabel}
                  </span>
                  <span className="text-[var(--accent)] text-[12px] font-semibold group-hover:underline">
                    Review →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-xl font-bold text-[var(--text)] mb-2">Can&apos;t decide between two tools?</h2>
          <p className="text-[var(--text-muted)] text-sm mb-5">
            Use our head-to-head comparison tool to find the perfect fit for your needs.
          </p>
          <Link href="/compare"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))", color: "var(--bg)" }}>
            Compare Tools Head-to-Head →
          </Link>
        </div>
      </main>
    </>
  );
}
