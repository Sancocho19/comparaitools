import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SearchBar from '@/components/SearchBar';
import { getTool, getAllTools, bootstrapStaticTools } from '@/lib/tools-storage';
import { buildCompareSlug } from '@/lib/utils';

export const revalidate = 3600;

function cleanText(text: string): string {
  if (!text) return '';
  return text.replace(/<cite[^>]*>.*?<\/cite>/gi, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function getEvidenceScore(tool: any): number {
  return Number(tool?.evidenceScore ?? tool?.research?.evidenceScore ?? 0);
}

function getSourceCount(tool: any): number {
  return Number(tool?.sourceCount ?? tool?.research?.sourceCount ?? 0);
}

function getOfficialSourceCount(tool: any): number {
  return Number(tool?.research?.officialSourceCount ?? 0);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await bootstrapStaticTools();
  const tool = await getTool(slug);
  if (!tool) return { title: 'Tool Not Found' };

  return {
    title: `${tool.name} Review 2026 - Pricing, Features & Rating | ComparAITools`,
    description: `Research-backed ${tool.name} profile with pricing, strengths, tradeoffs, and alternatives. Rating ${tool.rating}/5. Updated ${tool.lastUpdated}.`,
    openGraph: {
      title: `${tool.name} Review 2026 | ComparAITools`,
      description: `Research-backed ${tool.name} profile with pricing, features, and alternative paths before you decide.`,
      type: 'article',
    },
    alternates: { canonical: `https://comparaitools.com/tools/${tool.slug}` },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  await bootstrapStaticTools();
  const tool = await getTool(slug);
  if (!tool || !tool.verified) notFound();

  const allTools = await getAllTools();
  const alternatives = allTools
    .filter((item) => item.category === tool.category && item.slug !== tool.slug && item.verified !== false)
    .sort((a, b) => getEvidenceScore(b) - getEvidenceScore(a) || b.rating - a.rating)
    .slice(0, 6);

  const comparisons = alternatives.map((alt) => ({
    tool: alt,
    url: `/compare/${buildCompareSlug(tool.slug, alt.slug)}`,
  }));

  const longDesc = cleanText(tool.longDescription || tool.description);
  const bestFor = cleanText(tool.bestFor);
  const features = tool.features.map(cleanText).filter(Boolean);
  const pros = tool.pros.map(cleanText).filter(Boolean);
  const cons = tool.cons.map(cleanText).filter(Boolean);
  const evidenceScore = getEvidenceScore(tool);
  const sourceCount = getSourceCount(tool);
  const officialSourceCount = getOfficialSourceCount(tool);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    applicationCategory: 'AI Tool',
    operatingSystem: 'Web',
    url: tool.url,
    offers: {
      '@type': 'Offer',
      price: tool.pricingValue ?? 0,
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: tool.rating,
      bestRating: '5',
      worstRating: '1',
      ratingCount: Math.max(1, sourceCount || 1),
    },
  };

  const faqItems = [
    {
      q: `Is ${tool.name} worth it in 2026?`,
      a: `${tool.name} currently holds a ${tool.rating}/5 rating. The better question is whether its workflow fits your job and budget, not whether it wins a generic popularity contest.`,
    },
    {
      q: `How much does ${tool.name} cost?`,
      a: `${tool.name} is listed at ${tool.pricing}. ${Number(tool.pricingValue ?? 0) > 0 ? `Entry pricing is around $${tool.pricingValue}/month.` : 'Check the official site for the most current plan details.'}`,
    },
    {
      q: `What are the best ${tool.name} alternatives?`,
      a: alternatives.length
        ? `The strongest alternatives in this category include ${alternatives.slice(0, 3).map((item) => item.name).join(', ')}. Which one fits better depends on workflow, pricing, and switching costs.`
        : `${tool.name} is one of the more visible tools in the ${tool.categoryLabel} category.`,
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
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
        <div className="md:hidden px-4 pb-3">
          <SearchBar />
        </div>
      </nav>

      <main className="max-w-[980px] mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-8 flex-wrap">
          <Link href="/" className="hover:text-[var(--accent)]">
            Home
          </Link>
          <span>/</span>
          <Link href="/tools" className="hover:text-[var(--accent)]">
            Tools
          </Link>
          <span>/</span>
          <Link href={`/category/${tool.category}`} className="hover:text-[var(--accent)]">
            {tool.categoryLabel}
          </Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">{tool.name}</span>
          {tool.source === 'discovered' ? (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--purple)' }}>
              DISCOVERED
            </span>
          ) : null}
        </div>

        <section className="text-center mb-10">
          <span className="text-6xl block mb-4">{tool.logo}</span>

          <div className="flex items-center justify-center gap-3 flex-wrap mb-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-mono)' }}>
              {tool.name}
            </h1>
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{
                background: tool.trend.startsWith('+') ? 'rgba(0,229,160,0.1)' : 'rgba(239,68,68,0.1)',
                color: tool.trend.startsWith('+') ? 'var(--accent)' : 'var(--red)',
              }}
            >
              {tool.trend}
            </span>
          </div>

          <p className="text-[var(--text-muted)] text-sm">
            by {tool.company} · {tool.users} · Updated {tool.lastUpdated}
          </p>

          <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
            <span className="text-[var(--orange)] text-lg tracking-wider">
              {'★'.repeat(Math.max(1, Math.floor(tool.rating)))}
              <span className="text-[var(--text-muted)] ml-1 text-sm">{tool.rating.toFixed(1)}/5</span>
            </span>
            <span className="text-[var(--accent)] font-semibold text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
              {tool.pricing}
            </span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4 mb-8">
          {[
            { label: 'Evidence score', value: evidenceScore ? `${evidenceScore}/100` : 'Pending' },
            { label: 'Source count', value: sourceCount || '—' },
            { label: 'Official sources', value: officialSourceCount || '—' },
            { label: 'Category', value: tool.categoryLabel },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-[11px] text-[var(--text-dim)] uppercase tracking-wider mb-1">{item.label}</div>
              <div className="text-[var(--text)] font-bold">{item.value}</div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[var(--text-muted)] leading-relaxed text-[15px]">{longDesc}</p>
          {bestFor ? (
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-xs text-[var(--text-dim)] font-bold uppercase tracking-wider">Best fit</span>
              <p className="text-[var(--text)] text-sm mt-1.5">{bestFor}</p>
            </div>
          ) : null}
        </section>

        {tool.research?.sources?.length ? (
          <section className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <h2 className="text-lg font-bold text-[var(--text)]">Research basis</h2>
              <span className="text-[11px] px-3 py-1 rounded-full" style={{ background: 'rgba(0,229,160,0.1)', color: 'var(--accent)' }}>
                {sourceCount} sources reviewed
              </span>
            </div>
            <p className="text-[var(--text-muted)] text-sm leading-6 mb-4">
              This profile is backed by live research signals rather than static copy alone. Priority goes to official pages, pricing pages, docs, and recent product updates.
            </p>
            <div className="grid gap-3">
              {tool.research.sources.slice(0, 6).map((source: any) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="rounded-xl p-4 transition-all hover:scale-[1.01]"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', textDecoration: 'none' }}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                    <span className="text-[var(--text)] font-semibold text-sm">{source.title}</span>
                    <span className="text-[11px] text-[var(--text-dim)] uppercase">{source.kind}</span>
                  </div>
                  <div className="text-[var(--text-dim)] text-xs mb-2">{source.domain}</div>
                  <p className="text-[var(--text-muted)] text-sm leading-6">{source.snippet}</p>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {features.length > 0 ? (
          <section className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold text-[var(--text)] mb-4">Key features</h2>
            <div className="flex flex-wrap gap-2">
              {features.map((feature, index) => (
                <span
                  key={`${feature}-${index}`}
                  className="text-sm px-4 py-2 rounded-lg"
                  style={{ background: `${tool.color}15`, color: `${tool.color}cc`, border: `1px solid ${tool.color}22` }}
                >
                  {feature}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl p-6 md:p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold text-[var(--accent)] mb-4">Why pick {tool.name}</h2>
            {pros.length > 0 ? (
              pros.map((item, index) => (
                <p key={`${item}-${index}`} className="text-[var(--text-muted)] text-sm mb-3 pl-4" style={{ borderLeft: '2px solid var(--accent)' }}>
                  {item}
                </p>
              ))
            ) : (
              <p className="text-[var(--text-muted)] text-sm">The strongest case for {tool.name} is its fit for {bestFor || 'its intended workflow'}.</p>
            )}
          </div>

          <div className="rounded-2xl p-6 md:p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold text-[var(--red)] mb-4">When to skip it</h2>
            {cons.length > 0 ? (
              cons.map((item, index) => (
                <p key={`${item}-${index}`} className="text-[var(--text-muted)] text-sm mb-3 pl-4" style={{ borderLeft: '2px solid var(--red)' }}>
                  {item}
                </p>
              ))
            ) : (
              <p className="text-[var(--text-muted)] text-sm">If budget sensitivity or a very specific workflow matters more, compare alternatives before choosing.</p>
            )}
          </div>
        </section>

        {comparisons.length > 0 ? (
          <section className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <h2 className="text-lg font-bold text-[var(--text)]">Compare {tool.name} with alternatives</h2>
              <Link href="/compare" className="text-sm text-[var(--accent)] font-semibold hover:underline">
                Open compare hub →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {comparisons.map((item) => (
                <Link
                  key={item.tool.slug}
                  href={item.url}
                  className="rounded-xl p-4 transition-all hover:scale-[1.01]"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[var(--text)]">
                      {tool.name} vs {item.tool.name}
                    </div>
                    <span className="text-[var(--accent)]">→</span>
                  </div>
                  <div className="text-[12px] text-[var(--text-dim)] mt-1">{item.tool.categoryLabel}</div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl p-6 md:p-8 mb-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-bold text-[var(--text)] mb-5">Frequently asked questions</h2>
          {faqItems.map((faq, index) => (
            <div key={faq.q} className={index === faqItems.length - 1 ? '' : 'mb-5'}>
              <h3 className="text-[var(--text)] text-[15px] font-bold mb-1.5">{faq.q}</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </section>

        <div className="rounded-2xl p-5 mb-6 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[var(--text-muted)] text-sm mb-3">Need the official site before deciding?</p>
          <a href={tool.url} target="_blank" rel="noopener noreferrer nofollow" className="text-[var(--accent)] font-semibold text-sm hover:underline">
            Visit {tool.name} →
          </a>
        </div>
      </main>
    </>
  );
}
