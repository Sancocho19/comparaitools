import tools from "@/data/tools.json";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const categories = [...new Set(tools.map((t) => t.category))];

export async function generateStaticParams() {
  return categories.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const catTools = tools.filter((t) => t.category === category);
  if (catTools.length === 0) return { title: "Category Not Found" };
  const label = catTools[0].categoryLabel;

  return {
    title: `Best ${label} Tools 2026 - Top ${catTools.length} Compared`,
    description: `Compare the best ${label.toLowerCase()} AI tools in 2026. Side-by-side comparison of ${catTools.map((t) => t.name).join(", ")} with pricing, features & ratings.`,
    alternates: {
      canonical: `https://comparaitools.com/category/${category}`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const catTools = tools.filter((t) => t.category === category);
  if (catTools.length === 0) notFound();
  const label = catTools[0].categoryLabel;

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

      <main className="max-w-[1000px] mx-auto px-6 py-10 relative z-10">
        <div className="text-center mb-10">
          <span className="text-4xl block mb-3">{catTools[0].logo}</span>
          <h1 className="text-3xl font-extrabold text-[var(--text)] mb-2">
            Best {label} Tools 2026
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            {catTools.length} tools compared side-by-side with real data
          </p>
        </div>

        <div className="grid gap-4">
          {catTools
            .sort((a, b) => b.rating - a.rating)
            .map((tool, i) => (
              <Link key={tool.id} href={`/tools/${tool.slug}`}>
                <div
                  className="rounded-2xl p-6 flex items-center gap-5 transition-all hover:scale-[1.01]"
                  style={{
                    background: "var(--bg-card)",
                    border: `1px solid ${i === 0 ? "var(--accent)" : "var(--border)"}`,
                  }}
                >
                  <span className="text-2xl font-bold text-[var(--text-dim)] w-8 text-center" style={{ fontFamily: "var(--font-mono)" }}>
                    #{i + 1}
                  </span>
                  <span className="text-3xl">{tool.logo}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-[var(--text)]">{tool.name}</h2>
                      {i === 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "var(--accent)", color: "var(--bg)" }}>
                          TOP PICK
                        </span>
                      )}
                    </div>
                    <p className="text-[var(--text-muted)] text-xs mt-1">{tool.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[var(--orange)]">{"★".repeat(Math.floor(tool.rating))} <span className="text-[var(--text-muted)] text-xs">{tool.rating}</span></div>
                    <div className="text-[var(--accent)] text-sm font-semibold mt-1" style={{ fontFamily: "var(--font-mono)" }}>{tool.pricing}</div>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </main>
    </>
  );
}
