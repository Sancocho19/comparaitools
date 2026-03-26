import tools from "@/data/tools.json";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const pairs: { pair: string }[] = [];
  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      if (tools[i].category === tools[j].category) {
        pairs.push({ pair: `${tools[i].slug}-vs-${tools[j].slug}` });
      }
    }
  }
  return pairs;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const [slugA, slugB] = pair.split("-vs-");
  const toolA = tools.find((t) => t.slug === slugA);
  const toolB = tools.find((t) => t.slug === slugB);
  if (!toolA || !toolB) return { title: "Comparison Not Found" };

  return {
    title: `${toolA.name} vs ${toolB.name} (2026) - Which is Better?`,
    description: `Detailed comparison of ${toolA.name} vs ${toolB.name}. Compare pricing, features, ratings & more. ${toolA.name}: ${toolA.rating}/5, ${toolA.pricing}. ${toolB.name}: ${toolB.rating}/5, ${toolB.pricing}.`,
    openGraph: {
      title: `${toolA.name} vs ${toolB.name} - Side by Side Comparison 2026`,
      description: `Is ${toolA.name} or ${toolB.name} better? Complete comparison with pricing, features, pros & cons.`,
      type: "article",
    },
    alternates: {
      canonical: `https://comparaitools.com/compare/${pair}`,
    },
  };
}

function CompRow({
  label,
  valA,
  valB,
  highlight,
}: {
  label: string;
  valA: React.ReactNode;
  valB: React.ReactNode;
  highlight?: "a" | "b" | null;
}) {
  return (
    <div
      className="grid grid-cols-[160px_1fr_1fr] text-sm"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div
        className="p-3 text-[var(--text-muted)] font-semibold text-xs"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </div>
      <div
        className="p-3 text-center"
        style={{
          color: highlight === "a" ? "var(--accent)" : "var(--text)",
          fontWeight: highlight === "a" ? 700 : 400,
        }}
      >
        {valA}
      </div>
      <div
        className="p-3 text-center"
        style={{
          color: highlight === "b" ? "var(--accent)" : "var(--text)",
          fontWeight: highlight === "b" ? 700 : 400,
        }}
      >
        {valB}
      </div>
    </div>
  );
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const [slugA, slugB] = pair.split("-vs-");
  const toolA = tools.find((t) => t.slug === slugA);
  const toolB = tools.find((t) => t.slug === slugB);
  if (!toolA || !toolB) notFound();

  const winner =
    toolA.rating > toolB.rating ? toolA : toolB.rating > toolA.rating ? toolB : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: `${toolA.name} vs ${toolB.name} - Comparison 2026`,
            description: `Detailed comparison between ${toolA.name} and ${toolB.name}`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: [
                { "@type": "SoftwareApplication", name: toolA.name, position: 1 },
                { "@type": "SoftwareApplication", name: toolB.name, position: 2 },
              ],
            },
          }),
        }}
      />

      <div className="grain-overlay" />

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
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <span className="text-[var(--accent)]">Compar</span>
              <span className="text-[var(--text)]">AITools</span>
            </span>
          </Link>
        </div>
      </nav>

      <main className="max-w-[900px] mx-auto px-6 py-10 relative z-10">
        <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-6">
          <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">
            {toolA.name} vs {toolB.name}
          </span>
        </div>

        <div className="text-center mb-10">
          <h1
            className="text-3xl md:text-4xl font-extrabold text-[var(--text)] mb-3"
          >
            {toolA.logo} {toolA.name} vs {toolB.name} {toolB.logo}
          </h1>
          <p className="text-[var(--text-muted)] text-sm max-w-[500px] mx-auto">
            Complete side-by-side comparison updated for 2026. Which {toolA.categoryLabel.toLowerCase()} is right for you?
          </p>
        </div>

        {/* Quick Verdict */}
        {winner && (
          <div
            className="rounded-2xl p-5 mb-8 text-center"
            style={{
              background: "rgba(0,229,160,0.05)",
              border: "1px solid rgba(0,229,160,0.15)",
            }}
          >
            <span className="text-sm text-[var(--accent)] font-bold">
              🏆 Quick Verdict: {winner.name} edges ahead with a {winner.rating}/5 rating
              {winner.trend.startsWith("+") && ` and ${winner.trend} growth trend`}
            </span>
          </div>
        )}

        {/* Comparison Table */}
        <div
          className="rounded-2xl overflow-hidden mb-8"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="grid grid-cols-[160px_1fr_1fr] text-sm"
            style={{
              background: "var(--bg)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div className="p-4 font-bold text-[var(--text-dim)] text-xs uppercase tracking-wider" style={{ fontFamily: "var(--font-mono)" }}>
              Criteria
            </div>
            <div className="p-4 text-center">
              <span className="text-2xl block">{toolA.logo}</span>
              <div className="font-bold text-[var(--text)] mt-1">{toolA.name}</div>
            </div>
            <div className="p-4 text-center">
              <span className="text-2xl block">{toolB.logo}</span>
              <div className="font-bold text-[var(--text)] mt-1">{toolB.name}</div>
            </div>
          </div>

          <CompRow
            label="Rating"
            valA={`${"★".repeat(Math.floor(toolA.rating))} ${toolA.rating}`}
            valB={`${"★".repeat(Math.floor(toolB.rating))} ${toolB.rating}`}
            highlight={toolA.rating > toolB.rating ? "a" : toolB.rating > toolA.rating ? "b" : null}
          />
          <CompRow label="Pricing" valA={toolA.pricing} valB={toolB.pricing} />
          <CompRow label="Users" valA={toolA.users} valB={toolB.users} />
          <CompRow label="Company" valA={toolA.company} valB={toolB.company} />
          <CompRow
            label="Growth"
            valA={toolA.trend}
            valB={toolB.trend}
            highlight={
              parseInt(toolA.trend) > parseInt(toolB.trend) ? "a" : parseInt(toolB.trend) > parseInt(toolA.trend) ? "b" : null
            }
          />
          <CompRow label="Top Feature" valA={toolA.features[0]} valB={toolB.features[0]} />
          <CompRow label="Best For" valA={toolA.bestFor} valB={toolB.bestFor} />
        </div>

        {/* Features Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[toolA, toolB].map((tool) => (
            <div
              key={tool.id}
              className="rounded-2xl p-6"
              style={{
                background: "var(--bg-card)",
                border: `1px solid ${tool === winner ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              <h3 className="text-lg font-bold text-[var(--text)] mb-3">
                {tool.logo} {tool.name} Features
              </h3>
              <div className="space-y-2">
                {tool.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <span className="text-[var(--accent)]">→</span> {f}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <h4 className="text-xs font-bold text-[var(--accent)] mb-2">Pros</h4>
                {tool.pros.slice(0, 2).map((p, i) => (
                  <p key={i} className="text-[var(--text-muted)] text-xs mb-1">✓ {p}</p>
                ))}
                <h4 className="text-xs font-bold text-[var(--red)] mt-3 mb-2">Cons</h4>
                {tool.cons.slice(0, 2).map((c, i) => (
                  <p key={i} className="text-[var(--text-muted)] text-xs mb-1">✗ {c}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Individual Tool Links */}
        <div className="flex gap-4 justify-center flex-wrap">
          {[toolA, toolB].map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            >
              Read Full {tool.name} Review →
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
