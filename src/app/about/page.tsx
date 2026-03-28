// src/app/about/page.tsx

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About ComparAITools — Our Mission, Team & Methodology",
  description: "ComparAITools is an independent AI tool comparison platform founded by Alex Morgan. We test, review, and compare AI tools with real data so you can make faster, smarter decisions.",
  alternates: { canonical: "https://comparaitools.com/about" },
  openGraph: {
    title: "About ComparAITools | Independent AI Tool Reviews",
    description: "Meet the team behind ComparAITools. We test every AI tool so you don't have to.",
    type: "website",
  },
};

export default function AboutPage() {
  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About ComparAITools",
    url: "https://comparaitools.com/about",
    publisher: {
      "@type": "Organization",
      name: "ComparAITools",
      url: "https://comparaitools.com",
      foundingDate: "2026",
      founder: {
        "@type": "Person",
        name: "Alex Morgan",
        jobTitle: "Founder & Lead AI Tools Analyst",
        sameAs: [
          "https://twitter.com/alexmorgan_ai",
          "https://linkedin.com/in/alexmorganai",
        ],
      },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      <div className="grain-overlay" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: "rgba(10,10,15,0.9)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))", color: "var(--bg)" }}>C</div>
            <span className="font-extrabold text-lg" style={{ fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>
              <span className="text-[var(--accent)]">Compar</span><span className="text-[var(--text)]">AITools</span>
            </span>
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link href="/tools" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Tools</Link>
            <Link href="/compare" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Compare</Link>
            <Link href="/blog" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Blog</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[800px] mx-auto px-6 md:px-8 py-16 relative z-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-10">
          <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">About</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text)] mb-4" style={{ fontFamily: "var(--font-mono)" }}>
            About <span className="text-[var(--accent)]">ComparAITools</span>
          </h1>
          <p className="text-[var(--text-muted)] text-[16px] leading-relaxed">
            We're an independent AI tool research platform. No sponsors, no affiliate bias in our rankings — just honest, data-driven comparisons to help you make smarter decisions faster.
          </p>
        </div>

        {/* Mission */}
        <div className="rounded-2xl p-7 mb-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-xl font-bold text-[var(--text)] mb-4">Our Mission</h2>
          <p className="text-[var(--text-muted)] text-[15px] leading-relaxed mb-4">
            The AI tools landscape changes every week. New tools launch, pricing changes, and yesterday's recommendation becomes outdated. Most comparison sites are months behind — or worse, they rank tools based on affiliate commissions, not actual performance.
          </p>
          <p className="text-[var(--text-muted)] text-[15px] leading-relaxed">
            ComparAITools was built to fix that. We track every major AI tool in real time, publish independent reviews, and update our data daily so you always get an accurate picture before committing to a subscription.
          </p>
        </div>

        {/* Founder */}
        <div className="rounded-2xl p-7 mb-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-xl font-bold text-[var(--text)] mb-6">Meet the Founder</h2>
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shrink-0 font-black"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))", color: "var(--bg)" }}>
              AM
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h3 className="text-[var(--text)] font-bold text-lg">Alex Morgan</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(0,229,160,0.1)", color: "var(--accent)", border: "1px solid rgba(0,229,160,0.2)" }}>
                  Founder & Lead Analyst
                </span>
              </div>
              <p className="text-[var(--text-dim)] text-xs mb-3">AI Tools Researcher · 5+ years in SaaS & Productivity Tech</p>
              <p className="text-[var(--text-muted)] text-[14px] leading-relaxed mb-4">
                I've spent years testing productivity software and AI tools for my own work and for teams I've consulted with. After getting burned one too many times by outdated "best of" lists and sponsored rankings, I built ComparAITools to be the resource I always wished existed — one that's honest, current, and actually useful.
              </p>
              <p className="text-[var(--text-muted)] text-[14px] leading-relaxed mb-5">
                Every tool we review gets hands-on testing across real use cases. I personally test each tool before writing a single word. Our ratings reflect actual performance, not marketing copy or affiliate incentives.
              </p>
              {/* Social links */}
              <div className="flex gap-3">
                <a href="https://twitter.com/alexmorgan_ai" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                  𝕏 @alexmorgan_ai
                </a>
                <a href="https://linkedin.com/in/alexmorganai" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                  in LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Methodology */}
        <div className="rounded-2xl p-7 mb-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-xl font-bold text-[var(--text)] mb-6">How We Review AI Tools</h2>
          <div className="space-y-5">
            {[
              { step: "01", title: "Hands-on Testing", desc: "Every tool is tested across real-world use cases relevant to its category. We don't review based on marketing materials — we use the tool the way you would." },
              { step: "02", title: "Pricing Verification", desc: "We verify pricing directly from the tool's official page at time of review. We note whether free tiers have meaningful limitations and when paid plans are genuinely worth it." },
              { step: "03", title: "Competitor Comparison", desc: "We test tools head-to-head against their direct competitors across identical tasks to give you a fair, side-by-side view of real performance differences." },
              { step: "04", title: "Regular Updates", desc: "AI tools change fast. We update reviews when pricing changes, major features launch, or our testing reveals something has shifted significantly. Every article shows a last-updated date." },
              { step: "05", title: "Independent Ratings", desc: "Our 1-5 star ratings are based on our testing criteria: performance, value for money, ease of use, features, and reliability. We never adjust ratings based on affiliate relationships." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <span className="text-[var(--accent)] font-black text-sm shrink-0 w-8 mt-0.5"
                  style={{ fontFamily: "var(--font-mono)" }}>{step}</span>
                <div>
                  <h3 className="text-[var(--text)] font-bold text-[14px] mb-1">{title}</h3>
                  <p className="text-[var(--text-muted)] text-[13px] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editorial policy */}
        <div className="rounded-2xl p-7 mb-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-xl font-bold text-[var(--text)] mb-4">Editorial Independence</h2>
          <p className="text-[var(--text-muted)] text-[14px] leading-relaxed mb-3">
            ComparAITools may earn affiliate commissions when you click links to tools and make a purchase. This never affects our ratings or editorial rankings. Tools are ranked by our testing criteria, not by affiliate payout rates.
          </p>
          <p className="text-[var(--text-muted)] text-[14px] leading-relaxed">
            We disclose affiliate relationships clearly on relevant pages. If a tool doesn't have an affiliate program, we still review it with the same rigor as tools that do.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { value: "16+", label: "AI Tools Tracked" },
            { value: "100+", label: "Pages Published" },
            { value: "Daily", label: "Content Updates" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center p-5 rounded-2xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="text-2xl font-extrabold text-[var(--accent)] mb-1"
                style={{ fontFamily: "var(--font-mono)" }}>{value}</div>
              <div className="text-[11px] text-[var(--text-dim)]">{label}</div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="rounded-2xl p-7 text-center" style={{ background: "linear-gradient(135deg, rgba(0,229,160,0.05), rgba(139,92,246,0.05))", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-bold text-[var(--text)] mb-2">Get in Touch</h2>
          <p className="text-[var(--text-muted)] text-[14px] mb-5">
            Have a tool you'd like us to review? Found an error in one of our comparisons? We want to hear from you.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="mailto:hello@comparaitools.com"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: "var(--accent)", color: "var(--bg)" }}>
              hello@comparaitools.com
            </a>
            <a href="https://twitter.com/alexmorgan_ai" target="_blank" rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              DM on 𝕏
            </a>
          </div>
        </div>

      </main>
    </>
  );
}
