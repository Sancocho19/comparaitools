export const dynamic = 'force-dynamic';
export const revalidate = 0;

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import { getManifest } from '@/lib/kv-storage';
import { buildToolMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import type { ManifestEntry } from '@/lib/types';
import { getTool, getAllTools, bootstrapStaticTools } from '@/lib/tools-storage';
import { buildCompareSlug } from '@/lib/utils';

type ToolItem = Awaited<ReturnType<typeof getAllTools>>[number];
type ResearchSource = {
  title?: string;
  url?: string;
  domain?: string;
  snippet?: string;
  publishedAt?: string;
  score?: number;
  kind?: 'official' | 'pricing' | 'docs' | 'reviews' | 'news' | 'other' | string;
};

type ToolWithResearch = ToolItem & {
  evidenceScore?: number;
  sourceCount?: number;
  research?: {
    evidenceScore?: number;
    sourceCount?: number;
    officialSourceCount?: number;
    provider?: string;
    queries?: string[];
    sources?: ResearchSource[];
  };
};

function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<cite[^>]*>.*?<\/cite>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getEvidenceScore(tool: ToolItem | ToolWithResearch): number {
  const typed = tool as ToolWithResearch;
  return Number(typed.evidenceScore ?? typed.research?.evidenceScore ?? 0);
}

function getSourceCount(tool: ToolItem | ToolWithResearch): number {
  const typed = tool as ToolWithResearch;
  return Number(typed.sourceCount ?? typed.research?.sourceCount ?? 0);
}

function uniqueEntries(entries: ManifestEntry[]): ManifestEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.slug)) return false;
    seen.add(entry.slug);
    return true;
  });
}

function articleLabel(type: ManifestEntry['type']): string {
  switch (type) {
    case 'review':
      return 'Full review';
    case 'pricing':
      return 'Pricing guide';
    case 'alternatives':
      return 'Alternatives';
    case 'comparison':
      return 'Comparison';
    case 'roundup':
      return 'Best-of';
    default:
      return 'Guide';
  }
}

function researchStatusText(evidenceScore: number, sourceCount: number): string {
  if (evidenceScore > 0 || sourceCount > 0) {
    return `Source-backed profile${sourceCount > 0 ? ` · ${sourceCount} sources` : ''}${evidenceScore > 0 ? ` · ${evidenceScore}/100` : ''}`;
  }
  return 'Profile based on tool data; live-source coverage appears here as pages refresh.';
}

function compactPriceText(value: string): string {
  const text = String(value || '').trim();
  if (!text) return 'Pricing not listed';
  return text;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await bootstrapStaticTools();
  const rawTool = await getTool(slug);
  if (!rawTool) return { title: 'Tool Not Found' };
  return buildToolMetadata(rawTool as ToolWithResearch);
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  await bootstrapStaticTools();
  const [rawTool, allTools, manifest] = await Promise.all([getTool(slug), getAllTools(), getManifest()]);
  if (!rawTool || !rawTool.verified) notFound();
  const tool = rawTool as ToolWithResearch;

  const alternatives = allTools
    .filter((t) => t.category === tool.category && t.slug !== tool.slug && t.verified)
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
  const researchSources = Array.isArray(tool.research?.sources) ? tool.research!.sources : [];

  const companionPosts = uniqueEntries([
    ...manifest.filter((entry) => entry.slug === `${tool.slug}-review-2026`),
    ...manifest.filter((entry) => entry.slug === `${tool.slug}-pricing-2026`),
    ...manifest.filter((entry) => entry.slug === `${tool.slug}-alternatives-2026`),
    ...manifest.filter((entry) => entry.toolSlugs.includes(tool.slug) && entry.type === 'comparison').slice(0, 2),
  ]);

  const faqs = [
    {
      q: `Is ${tool.name} worth it in 2026?`,
      a: `${tool.name} is best for ${bestFor || 'general AI work'} and currently shows pricing at ${compactPriceText(tool.pricing)}. Whether it is worth it depends on how much you value ${features.slice(0, 2).join(' and ') || tool.categoryLabel.toLowerCase()}.`,
    },
    {
      q: `How much does ${tool.name} cost?`,
      a: `${tool.name} pricing is ${compactPriceText(tool.pricing)}.${tool.pricingValue === 0 ? ' A free tier may be available.' : ` Plans start around $${tool.pricingValue}/month.`}`,
    },
    {
      q: `What are the best ${tool.name} alternatives?`,
      a:
        alternatives.length > 0
          ? `Popular alternatives to ${tool.name} include ${alternatives.slice(0, 3).map((a) => a.name).join(', ')}.`
          : `${tool.name} is one of the better-known options in the ${tool.categoryLabel} category.`,
    },
  ];

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    applicationCategory: 'AI Tool',
    operatingSystem: 'Web',
    url: `${SITE_URL}/tools/${tool.slug}`,
    offers: { '@type': 'Offer', price: tool.pricingValue, priceCurrency: 'USD' },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: tool.rating,
      bestRating: '5',
      worstRating: '1',
      ratingCount: '1000',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: `${SITE_URL}/tools` },
      { '@type': 'ListItem', position: 3, name: tool.categoryLabel, item: `${SITE_URL}/category/${tool.category}` },
      { '@type': 'ListItem', position: 4, name: tool.name, item: `${SITE_URL}/tools/${tool.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="grain-overlay" />

      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(10,10,15,0.9)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black" style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))', color: 'var(--bg)' }}>C</div>
            <span className="font-extrabold text-lg hidden sm:block" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>
              <span className="text-[var(--accent)]">Compar</span><span className="text-[var(--text)]">AITools</span>
            </span>
          </Link>
          <div className="flex-1 hidden md:block"><SearchBar /></div>
          <div className="hidden md:flex gap-6 items-center shrink-0">
            <Link href="/tools" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Tools</Link>
            <Link href="/compare" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Compare</Link>
            <Link href="/blog" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Blog</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[860px] mx-auto px-6 md:px-8 py-12 relative z-10">
        <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-8 flex-wrap">
          <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
          <span>/</span>
          <Link href="/tools" className="hover:text-[var(--accent)]">Tools</Link>
          <span>/</span>
          <Link href={`/category/${tool.category}`} className="hover:text-[var(--accent)]">{tool.categoryLabel}</Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">{tool.name}</span>
          {tool.source === 'discovered' ? (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--purple)' }}>NEW</span>
          ) : null}
        </div>

        <div className="text-center mb-10">
          <span className="text-6xl block mb-4">{tool.logo}</span>
          <div className="flex items-center justify-center gap-3 flex-wrap mb-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-mono)' }}>
              {tool.name} review (2026)
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: tool.trend.startsWith('+') ? 'rgba(0,229,160,0.1)' : 'rgba(239,68,68,0.1)', color: tool.trend.startsWith('+') ? 'var(--accent)' : 'var(--red)' }}>
              {tool.trend}
            </span>
          </div>
          <p className="text-[var(--text-muted)] text-sm max-w-[760px] mx-auto">Pricing, pros, cons, alternatives, and best fit before you decide whether {tool.name} belongs in your workflow.</p>
          <p className="text-[var(--text-muted)] text-sm mt-3">by {tool.company} · {tool.users} · Updated {tool.lastUpdated}</p>
          <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
            <span className="text-[var(--orange)] text-lg tracking-wider">
              {'★'.repeat(Math.floor(tool.rating))}
              <span className="text-[var(--text-muted)] ml-1 text-sm">{tool.rating}/5</span>
            </span>
            <span className="text-[var(--accent)] font-semibold text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{tool.pricing}</span>
          </div>
        </div>

        <section className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[var(--text-muted)] leading-relaxed text-[15px]">{longDesc}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
            <div>
              <div className="text-xs text-[var(--text-dim)] font-bold uppercase tracking-wider">Best for</div>
              <p className="text-[var(--text)] text-sm mt-1.5">{bestFor || 'General AI workflow use'}</p>
            </div>
            <div>
              <div className="text-xs text-[var(--text-dim)] font-bold uppercase tracking-wider">Pricing snapshot</div>
              <p className="text-[var(--text)] text-sm mt-1.5">{compactPriceText(tool.pricing)}</p>
            </div>
            <div>
              <div className="text-xs text-[var(--text-dim)] font-bold uppercase tracking-wider">Research status</div>
              <p className="text-[var(--text)] text-sm mt-1.5">{researchStatusText(evidenceScore, sourceCount)}</p>
            </div>
          </div>
        </section>

        {companionPosts.length > 0 ? (
          <section className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold text-[var(--text)] mb-4">Read before you buy</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {companionPosts.map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/blog/${entry.slug}`}
                  className="rounded-xl p-4 block"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', textDecoration: 'none' }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] mb-2">{articleLabel(entry.type)}</div>
                  <div className="text-[var(--text)] font-semibold text-sm leading-6">{entry.title}</div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {features.length > 0 ? (
          <section className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold text-[var(--text)] mb-4">Key features</h2>
            <div className="flex flex-wrap gap-2">
              {features.map((f, i) => (
                <span key={`${f}-${i}`} className="text-sm px-4 py-2 rounded-lg" style={{ background: `${tool.color}15`, color: `${tool.color}cc`, border: `1px solid ${tool.color}22` }}>
                  {f}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <section className="rounded-2xl p-6 md:p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold text-[var(--accent)] mb-4">✓ Pros</h2>
            {pros.map((p, i) => (
              <p key={`${p}-${i}`} className="text-[var(--text-muted)] text-sm mb-3 pl-4" style={{ borderLeft: '2px solid var(--accent)' }}>{p}</p>
            ))}
          </section>
          <section className="rounded-2xl p-6 md:p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold text-[var(--red)] mb-4">✗ Cons</h2>
            {cons.map((c, i) => (
              <p key={`${c}-${i}`} className="text-[var(--text-muted)] text-sm mb-3 pl-4" style={{ borderLeft: '2px solid var(--red)' }}>{c}</p>
            ))}
          </section>
        </div>

        {researchSources.length ? (
          <section className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <h2 className="text-lg font-bold text-[var(--text)]">Research basis</h2>
              <span className="text-xs text-[var(--text-dim)]">
                Provider: {tool.research?.provider || 'unknown'} · Sources: {researchSources.length}
              </span>
            </div>
            <div className="space-y-3">
              {researchSources.slice(0, 6).map((source, i) => (
                <a
                  key={`${source.url || source.title || i}-${i}`}
                  href={source.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="block rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', textDecoration: 'none' }}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-[var(--text)] text-sm font-semibold">{source.title || source.url}</div>
                    <div className="text-[11px] text-[var(--text-dim)]">{source.kind || 'source'}{source.score ? ` · ${source.score}` : ''}</div>
                  </div>
                  {source.domain ? <div className="text-[11px] text-[var(--accent)] mt-1">{source.domain}</div> : null}
                  {source.snippet ? <p className="text-[var(--text-muted)] text-xs leading-6 mt-2">{source.snippet}</p> : null}
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {comparisons.length > 0 ? (
          <section className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold text-[var(--text)] mb-4">Compare {tool.name} with alternatives</h2>
            <div className="flex flex-wrap gap-2">
              {comparisons.map((c) => (
                <Link key={c.tool.slug} href={c.url} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  {tool.logo} {tool.name} vs {c.tool.name} {c.tool.logo}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl p-6 md:p-8 mb-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-bold text-[var(--text)] mb-5">Frequently asked questions</h2>
          {faqs.map((faq, i) => (
            <div key={`${faq.q}-${i}`} className="mb-5 last:mb-0">
              <h3 className="text-[var(--text)] text-[15px] font-bold mb-1.5">{faq.q}</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </section>

        <div className="text-center mt-10">
          <a href={tool.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all hover:scale-105" style={{ background: `linear-gradient(135deg, ${tool.color}, ${tool.color}cc)`, color: '#fff' }}>
            Visit {tool.name} →
          </a>
        </div>
      </main>
    </>
  );
}
