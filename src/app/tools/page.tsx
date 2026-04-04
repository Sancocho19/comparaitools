export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from "next/link";
import type { Metadata } from "next";
import SearchBar from "@/components/SearchBar";
import { getAllTools, bootstrapStaticTools } from "@/lib/tools-storage";

export const metadata: Metadata = {
  title: "All AI Tools 2026 — Reviews, Pricing & Comparisons | ComparAITools",
  description:
    "Browse AI tools reviewed and rated across categories including chatbots, image generators, coding assistants, and more. Updated 2026.",
  alternates: { canonical: "https://comparaitools.com/tools" },
  openGraph: {
    title: "All AI Tools 2026 | ComparAITools",
    description: "AI tools reviewed, rated, and compared across categories, pricing, and market positioning.",
    type: "website",
  },
};

type ToolItem = Awaited<ReturnType<typeof getAllTools>>[number];

type ToolWithResearch = ToolItem & {
  evidenceScore?: number;
  sourceCount?: number;
  research?: {
    evidenceScore?: number;
    sourceCount?: number;
  };
};

function getEvidenceScore(tool: ToolItem): number {
  const typed = tool as ToolWithResearch;
  return Number(typed.evidenceScore ?? typed.research?.evidenceScore ?? 0);
}

function getSourceCount(tool: ToolItem): number {
  const typed = tool as ToolWithResearch;
  return Number(typed.sourceCount ?? typed.research?.sourceCount ?? 0);
}

function buildToolsUrl(category: string, source: string, sort: string): string {
  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (source !== "all") params.set("source", source);
  if (sort !== "evidence") params.set("sort", sort);
  const query = params.toString();
  return query ? `/tools?${query}` : "/tools";
}

function compactPricing(value: string): string {
  const text = String(value || "").trim();
  if (!text) return "Pricing not listed";
  if (text.length <= 34) return text;

  const shortened = text
    .replace(/^free tier\s*\+\s*/i, "Free + ")
    .replace(/^plans start at\s*/i, "From ")
    .replace(/^starting from\s*/i, "From ")
    .replace(/^free self-hosted version available\.\s*/i, "")
    .replace(/^cloud plans start at\s*/i, "Cloud from ");

  return shortened.length <= 34 ? shortened : `${shortened.slice(0, 31).trim()}…`;
}

function shortFeature(feature: string): string {
  const text = String(feature || "").trim();
  if (!text) return "";
  return text.length <= 24 ? text : `${text.slice(0, 21).trim()}…`;
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--text-dim)] mb-3"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {children}
    </div>
  );
}

function FilterPill({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold leading-none whitespace-nowrap"
      style={{
        border: "1px solid var(--border)",
        textDecoration: "none",
        background: isActive ? "var(--accent)" : "rgba(255,255,255,0.02)",
        color: isActive ? "var(--bg)" : "var(--text-muted)",
      }}
    >
      {children}
    </Link>
  );
}

function ToolCard({ tool }: { tool: ToolItem }) {
  const evidence = getEvidenceScore(tool);
  const sources = getSourceCount(tool);

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group block rounded-[26px] px-5 py-5 md:px-6 md:py-6 transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl shrink-0">{tool.logo}</span>
          <div className="min-w-0">
            <h2 className="text-[var(--text)] font-bold text-[17px] leading-tight truncate">{tool.name}</h2>
            <p className="text-[var(--text-dim)] text-xs mt-1 truncate">{tool.company}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{
              background: tool.trend.startsWith("+") ? "rgba(0,229,160,0.1)" : "rgba(239,68,68,0.1)",
              color: tool.trend.startsWith("+") ? "var(--accent)" : "var(--red)",
            }}
          >
            {tool.trend}
          </span>

          {tool.source === "discovered" ? (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(139,92,246,0.15)", color: "var(--purple)" }}
            >
              NEW
            </span>
          ) : null}
        </div>
      </div>

      <p className="text-[var(--text-muted)] text-[13px] md:text-sm leading-7 mb-5 line-clamp-2">
        {tool.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {tool.features.slice(0, 2).map((feature) => (
          <span
            key={feature}
            className="text-[11px] px-2.5 py-1 rounded-full"
            style={{
              background: `${tool.color}15`,
              color: `${tool.color}cc`,
              border: `1px solid ${tool.color}22`,
            }}
            title={feature}
          >
            {shortFeature(feature)}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div
          className="rounded-xl px-3 py-3"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}
        >
          <div className="text-[11px] text-[var(--text-dim)] mb-1">Evidence</div>
          <div className="text-[var(--text)] font-semibold text-sm">{evidence || "—"}/100</div>
        </div>
        <div
          className="rounded-xl px-3 py-3"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}
        >
          <div className="text-[11px] text-[var(--text-dim)] mb-1">Sources</div>
          <div className="text-[var(--text)] font-semibold text-sm">{sources || "—"}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[var(--orange)] text-sm">{"★".repeat(Math.max(1, Math.floor(tool.rating)))}</span>
          <span className="text-[var(--text-dim)] text-[12px]">{tool.rating.toFixed(1)}/5</span>
        </div>

        <span
          className="text-[12px] font-semibold text-right"
          style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}
          title={tool.pricing}
        >
          {compactPricing(tool.pricing)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <span
          className="text-[11px] px-2.5 py-1 rounded-lg"
          style={{ background: `${tool.color}15`, color: `${tool.color}cc`, border: `1px solid ${tool.color}22` }}
        >
          {tool.categoryLabel}
        </span>
        <span className="text-[var(--accent)] text-[12px] font-semibold group-hover:underline">Review →</span>
      </div>
    </Link>
  );
}

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; source?: string; sort?: string }>;
}) {
  await bootstrapStaticTools();

  const allTools = await getAllTools();
  const verified = allTools.filter((t) => t.verified);

  const params = await searchParams;
  const activeCategory = params.category ?? "all";
  const activeSource = params.source ?? "all";
  const activeSort = params.sort ?? "evidence";

  let filtered =
    activeCategory === "all" ? verified : verified.filter((t) => t.category === activeCategory);

  if (activeSource !== "all") {
    filtered = filtered.filter((t) => t.source === activeSource);
  }

  const sorted = [...filtered].sort((a, b) => {
    if (activeSort === "rating") return b.rating - a.rating || getEvidenceScore(b) - getEvidenceScore(a);
    if (activeSort === "new") return String(b.lastUpdated).localeCompare(String(a.lastUpdated));
    if (activeSort === "pricing") return Number(a.pricingValue ?? 0) - Number(b.pricingValue ?? 0);
    if (activeSort === "sources") return getSourceCount(b) - getSourceCount(a) || getEvidenceScore(b) - getEvidenceScore(a);
    return getEvidenceScore(b) - getEvidenceScore(a) || b.rating - a.rating;
  });

  const categoryMap = new Map<string, { label: string; count: number }>();
  for (const t of verified) {
    if (!categoryMap.has(t.category)) {
      categoryMap.set(t.category, { label: t.categoryLabel, count: 0 });
    }
    categoryMap.get(t.category)!.count += 1;
  }

  const categories = Array.from(categoryMap.entries()).map(([cat, v]) => ({
    category: cat,
    label: v.label,
    count: v.count,
  }));

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Best AI Tools 2026",
    description: "Comprehensive list of AI tools reviewed and rated by ComparAITools",
    numberOfItems: verified.length,
    itemListElement: sorted.map((tool, i) => ({
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

      <nav
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: "rgba(10,10,15,0.9)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-[1280px] mx-auto px-5 sm:px-7 py-3.5 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))", color: "var(--bg)" }}
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

          <div className="flex-1 hidden md:block">
            <SearchBar />
          </div>

          <div className="hidden md:flex gap-6 items-center shrink-0">
            <Link href="/tools" className="text-[var(--accent)] text-[13px] font-medium">
              Tools
            </Link>
            <Link
              href="/compare"
              className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors"
            >
              Compare
            </Link>
            <Link
              href="/blog"
              className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors"
            >
              Blog
            </Link>
          </div>
        </div>

        <div className="md:hidden px-5 pb-3">
          <SearchBar />
        </div>
      </nav>

      <main className="max-w-[1280px] mx-auto px-5 sm:px-7 py-14 md:py-16 relative z-10">
        <section className="mb-12 md:mb-14">
          <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-5">
            <Link href="/" className="hover:text-[var(--accent)]">
              Home
            </Link>
            <span>/</span>
            <span className="text-[var(--text-muted)]">All Tools</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text)] mb-4" style={{ fontFamily: "var(--font-mono)" }}>
            All AI Tools <span className="text-[var(--accent)]">2026</span>
          </h1>

          <p className="text-[var(--text-muted)] text-[15px] max-w-3xl leading-7">
            {verified.length} verified tools reviewed, compared, and ranked by research strength, pricing clarity, and commercial relevance.
          </p>
        </section>

        <section
          className="rounded-[28px] px-5 py-5 md:px-6 md:py-6 mb-10 md:mb-12"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr_1fr] xl:items-start">
            <div>
              <FilterLabel>Categories</FilterLabel>
              <div className="flex flex-wrap gap-2.5">
                <FilterPill href={buildToolsUrl("all", activeSource, activeSort)} isActive={activeCategory === "all"}>
                  All ({verified.length})
                </FilterPill>

                {categories.map((cat) => (
                  <FilterPill
                    key={cat.category}
                    href={buildToolsUrl(cat.category, activeSource, activeSort)}
                    isActive={activeCategory === cat.category}
                  >
                    {cat.label} ({cat.count})
                  </FilterPill>
                ))}
              </div>
            </div>

            <div>
              <FilterLabel>Source</FilterLabel>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { key: "all", label: "All sources" },
                  { key: "static", label: "Static" },
                  { key: "discovered", label: "Discovered" },
                ].map((item) => (
                  <FilterPill
                    key={item.key}
                    href={buildToolsUrl(activeCategory, item.key, activeSort)}
                    isActive={activeSource === item.key}
                  >
                    {item.label}
                  </FilterPill>
                ))}
              </div>
            </div>

            <div>
              <FilterLabel>Sort</FilterLabel>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { key: "evidence", label: "Top evidence" },
                  { key: "rating", label: "Top rated" },
                  { key: "sources", label: "Most sources" },
                  { key: "new", label: "Newest" },
                ].map((item) => (
                  <FilterPill
                    key={item.key}
                    href={buildToolsUrl(activeCategory, activeSource, item.key)}
                    isActive={activeSort === item.key}
                  >
                    {item.label}
                  </FilterPill>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <h2 className="text-[var(--text)] text-xl md:text-2xl font-bold">Showing {sorted.length} tools</h2>
            <p className="text-[12px] md:text-[13px] text-[var(--text-dim)]">
              Cleaner cards, less text noise, and a faster scan through the catalog.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
            {sorted.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        <section className="mt-14 md:mt-16 rounded-[28px] px-6 py-8 md:px-8 md:py-10 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text)] mb-3">Can&apos;t decide between two tools?</h2>
          <p className="text-[var(--text-muted)] text-sm md:text-base leading-7 max-w-[720px] mx-auto mb-6">
            Use the compare hub to move from a long list of tools into cleaner head-to-head decisions.
          </p>
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))", color: "var(--bg)" }}
          >
            Compare Tools Head-to-Head →
          </Link>
        </section>
      </main>
    </>
  );
}
