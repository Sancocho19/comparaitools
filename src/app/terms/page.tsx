import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for ComparAITools.com - Rules and guidelines for using our website.",
  alternates: { canonical: "https://comparaitools.com/terms" },
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-extrabold text-[var(--text)] mb-2">Terms of Service</h1>
          <p className="text-[var(--text-muted)] text-sm">Last updated: March 26, 2026</p>
        </div>

        <div className="content-card">
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">1. Acceptance of Terms</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            By accessing and using ComparAITools.com ("the Website"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">2. Description of Service</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            ComparAITools.com is a free online resource that provides AI tool comparisons, reviews, ratings, and related information. Our content is for informational purposes only and should not be considered as professional advice.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">3. Accuracy of Information</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            While we strive to provide accurate and up-to-date information about AI tools, pricing, features, and ratings, we cannot guarantee the completeness or accuracy of all content. Tool pricing and features may change without notice. We recommend visiting the official websites of each tool for the most current information.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">4. Affiliate Disclosure</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            ComparAITools.com participates in various affiliate programs. Some links on our website are affiliate links, meaning we may earn a commission if you make a purchase through these links. This does not affect our editorial independence or the price you pay. We only recommend tools we believe provide genuine value.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">5. Intellectual Property</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            All content on this website, including text, graphics, logos, and software, is the property of ComparAITools.com and is protected by copyright laws. You may not reproduce, distribute, or create derivative works without our written permission.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">6. User Conduct</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            You agree not to use the website for any unlawful purpose, attempt to gain unauthorized access to our systems, interfere with the proper functioning of the website, or collect personal information about other users.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">7. Third-Party Links</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            Our website contains links to third-party websites. We are not responsible for the content, privacy policies, or practices of these external sites. We encourage you to review the terms and privacy policies of any third-party websites you visit.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">8. Disclaimer of Warranties</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            The website is provided "as is" without warranties of any kind, either express or implied. We do not warrant that the website will be uninterrupted, error-free, or free of viruses or other harmful components.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">9. Limitation of Liability</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            In no event shall ComparAITools.com be liable for any indirect, incidental, special, or consequential damages arising from your use of the website or any tools reviewed on our platform.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">10. Changes to Terms</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website constitutes acceptance of the modified terms.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">11. Contact</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed">
            If you have any questions about these Terms of Service, please contact us at: contact@comparaitools.com
          </p>
        </div>
      </main>
    </>
  );
}
