import tools from "@/data/tools.json";
import Link from "next/link";

const categories = [...new Set(tools.map((t) => t.category))];
const categoryLabels: Record<string, string> = {};
tools.forEach((t) => {
  categoryLabels[t.category] = t.categoryLabel;
});

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-[var(--orange)] text-sm tracking-wider whitespace-nowrap">
      {"★".repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? "½" : ""}
      <span className="text-[var(--text-dim)] ml-1 text-xs">{rating}</span>
    </span>
  );
}

function TrendBadge({ trend }: { trend: string }) {
  const isUp = trend.startsWith("+");
  return (
    <span
      className="text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
      style={{
        background: isUp ? "rgba(0,229,160,0.1)" : "rgba(239,68,68,0.1)",
        color: isUp ? "var(--accent)" : "var(--red)",
        border: `1px solid ${isUp ? "rgba(0,229,160,0.2)" : "rgba(239,68,68,0.2)"}`,
      }}
    >
      {trend}
    </span>
  );
}

function ToolCard({ tool }: { tool: (typeof tools)[0] }) {
  return (
    <Link href={`/tools/${tool.slug}`} className="block">
      <div
        className="tool-card rounded-2xl p-5 sm:p-6 cursor-pointer relative overflow-hidden group h-full"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Top color bar on hover */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: `linear-gradient(90deg, ${tool.color}, transparent)`,
          }}
        />

        {/* Header: logo + name + trend */}
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl sm:text-3xl shrink-0">{tool.logo}</span>
            <div className="min-w-0">
              <h3
                className="text-[var(--text)] text-[15px] sm:text-[17px] font-bold truncate"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {tool.name}
              </h3>
              <span className="text-xs text-[var(--text-muted)]">
                {tool.company}
              </span>
            </div>
          </div>
          <TrendBadge trend={tool.trend} />
        </div>

        {/* Description - 2 lines max */}
        <p className="text-[var(--text-muted)] text-[13px] leading-[1.6] mb-4 line-clamp-2">
          {tool.description}
        </p>

        {/* Feature tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tool.features.slice(0, 3).map((f, i) => (
            <span
              key={i}
              className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full"
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

        {/* Footer: rating + price */}
        <div
          className="flex justify-between items-center pt-3 gap-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <Stars rating={tool.rating} />
          <span
            className="text-[12px] sm:text-[13px] text-[var(--accent)] font-semibold whitespace-nowrap"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {tool.pricing}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ComparisonPreview() {
  const comparisons: { a: (typeof tools)[0]; b: (typeof tools)[0] }[] = [];
  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      if (tools[i].category === tools[j].category) {
        comparisons.push({ a: tools[i], b: tools[j] });
      }
    }
  }

  return (
    <section className="mt-16 sm:mt-20">
      <div className="text-center mb-8">
        <span
          className="text-[11px] tracking-[3px] text-[var(--accent)] font-bold uppercase block"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Head-to-Head
        </span>
        <h2 className="text-[var(--text)] text-2xl sm:text-3xl font-extrabold mt-2">
          Popular Comparisons
        </h2>
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
        {comparisons.slice(0, 8).map((c, i) => (
          <Link
            key={i}
            href={`/compare/${c.a.slug}-vs-${c.b.slug}`}
            className="px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-[13px] font-semibold transition-all hover:scale-105"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {c.a.logo} {c.a.name} vs {c.b.name} {c.b.logo}
          </Link>
        ))}
      </div>
    </section>
  );
}

function CategorySection() {
  return (
    <section className="mt-16 sm:mt-20">
      <div className="text-center mb-8">
        <span
          className="text-[11px] tracking-[3px] text-[var(--purple)] font-bold uppercase block"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Browse by Category
        </span>
        <h2 className="text-[var(--text)] text-2xl sm:text-3xl font-extrabold mt-2">
          Find the Right Tool
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const catTools = tools.filter((t) => t.category === cat);
          return (
            <Link
              key={cat}
              href={`/category/${cat}`}
              className="rounded-xl p-4 sm:p-5 text-center transition-all hover:scale-[1.02]"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <span className="text-2xl sm:text-3xl block mb-2">{catTools[0].logo}</span>
              <h3 className="text-[var(--text)] font-bold text-xs sm:text-sm">
                {categoryLabels[cat]}
              </h3>
              <span className="text-[var(--text-dim)] text-[11px]">
                {catTools.length} {catTools.length === 1 ? "tool" : "tools"}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function AdSlot({ size = "banner" }: { size?: "banner" | "native" }) {
  return (
    <div
      className={`w-full max-w-[728px] mx-auto my-8 sm:my-10 ${size === "banner" ? "h-[70px] sm:h-[90px]" : "h-[90px] sm:h-[120px]"} rounded-lg flex items-center justify-center`}
      style={{
        border: "1px dashed var(--border)",
        background: "linear-gradient(135deg, var(--bg-card), var(--bg))",
        color: "var(--text-dim)",
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
      }}
    >
      <div className="text-center">
        <div className="text-[10px] opacity-50 mb-1">AD PLACEMENT</div>
        <div className="text-[11px]">{size === "banner" ? "728×90 Leaderboard" : "Native Ad Unit"}</div>
        <div className="text-[9px] mt-0.5 opacity-40 hidden sm:block">
          Mediavine · Raptive · AdThrive · Ezoic
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <div className="grain-overlay" />

      {/* ═══ NAVBAR ═══ */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: "rgba(10,10,15,0.92)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="site-container py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm sm:text-base font-black shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--purple))",
                color: "var(--bg)",
              }}
            >
              C
            </div>
            <span
              className="font-extrabold text-base sm:text-lg"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}
            >
              <span className="text-[var(--accent)]">Compar</span>
              <span className="text-[var(--text)]">AITools</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex gap-6 items-center">
            {[
              { label: "Tools", href: "/tools" },
              { label: "Compare", href: "/#comparisons" },
              { label: "Blog", href: "/blog" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile CTA */}
          <Link
            href="/tools"
            className="sm:hidden px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "var(--accent)", color: "var(--bg)" }}
          >
            All Tools
          </Link>
        </div>
      </nav>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="site-container relative z-10">

        {/* ─── HERO ─── */}
        <header className="text-center py-12 sm:py-16 md:py-20 relative">
          <div className="hero-glow" />
          <div className="relative max-w-[700px] mx-auto">
            {/* Status pill */}
            <div
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full mb-5 sm:mb-6"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background: "var(--accent)",
                  animation: "pulse 2s infinite",
                }}
              />
              <span
                className="text-[11px] sm:text-xs text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {tools.length} tools tracked · Updated daily
              </span>
            </div>

            {/* Main heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] mb-5 sm:mb-6 gradient-text">
              Compare Every AI Tool.
              <br />
              Decide in Seconds.
            </h1>

            {/* Subtitle - CENTERED and smaller */}
            <p className="text-[var(--text-muted)] text-sm sm:text-base max-w-[480px] mx-auto mb-7 sm:mb-8 leading-relaxed">
              Real-time comparisons, reviews, and data-driven insights for{" "}
              {tools.length}+ AI tools. Find the perfect tool for your needs.
            </p>

            {/* CTA button */}
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, var(--accent), #00c889)",
                color: "var(--bg)",
              }}
            >
              Explore All Tools →
            </Link>
          </div>
        </header>

        <AdSlot size="banner" />

        {/* ─── TOOLS GRID ─── */}
        <section className="mt-4 sm:mt-8">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-[var(--text)] text-2xl sm:text-3xl font-extrabold">
              Top AI Tools
            </h2>
            <p className="text-[var(--text-muted)] text-xs sm:text-sm mt-2">
              Ranked by user ratings, features, and market growth
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        <AdSlot size="native" />

        {/* ─── COMPARISONS ─── */}
        <div id="comparisons">
          <ComparisonPreview />
        </div>

        {/* ─── CATEGORIES ─── */}
        <CategorySection />

        <AdSlot size="banner" />

        {/* ─── FOOTER ─── */}
        <footer
          className="mt-16 sm:mt-20 pb-8 sm:pb-10 pt-8 sm:pt-10"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex flex-col sm:flex-row justify-between gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black"
                  style={{
                    background: "linear-gradient(135deg, var(--accent), var(--purple))",
                    color: "var(--bg)",
                  }}
                >
                  C
                </div>
                <span
                  className="font-extrabold text-base"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <span className="text-[var(--accent)]">Compar</span>AITools
                </span>
              </div>
              <p className="text-[var(--text-dim)] text-xs max-w-[280px] leading-relaxed">
                The definitive AI tools comparison platform. Updated daily with
                data-driven insights.
              </p>
            </div>

            {/* Links grid */}
            <div className="grid grid-cols-3 gap-8 sm:gap-12">
              {[
                {
                  title: "Tools",
                  links: [
                    { label: "All Tools", href: "/tools" },
                    { label: "Chatbots", href: "/category/chatbot" },
                    { label: "Image Gen", href: "/category/image" },
                    { label: "Code", href: "/category/code" },
                  ],
                },
                {
                  title: "Resources",
                  links: [
                    { label: "Blog", href: "/blog" },
                    { label: "Newsletter", href: "#" },
                    { label: "About", href: "#" },
                  ],
                },
                {
                  title: "Legal",
                  links: [
                    { label: "Privacy", href: "#" },
                    { label: "Terms", href: "#" },
                    { label: "Contact", href: "#" },
                  ],
                },
              ].map((section) => (
                <div key={section.title}>
                  <h4
                    className="text-[var(--text-muted)] text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mb-3"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {section.title}
                  </h4>
                  {section.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="block text-[var(--text-dim)] text-[12px] sm:text-[13px] mb-2 hover:text-[var(--accent)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div
            className="mt-8 sm:mt-10 pt-5 text-center sm:text-left"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span className="text-[11px] text-[var(--text-dim)]">
              © 2026 ComparAITools. All rights reserved.
            </span>
          </div>
        </footer>
      </main>
    </>
  );
}
