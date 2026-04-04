import type { Metadata } from 'next';
import Link from 'next/link';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import { buildDefaultSiteMetadata } from '@/lib/seo';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  ...buildDefaultSiteMetadata(),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0a0a0f" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: SITE_NAME,
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              alternateName: 'Compar AITools',
              potentialAction: {
                '@type': 'SearchAction',
                target: `${SITE_URL}/tools?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
        <footer style={{ borderTop: '1px solid var(--border)', marginTop: '72px', padding: '48px 24px 32px', background: 'var(--bg)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', marginBottom: '32px' }}>
              <div>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, background: 'linear-gradient(135deg, var(--accent), var(--purple))', color: 'var(--bg)' }}>C</div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '16px', letterSpacing: '-0.5px' }}>
                    <span style={{ color: 'var(--accent)' }}>Compar</span>
                    <span style={{ color: 'var(--text)' }}>AITools</span>
                  </span>
                </Link>
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: '280px', margin: '0 0 12px' }}>
                  AI tool reviews, pricing guides, comparisons, and alternatives built to help people pick the right tool faster.
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0 }}>© {new Date().getFullYear()} {SITE_NAME}. Editorially independent.</p>
              </div>
              <FooterColumn title="Explore" links={[
                { href: '/tools', label: 'All tools' },
                { href: '/compare', label: 'Comparisons' },
                { href: '/blog', label: 'Blog' },
                { href: '/about', label: 'Methodology' },
              ]} />
              <FooterColumn title="Popular clusters" links={[
                { href: '/category/chatbot', label: 'Chatbots' },
                { href: '/category/code', label: 'Coding tools' },
                { href: '/category/image', label: 'Image tools' },
                { href: '/category/video', label: 'Video tools' },
              ]} />
              <FooterColumn title="Legal" links={[
                { href: '/privacy', label: 'Privacy' },
                { href: '/terms', label: 'Terms' },
              ]} />
            </div>
            <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0 }}>
                Some pages may include affiliate links. Rankings and verdicts are not sold and are not based on commissions.
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0 }}>
                Live research assisted by search APIs and editorial prompts. Final responsibility stays with the publisher.
              </p>
            </div>
          </div>
        </footer>
        <style>{`
          @media (max-width: 768px) {
            footer > div > div:first-child {
              grid-template-columns: 1fr 1fr !important;
            }
          }
          @media (max-width: 480px) {
            footer > div > div:first-child {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </body>
    </html>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', margin: '0 0 14px' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
