import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for ComparAITools.com - How we collect, use, and protect your data.",
  alternates: { canonical: "https://comparaitools.com/privacy" },
};

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-extrabold text-[var(--text)] mb-2">Privacy Policy</h1>
          <p className="text-[var(--text-muted)] text-sm">Last updated: March 26, 2026</p>
        </div>

        <div className="content-card">
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">1. Introduction</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            Welcome to ComparAITools.com ("we," "our," or "us"). We are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website comparaitools.com.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">2. Information We Collect</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-2">We may collect information about you in a variety of ways:</p>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-1"><strong className="text-[var(--text)]">Personal Data:</strong> When you subscribe to our newsletter, we collect your email address.</p>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-1"><strong className="text-[var(--text)]">Usage Data:</strong> We automatically collect certain information when you visit our website, including your IP address, browser type, operating system, referring URLs, and pages visited.</p>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4"><strong className="text-[var(--text)]">Cookies:</strong> We use cookies and similar tracking technologies to track activity on our website and hold certain information.</p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">3. How We Use Your Information</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            We use the information we collect to operate, maintain, and improve our website; to send you newsletters and updates (if you have subscribed); to monitor and analyze usage and trends; and to display advertisements through third-party advertising partners.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">4. Third-Party Advertising</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            We use Google AdSense and other third-party advertising companies to serve ads when you visit our website. These companies may use cookies and similar technologies to collect information about your visits to this and other websites in order to provide relevant advertisements. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site and/or other sites on the Internet. You may opt out of personalized advertising by visiting Google's Ads Settings at https://www.google.com/settings/ads.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">5. Google AdSense & Cookies</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the Internet. You may opt out of the use of the DART cookie by visiting the Google Ad and Content Network Privacy Policy.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">6. Affiliate Links</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            Some of the links on our website are affiliate links. This means that if you click on the link and purchase an item, we may receive an affiliate commission at no extra cost to you. All opinions remain our own and we only recommend products we genuinely believe in.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">7. Data Security</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            We use administrative, technical, and physical security measures to protect your personal information. While we have taken reasonable steps to secure the information you provide to us, no method of transmission over the Internet is 100% secure.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">8. Your Rights</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            Depending on your location, you may have certain rights regarding your personal information, including the right to access, correct, or delete your data. To exercise these rights, please contact us using the information provided below.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">9. Children's Privacy</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            Our website is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">10. Changes to This Policy</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>

          <h2 className="text-lg font-bold text-[var(--text)] mb-3">11. Contact Us</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at: contact@comparaitools.com
          </p>
        </div>
      </main>
    </>
  );
}
