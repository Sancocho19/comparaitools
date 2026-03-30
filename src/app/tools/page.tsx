import Link from 'next/link';
import type { Metadata } from 'next';
import SearchBar from '@/components/SearchBar';
import { getAllTools, bootstrapStaticTools } from '@/lib/tools-storage';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'All AI Tools 2026 — Reviews, Pricing & Comparisons | ComparAITools',
  description:
    'Browse AI tools reviewed and ranked by pricing clarity, research strength, and fit. Filter by category and discover stronger tools first.',
  alternates: { canonical: 'https://comparaitools.com/tools' },
  openGraph: {
    title: 'All AI Tools 2026 | ComparAITools',
    description: 'Browse verified AI tools with research-backed profiles, pricing context, and comparison paths.',
    type: 'website',
  },
};

type ToolItem = Awaited<ReturnType<typeof getAllTools>>[number];

function getEvidenceScore(tool: Partial<ToolItem>): number {
  return Number(tool.evidenceScore ?? tool.research?.evidenceScore ?? 0);
}

function getSourceCount(tool: Partial<ToolItem>): number {
  return Number(tool.sourceCount ?? tool.research?.sourceCount ?? 0);
}

type SortMode = 'evidence' | 'rating' | 'updated' | 'price';
type SourceMode = 'all' | 'static' | 'discovered';

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: SortMode; source?: SourceMode }>;
}) {
  await bootstrapStaticTools();

  const params = await searchParams;
  const allTools = await getAllTools();
  const verified = allTools.filter((tool) => tool.verified !== false);

  const activeCategory = params.category ?? 'all';
  const activeSort: SortMode = params.sort ?? 'evidence';
  const activeSource: SourceMode = params.source ?? 'all';

  let filtered = [...verified];
  if (activeCategory !== 'all') {
    filtered = filtered.filter((tool) => tool.category === activeCategory);
  }
  if (activeSource !== 'all') {
    filtered = filtered.filter((tool) => tool.source === activeSource);
  }

  filtered.sort((a, b) => {
    if (activeSort === 'rating') {
      return b.rating - a.rating || getEvidenceScore(b) - getEvidenceScore(a);
    }
    if (activeSort === 'updated') {
      return String(b.lastUpdated).localeCompare(String(a.lastUpdated)) || getEvidenceScore(b) - getEvidenceScore(a);
    }
    if (activeSort === 'price') {
      return Number(a.pricingValue ?? 0) - Number(b.pricingValue ?? 0) || getEvidenceScore(b) - getEvidenceScore(a);
    }
    return getEvidenceScore(b) - getEvidenceScore(a) || b.rating - a.rating || a.name.localeCompare(b.name);
  });

  const categoryMap = new Map<string, { label: string; count: number }>();
  for (const tool of verified) {
    if (!categoryMap.has(tool.category)) {
      categoryMap.set(tool.category, { label: tool.categoryLabel, count: 0 });
    }
    categoryMap.get(tool.category)!.count += 1;
  }
  const categories = Array.from(categoryMap.entries())
    .map(([category, value]) => ({ category, label: value.label, count: value.count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Best AI Tools 2026',
    description: 'Verified AI tools reviewed and ranked by ComparAITools',
    numberOfItems: filtered.length,
    itemListElement: filtered.slice(0, 30).map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: tool.name,
      url: `https://comparaitools.com/tools/${tool.slug}`,
    })),
  };

  const strongResearchCount = verified.filter((tool) => getEvidenceScore(tool) >= 75).length;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      <div className="grain-overlay" />

      <nav
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'rgba(10,10,15,0.9)', borderBottom: '1px solid var(--border)' }}
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
            <Link href="/tools" className="text-[var(--accent)] text-[13px] font-medium">
              Tools
            </Link>
            <Link href="/compare" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">
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
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-4">
            <Link href="/" className="hover:text-[var(--accent)]">
              Home
            </Link>
            <span>/</span>
            <span className="text-[var(--text-muted)]">All Tools</span>
          </div>

          <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-6 items-start">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text)] mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
                All AI Tools <span className="text-[var(--accent)]">2026</span>
              </h1>
              <p className="text-[var(--text-muted)] text-[15px] max-w-2xl leading-7">
                Browse tools ranked by research strength, pricing clarity, and commercial fit. This page is meant to help you discover stronger options first, not just newer ones.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Verified tools', value: verified.length },
                { label: 'Strong research', value: strongResearchCount },
                { label: 'Categories', value: categories.length },
                { label: 'Visible now', value: filtered.length },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="text-2xl font-extrabold text-[var(--accent)] mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
                    {item.value}
                  </div>
                  <div className="text-[11px] text-[var(--text-dim)]">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4 sm:p-5 mb-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-bold mb-2">Category</div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/tools?sort=${activeSort}&source=${activeSource}`}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: activeCategory === 'all' ? 'var(--accent)' : 'var(--bg)',
                    color: activeCategory === 'all' ? 'var(--bg)' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}
                >
                  All ({verified.length})
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.category}
                    href={`/tools?category=${cat.category}&sort=${activeSort}&source=${activeSource}`}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: activeCategory === cat.category ? 'var(--accent)' : 'var(--bg)',
                      color: activeCategory === cat.category ? 'var(--bg)' : 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {cat.label} ({cat.count})
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-bold mb-2">Sort by</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['evidence', 'Evidence'],
                    ['rating', 'Rating'],
                    ['updated', 'Updated'],
                    ['price', 'Price'],
                  ].map(([value, label]) => (
                    <Link
                      key={value}
                      href={`/tools?category=${activeCategory}&sort=${value}&source=${activeSource}`}
                      className="px-3 py-2 rounded-xl text-sm font-semibold"
                      style={{
                        background: activeSort === value ? 'var(--accent)' : 'var(--bg)',
                        color: activeSort === value ? 'var(--bg)' : 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-bold mb-2">Source</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['all', 'All'],
                    ['static', 'Core'],
                    ['discovered', 'Discovered'],
                  ].map(([value, label]) => (
                    <Link
                      key={value}
                      href={`/tools?category=${activeCategory}&sort=${activeSort}&source=${value}`}
                      className="px-3 py-2 rounded-xl text-sm font-semibold"
                      style={{
                        background: activeSource === value ? 'var(--accent)' : 'var(--bg)',
                        color: activeSource === value ? 'var(--bg)' : 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold text-[var(--text)] mb-2">No tools match this view yet</h2>
            <p className="text-[var(--text-muted)] text-sm">Try a different category, source, or sort mode.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tool) => {
              const evidence = getEvidenceScore(tool);
              const sources = getSourceCount(tool);

              return (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  className="group rounded-2xl p-6 flex flex-col gap-4 transition-all hover:scale-[1.02]"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-3xl">{tool.logo}</span>
                      <div className="min-w-0">
                        <h2 className="text-[var(--text)] font-bold text-[16px] leading-tight truncate">{tool.name}</h2>
                        <p className="text-[var(--text-dim)] text-[11px]">{tool.company}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: tool.trend.startsWith('+') ? 'rgba(0,229,160,0.1)' : 'rgba(239,68,68,0.1)',
                          color: tool.trend.startsWith('+') ? 'var(--accent)' : 'var(--red)',
                        }}
                      >
                        {tool.trend}
                      </span>
                      {tool.source === 'discovered' ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--purple)' }}>
                          NEW
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-[var(--text-muted)] text-[13px] leading-relaxed line-clamp-2">{tool.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {tool.features.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{ background: `${tool.color}15`, color: `${tool.color}cc`, border: `1px solid ${tool.color}22` }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

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
                      <span className="text-[var(--orange)] text-sm">{'★'.repeat(Math.max(1, Math.floor(tool.rating)))}</span>
                      <span className="text-[var(--text-dim)] text-[12px]">{tool.rating.toFixed(1)}/5</span>
                    </div>
                    <span className="text-[12px] font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                      {tool.pricing}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <span
                      className="text-[11px] px-2.5 py-1 rounded-lg"
                      style={{ background: `${tool.color}15`, color: `${tool.color}cc`, border: `1px solid ${tool.color}22` }}
                    >
                      {tool.categoryLabel}
                    </span>
                    <span className="text-[var(--accent)] text-[12px] font-semibold group-hover:underline">Open profile →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-12 rounded-2xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-xl font-bold text-[var(--text)] mb-2">Need a faster decision?</h2>
          <p className="text-[var(--text-muted)] text-sm mb-5">
            Jump into the comparison hub and see the strongest head-to-head pages first.
          </p>
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))', color: 'var(--bg)' }}
          >
            Compare Tools Head-to-Head →
          </Link>
        </div>
      </main>
    </>
  );
}
