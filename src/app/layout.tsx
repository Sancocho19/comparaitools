import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "ComparAITools - Compare Every AI Tool Side by Side | 2026",
    template: "%s | ComparAITools",
  },
  description:
    "Compare AI tools side-by-side with real data, pricing, features & ratings. ChatGPT vs Claude vs Gemini and 50+ tools. Updated daily.",
  keywords: [
    "AI tools comparison",
    "compare AI tools",
    "best AI tools 2026",
    "ChatGPT vs Claude",
    "AI tool reviews",
    "AI software comparison",
  ],
  authors: [{ name: "Alex Morgan", url: "https://twitter.com/alexmorgan_ai" }],
  creator: "Alex Morgan",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://comparaitools.com",
    siteName: "ComparAITools",
    title: "ComparAITools - Compare Every AI Tool Side by Side",
    description:
      "Real-time AI tool comparisons with data-driven insights. Find the perfect AI tool for your needs.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ComparAITools - AI Tool Comparison Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ComparAITools - Compare Every AI Tool",
    description: "Side-by-side AI tool comparisons with real data.",
    creator: "@alexmorgan_ai",
    site: "@alexmorgan_ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://comparaitools.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="google-site-verification" content="hpE6yggeCpp5GO9UF_2EJVLRZTP1iluds-D2dy_VxOU" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-DZWL8K43V0"></script>
        <script dangerouslySetInnerHTML={{__html:`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-DZWL8K43V0');`}}/>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "ComparAITools",
              url: "https://comparaitools.com",
              description: "Compare AI tools side-by-side with real data",
              author: {
                "@type": "Person",
                name: "Alex Morgan",
                url: "https://comparaitools.com/about",
                sameAs: [
                  "https://twitter.com/alexmorgan_ai",
                  "https://linkedin.com/in/alexmorganai",
                ],
              },
              potentialAction: {
                "@type": "SearchAction",
                target: "https://comparaitools.com/tools?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}

        {/* FOOTER */}
        <footer style={{
          borderTop: '1px solid var(--border)',
          marginTop: '80px',
          padding: '48px 24px 32px',
          background: 'var(--bg)',
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

            {/* Top: logo + columns */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              gap: '40px',
              marginBottom: '40px',
            }}>

              {/* Brand */}
              <div>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 900,
                    background: 'linear-gradient(135deg, var(--accent), var(--purple))',
                    color: 'var(--bg)',
                  }}>C</div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '16px', letterSpacing: '-0.5px' }}>
                    <span style={{ color: 'var(--accent)' }}>Compar</span>
                    <span style={{ color: 'var(--text)' }}>AITools</span>
                  </span>
                </Link>
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: '240px', margin: '0 0 12px' }}>
                  The definitive AI tools comparison platform. Expert reviews and data-driven insights, updated daily.
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '0 0 12px' }}>
                  By <Link href="/about" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Alex Morgan</Link> · AI Tools Analyst
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  © {new Date().getFullYear()} ComparAITools. All rights reserved.
                </p>
              </div>

              {/* Tools */}
              <div>
                <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', margin: '0 0 14px' }}>
                  Tools
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'All Tools', href: '/tools' },
                    { label: 'Chatbots', href: '/category/chatbot' },
                    { label: 'Image Generation', href: '/category/image' },
                    { label: 'Code Assistants', href: '/category/code' },
                    { label: 'AI Search', href: '/category/search' },
                    { label: 'Video & Audio', href: '/category/video' },
                  ].map(({ label, href }) => (
                    <Link key={href} href={href} style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div>
                <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', margin: '0 0 14px' }}>
                  Resources
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Blog', href: '/blog' },
                    { label: 'Compare Tools', href: '/compare' },
                    { label: 'About Us', href: '/about' },
                    { label: 'Contact', href: '/about#contact' },
                  ].map(({ label, href }) => (
                    <Link key={href} href={href} style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Legal */}
              <div>
                <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', margin: '0 0 14px' }}>
                  Legal
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Privacy Policy', href: '/privacy' },
                    { label: 'Terms of Service', href: '/terms' },
                    { label: 'Cookie Policy', href: '/privacy#cookies' },
                    { label: 'Affiliate Disclosure', href: '/privacy#affiliate' },
                  ].map(({ label, href }) => (
                    <Link key={href} href={href} style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom bar */}
            <div style={{
              paddingTop: '24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0 }}>
                Disclosure: We may earn affiliate commissions from links on this site. This does not affect our editorial independence.
              </p>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <a href="https://twitter.com/alexmorgan_ai" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '12px', color: 'var(--text-dim)', textDecoration: 'none' }}>𝕏 Twitter</a>
                <a href="https://linkedin.com/in/alexmorganai" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '12px', color: 'var(--text-dim)', textDecoration: 'none' }}>LinkedIn</a>
                <Link href="/privacy" style={{ fontSize: '12px', color: 'var(--text-dim)', textDecoration: 'none' }}>Privacy</Link>
                <Link href="/terms" style={{ fontSize: '12px', color: 'var(--text-dim)', textDecoration: 'none' }}>Terms</Link>
              </div>
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
