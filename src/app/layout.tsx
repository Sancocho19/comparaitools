import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
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
  authors: [{ name: "ComparAITools" }],
  creator: "ComparAITools",
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
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="google-site-verification" content="hpE6yggeCpp5GO9UF_2EJVLRZTP1iluds-D2dy_VxOU" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-DZWL8K43V0"></script>
        <script dangerouslySetInnerHTML={{__html:`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-DZWL8K43V0');`}}/>
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-DZWL8K43V0"></script>
	<script dangerouslySetInnerHTML={{__html:`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-	DZWL8K43V0');`}}/>
        {/* JSON-LD Website Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "ComparAITools",
              url: "https://comparaitools.com",
              description: "Compare AI tools side-by-side with real data",
              potentialAction: {
                "@type": "SearchAction",
                target:
                  "https://comparaitools.com/tools?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
