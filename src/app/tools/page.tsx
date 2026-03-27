// src/app/tools/page.tsx

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from "next/link";
import type { Metadata } from "next";
import SearchBar from "@/components/SearchBar";
import { getAllTools, bootstrapStaticTools } from "@/lib/tools-storage";

export const metadata: Metadata = {
  title: "All AI Tools 2026 — Reviews, Pricing & Comparisons | ComparAITools",
  description: "Browse 50+ AI tools reviewed and rated. Find the best AI tools by category — chatbots, image generators, coding assistants, and more. Updated 2026.",
  alternates: { canonical: "https://comparaitools.com/tools" },
  openGraph: {
    title: "All AI Tools 2026 | ComparAITools",
    description: "50+ AI tools reviewed, rated, and compared. Find the best AI tool for your needs.",
    type: "website",
  },
};

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  // Bootstrap tools estáticas en Redis si es primera vez
  await bootstrapStaticTools();

  // Leer TODAS las tools (estáticas + descubiertas dinámicamente)
  const allTools = await getAllTools();
  const verified = allTools.filter(t => t.verified);

  const activeCategory = searchParams.category ?? "all";
  const filtered = activeCategory === "all"
    ? verified
    : verified.filter(t => t.category === activeCategory);

  // Categorías dinámicas (incluye las nuevas)
  const categoryMap = new Map<string, { label: string; count: number }>();
  for (const t of verified) {
    if (!categoryMap.has(t.category)) {
      categoryMap.set(t.category, { label: t.categoryLabel, count: 0 });
    }
    categoryMap.get(t.category)!.count++;
  }
  const categories = Array.from(categoryMap.entries()).map(([cat, v]) => ({
    category: cat, label: v.label, count: v.count,
  }));

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Best AI Tools 2026",
    description: "Comprehensive list of AI tools reviewed and rated by ComparAITools",
    numberOfItems: verified.length,
    itemListElement: verified.map((tool, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: tool.name,
      url: `https://comparaitools.com/tools/${tool.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      <div className="grain-overlay" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: "rgba(10,10,15,0.9)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))", color: "var(--bg)" }}>
              C
            </div>
            <span className="font-extrabold text-lg" style={{ fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>
              <span className="text-[var(--accent)]">Compar</span>
              <span className="text-[var(--text)]">AITools</span>
            </span>
          </Link>
          <div className="flex-1 hidden md:block">
            <SearchBar />
          </div>
          <div className="hidden md:flex gap-6 items-center shrink-0">
            <Link href="/tools" className="text-[var(--accent)] text-[13px] font-medium">Tools</Link>
            <Link href="/compare" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Compare</Link>
            <Link href="/blog" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Blog</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 py-12 relative z-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-4">
            <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
            <span>/</span>
            <span className="text-[var(--text-muted)]">All Tools</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-mono)" }}>
            All AI Tools <span className="text-[var(--accent)]">2026</span>
          </h1>
          <p className="text-[var(--text-muted)] text-[15px] max-w-xl">
            {verified.length} tools reviewed, rated, and compared. Updated automatically as new AI tools launch.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link href="/tools" className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: activeCategory === "all" ? "var(--accent)" : "var(--bg-card)",
              color: activeCategory === "all" ? "var(--bg)" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}>
            All ({verified.length})
          </Link>
          {categories.map((cat) => (
            <Link key={cat.category} href={`/tools?category=${cat.category}`}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: activeCategory === cat.category ? "var(--accent)" : "var(--bg-card)",
                color: activeCategory === cat.category ? "var(--bg)" : "var(--text-muted)",
                border: "1px solid var(--border)",
              }}>
              {cat.label} ({cat.count})
            </Link>
          ))}
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tool) => (
            <Link key={tool.id} href={`/tools/${tool.slug}`}
              className="group rounded-2xl p-6 flex flex-col gap-3 transition-all hover:scale-[1.02]"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{tool.logo}</span>
                  <div>
                    <h2 className="text-[var(--text)] font-bold text-[15px] leading-tight">{tool.name}</h2>
                    <p className="text-[var(--text-dim)] text-[11px]">{tool.company}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: tool.trend.startsWith("+") ? "rgba(0,229,160,0.1)" : "rgba(239,68,68,0.1)",
                      color: tool.trend.startsWith("+") ? "var(--accent)" : "var(--red)",
                    }}>
                    {tool.trend}
                  </span>
                  {tool.source === 'discovered' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(139,92,246,0.15)", color: "var(--purple)" }}>
                      NEW
                    </span>
                  )}
                </div>
              </div>

              <p className="text-[var(--text-muted)] text-[13px] leading-relaxed line-clamp-2">
                {tool.description}
              </p>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--orange)] text-sm">{"★".repeat(Math.floor(tool.rating))}</span>
                  <span className="text-[var(--text-dim)] text-[12px]">{tool.rating}/5</span>
                </div>
                <span className="text-[12px] font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
                  {tool.pricing}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="text-[11px] px-2.5 py-1 rounded-lg"
                  style={{ background: `${tool.color}15`, color: `${tool.color}cc`, border: `1px solid ${tool.color}22` }}>
                  {tool.categoryLabel}
                </span>
                <span className="text-[var(--accent)] text-[12px] font-semibold group-hover:underline">
                  Review →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA bottom */}
        <div className="mt-12 rounded-2xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-xl font-bold text-[var(--text)] mb-2">Can&apos;t decide between two tools?</h2>
          <p className="text-[var(--text-muted)] text-sm mb-5">
            Use our head-to-head comparison tool to find the perfect fit for your needs.
          </p>
          <Link href="/compare"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))", color: "var(--bg)" }}>
            Compare Tools Head-to-Head →
          </Link>
        </div>
      </main>
    </>
  );
}
