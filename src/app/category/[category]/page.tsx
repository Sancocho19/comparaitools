// src/app/category/[category]/page.tsx

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SearchBar from "@/components/SearchBar";
import { getToolsByCategory, getCategories, bootstrapStaticTools } from "@/lib/tools-storage";
import { buildCategoryMetadata } from "@/lib/seo";

function clean(text: unknown): string {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  await bootstrapStaticTools();
  const catTools = await getToolsByCategory(category);
  if (catTools.length === 0) return { title: "Category Not Found" };
  const label = catTools[0].categoryLabel;

  return buildCategoryMetadata(label, category, catTools.map((tool) => tool.name));
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;

  await bootstrapStaticTools();
  const catTools = (await getToolsByCategory(category)).sort((a, b) => b.rating - a.rating);
  if (catTools.length === 0) notFound();

  const label    = catTools[0].categoryLabel;
  const allCats  = await getCategories();

  // Pairs for comparisons section
  const pairs: { a: typeof catTools[0]; b: typeof catTools[0] }[] = [];
  for (let i = 0; i < catTools.length && pairs.length < 6; i++) {
    for (let j = i + 1; j < catTools.length && pairs.length < 6; j++) {
      pairs.push({ a: catTools[i], b: catTools[j] });
    }
  }

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best ${label} AI Tools 2026`,
    numberOfItems: catTools.length,
    itemListElement: catTools.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      url: `https://comparaitools.com/tools/${t.slug}`,
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

      <main className="max-w-[1000px] mx-auto px-6 md:px-8 py-12 relative z-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-8">
          <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
          <span>/</span>
          <Link href="/tools" className="hover:text-[var(--accent)]">Tools</Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">{label}</span>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-5xl block mb-4">{catTools[0].logo}</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text)] mb-2">
            Best {label} AI Tools 2026
          </h1>
          <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">
            {catTools.length} tools compared side-by-side with real pricing, features, and ratings
          </p>
        </div>

        {/* Tools ranked list */}
        <div className="grid gap-4 mb-12">
          {catTools.map((tool, i) => (
            <Link key={tool.slug} href={`/tools/${tool.slug}`} style={{ textDecoration: "none" }}>
              <div className="rounded-2xl p-5 md:p-6 flex items-center gap-5 transition-all hover:scale-[1.01]"
                style={{ background: "var(--bg-card)", border: `1px solid ${i === 0 ? "var(--accent)" : "var(--border)"}` }}>

                {/* Rank */}
                <span className="text-2xl font-bold text-[var(--text-dim)] w-8 text-center shrink-0"
                  style={{ fontFamily: "var(--font-mono)" }}>#{i + 1}</span>

                {/* Logo */}
                <span className="text-3xl shrink-0">{tool.logo}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-[var(--text)]">{tool.name}</h2>
                    {i === 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                        style={{ background: "var(--accent)", color: "var(--bg)" }}>TOP PICK</span>
                    )}
                    {tool.source === 'discovered' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: "rgba(139,92,246,0.15)", color: "var(--purple)" }}>NEW</span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: tool.trend.startsWith("+") ? "rgba(0,229,160,0.1)" : "rgba(239,68,68,0.1)",
                        color: tool.trend.startsWith("+") ? "var(--accent)" : "var(--red)",
                      }}>
                      {tool.trend}
                    </span>
                  </div>
                  <p className="text-[var(--text-muted)] text-xs mt-1 line-clamp-2">{clean(tool.description)}</p>
                  {tool.bestFor && (
                    <p className="text-[var(--text-dim)] text-[10px] mt-1">
                      <span className="font-bold uppercase tracking-wider">Best for:</span> {clean(tool.bestFor)}
                    </p>
                  )}
                </div>

                {/* Rating + pricing */}
                <div className="text-right hidden sm:block shrink-0">
                  <div className="text-[var(--orange)]">
                    {"★".repeat(Math.floor(tool.rating))}
                    <span className="text-[var(--text-muted)] text-xs ml-1">{tool.rating}/5</span>
                  </div>
                  <div className="text-[var(--accent)] text-sm font-semibold mt-1" style={{ fontFamily: "var(--font-mono)" }}>
                    {tool.pricing}
                  </div>
                  <div className="text-[var(--text-dim)] text-[10px] mt-0.5">{tool.users} users</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Compare section */}
        {pairs.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-[var(--text)] mb-5">
              Compare {label} Tools Head-to-Head
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pairs.map(({ a, b }) => (
                <Link key={`${a.slug}-${b.slug}`}
                  href={`/compare/${[a.slug, b.slug].sort().join('-vs-')}`}
                  className="group flex items-center justify-between p-4 rounded-2xl transition-all hover:scale-[1.02]"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", textDecoration: "none" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{a.logo}</span>
                      <div>
                        <p className="text-[13px] font-bold text-[var(--text)] leading-tight">{a.name}</p>
                        <p className="text-[10px] text-[var(--text-dim)]">★ {a.rating}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[var(--text-dim)]">VS</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{b.logo}</span>
                      <div>
                        <p className="text-[13px] font-bold text-[var(--text)] leading-tight">{b.name}</p>
                        <p className="text-[10px] text-[var(--text-dim)]">★ {b.rating}</p>
                      </div>
                    </div>
                  </div>
                  <span className="text-[var(--accent)] group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Other categories */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-[var(--text)] mb-5">Browse Other Categories</h2>
          <div className="flex flex-wrap gap-2">
            {allCats.filter(c => c.category !== category).map(cat => (
              <Link key={cat.category} href={`/category/${cat.category}`}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)", textDecoration: "none" }}>
                {cat.categoryLabel} ({cat.count})
              </Link>
            ))}
          </div>
        </div>

        {/* Blog CTA */}
        <div className="text-center p-8 rounded-2xl"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))" }}>
          <h2 className="text-xl font-extrabold mb-2" style={{ color: "var(--bg)" }}>
            Open the {label} AI Guide
          </h2>
          <p className="text-sm mb-5 opacity-85" style={{ color: "var(--bg)" }}>
            In-depth analysis, use case breakdowns, and expert recommendations.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href={`/blog/best-${category}-ai-tools-2026`}
              className="px-6 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: "var(--bg)", color: "var(--accent)", textDecoration: "none" }}>
              Read the Guide →
            </Link>
            <Link href="/compare"
              className="px-6 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: "rgba(0,0,0,0.2)", color: "var(--bg)", textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)" }}>
              Compare Tools →
            </Link>
          </div>
        </div>

      </main>
    </>
  );
}
