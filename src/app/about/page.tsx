import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About and methodology',
  description: 'How ComparAITools uses live research, structured tool data, and editorial prompts to publish useful software decision pages at scale.',
};

export default function AboutPage() {
  return (
    <>
      <div className="grain-overlay" />
      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(10,10,15,0.9)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black" style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))', color: 'var(--bg)' }}>C</div><span className="font-extrabold text-lg" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}><span className="text-[var(--accent)]">Compar</span><span className="text-[var(--text)]">AITools</span></span></Link>
          <div className="hidden md:flex gap-6 items-center"><Link href="/tools" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)]">Tools</Link><Link href="/compare" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)]">Compare</Link><Link href="/blog" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)]">Blog</Link></div>
        </div>
      </nav>

      <main className="max-w-[860px] mx-auto px-6 md:px-8 py-16 relative z-10">
        <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-8"><Link href="/" className="hover:text-[var(--accent)]">Home</Link><span>/</span><span className="text-[var(--text-muted)]">About</span></div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text)] mb-4" style={{ fontFamily: 'var(--font-mono)' }}>How this site is built</h1>
        <p className="text-[var(--text-muted)] text-[16px] leading-relaxed mb-8">ComparAITools is designed to scale with automation <em>without</em> pretending the site personally tested every product. The stack combines live search, product data, and editorial prompts so pages can update fast while staying grounded.</p>

        <Section title="What changed in this rebuild">
          <ul className="text-[var(--text-muted)] text-[15px] leading-7 list-disc pl-5 space-y-2">
            <li>One source of truth for tools instead of multiple contradictory counts.</li>
            <li>Search-backed content generation instead of offline knowledge guesses.</li>
            <li>No fake founder persona and no invented “we tested it” language.</li>
            <li>Canonical comparison URLs with cleaner sitemap and internal linking.</li>
            <li>Visible research basis on blog pages so readers can audit the sources.</li>
          </ul>
        </Section>

        <Section title="Editorial method">
          <div className="space-y-4 text-[var(--text-muted)] text-[15px] leading-relaxed">
            <p>Every automated article starts with live search queries tied to a clear commercial intent: pricing, comparison, alternatives, or category selection.</p>
            <p>From there, the system prioritizes official pricing pages, release notes, docs, and reputable third-party coverage. The prompt is then instructed to synthesize tradeoffs and buyer guidance, not to invent a fake reviewer.</p>
            <p>The goal is simple: automation underneath, honest decision support on top.</p>
          </div>
        </Section>

        <Section title="What the site will still need from you">
          <ul className="text-[var(--text-muted)] text-[15px] leading-7 list-disc pl-5 space-y-2">
            <li>Periodic spot checks on the highest-traffic pages.</li>
            <li>Search Console and analytics reviews to decide what to prune, refresh, or expand.</li>
            <li>A backlink strategy based on data assets, not spammy link buying.</li>
            <li>Manual upgrades on pages that prove they can rank and convert.</li>
          </ul>
        </Section>

        <Section title="Affiliate disclosure">
          <p className="text-[var(--text-muted)] text-[15px] leading-relaxed">Some pages may contain affiliate links. Those links can monetize traffic, but they should never dictate verdicts. Pages built for purchase intent only work long-term when the advice is still useful even if no one clicks.</p>
        </Section>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl p-7 mb-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <h2 className="text-xl font-bold text-[var(--text)] mb-4">{title}</h2>
      {children}
    </section>
  );
}
