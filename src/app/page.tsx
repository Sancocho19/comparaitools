import tools from "@/data/tools.json";
import Link from "next/link";

const categories = [...new Set(tools.map((t) => t.category))];
const categoryLabels: Record<string, string> = {};
tools.forEach((t) => {
  categoryLabels[t.category] = t.categoryLabel;
});

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-[var(--orange)] text-sm tracking-wider">
      {"★".repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? "½" : ""}
      <span className="text-[var(--text-dim)] ml-1.5 text-xs">{rating}</span>
    </span>
  );
}

function TrendBadge({ trend }: { trend: string }) {
  const isUp = trend.startsWith("+");
  return (
    <span
      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
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

function ToolCard({ tool, index }: { tool: (typeof tools)[0]; index: number }) {
  return (
    <Link href={`/tools/${tool.slug}`}>
      <div
        className="tool-card rounded-2xl p-6 cursor-pointer relative overflow-hidden group"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          animationDelay: `${index * 0.05}s`,
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: `linear-gradient(90deg, ${tool.color}, transparent)`,
          }}
        />
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{tool.logo}</span>
            <div>
              <h3
                className="text-[var(--text)] text-[17px] font-bold"
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

        <p className="text-[var(--text-muted)] text-[13px] leading-relaxed mb-3.5">
          {tool.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {tool.features.slice(0, 3).map((f, i) => (
            <span
              key={i}
              className="text-[11px] px-2.5 py-0.5 rounded-full"
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

        <div
          className="flex justify-between items-center pt-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <Stars rating={tool.rating} />
          <span
            className="text-[13px] text-[var(--accent)] font-semibold"
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
    <section className="mt-16">
      <div className="text-center mb-8">
        <span
          className="text-[11px] tracking-[3px] text-[var(--accent)] font-bold uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Head-to-Head
        </span>
        <h2 className="text-[var(--text)] text-3xl font-extrabold mt-2">
          Popular Comparisons
        </h2>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {comparisons.slice(0, 12).map((c, i) => (
          <Link
            key={i}
            href={`/compare/${c.a.slug}-vs-${c.b.slug}`}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-all hover:scale-105"
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
    <section className="mt-16">
      <div className="text-center mb-8">
        <span
          className="text-[11px] tracking-[3px] text-[var(--purple)] font-bold uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Browse by Category
        </span>
        <h2 className="text-[var(--text)] text-3xl font-extrabold mt-2">
          Find the Right Tool
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const catTools = tools.filter((t) => t.category === cat);
          return (
            <Link
              key={cat}
              href={`/category/${cat}`}
              className="rounded-xl p-5 text-center transition-all hover:scale-[1.02] group"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <span className="text-3xl block mb-2">{catTools[0].logo}</span>
              <h3 className="text-[var(--text)] font-bold text-sm">
                {categoryLabels[cat]}
              </h3>
              <span className="text-[var(--text-dim)] text-xs">
                {catTools.length} tools
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function AdSlot({ size = "banner" }: { size?: "banner" | "native" }) {
  const h = size === "banner" ? "h-[90px]" : "h-[120px]";
  return (
    <div
      className={`w-full max-w-[728px] mx-auto my-6 ${h} rounded-lg flex items-center justify-center`}
      style={{
        border: "1px dashed var(--border)",
        background:
          "linear-gradient(135deg, var(--bg-card), var(--bg))",
        color: "var(--text-dim)",
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
      }}
    >
      <div className="text-center">
        <div className="text-[10px] opacity-50 mb-1">AD PLACEMENT</div>
        <div>{size === "banner" ? "728×90 Leaderboard" : "Native Ad Unit"}</div>
        <div className="text-[9px] mt-0.5 opacity-40">
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
      {/* Navbar */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-xl transition-all"
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
            {["Tools", "Compare", "Blog"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 relative z-10">
        {/* Hero */}
        <header className="text-center py-16 relative">
          <div className="hero-glow" />
          <div className="relative">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "var(--accent)",
                  animation: "pulse 2s infinite",
                }}
              />
              <span
                className="text-xs text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {tools.length} tools tracked · Updated daily
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4 gradient-text">
              Compare Every AI Tool.
              <br />
              Decide in Seconds.
            </h1>

            <p className="text-[var(--text-muted)] text-base max-w-[550px] mx-auto mb-7 leading-relaxed">
              Real-time comparisons, reviews, and data-driven insights for{" "}
              {tools.length}+ AI tools. Find the perfect tool for your needs.
            </p>

            <Link
              href="/tools"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
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

        {/* Tools Grid */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-[var(--text)] text-3xl font-extrabold">
              Top AI Tools
            </h2>
            <p className="text-[var(--text-muted)] text-sm mt-2">
              Ranked by user ratings, features, and market growth
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool, i) => (
              <ToolCard key={tool.id} tool={tool} index={i} />
            ))}
          </div>
        </section>

        <AdSlot size="native" />
        <ComparisonPreview />
        <CategorySection />
        <AdSlot size="banner" />

        {/* Footer */}
        <footer
          className="mt-20 pb-10 pt-10"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex justify-between flex-wrap gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--accent), var(--purple))",
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
            <div className="flex gap-12 flex-wrap">
              {[
                {
                  title: "Tools",
                  links: ["All Tools", "Chatbots", "Image Gen", "Code"],
                },
                {
                  title: "Resources",
                  links: ["Blog", "Newsletter", "About"],
                },
                {
                  title: "Legal",
                  links: ["Privacy", "Terms", "Contact"],
                },
              ].map((section) => (
                <div key={section.title}>
                  <h4
                    className="text-[var(--text-muted)] text-[11px] font-bold tracking-wider uppercase mb-3"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {section.title}
                  </h4>
                  {section.links.map((link) => (
                    <a
                      key={link}
                      href="#"
                      className="block text-[var(--text-dim)] text-[13px] mb-2 hover:text-[var(--accent)] transition-colors"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div
            className="mt-10 pt-5 flex justify-between items-center flex-wrap gap-3"
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
