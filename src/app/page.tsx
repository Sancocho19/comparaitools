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

function compactPricing(value: string): string {
  const text = String(value || '').trim();
  if (!text) return 'Pricing not listed';
  if (text.length <= 34) return text;

  const shortened = text
    .replace(/^free tier\s*\+\s*/i, 'Free + ')
    .replace(/^plans start at\s*/i, 'From ')
    .replace(/^starting from\s*/i, 'From ')
    .replace(/^free self-hosted version available\.\s*/i, '')
    .replace(/^cloud plans start at\s*/i, 'Cloud from ');

  return shortened.length <= 34 ? shortened : `${shortened.slice(0, 31).trim()}…`;
}

function shortFeature(feature: string): string {
  const text = String(feature || '').trim();
  if (!text) return '';
  return text.length <= 26 ? text : `${text.slice(0, 23).trim()}…`;
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  linkHref,
  linkLabel,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 md:mb-10 flex items-end justify-between gap-4 flex-wrap">
      <div className="max-w-[760px]">
        {eyebrow ? (
          <span
            className="text-[11px] tracking-[3px] text-[var(--accent)] font-bold uppercase block"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {eyebrow}
          </span>
        ) : null}
        <h2 className="text-[var(--text)] text-2xl md:text-3xl font-extrabold mt-2">{title}</h2>
        {subtitle ? (
          <p className="text-[13px] md:text-sm text-[var(--text-muted)] leading-7 mt-3">{subtitle}</p>
        ) : null}
      </div>

      {linkHref && linkLabel ? (
        <Link href={linkHref} className="text-sm text-[var(--accent)] font-semibold hover:underline shrink-0">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolItem }) {
  const evidence = getEvidenceScore(tool);
  const sources = getSourceCount(tool);

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="block rounded-[26px] px-5 py-5 md:px-6 md:py-6 transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex justify-between items-start gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl shrink-0">{tool.logo}</span>
          <div className="min-w-0">
            <h3 className="text-[var(--text)] text-[18px] font-bold truncate" style={{ fontFamily: 'var(--font-mono)' }}>
              {tool.name}
            </h3>
            <span className="text-xs text-[var(--text-muted)] block mt-1">{tool.company}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full"
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

      <p className="text-[var(--text-muted)] text-[13px] md:text-sm leading-7 mb-5 line-clamp-2">{tool.description}</p>

      <div className="flex flex-wrap gap-2 mb-5">
        {tool.features.slice(0, 3).map((feature) => (
          <span
            key={feature}
            className="text-[11px] px-2.5 py-1 rounded-full"
            style={{ background: `${tool.color}15`, color: `${tool.color}cc`, border: `1px solid ${tool.color}22` }}
            title={feature}
          >
            {shortFeature(feature)}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
          <div className="text-[11px] text-[var(--text-dim)] mb-1">Evidence</div>
          <div className="text-[var(--text)] font-semibold text-sm">{evidence || '—'}/100</div>
        </div>
        <div className="rounded-xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
          <div className="text-[11px] text-[var(--text-dim)] mb-1">Sources</div>
          <div className="text-[var(--text)] font-semibold text-sm">{sources || '—'}</div>
        </div>
      </div>

      <div className="flex justify-between items-center gap-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <Stars rating={tool.rating} />
        <span className="text-[13px] text-[var(--accent)] font-semibold text-right" style={{ fontFamily: 'var(--font-mono)' }} title={tool.pricing}>
          {compactPricing(tool.pricing)}
        </span>
      </div>
    </Link>
  );
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
    .slice(0, 6);

  const newVerified = [...tools]
    .filter((tool) => tool.source === 'discovered' && getEvidenceScore(tool) >= 70)
    .sort((a, b) => getEvidenceScore(b) - getEvidenceScore(a) || b.rating - a.rating)
    .slice(0, 4);

  const pricingReady = [...tools]
    .filter((tool) => Number(tool.pricingValue ?? 0) > 0 || !/check official/i.test(String(tool.pricing ?? '')))
    .sort((a, b) => getEvidenceScore(b) - getEvidenceScore(a) || b.rating - a.rating)
    .slice(0, 4);

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

  const featuredComparisons = comparisons.sort((a, b) => b.score - a.score).slice(0, 6);

  const highConfidenceCount = tools.filter((tool) => getEvidenceScore(tool) >= 75).length;
  const discoveredCount = tools.filter((tool) => tool.source === 'discovered').length;

  const blogHighlights = [
    {
      title: 'Pricing deep dives',
      description: 'Commercial pages built for users comparing plan costs, upgrade thresholds, and value for money.',
      href: '/blog',
    },
    {
      title: 'Alternatives that matter',
      description: 'Sharper side-by-side alternatives and substitute pages aimed at real switching intent, not fluffy lists.',
      href: '/blog',
    },
    {
      title: 'Reviews and buying guides',
      description: 'Cleaner review-style pages that explain fit, tradeoffs, and who should actually choose each tool.',
      href: '/blog',
    },
  ];

  return (
    <>
      <div className="grain-overlay" />

      <nav
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'rgba(10,10,15,0.9)', borderBottom: '1px solid var(--border)' }}
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
        <div className="sm:hidden px-5 pb-3">
          <SearchBar />
        </div>
      </nav>

      <main className="max-w-[1280px] mx-auto px-5 sm:px-7 py-14 md:py-16 relative z-10">
        <header className="text-center py-6 md:py-8 relative mb-16 md:mb-20">
          <div className="hero-glow" />
          <div className="relative max-w-[860px] mx-auto">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7"
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

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.08] mb-6 gradient-text">
              Find the AI tool that fits the job — not just the hype.
            </h1>

            <p className="text-[var(--text-muted)] text-sm sm:text-base leading-8 max-w-[760px] mx-auto mb-8">
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

        <section className="mb-16 md:mb-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {[
              { label: 'Tracked tools', value: tools.length },
              { label: 'High-confidence profiles', value: highConfidenceCount },
              { label: 'Live categories', value: categories.length },
              { label: 'Head-to-head pairs', value: featuredComparisons.length },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] p-5 md:p-6 text-center"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div
                  className="text-2xl md:text-3xl font-black text-[var(--accent)] mb-2"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {item.value}
                </div>
                <div className="text-[12px] text-[var(--text-dim)]">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20 md:mb-24">
          <SectionHeader
            eyebrow="Best starting points"
            title="Featured tools with stronger research signals"
            subtitle="A cleaner first pass through the tools that already have better evidence and clearer commercial context."
            linkHref="/tools"
            linkLabel="Browse all tools →"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
            {featured.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>

        {newVerified.length > 0 ? (
          <section className="mb-20 md:mb-24">
            <SectionHeader
              eyebrow="Fresh additions"
              title="Recently discovered tools worth checking"
              subtitle="Newer entries that already show enough promise to deserve visibility, without overloading the page."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {newVerified.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="rounded-[24px] p-5 md:p-6 transition-all hover:-translate-y-0.5"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-3xl shrink-0">{tool.logo}</span>
                      <div className="min-w-0">
                        <h3 className="text-[var(--text)] font-bold text-lg truncate">{tool.name}</h3>
                        <p className="text-[var(--text-dim)] text-xs mt-1">{tool.company}</p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] px-2 py-1 rounded-full font-bold shrink-0"
                      style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--purple)' }}
                    >
                      NEW
                    </span>
                  </div>
                  <p className="text-[var(--text-muted)] text-sm leading-7 mt-4 line-clamp-2">{tool.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mb-20 md:mb-24">
          <SectionHeader
            eyebrow="Head-to-head"
            title="Commercial-intent comparisons"
            subtitle="Shortcuts into the comparisons that are most likely to matter before someone switches or buys."
            linkHref="/compare"
            linkLabel="Explore compare hub →"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            {featuredComparisons.map(({ a, b }) => (
              <Link
                key={`${a.slug}-${b.slug}`}
                href={`/compare/${buildCompareSlug(a.slug, b.slug)}`}
                className="rounded-[22px] px-4 py-4 transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'inherit', textDecoration: 'none' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{a.logo}</span>
                      <span className="text-[14px] font-bold text-[var(--text)] truncate">{a.name}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-dim)] mt-2">Evidence {getEvidenceScore(a)}</p>
                  </div>

                  <div className="shrink-0 text-[11px] font-bold text-[var(--text-dim)] px-2">VS</div>

                  <div className="min-w-0 text-right">
                    <div className="flex items-center justify-end gap-2 min-w-0">
                      <span className="text-[14px] font-bold text-[var(--text)] truncate">{b.name}</span>
                      <span className="text-xl shrink-0">{b.logo}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-dim)] mt-2">Evidence {getEvidenceScore(b)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {pricingReady.length > 0 ? (
          <section className="mb-20 md:mb-24">
            <SectionHeader
              eyebrow="Commercial-ready"
              title="Tools with clearer pricing signals"
              subtitle="Profiles where pricing is already more understandable, so the buying decision is easier to compare."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
              {pricingReady.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="rounded-[24px] p-5 md:p-6 transition-all hover:-translate-y-0.5"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-3xl">{tool.logo}</span>
                      <div className="min-w-0">
                        <h3 className="text-[var(--text)] font-bold text-lg truncate">{tool.name}</h3>
                        <p className="text-[var(--text-dim)] text-xs mt-1">{tool.categoryLabel}</p>
                      </div>
                    </div>

                    <span
                      className="text-[12px] text-[var(--accent)] font-semibold shrink-0"
                      style={{ fontFamily: 'var(--font-mono)' }}
                      title={tool.pricing}
                    >
                      {compactPricing(tool.pricing)}
                    </span>
                  </div>

                  <p className="text-[var(--text-muted)] text-sm leading-7 line-clamp-2">{tool.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mb-20 md:mb-24">
          <SectionHeader
            eyebrow="From the blog"
            title="Entry points into the content side of the site"
            subtitle="Use the blog as the softer layer of the funnel: pricing pages, alternatives, reviews, and buying guides."
            linkHref="/blog"
            linkLabel="Open the blog →"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {blogHighlights.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-[24px] p-5 md:p-6 transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'none' }}
              >
                <div
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold mb-4"
                  style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--purple)' }}
                >
                  BLOG
                </div>
                <h3 className="text-[var(--text)] text-lg font-bold mb-3">{item.title}</h3>
                <p className="text-[var(--text-muted)] text-sm leading-7">{item.description}</p>
                <div className="mt-5 text-[var(--accent)] text-sm font-semibold">Read more →</div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Clusters"
            title="Browse by job-to-be-done"
            subtitle="Use the categories as cleaner entry points instead of trying to scan every tool on the homepage."
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {categories.map((cat) => {
              const representative = tools.find((tool) => tool.category === cat.category);
              return (
                <Link
                  key={cat.category}
                  href={`/category/${cat.category}`}
                  className="rounded-[22px] p-5 md:p-6 text-center transition-all hover:-translate-y-0.5"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <span className="text-2xl sm:text-3xl block mb-3">{representative?.logo ?? '🧠'}</span>
                  <h3 className="text-[var(--text)] font-bold text-sm md:text-base">{cat.categoryLabel}</h3>
                  <span className="text-[var(--text-dim)] text-[11px] block mt-2">
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
