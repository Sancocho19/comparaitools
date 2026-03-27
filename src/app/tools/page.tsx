// src/app/tools/page.tsx

import tools from "@/data/tools.json";
import Link from "next/link";
import type { Metadata } from "next";
import SearchBar from "@/components/SearchBar";

export const metadata: Metadata = {
  title: "All AI Tools 2026 — Reviews, Pricing & Comparisons | ComparAITools",
  description: `Browse ${tools.length}+ AI tools reviewed and rated. Find the best AI tools by category — chatbots, image generators, coding assistants, and more. Updated 2026.`,
  alternates: {
    canonical: "https://comparaitools.com/tools",
  },
  openGraph: {
    title: "All AI Tools 2026 | ComparAITools",
    description: `${tools.length}+ AI tools reviewed, rated, and compared. Find the best AI tool for your needs.`,
    type: "website",
  },
};

const categories = [...new Set(tools.map((t) => t.category))].map((cat) => ({
  category: cat,
  label: tools.find((t) => t.category === cat)!.categoryLabel,
  count: tools.filter((t) => t.category === cat).length,
}));

export default function ToolsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const activeCategory = searchParams.category ?? "all";
  const filtered =
    activeCategory === "all"
      ? tools
      : tools.filter((t) => t.category === activeCategory);

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Best AI Tools 2026",
    description: "Comprehensive list of AI tools reviewed and rated by ComparAITools",
    numberOfItems: tools.length,
    itemListElement: tools.map((tool, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: tool.name,
      url: `https://comparaitools.com/tools/${tool.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      <div className="grain-overlay" />
      

      {/* Navbar */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: "rgba(10,10,15,0.9)",
          borderBottom: "1px solid var(--border)",
        }}
      > <div className="flex-1 hidden sm:block"><SearchBar /></div>
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
            <Link href="/tools" className="text-[var(--accent)] text-[13px] font-medium">Tools</Link>
            <Link href="/" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Compare</Link>
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
          <h1
            className="text-3xl md:text-4xl font-extrabold text-[var(--text)] mb-3"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            All AI Tools{" "}
            <span className="text-[var(--accent)]">2026</span>
          </h1>
          <p className="text-[var(--text-muted)] text-[15px] max-w-xl">
            {tools.length} tools reviewed, rated, and compared. Find the best AI tool for every use case.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/tools"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: activeCategory === "all" ? "var(--accent)" : "var(--bg-card)",
              color: activeCategory === "all" ? "var(--bg)" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            All ({tools.length})
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.category}
              href={`/tools?category=${cat.category}`}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: activeCategory === cat.category ? "var(--accent)" : "var(--bg-card)",
                color: activeCategory === cat.category ? "var(--bg)" : "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {cat.label} ({cat.count})
            </Link>
          ))}
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              className="group rounded-2xl p-6 flex flex-col gap-3 transition-all hover:scale-[1.02]"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              {/* Tool header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{tool.logo}</span>
                  <div>
                    <h2 className="text-[var(--text)] font-bold text-[15px] leading-tight">
                      {tool.name}
                    </h2>
                    <p className="text-[var(--text-dim)] text-[11px]">{tool.company}</p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{
                    background: tool.trend.startsWith("+") ? "rgba(0,229,160,0.1)" : "rgba(239,68,68,0.1)",
                    color: tool.trend.startsWith("+") ? "var(--accent)" : "var(--red)",
                  }}
                >
                  {tool.trend}
                </span>
              </div>

              {/* Description */}
              <p className="text-[var(--text-muted)] text-[13px] leading-relaxed line-clamp-2">
                {tool.description}
              </p>

              {/* Rating + price */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--orange)] text-sm">
                    {"★".repeat(Math.floor(tool.rating))}
                  </span>
                  <span className="text-[var(--text-dim)] text-[12px]">
                    {tool.rating}/5
                  </span>
                </div>
                <span
                  className="text-[12px] font-semibold"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}
                >
                  {tool.pricing}
                </span>
              </div>

              {/* Category badge */}
              <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                <span
                  className="text-[11px] px-2.5 py-1 rounded-lg"
                  style={{
                    background: `${tool.color}15`,
                    color: `${tool.color}cc`,
                    border: `1px solid ${tool.color}22`,
                  }}
                >
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
        <div
          className="mt-12 rounded-2xl p-8 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-xl font-bold text-[var(--text)] mb-2">
            Can&apos;t decide between two tools?
          </h2>
          <p className="text-[var(--text-muted)] text-sm mb-5">
            Use our head-to-head comparison tool to find the perfect fit for your needs.
          </p>
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--purple))",
              color: "var(--bg)",
            }}
          >
            Compare Tools Head-to-Head →
          </Link>
        </div>
      </main>
    </>
  );
}
