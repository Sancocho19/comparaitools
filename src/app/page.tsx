import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import { getAllTools, getCategories } from '@/lib/tools-storage';
import { buildCompareSlug } from '@/lib/utils';

export const revalidate = 3600;

type ToolItem = Awaited<ReturnType<typeof getAllTools>>[number];

type ToolWithResearch = ToolItem & {
  evidenceScore?: number;
  sourceCount?: number;
  research?: {
    evidenceScore?: number;
    sourceCount?: number;
  };
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-[var(--orange)] text-sm">
      {'★'.repeat(Math.max(1, Math.floor(rating)))}{' '}
      <span className="text-[var(--text-dim)]">{rating.toFixed(1)}</span>
    </span>
  );
}

function getEvidenceScore(tool: ToolItem): number {
  const typed = tool as ToolWithResearch;
  return Number(typed.evidenceScore ?? typed.research?.evidenceScore ?? 0);
}

function getSourceCount(tool: ToolItem): number {
  const typed = tool as ToolWithResearch;
  return Number(typed.sourceCount ?? typed.research?.sourceCount ?? 0);
}

export default async function HomePage() {
  const [rawTools, categories] = await Promise.all([getAllTools(), getCategories()]);
  const tools = rawTools.filter((tool) => tool.verified !== false);

  const featured = [...tools]
    .sort((a, b) => {
      const aEvidence = getEvidenceScore(a);
      const bEvidence = getEvidenceScore(b);
      return (
        bEvidence - aEvidence ||
        b.rating - a.rating ||
        Number(b.pricingValue ?? 0) - Number(a.pricingValue ?? 0)
      );
    })
    .slice(0, 9);

  const newVerified = [...tools]
    .filter((tool) => tool.source === 'discovered' && getEvidenceScore(tool) >= 70)
    .sort((a, b) => getEvidenceScore(b) - getEvidenceScore(a) || b.rating - a.rating)
    .slice(0, 4);

  const pricingReady = [...tools]
    .filter((tool) => Number(tool.pricingValue ?? 0) > 0 || !/check official/i.test(String(tool.pricing ?? '')))
    .sort((a, b) => getEvidenceScore(b) - getEvidenceScore(a) || b.rating - a.rating)
    .slice(0, 6);

  const comparisons: Array<{ a: ToolItem; b: ToolItem; score: number }> = [];
  for (let i = 0; i < tools.length; i += 1) {
    for (let j = i + 1; j < tools.length; j += 1) {
      if (tools[i].category !== tools[j].category) continue;
      const score =
        getEvidenceScore(tools[i]) +
        getEvidenceScore(tools[j]) +
        tools[i].rating * 10 +
        tools[j].rating * 10;
      comparisons.push({ a: tools[i], b: tools[j], score });
    }
  }
  const featuredComparisons = comparisons
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const highConfidenceCount = tools.filter((tool) => getEvidenceScore(tool) >= 75).length;
  const discoveredCount = tools.filter((tool) => tool.source === 'discovered').length;

  return (
    <>
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
            <span
              className="font-extrabold text-lg hidden sm:block"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}
            >
              <span className="text-[var(--accent)]">Compar</span>
              <span className="text-[var(--text)]">AITools</span>
            </span>
          </Link>

          <div className="flex-1 hidden sm:block">
            <SearchBar />
          </div>

          <div className="hidden sm:flex gap-6 items-center shrink-0">
            <Link href="/tools" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">
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
        <div className="sm:hidden px-4 pb-3">
          <SearchBar />
        </div>
      </nav>

      <main className="site-container relative z-10">
        <header className="text-center py-12 sm:py-16 md:py-20 relative">
          <div className="hero-glow" />
          <div className="relative max-w-[820px] mx-auto">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--accent)', animation: 'pulse 2s infinite' }}
              />
              <span className="text-xs text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                {tools.length} verified tools · {highConfidenceCount} strong-research profiles · {discoveredCount} discovered entries
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.06] mb-5 gradient-text">
              Find the AI tool that fits the job — not just the hype.
            </h1>

            <p className="text-[var(--text-muted)] text-sm sm:text-base leading-7 max-w-[720px] mx-auto mb-7">
              Pricing snapshots, high-intent comparisons, and buying guides powered by live search research plus editorial logic.
              Built to win long-tail commercial queries instead of generic fluff.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, var(--accent), #00c889)', color: 'var(--bg)' }}
              >
                Explore tools →
              </Link>
              <Link
                href="/compare"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                See comparisons
              </Link>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Tracked tools', value: tools.length },
            { label: 'High-confidence profiles', value: highConfidenceCount },
            { label: 'Live categories', value: categories.length },
            { label: 'Head-to-head pairs', value: featuredComparisons.length },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl p-4 sm:p-5 text-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div
                className="text-2xl sm:text-3xl font-black text-[var(--accent)] mb-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {item.value}
              </div>
              <div className="text-[11px] sm:text-[12px] text-[var(--text-dim)]">{item.label}</div>
            </div>
          ))}
        </section>

        <section className="mt-14 sm:mt-18">
          <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
            <div>
              <span
                className="text-[11px] tracking-[3px] text-[var(--accent)] font-bold uppercase block"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Best starting points
              </span>
              <h2 className="text-[var(--text)] text-2xl sm:text-3xl font-extrabold mt-2">Featured tools with stronger research signals</h2>
            </div>
            <Link href="/tools" className="text-sm text-[var(--accent)] font-semibold hover:underline">
              Browse all tools →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {featured.map((tool) => {
              const evidence = getEvidenceScore(tool);
              const sources = getSourceCount(tool);

              return (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="block rounded-2xl p-5 sm:p-6 transition-all hover:scale-[1.02]"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-3xl shrink-0">{tool.logo}</span>
                      <div className="min-w-0">
                        <h3 className="text-[var(--text)] text-[17px] font-bold truncate" style={{ fontFamily: 'var(--font-mono)' }}>
                          {tool.name}
                        </h3>
                        <span className="text-xs text-[var(--text-muted)]">{tool.company}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: tool.trend.startsWith('+') ? 'rgba(0,229,160,0.1)' : 'rgba(239,68,68,0.1)',
                          color: tool.trend.startsWith('+') ? 'var(--accent)' : 'var(--red)',
                        }}
                      >
                        {tool.trend}
                      </span>
                      {tool.source === 'discovered' ? (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--purple)' }}
                        >
                          DISCOVERED
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-[var(--text-muted)] text-[13px] leading-[1.6] mb-4 line-clamp-2">{tool.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
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

                  <div className="grid grid-cols-2 gap-3 text-[11px] mb-4">
                    <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                      <div className="text-[var(--text-dim)]">Evidence</div>
                      <div className="text-[var(--text)] font-semibold">{evidence || '—'}/100</div>
                    </div>
                    <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                      <div className="text-[var(--text-dim)]">Sources</div>
                      <div className="text-[var(--text)] font-semibold">{sources || '—'}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <Stars rating={tool.rating} />
                    <span className="text-[13px] text-[var(--accent)] font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
                      {tool.pricing}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {newVerified.length > 0 ? (
          <section className="mt-16 sm:mt-20">
            <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
              <div>
                <span
                  className="text-[11px] tracking-[3px] text-[var(--purple)] font-bold uppercase block"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Fresh additions
                </span>
                <h2 className="text-[var(--text)] text-2xl sm:text-3xl font-extrabold mt-2">Recently discovered tools worth checking</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newVerified.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="rounded-2xl p-5 transition-all hover:scale-[1.01]"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-3xl shrink-0">{tool.logo}</span>
                      <div className="min-w-0">
                        <h3 className="text-[var(--text)] font-bold text-lg truncate">{tool.name}</h3>
                        <p className="text-[var(--text-dim)] text-xs">{tool.company}</p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] px-2 py-1 rounded-full font-bold"
                      style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--purple)' }}
                    >
                      NEW
                    </span>
                  </div>
                  <p className="text-[var(--text-muted)] text-sm leading-6 mt-3 line-clamp-2">{tool.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-16 sm:mt-20">
          <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
            <div>
              <span
                className="text-[11px] tracking-[3px] text-[var(--accent)] font-bold uppercase block"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Head-to-head
              </span>
              <h2 className="text-[var(--text)] text-2xl sm:text-3xl font-extrabold mt-2">Commercial-intent comparisons</h2>
            </div>
            <Link href="/compare" className="text-sm text-[var(--accent)] font-semibold hover:underline">
              Explore compare hub →
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
            {featuredComparisons.map(({ a, b }) => (
              <Link
                key={`${a.slug}-${b.slug}`}
                href={`/compare/${buildCompareSlug(a.slug, b.slug)}`}
                className="px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-[13px] font-semibold transition-all hover:scale-105"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                {a.logo} {a.name} vs {b.name} {b.logo}
              </Link>
            ))}
          </div>
        </section>

        {pricingReady.length > 0 ? (
          <section className="mt-16 sm:mt-20">
            <div className="text-center mb-8">
              <span
                className="text-[11px] tracking-[3px] text-[var(--purple)] font-bold uppercase block"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Commercial-ready
              </span>
              <h2 className="text-[var(--text)] text-2xl sm:text-3xl font-extrabold mt-2">Tools with clearer pricing signals</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pricingReady.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="rounded-2xl p-5 transition-all hover:scale-[1.02]"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-3xl">{tool.logo}</span>
                      <div className="min-w-0">
                        <h3 className="text-[var(--text)] font-bold truncate">{tool.name}</h3>
                        <p className="text-[var(--text-dim)] text-xs">{tool.categoryLabel}</p>
                      </div>
                    </div>
                    <span className="text-[var(--accent)] text-xs font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
                      {tool.pricing}
                    </span>
                  </div>
                  <p className="text-[var(--text-muted)] text-sm leading-6 line-clamp-2">{tool.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-16 sm:mt-20">
          <div className="text-center mb-8">
            <span
              className="text-[11px] tracking-[3px] text-[var(--purple)] font-bold uppercase block"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Clusters
            </span>
            <h2 className="text-[var(--text)] text-2xl sm:text-3xl font-extrabold mt-2">Browse by job-to-be-done</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((cat) => {
              const representative = tools.find((tool) => tool.category === cat.category);
              return (
                <Link
                  key={cat.category}
                  href={`/category/${cat.category}`}
                  className="rounded-xl p-4 sm:p-5 text-center transition-all hover:scale-[1.02]"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <span className="text-2xl sm:text-3xl block mb-2">{representative?.logo ?? '🧠'}</span>
                  <h3 className="text-[var(--text)] font-bold text-xs sm:text-sm">{cat.categoryLabel}</h3>
                  <span className="text-[var(--text-dim)] text-[11px]">
                    {cat.count} {cat.count === 1 ? 'tool' : 'tools'}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
