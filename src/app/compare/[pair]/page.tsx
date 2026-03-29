import Link from 'next/link';
import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import { SITE_URL } from '@/lib/site';
import { getAllTools, getTool } from '@/lib/tools-storage';
import { buildCompareSlug, parseCompareSlug, stripHtml } from '@/lib/utils';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const { slugA, slugB } = parseCompareSlug(pair);
  const [toolA, toolB] = await Promise.all([getTool(slugA), getTool(slugB)]);
  if (!toolA || !toolB) return { title: 'Comparison not found' };
  const canonicalPath = `/compare/${buildCompareSlug(toolA.slug, toolB.slug)}`;
  return {
    title: `${toolA.name} vs ${toolB.name}: Pricing, Fit, and Tradeoffs`,
    description: `Compare ${toolA.name} and ${toolB.name} with pricing, strengths, best-fit scenarios, and the tradeoffs that matter before you choose.`,
    alternates: { canonical: `${SITE_URL}${canonicalPath}` },
  };
}

function compareScore(a: number, b: number): 'a' | 'b' | null {
  return a > b ? 'a' : b > a ? 'b' : null;
}

function Row({ label, a, b, winner }: { label: string; a: React.ReactNode; b: React.ReactNode; winner?: 'a' | 'b' | null }) {
  return (
    <div className="grid grid-cols-[140px_1fr_1fr] md:grid-cols-[180px_1fr_1fr] text-sm" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="p-3 md:p-4 text-[var(--text-muted)] font-semibold text-xs" style={{ fontFamily: 'var(--font-mono)' }}>{label}</div>
      <div className="p-3 md:p-4 text-center" style={{ color: winner === 'a' ? 'var(--accent)' : 'var(--text)', fontWeight: winner === 'a' ? 700 : 400 }}>{a}</div>
      <div className="p-3 md:p-4 text-center" style={{ color: winner === 'b' ? 'var(--accent)' : 'var(--text)', fontWeight: winner === 'b' ? 700 : 400 }}>{b}</div>
    </div>
  );
}

export default async function ComparePage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const { slugA, slugB, hadYearSuffix } = parseCompareSlug(pair);
  const [toolA, toolB, allTools] = await Promise.all([getTool(slugA), getTool(slugB), getAllTools()]);
  if (!toolA || !toolB) notFound();

  const canonicalSlug = buildCompareSlug(toolA.slug, toolB.slug);
  if (hadYearSuffix || pair !== canonicalSlug) {
    permanentRedirect(`/compare/${canonicalSlug}`);
  }

  const sameCategory = allTools.filter((tool) => tool.category === toolA.category && ![toolA.slug, toolB.slug].includes(tool.slug)).slice(0, 4);
  const verdict = toolA.rating === toolB.rating
    ? `${toolA.name} and ${toolB.name} are close enough that your choice should come down to workflow and budget.`
    : `${toolA.rating > toolB.rating ? toolA.name : toolB.name} is the stronger general pick right now, but the loser can still make more sense in a narrower workflow.`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${toolA.name} vs ${toolB.name}`,
    description: verdict,
    mainEntityOfPage: `${SITE_URL}/compare/${canonicalSlug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="grain-overlay" />
      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(10,10,15,0.9)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0"><div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black" style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))', color: 'var(--bg)' }}>C</div><span className="font-extrabold text-lg hidden sm:block" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}><span className="text-[var(--accent)]">Compar</span><span className="text-[var(--text)]">AITools</span></span></Link>
          <div className="flex-1 hidden md:block"><SearchBar /></div>
          <div className="hidden md:flex gap-6 items-center shrink-0"><Link href="/tools" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)]">Tools</Link><Link href="/compare" className="text-[var(--accent)] text-[13px] font-medium">Compare</Link><Link href="/blog" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)]">Blog</Link></div>
        </div>
      </nav>

      <main className="max-w-[900px] mx-auto px-6 md:px-8 py-12 relative z-10">
        <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-8 flex-wrap"><Link href="/" className="hover:text-[var(--accent)]">Home</Link><span>/</span><Link href="/compare" className="hover:text-[var(--accent)]">Compare</Link><span>/</span><span className="text-[var(--text-muted)]">{toolA.name} vs {toolB.name}</span></div>
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text)] mb-3">{toolA.logo} {toolA.name} vs {toolB.logo} {toolB.name}</h1>
          <p className="text-[var(--text-muted)] text-sm max-w-[650px] mx-auto">A cleaner buying decision: pricing, product fit, and the tradeoffs that matter more than generic feature lists.</p>
        </div>

        <div className="rounded-2xl p-5 mb-8 text-center" style={{ background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.15)' }}>
          <span className="text-sm text-[var(--accent)] font-bold">Quick take: {verdict}</span>
        </div>

        <div className="rounded-2xl overflow-hidden mb-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-[140px_1fr_1fr] md:grid-cols-[180px_1fr_1fr] text-sm" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
            <div className="p-4 font-bold text-[var(--text-dim)] text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>Criteria</div>
            <div className="p-4 text-center"><span className="text-2xl block">{toolA.logo}</span><div className="font-bold text-[var(--text)] mt-1">{toolA.name}</div></div>
            <div className="p-4 text-center"><span className="text-2xl block">{toolB.logo}</span><div className="font-bold text-[var(--text)] mt-1">{toolB.name}</div></div>
          </div>
          <Row label="Rating" a={`${toolA.rating}/5`} b={`${toolB.rating}/5`} winner={compareScore(toolA.rating, toolB.rating)} />
          <Row label="Pricing" a={toolA.pricing} b={toolB.pricing} />
          <Row label="Users" a={toolA.users} b={toolB.users} />
          <Row label="Best for" a={toolA.bestFor} b={toolB.bestFor} />
          <Row label="Momentum" a={toolA.trend} b={toolB.trend} winner={compareScore(parseFloat(toolA.trend), parseFloat(toolB.trend))} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[toolA, toolB].map((tool) => (
            <div key={tool.slug} className="rounded-2xl p-6 md:p-7" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h2 className="text-lg font-bold text-[var(--text)] mb-4">{tool.logo} {tool.name}</h2>
              <p className="text-[var(--text-muted)] text-sm leading-6 mb-4">{stripHtml(tool.longDescription || tool.description)}</p>
              <div className="space-y-2.5 mb-4">{tool.features.slice(0, 5).map((feature) => <div key={feature} className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><span className="text-[var(--accent)]">→</span>{feature}</div>)}</div>
              <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <h3 className="text-xs font-bold text-[var(--accent)] mb-2">Pros</h3>
                {tool.pros.slice(0, 3).map((item) => <p key={item} className="text-[var(--text-muted)] text-xs mb-1.5">✓ {item}</p>)}
                <h3 className="text-xs font-bold text-[var(--red,#ef4444)] mt-3 mb-2">Cons</h3>
                {tool.cons.slice(0, 3).map((item) => <p key={item} className="text-[var(--text-muted)] text-xs mb-1.5">✗ {item}</p>)}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-6 mb-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">How to choose between them</h2>
          <ul className="text-[var(--text-muted)] text-sm leading-7 list-disc pl-5 space-y-2">
            <li>Choose <strong>{toolA.name}</strong> when the top priority is {toolA.bestFor.toLowerCase()}.</li>
            <li>Choose <strong>{toolB.name}</strong> when the top priority is {toolB.bestFor.toLowerCase()}.</li>
            <li>If price sensitivity matters more than ecosystem depth, compare the free and entry plans carefully before you switch.</li>
            <li>Look at switching costs too: saved prompts, integrations, and team habits can matter more than one flashy feature.</li>
          </ul>
        </div>

        {sameCategory.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">More comparisons in {toolA.categoryLabel}</h2>
            <div className="flex flex-wrap gap-3">
              {sameCategory.map((tool) => (
                <Link key={tool.slug} href={`/compare/${buildCompareSlug(toolA.slug, tool.slug)}`} className="px-4 py-2 rounded-xl text-[13px] font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{toolA.name} vs {tool.name}</Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
