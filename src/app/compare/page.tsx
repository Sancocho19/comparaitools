// src/app/compare/page.tsx

import tools from "@/data/tools.json";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare AI Tools Side by Side (2026) | ComparAITools",
  description: "Compare any two AI tools head-to-head. Pricing, features, ratings & real user data. ChatGPT vs Claude, Midjourney vs DALL-E, and 50+ comparisons.",
  alternates: { canonical: "https://comparaitools.com/compare" },
  openGraph: {
    title: "Compare AI Tools Side by Side | ComparAITools",
    description: "Head-to-head AI tool comparisons with real data. Find the best tool for your needs.",
    url: "https://comparaitools.com/compare",
    type: "website",
  },
};

const YEAR = 2026;

// Generar todos los pares posibles (mismo category primero, luego cross-category)
function getAllPairs() {
  const sameCat: { toolA: typeof tools[0]; toolB: typeof tools[0] }[] = [];
  const crossCat: { toolA: typeof tools[0]; toolB: typeof tools[0] }[] = [];

  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      if (tools[i].category === tools[j].category) {
        sameCat.push({ toolA: tools[i], toolB: tools[j] });
      } else {
        crossCat.push({ toolA: tools[i], toolB: tools[j] });
      }
    }
  }
  return { sameCat, crossCat };
}

const categories = [...new Set(tools.map(t => t.category))].map(cat => ({
  category: cat,
  label: tools.find(t => t.category === cat)!.categoryLabel,
  tools: tools.filter(t => t.category === cat),
}));

export default function ComparePage() {
  const { sameCat, crossCat } = getAllPairs();

  return (
    <>
      <div className="grain-overlay" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: "rgba(10,10,15,0.92)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))", color: "var(--bg)" }}>
              C
            </div>
            <span className="font-extrabold text-lg" style={{ fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>
              <span className="text-[var(--accent)]">Compar</span>
              <span className="text-[var(--text)]">AITools</span>
            </span>
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link href="/tools" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Tools</Link>
            <Link href="/compare" className="text-[var(--accent)] text-[13px] font-medium">Compare</Link>
            <Link href="/blog" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Blog</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 py-12 relative z-10">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] justify-center mb-4">
            <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
            <span>/</span>
            <span className="text-[var(--text-muted)]">Compare</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-3" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="text-[var(--text)]">Compare </span>
            <span className="text-[var(--accent)]">AI Tools</span>
          </h1>
          <p className="text-[15px] text-[var(--text-muted)] max-w-lg mx-auto">
            Head-to-head comparisons with real data. Pricing, features, and ratings — find the perfect tool for your needs.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { label: "Tools Tracked", value: tools.length + "+" },
            { label: "Comparisons Available", value: sameCat.length + crossCat.length + "+" },
            { label: "Updated", value: "Daily" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-5 rounded-2xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="text-2xl font-extrabold text-[var(--accent)] mb-1"
                style={{ fontFamily: "var(--font-mono)" }}>{value}</div>
              <div className="text-[12px] text-[var(--text-dim)]">{label}</div>
            </div>
          ))}
        </div>

        {/* Same-category comparisons by section */}
        {categories.map(({ category, label, tools: catTools }) => {
          const pairs = sameCat.filter(
            p => p.toolA.category === category
          );
          if (pairs.length === 0) return null;

          return (
            <div key={category} className="mb-12">
              <h2 className="text-lg font-bold text-[var(--text)] mb-5 flex items-center gap-3">
                <span>{catTools[0].logo}</span>
                <span>{label} Comparisons</span>
                <span className="text-[12px] font-normal text-[var(--text-dim)] px-2 py-0.5 rounded-lg"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  {pairs.length} comparisons
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pairs.map(({ toolA, toolB }) => (
                  <Link
                    key={`${toolA.slug}-${toolB.slug}`}
                    href={`/compare/${toolA.slug}-vs-${toolB.slug}`}
                    className="group flex items-center justify-between p-4 rounded-2xl transition-all hover:scale-[1.02]"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", textDecoration: "none" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl">{toolA.logo}</span>
                        <div>
                          <p className="text-[13px] font-bold text-[var(--text)] leading-tight">{toolA.name}</p>
                          <p className="text-[10px] text-[var(--text-dim)]">★ {toolA.rating}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[var(--text-dim)] px-1.5">VS</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl">{toolB.logo}</span>
                        <div>
                          <p className="text-[13px] font-bold text-[var(--text)] leading-tight">{toolB.name}</p>
                          <p className="text-[10px] text-[var(--text-dim)]">★ {toolB.rating}</p>
                        </div>
                      </div>
                    </div>
                    <span className="text-[var(--accent)] text-sm group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {/* Cross-category — most popular */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-[var(--text)] mb-2">Cross-Category Comparisons</h2>
          <p className="text-[13px] text-[var(--text-muted)] mb-5">Compare tools across different categories</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {crossCat.slice(0, 12).map(({ toolA, toolB }) => (
              <Link
                key={`${toolA.slug}-${toolB.slug}`}
                href={`/compare/${toolA.slug}-vs-${toolB.slug}`}
                className="group flex items-center justify-between p-4 rounded-2xl transition-all hover:scale-[1.02]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", textDecoration: "none" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">{toolA.logo}</span>
                    <div>
                      <p className="text-[13px] font-bold text-[var(--text)] leading-tight">{toolA.name}</p>
                      <p className="text-[10px] text-[var(--text-dim)]">{toolA.categoryLabel}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--text-dim)] px-1.5">VS</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">{toolB.logo}</span>
                    <div>
                      <p className="text-[13px] font-bold text-[var(--text)] leading-tight">{toolB.name}</p>
                      <p className="text-[10px] text-[var(--text-dim)]">{toolB.categoryLabel}</p>
                    </div>
                  </div>
                </div>
                <span className="text-[var(--accent)] text-sm group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-10 rounded-2xl"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))" }}>
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--bg)" }}>
            Read In-Depth Reviews
          </h2>
          <p className="text-sm mb-6 opacity-85" style={{ color: "var(--bg)" }}>
            Want more detail? Check our expert reviews with pricing analysis, pros & cons, and use case breakdowns.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/tools"
              className="px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: "var(--bg)", color: "var(--accent)", textDecoration: "none" }}>
              Browse All Tools →
            </Link>
            <Link href="/blog"
              className="px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: "rgba(0,0,0,0.2)", color: "var(--bg)", textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)" }}>
              Read the Blog →
            </Link>
          </div>
        </div>

      </main>
    </>
  );
}
