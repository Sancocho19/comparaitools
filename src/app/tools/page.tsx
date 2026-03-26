import tools from "@/data/tools.json";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All AI Tools - Compare 12+ AI Tools Side by Side",
  description: "Browse and compare all AI tools in our database. Filter by category, rating, and pricing. Updated daily with the latest data.",
  alternates: { canonical: "https://comparaitools.com/tools" },
};

export default function ToolsPage() {
  const categories = [...new Set(tools.map((t) => t.category))];

  return (
    <>
      <div className="grain-overlay" />
      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: "rgba(10,10,15,0.9)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black" style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))", color: "var(--bg)" }}>C</div>
            <span className="font-extrabold text-lg" style={{ fontFamily: "var(--font-mono)" }}>
              <span className="text-[var(--accent)]">Compar</span><span className="text-[var(--text)]">AITools</span>
            </span>
          </Link>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 py-10 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-[var(--text)] mb-2">All AI Tools</h1>
          <p className="text-[var(--text-muted)] text-sm">{tools.length} tools across {categories.length} categories</p>
        </div>

        {categories.map((cat) => {
          const catTools = tools.filter((t) => t.category === cat).sort((a, b) => b.rating - a.rating);
          return (
            <section key={cat} className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[var(--text)]">
                  {catTools[0].logo} {catTools[0].categoryLabel}
                </h2>
                <Link href={`/category/${cat}`} className="text-xs text-[var(--accent)] hover:underline">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catTools.map((tool) => (
                  <Link key={tool.id} href={`/tools/${tool.slug}`}>
                    <div className="rounded-xl p-5 transition-all hover:scale-[1.02]" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{tool.logo}</span>
                        <div>
                          <h3 className="text-[var(--text)] font-bold text-sm">{tool.name}</h3>
                          <span className="text-[var(--text-dim)] text-xs">{tool.company}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-[var(--orange)] text-xs">{"★".repeat(Math.floor(tool.rating))} {tool.rating}</span>
                        <span className="text-[var(--accent)] text-xs font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{tool.pricing}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
