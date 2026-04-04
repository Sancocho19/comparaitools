// src/app/terms/page.tsx

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | ComparAITools',
  description: 'Terms of Service for ComparAITools.com — rules and conditions for using our platform.',
  alternates: { canonical: 'https://comparaitools.com/terms' },
};

const LAST_UPDATED = 'March 27, 2026';
const SITE = 'ComparAITools.com';
const EMAIL = 'legal@comparaitools.com';

export default function TermsPage() {
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
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Terms of Service</span>
        </div>

        <h1 style={{ fontSize: '2em', fontWeight: 800, color: 'var(--text)', margin: '24px 0 8px' }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '40px' }}>Last updated: {LAST_UPDATED}</p>

        <div className="legal-content">

          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using {SITE} ("the Website"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.</p>

          <h2>2. Description of Service</h2>
          <p>{SITE} is an AI tools comparison platform that provides reviews, comparisons, pricing information, and guides about artificial intelligence software and tools. Our content is for informational purposes only.</p>

          <h2>3. Use of the Website</h2>
          <h3>Permitted Use</h3>
          <p>You may use our website for lawful purposes only. You agree to use the website in accordance with these Terms and all applicable laws and regulations.</p>
          <h3>Prohibited Activities</h3>
          <p>You agree not to:</p>
          <ul>
            <li>Scrape, crawl, or systematically extract data from our website without permission</li>
            <li>Use our content for training AI models without explicit written permission</li>
            <li>Reproduce, duplicate, or copy our content for commercial purposes without authorization</li>
            <li>Interfere with or disrupt the website's operation or servers</li>
            <li>Attempt to gain unauthorized access to any part of the website</li>
            <li>Use the website for any fraudulent or deceptive purposes</li>
            <li>Transmit any malicious code, viruses, or harmful software</li>
          </ul>

          <h2>4. Intellectual Property</h2>
          <p>All content on {SITE}, including but not limited to text, graphics, logos, images, and software, is the property of ComparAITools or its content suppliers and is protected by intellectual property laws.</p>
          <p>You may not reproduce, distribute, modify, or create derivative works of our content without express written permission, except for personal, non-commercial use.</p>

          <h2>5. Accuracy of Information</h2>
          <p>We strive to provide accurate and up-to-date information about AI tools. However, we make no warranties or representations about the accuracy, completeness, or reliability of any information on our website.</p>
          <p>Pricing, features, and availability of AI tools change frequently. Always verify current information directly with the tool provider before making purchasing decisions.</p>

          <h2>6. Affiliate Links & Commercial Relationships</h2>
          <p>Some links on our website are affiliate links. This means we may earn a commission if you click on a link and make a purchase. This does not affect the price you pay and does not influence our editorial content or ratings.</p>
          <p>We clearly disclose our affiliate relationships in accordance with FTC guidelines. Our reviews and comparisons are based on genuine assessment of the tools.</p>

          <h2>7. Third-Party Websites</h2>
          <p>Our website contains links to third-party websites. These links are provided for your convenience only. We have no control over the content of those websites and accept no responsibility for them or for any loss or damage that may arise from your use of them.</p>

          <h2>8. Disclaimer of Warranties</h2>
          <p>THE WEBSITE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>

          <h2>9. Limitation of Liability</h2>
          <p>TO THE FULLEST EXTENT PERMITTED BY LAW, COMPARAITOOLS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.</p>

          <h2>10. Indemnification</h2>
          <p>You agree to indemnify and hold harmless ComparAITools and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of your use of the website or violation of these Terms.</p>

          <h2>11. Privacy</h2>
          <p>Your use of the website is also governed by our <Link href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>, which is incorporated into these Terms by reference.</p>

          <h2>12. Advertising</h2>
          <p>We display advertisements on our website through Google AdSense and potentially other advertising networks. Advertisements are clearly distinguished from editorial content. We do not endorse the products or services advertised.</p>

          <h2>13. Changes to Terms</h2>
          <p>We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website after any changes constitutes your acceptance of the new Terms.</p>

          <h2>14. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising from these Terms or your use of the website shall be subject to the exclusive jurisdiction of the competent courts.</p>

          <h2>15. Contact Information</h2>
          <p>If you have any questions about these Terms of Service, please contact us at:</p>
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
