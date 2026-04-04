import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import { getManifest } from '@/lib/kv-storage';
import { buildCompareMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import { getAllTools, getTool } from '@/lib/tools-storage';
import { buildCompareSlug, parseCompareSlug, stripHtml } from '@/lib/utils';

export const revalidate = 3600;

type CompareTool = Awaited<ReturnType<typeof getAllTools>>[number] & {
  evidenceScore?: number;
  sourceCount?: number;
  research?: {
    evidenceScore?: number;
    sourceCount?: number;
  };
};

function getEvidenceScore(tool: CompareTool): number {
  return Number(tool?.evidenceScore ?? tool?.research?.evidenceScore ?? 0);
}

function getSourceCount(tool: CompareTool): number {
  return Number(tool?.sourceCount ?? tool?.research?.sourceCount ?? 0);
}

function researchCell(tool: CompareTool): string {
  const evidence = getEvidenceScore(tool);
  if (evidence > 0) return `${evidence}/100`;
  return 'Tool profile';
}

function sourcesCell(tool: CompareTool): string {
  const sources = getSourceCount(tool);
  return sources > 0 ? `${sources}` : 'Updating';
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const { slugA, slugB } = parseCompareSlug(pair);
  const [toolA, toolB] = await Promise.all([getTool(slugA), getTool(slugB)]);

  if (!toolA || !toolB) return { title: 'Comparison not found' };
  return buildCompareMetadata(toolA, toolB);
}

function compareScore(a: number, b: number): 'a' | 'b' | null {
  return a > b ? 'a' : b > a ? 'b' : null;
}

function Row({
  label,
  a,
  b,
  winner,
}: {
  label: string;
  a: React.ReactNode;
  b: React.ReactNode;
  winner?: 'a' | 'b' | null;
}) {
  return (
    <div className="grid grid-cols-[130px_1fr_1fr] md:grid-cols-[180px_1fr_1fr] text-sm" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="p-3 md:p-4 text-[var(--text-muted)] font-semibold text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
        {label}
      </div>
      <div className="p-3 md:p-4 text-center" style={{ color: winner === 'a' ? 'var(--accent)' : 'var(--text)', fontWeight: winner === 'a' ? 700 : 400 }}>
        {a}
      </div>
      <div className="p-3 md:p-4 text-center" style={{ color: winner === 'b' ? 'var(--accent)' : 'var(--text)', fontWeight: winner === 'b' ? 700 : 400 }}>
        {b}
      </div>
    </div>
  );
}

export default async function ComparePairPage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const { slugA, slugB, hadYearSuffix } = parseCompareSlug(pair);
  const [toolA, toolB, allTools, manifest] = await Promise.all([getTool(slugA), getTool(slugB), getAllTools(), getManifest()]);

  if (!toolA || !toolB) notFound();

  const canonicalSlug = buildCompareSlug(toolA.slug, toolB.slug);
  if (hadYearSuffix || pair !== canonicalSlug) {
    permanentRedirect(`/compare/${canonicalSlug}`);
  }

  const sameCategory = allTools
    .filter((tool) => tool.category === toolA.category && ![toolA.slug, toolB.slug].includes(tool.slug))
    .sort((a, b) => getEvidenceScore(b) - getEvidenceScore(a) || b.rating - a.rating)
    .slice(0, 4);

  const winner = toolA.rating === toolB.rating ? null : toolA.rating > toolB.rating ? toolA : toolB;
  const verdict = winner
    ? `${winner.name} is the stronger general pick right now, but the better choice still depends on workflow, budget, and switching cost.`
    : `${toolA.name} and ${toolB.name} are close enough that your decision should come down to workflow and budget, not hype.`;

  const comparisonArticle = manifest.find((entry) => entry.slug === `${canonicalSlug}-2026`);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${toolA.name} vs ${toolB.name} comparison (${new Date().getFullYear()})`,
    description: verdict,
    mainEntityOfPage: `${SITE_URL}/compare/${canonicalSlug}`,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE_URL}/compare` },
      { '@type': 'ListItem', position: 3, name: `${toolA.name} vs ${toolB.name}`, item: `${SITE_URL}/compare/${canonicalSlug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
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
            <Link href="/tools" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)]">
              Tools
            </Link>
            <Link href="/compare" className="text-[var(--accent)] text-[13px] font-medium">
              Compare
            </Link>
            <Link href="/blog" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)]">
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
          <Link href="/compare" className="hover:text-[var(--accent)]">
            Compare
          </Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">
            {toolA.name} vs {toolB.name}
          </span>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text)] mb-3">
            {toolA.logo} {toolA.name} vs {toolB.logo} {toolB.name} comparison (2026)
          </h1>
          <p className="text-[var(--text-muted)] text-sm max-w-[720px] mx-auto">
            Pricing, features, best fit, research status, and the tradeoffs that matter before you switch.
          </p>
        </div>

        <div className="rounded-2xl p-5 mb-6 text-center" style={{ background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.15)' }}>
          <span className="text-sm text-[var(--accent)] font-bold">Quick take: {verdict}</span>
        </div>

        {comparisonArticle ? (
          <div className="rounded-2xl p-5 mb-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-[var(--text-muted)] text-sm mb-2">Want the longer article version?</p>
            <Link href={`/blog/${comparisonArticle.slug}`} className="text-[var(--accent)] font-semibold text-sm hover:underline">
              Read the full {toolA.name} vs {toolB.name} comparison →
            </Link>
          </div>
        ) : null}

        <div className="rounded-2xl overflow-hidden mb-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-[130px_1fr_1fr] md:grid-cols-[180px_1fr_1fr] text-sm" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
            <div className="p-4 font-bold text-[var(--text-dim)] text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
              Criteria
            </div>
            <div className="p-4 text-center">
              <span className="text-2xl block">{toolA.logo}</span>
              <div className="font-bold text-[var(--text)] mt-1">{toolA.name}</div>
            </div>
            <div className="p-4 text-center">
              <span className="text-2xl block">{toolB.logo}</span>
              <div className="font-bold text-[var(--text)] mt-1">{toolB.name}</div>
            </div>
          </div>

          <Row label="Rating" a={`${toolA.rating.toFixed(1)}/5`} b={`${toolB.rating.toFixed(1)}/5`} winner={compareScore(toolA.rating, toolB.rating)} />
          <Row label="Pricing" a={toolA.pricing} b={toolB.pricing} />
          <Row label="Research" a={researchCell(toolA)} b={researchCell(toolB)} winner={compareScore(getEvidenceScore(toolA), getEvidenceScore(toolB))} />
          <Row label="Sources cited" a={sourcesCell(toolA)} b={sourcesCell(toolB)} winner={compareScore(getSourceCount(toolA), getSourceCount(toolB))} />
          <Row label="Best for" a={toolA.bestFor} b={toolB.bestFor} />
          <Row label="Momentum" a={toolA.trend} b={toolB.trend} winner={compareScore(parseFloat(toolA.trend), parseFloat(toolB.trend))} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[
            {
              key: toolA.slug,
              title: `Pick ${toolA.name} if...`,
              tool: toolA,
              bullets: toolA.pros.slice(0, 3).length ? toolA.pros.slice(0, 3) : [`Your workflow fits ${toolA.bestFor.toLowerCase()}.`],
            },
            {
              key: toolB.slug,
              title: `Pick ${toolB.name} if...`,
              tool: toolB,
              bullets: toolB.pros.slice(0, 3).length ? toolB.pros.slice(0, 3) : [`Your workflow fits ${toolB.bestFor.toLowerCase()}.`],
            },
          ].map((item) => (
            <div key={item.key} className="rounded-2xl p-6 md:p-7" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h2 className="text-lg font-bold text-[var(--text)] mb-4">
                {item.tool.logo} {item.title}
              </h2>
              <p className="text-[var(--text-muted)] text-sm leading-6 mb-4">{stripHtml(item.tool.longDescription || item.tool.description)}</p>
              <div className="space-y-2.5">
                {item.bullets.map((bullet) => (
                  <div key={bullet} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                    <span className="text-[var(--accent)] mt-0.5">→</span>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-6 mb-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">How to choose between them</h2>
          <ul className="text-[var(--text-muted)] text-sm leading-7 list-disc pl-5 space-y-2">
            <li>Choose <strong>{toolA.name}</strong> when your priority is {toolA.bestFor.toLowerCase()}.</li>
            <li>Choose <strong>{toolB.name}</strong> when your priority is {toolB.bestFor.toLowerCase()}.</li>
            <li>If price sensitivity matters more than ecosystem depth, compare the free and entry plans carefully before you switch.</li>
            <li>Switching cost matters: saved prompts, integrations, and team habits can outweigh a single flashy feature.</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[toolA, toolB].map((tool) => (
            <div key={tool.slug} className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h2 className="text-lg font-bold text-[var(--text)] mb-4">
                {tool.logo} {tool.name} strengths and tradeoffs
              </h2>

              <div className="mb-4">
                <h3 className="text-xs font-bold text-[var(--accent)] mb-2">Pros</h3>
                {tool.pros.slice(0, 3).map((item) => (
                  <p key={item} className="text-[var(--text-muted)] text-xs mb-1.5">
                    ✓ {item}
                  </p>
                ))}
              </div>

              <div>
                <h3 className="text-xs font-bold text-[var(--red,#ef4444)] mb-2">Cons</h3>
                {tool.cons.slice(0, 3).map((item) => (
                  <p key={item} className="text-[var(--text-muted)] text-xs mb-1.5">
                    ✗ {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {sameCategory.length > 0 ? (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-[var(--text)] mb-4">More comparisons in {toolA.categoryLabel}</h2>
            <div className="flex flex-wrap gap-2">
              {sameCategory.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/compare/${buildCompareSlug(toolA.slug, tool.slug)}`}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  {toolA.name} vs {tool.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}
