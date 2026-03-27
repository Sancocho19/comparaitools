import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "About ComparAITools.com - The definitive AI tools comparison platform. Learn about our mission and team.",
  alternates: { canonical: "https://comparaitools.com/about" },
};

export default function AboutPage() {
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

      <main>
        <div className="page-header">
          <h1 className="text-3xl font-extrabold text-[var(--text)] mb-2">About ComparAITools</h1>
          <p className="text-[var(--text-muted)] text-sm">The definitive AI tools comparison platform</p>
        </div>

        <div className="content-card">
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">Our Mission</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            ComparAITools.com was created to help professionals, creators, and businesses navigate the rapidly evolving landscape of AI tools. With hundreds of AI products launching every month, finding the right tool for your specific needs can be overwhelming. We simplify this process by providing clear, data-driven comparisons.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">What We Do</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            We track and analyze 12+ leading AI tools across categories including chatbots, image generation, code assistants, video generation, audio and voice, and marketing tools. Each tool is evaluated based on features, pricing, user ratings, and real-world performance. Our comparison pages provide side-by-side analysis to help you make informed decisions.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">Our Approach</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            We believe in transparency and objectivity. Our reviews are based on publicly available data, official pricing, and verified user feedback. We regularly update our database to reflect the latest changes in pricing, features, and tool capabilities. Our content is updated daily to ensure you always have access to current information.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">Editorial Independence</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            While we may earn affiliate commissions from some links on our site, this never influences our reviews or rankings. Our editorial process is independent, and we recommend tools based solely on their merit and suitability for different use cases.
          </p>
        </div>

        <div className="content-card">
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">Contact Us</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            We love hearing from our readers. Whether you have a question, suggestion, or want to submit a tool for review, feel free to reach out.
          </p>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-2">
            <strong className="text-[var(--text)]">Email:</strong> contact@comparaitools.com
          </p>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-2">
            <strong className="text-[var(--text)]">Website:</strong> comparaitools.com
          </p>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed">
            <strong className="text-[var(--text)]">Response Time:</strong> We typically respond within 24-48 hours.
          </p>
        </div>
      </main>
    </>
  );
}
