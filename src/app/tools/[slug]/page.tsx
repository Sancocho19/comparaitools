import tools from "@/data/tools.json";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) return { title: "Tool Not Found" };

  return {
    title: `${tool.name} Review 2026 - Pricing, Features & Rating`,
    description: `Honest ${tool.name} review. Rating: ${tool.rating}/5. ${tool.description} Compare with alternatives. Updated ${tool.lastUpdated}.`,
    openGraph: {
      title: `${tool.name} Review 2026 | ComparAITools`,
      description: `Is ${tool.name} worth it in 2026? Detailed review with pricing at ${tool.pricing}, pros & cons, and alternatives.`,
      type: "article",
    },
    alternates: {
      canonical: `https://comparaitools.com/tools/${tool.slug}`,
    },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) notFound();

  const alternatives = tools.filter(
    (t) => t.category === tool.category && t.id !== tool.id
  );

  const comparisons = alternatives.map((alt) => ({
    tool: alt,
    url: `/compare/${tool.slug}-vs-${alt.slug}`,
  }));

  const faqs = [
    {
      q: `Is ${tool.name} worth it in 2026?`,
      a: `With a rating of ${tool.rating}/5 and ${tool.trend} growth, ${tool.name} is ${tool.rating >= 4.5 ? "one of the top choices" : "a solid option"} in the ${tool.categoryLabel} category. Pricing starts at ${tool.pricing}.`,
    },
    {
      q: `How much does ${tool.name} cost?`,
      a: `${tool.name} pricing is ${tool.pricing}. ${tool.pricingValue === 0 ? "A free tier is available." : `Plans start at $${tool.pricingValue}/month.`}`,
    },
    {
      q: `What are the best ${tool.name} alternatives?`,
      a: `Top alternatives to ${tool.name} include ${alternatives.map((a) => a.name).join(", ")}. Each offers different strengths in the ${tool.categoryLabel} space.`,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: tool.name,
            applicationCategory: "AI Tool",
            operatingSystem: "Web",
            url: tool.url,
            offers: {
              "@type": "Offer",
              price: tool.pricingValue,
              priceCurrency: "USD",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: tool.rating,
              bestRating: "5",
              worstRating: "1",
              ratingCount: "1000",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      <div className="grain-overlay" />

      {/* Navbar */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: "rgba(10,10,15,0.9)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--purple))",
                color: "var(--bg)",
              }}
            >
              C
            </div>
            <span
              className="font-extrabold text-lg"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}
            >
              <span className="text-[var(--accent)]">Compar</span>
              <span className="text-[var(--text)]">AITools</span>
            </span>
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link href="/tools" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Tools</Link>
            <Link href="/" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Compare</Link>
            <Link href="/" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Blog</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[800px] mx-auto px-6 md:px-8 py-12 relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-8">
          <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
          <span>/</span>
          <Link href="/tools" className="hover:text-[var(--accent)]">Tools</Link>
          <span>/</span>
          <Link href={`/category/${tool.category}`} className="hover:text-[var(--accent)]">{tool.categoryLabel}</Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">{tool.name}</span>
        </div>

        {/* Tool Header - Centered */}
        <div className="text-center mb-10">
          <span className="text-6xl block mb-4">{tool.logo}</span>
          <div className="flex items-center justify-center gap-3 flex-wrap mb-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text)]" style={{ fontFamily: "var(--font-mono)" }}>
              {tool.name}
            </h1>
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{
                background: tool.trend.startsWith("+") ? "rgba(0,229,160,0.1)" : "rgba(239,68,68,0.1)",
                color: tool.trend.startsWith("+") ? "var(--accent)" : "var(--red)",
              }}
            >
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
          <p className="text-[var(--text-muted)] leading-relaxed text-[15px]">{tool.longDescription}</p>
          <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="text-xs text-[var(--text-dim)] font-bold uppercase tracking-wider">Best for:</span>
            <p className="text-[var(--text)] text-sm mt-1.5">{tool.bestFor}</p>
          </div>
        </div>

        {/* Features */}
        <div className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-bold text-[var(--text)] mb-4">Key Features</h2>
          <div className="flex flex-wrap gap-2">
            {tool.features.map((f, i) => (
              <span
                key={i}
                className="text-sm px-4 py-2 rounded-lg"
                style={{
                  background: `${tool.color}15`,
                  color: `${tool.color}cc`,
                  border: `1px solid ${tool.color}22`,
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Pros & Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl p-6 md:p-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h2 className="text-lg font-bold text-[var(--accent)] mb-4">✓ Pros</h2>
            {tool.pros.map((p, i) => (
              <p key={i} className="text-[var(--text-muted)] text-sm mb-3 pl-4" style={{ borderLeft: "2px solid var(--accent)" }}>{p}</p>
            ))}
          </div>
          <div className="rounded-2xl p-6 md:p-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h2 className="text-lg font-bold text-[var(--red)] mb-4">✗ Cons</h2>
            {tool.cons.map((c, i) => (
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
                <Link
                  key={c.tool.id}
                  href={c.url}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                >
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

        {/* Visit CTA */}
        <div className="text-center mt-10">
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${tool.color}, ${tool.color}cc)`, color: "#fff" }}
          >
            Visit {tool.name} →
          </a>
        </div>
      </main>
    </>
  );
}
