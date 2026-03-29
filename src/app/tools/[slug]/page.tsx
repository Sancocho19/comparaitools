// src/app/tools/[slug]/page.tsx

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SearchBar from "@/components/SearchBar";
import { getTool, getAllTools, bootstrapStaticTools } from "@/lib/tools-storage";

// ─── Limpia texto contaminado con <cite> tags u otros artefactos HTML ─────────
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<cite[^>]*>.*?<\/cite>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await bootstrapStaticTools();
  const tool = await getTool(slug);
  if (!tool) return { title: "Tool Not Found" };

  return {
    title: `${tool.name} Review 2026 - Pricing, Features & Rating | ComparAITools`,
    description: `Honest ${tool.name} review. Rating: ${tool.rating}/5. ${cleanText(tool.description)} Compare with alternatives. Updated ${tool.lastUpdated}.`,
    openGraph: {
      title: `${tool.name} Review 2026 | ComparAITools`,
      description: `Is ${tool.name} worth it in 2026? Detailed review with pricing at ${tool.pricing}, pros & cons, and alternatives.`,
      type: "article",
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

  // Bootstrap + leer tool desde Redis (incluye tools descubiertas)
  await bootstrapStaticTools();
  const tool = await getTool(slug);
  if (!tool || !tool.verified) notFound();

  // Alternativas de la misma categoría
  const allTools   = await getAllTools();
  const alternatives = allTools
    .filter(t => t.category === tool.category && t.slug !== tool.slug && t.verified)
    .slice(0, 6);

  const comparisons = alternatives.map(alt => ({
    tool: alt,
    url: `/compare/${[tool.slug, alt.slug].sort().join('-vs-')}`,
  }));

  const description    = cleanText(tool.description);
  const longDesc       = cleanText(tool.longDescription || tool.description);
  const bestFor        = cleanText(tool.bestFor);
  const features       = tool.features.map(cleanText).filter(Boolean);
  const pros           = tool.pros.map(cleanText).filter(Boolean);
  const cons           = tool.cons.map(cleanText).filter(Boolean);

  const faqs = [
    {
      q: `Is ${tool.name} worth it in 2026?`,
      a: `With a rating of ${tool.rating}/5 and ${tool.trend} growth, ${tool.name} is ${tool.rating >= 4.5 ? "one of the top choices" : "a solid option"} in the ${tool.categoryLabel} category. Pricing: ${tool.pricing}.`,
    },
    {
      q: `How much does ${tool.name} cost?`,
      a: `${tool.name} pricing is ${tool.pricing}. ${tool.pricingValue === 0 ? "A free tier is available." : `Plans start at $${tool.pricingValue}/month.`}`,
    },
    {
      q: `What are the best ${tool.name} alternatives?`,
      a: alternatives.length > 0
        ? `Top alternatives to ${tool.name} include ${alternatives.slice(0,3).map(a => a.name).join(", ")}. Each offers different strengths in the ${tool.categoryLabel} space.`
        : `${tool.name} is a leading tool in the ${tool.categoryLabel} category.`,
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: tool.name,
        applicationCategory: "AI Tool",
        operatingSystem: "Web",
        url: tool.url,
        offers: { "@type": "Offer", price: tool.pricingValue, priceCurrency: "USD" },
        aggregateRating: { "@type": "AggregateRating", ratingValue: tool.rating, bestRating: "5", worstRating: "1", ratingCount: "1000" },
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(f => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      })}} />

      <div className="grain-overlay" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: "rgba(10,10,15,0.9)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))", color: "var(--bg)" }}>C</div>
            <span className="font-extrabold text-lg hidden sm:block" style={{ fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>
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

      <main className="max-w-[800px] mx-auto px-6 md:px-8 py-12 relative z-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-8 flex-wrap">
          <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
          <span>/</span>
          <Link href="/tools" className="hover:text-[var(--accent)]">Tools</Link>
          <span>/</span>
          <Link href={`/category/${tool.category}`} className="hover:text-[var(--accent)]">{tool.categoryLabel}</Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">{tool.name}</span>
          {tool.source === 'discovered' && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
              style={{ background: "rgba(139,92,246,0.15)", color: "var(--purple)" }}>NEW</span>
          )}
        </div>

        {/* Tool Header */}
        <div className="text-center mb-10">
          <span className="text-6xl block mb-4">{tool.logo}</span>
          <div className="flex items-center justify-center gap-3 flex-wrap mb-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text)]" style={{ fontFamily: "var(--font-mono)" }}>
              {tool.name}
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{
                background: tool.trend.startsWith("+") ? "rgba(0,229,160,0.1)" : "rgba(239,68,68,0.1)",
                color: tool.trend.startsWith("+") ? "var(--accent)" : "var(--red)",
              }}>
              {tool.trend}
            </span>
          </div>
          <p className="text-[var(--text-muted)] text-sm">
            by {tool.company} · {tool.users} users · Updated {tool.lastUpdated}
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="text-[var(--orange)] text-lg tracking-wider">
              {"★".repeat(Math.floor(tool.rating))}
              <span className="text-[var(--text-muted)] ml-1 text-sm">{tool.rating}/5</span>
            </span>
            <span className="text-[var(--accent)] font-semibold text-sm" style={{ fontFamily: "var(--font-mono)" }}>
              {tool.pricing}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-[var(--text-muted)] leading-relaxed text-[15px]">{longDesc}</p>
          {bestFor && (
            <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="text-xs text-[var(--text-dim)] font-bold uppercase tracking-wider">Best for:</span>
              <p className="text-[var(--text)] text-sm mt-1.5">{bestFor}</p>
            </div>
          )}
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h2 className="text-lg font-bold text-[var(--text)] mb-4">Key Features</h2>
            <div className="flex flex-wrap gap-2">
              {features.map((f, i) => (
                <span key={i} className="text-sm px-4 py-2 rounded-lg"
                  style={{ background: `${tool.color}15`, color: `${tool.color}cc`, border: `1px solid ${tool.color}22` }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pros & Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl p-6 md:p-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h2 className="text-lg font-bold text-[var(--accent)] mb-4">✓ Pros</h2>
            {pros.map((p, i) => (
              <p key={i} className="text-[var(--text-muted)] text-sm mb-3 pl-4" style={{ borderLeft: "2px solid var(--accent)" }}>{p}</p>
            ))}
          </div>
          <div className="rounded-2xl p-6 md:p-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h2 className="text-lg font-bold text-[var(--red)] mb-4">✗ Cons</h2>
            {cons.map((c, i) => (
              <p key={i} className="text-[var(--text-muted)] text-sm mb-3 pl-4" style={{ borderLeft: "2px solid var(--red)" }}>{c}</p>
            ))}
          </div>
        </div>

        {/* Comparisons */}
        {comparisons.length > 0 && (
          <div className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h2 className="text-lg font-bold text-[var(--text)] mb-4">Compare {tool.name} with Alternatives</h2>
            <div className="flex flex-wrap gap-2">
              {comparisons.map((c) => (
                <Link key={c.tool.slug} href={c.url}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                  {tool.logo} {tool.name} vs {c.tool.name} {c.tool.logo}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="rounded-2xl p-6 md:p-8 mb-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-bold text-[var(--text)] mb-5">Frequently Asked Questions</h2>
          {faqs.map((faq, i) => (
            <div key={i} className="mb-5 last:mb-0">
              <h3 className="text-[var(--text)] text-[15px] font-bold mb-1.5">{faq.q}</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        {/* Blog link */}
        <div className="rounded-2xl p-5 mb-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-[var(--text-muted)] text-sm mb-3">Want a deeper analysis?</p>
          <Link href={`/blog/${tool.slug}-review-2026`}
            className="text-[var(--accent)] font-semibold text-sm hover:underline">
            Read our full {tool.name} review →
          </Link>
        </div>

        {/* Visit CTA */}
        <div className="text-center mt-10">
          <a href={tool.url} target="_blank" rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${tool.color}, ${tool.color}cc)`, color: "#fff" }}>
            Visit {tool.name} →
          </a>
        </div>
      </main>
    </>
  );
}
