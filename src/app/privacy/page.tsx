// src/app/privacy/page.tsx

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | ComparAITools',
  description: 'Privacy Policy for ComparAITools.com — how personal data is collected, used, and protected.',
  alternates: { canonical: 'https://comparaitools.com/privacy' },
};

const LAST_UPDATED = 'March 27, 2026';
const SITE = 'ComparAITools.com';
const EMAIL = 'privacy@comparaitools.com';

export default function PrivacyPage() {
  return (
    <>
      <div className="grain-overlay" />
      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(10,10,15,0.92)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))', color: 'var(--bg)' }}>C</div>
            <span className="font-extrabold text-lg" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>
              <span className="text-[var(--accent)]">Compar</span><span className="text-[var(--text)]">AITools</span>
            </span>
          </Link>
          <div className="hidden md:flex gap-6">
            <Link href="/tools" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Tools</Link>
            <Link href="/compare" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Compare</Link>
            <Link href="/blog" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Blog</Link>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: '8px' }}>
          <Link href="/" style={{ fontSize: '13px', color: 'var(--text-dim)', textDecoration: 'none' }}>Home</Link>
          <span style={{ color: 'var(--text-dim)', margin: '0 8px' }}>/</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Privacy Policy</span>
        </div>

        <h1 style={{ fontSize: '2em', fontWeight: 800, color: 'var(--text)', margin: '24px 0 8px' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '40px' }}>Last updated: {LAST_UPDATED}</p>

        <div className="legal-content">

          <h2>1. Introduction</h2>
          <p>{SITE} ("we," "our," or "us") is committed to protecting personal information and privacy rights. This Privacy Policy explains how information is collected, used, disclosed, and safeguarded in connection with visits to the website.</p>

          <h2>2. Information We Collect</h2>
          <h3>Information Provided Voluntarily</h3>
          <p>Information submitted voluntarily may be collected, such as an email address used for newsletter subscriptions or contact requests.</p>
          <h3>Automatically Collected Information</h3>
          <p>When the website is visited, certain information may be collected automatically, including IP address, browser type, operating system, referring URLs, pages viewed, and time spent on pages. This data is collected through cookies and similar tracking technologies.</p>
          <h3>Analytics Data</h3>
          <p>Google Analytics is used to understand how visitors interact with the website. Analytics data may include approximate location, device type, and on-site browsing behavior.</p>

          <h2>3. How Information Is Used</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Operate and improve our website and services</li>
            <li>Analyze usage patterns and optimize user experience</li>
            <li>Send newsletters and updates when consent has been provided</li>
            <li>Respond to inquiries and support requests</li>
            <li>Comply with legal obligations</li>
            <li>Detect and prevent fraud or abuse</li>
          </ul>

          <h2>4. Cookies Policy</h2>
          <p id="cookies">Cookies and similar tracking technologies are used to support website functionality, analytics, and advertising operations.</p>
          <h3>Types of Cookies We Use</h3>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for the website to function properly. Cannot be disabled.</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our site (Google Analytics).</li>
            <li><strong>Advertising Cookies:</strong> Used by Google AdSense and other advertising partners to serve relevant ads based on browsing signals and related interests.</li>
            <li><strong>Preference Cookies:</strong> Store settings and preferences for future visits.</li>
          </ul>
          <p>Cookie settings can be controlled through browser preferences. Disabling certain cookies may affect website functionality.</p>

          <h2>5. Advertising & Google AdSense</h2>
          <p>Google AdSense is used to display advertisements on the website. Google AdSense may use cookies to serve ads based on prior visits to this website and other websites on the internet. Personalized advertising settings can be managed through <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</p>
          <p>Third-party vendors, including Google, may use cookies to serve ads based on prior visits to this website and other sites on the internet. Google's advertising cookies enable Google and its partners to serve ads based on those visits.</p>

          <h2>6. Affiliate Disclosure</h2>
          <p id="affiliate">{SITE} participates in affiliate marketing programs. A commission may be earned when certain links generate a purchase or service sign-up. This does not create additional cost for the purchaser.</p>
          <p>Our editorial content is independent of our affiliate relationships. We only recommend tools and services we genuinely believe provide value. Affiliate relationships do not influence our reviews, ratings, or comparisons.</p>
          <p>Affiliate relationships we currently maintain may include: Amazon Associates, software affiliate programs, and AI tool company affiliate programs. All sponsored content is clearly marked as such.</p>

          <h2>7. Third-Party Services</h2>
          <p>Our website uses the following third-party services that may collect data:</p>
          <ul>
            <li><strong>Google Analytics:</strong> Website analytics — <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><strong>Google AdSense:</strong> Advertising — <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><strong>Vercel:</strong> Website hosting — <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><strong>Upstash:</strong> Database services — <a href="https://upstash.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
          </ul>

          <h2>8. Data Sharing</h2>
          <p>Personal information is not sold, traded, or rented to third parties. Information may be shared only in the following limited circumstances:</p>
          <ul>
            <li>With service providers who assist in our operations (under strict confidentiality agreements)</li>
            <li>When required by law or legal process</li>
            <li>To protect our rights, property, or safety</li>
            <li>In connection with a merger, acquisition, or sale of assets</li>
          </ul>

          <h2>9. Data Retention</h2>
          <p>Personal data is retained only for as long as necessary to fulfill the purposes outlined in this policy or as required by law. Analytics data is retained for 26 months by default in Google Analytics.</p>

          <h2>10. Data Subject Rights</h2>
          <p>Depending on location, data subjects may have the following rights regarding personal data:</p>
          <ul>
            <li>Right to access personal data</li>
            <li>Right to correct inaccurate data</li>
            <li>Right to delete data ("right to be forgotten")</li>
            <li>Right to object to data processing</li>
            <li>Right to data portability</li>
            <li>Right to withdraw consent at any time</li>
          </ul>
          <p>Requests regarding these rights may be submitted to <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p>

          <h2>11. Children's Privacy</h2>
          <p>The website is not directed to children under 13 years of age. Personal information from children under 13 is not knowingly collected. Concerns regarding inadvertent collection may be reported immediately to <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p>

          <h2>12. Changes to This Policy</h2>
          <p>This Privacy Policy may be updated from time to time. Material changes will be reflected by posting the updated policy on this page and revising the "Last Updated" date.</p>

          <h2>13. Contact Us</h2>
          <p>Questions or concerns regarding this Privacy Policy may be directed to:</p>
          <p><strong>Email:</strong> <a href={`mailto:${EMAIL}`}>{EMAIL}</a><br />
          <strong>Website:</strong> <a href="https://comparaitools.com">comparaitools.com</a></p>

        </div>
      </main>

      <style>{`
        .legal-content { color: var(--text-muted); line-height: 1.8; font-size: 15px; }
        .legal-content h2 { font-size: 1.2em; font-weight: 700; color: var(--text); margin: 2em 0 0.6em; padding-bottom: 0.3em; border-bottom: 1px solid var(--border); }
        .legal-content h3 { font-size: 1em; font-weight: 600; color: var(--text); margin: 1.4em 0 0.4em; }
        .legal-content p { margin: 0 0 1em; }
        .legal-content ul { margin: 0 0 1em 1.5em; }
        .legal-content li { margin-bottom: 0.4em; }
        .legal-content a { color: var(--accent); }
        .legal-content strong { color: var(--text); font-weight: 600; }
      `}</style>
    </>
  );
}
