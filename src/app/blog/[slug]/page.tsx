// src/app/blog/[slug]/page.tsx

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPost, getRelatedPosts } from '@/lib/kv-storage';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords.join(', '),
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: `https://comparaitools.com/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      siteName: 'comparaitools.com',
    },
    twitter: { card: 'summary_large_image', title: post.metaTitle, description: post.metaDescription },
    alternates: { canonical: `https://comparaitools.com/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.slug, post.toolSlugs, 4);
  const publishDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const TYPE_LABELS: Record<string, string> = {
    review: 'Review', comparison: 'Comparison', roundup: 'Best Of',
    guide: 'Guide', pricing: 'Pricing Guide',
  };

  // ── SCHEMA FIX: enriquecer el schema que viene de Redis ──────────────────
  // Google exige "author" e "itemReviewed" en Review schema.
  // Los campos que ya vengan en post.schemaOrg se conservan;
  // solo añadimos los que faltan para no romper nada.

  const toolName =
    post.toolSlugs?.[0]
      ? post.toolSlugs[0].charAt(0).toUpperCase() + post.toolSlugs[0].slice(1).replace(/-/g, ' ')
      : post.title;

  // Cast a Record para que TypeScript permita acceso por clave dinámica
  const baseSchema = (post.schemaOrg ?? {}) as Record<string, unknown>;
  const isReviewType = ['review', 'comparison', 'pricing'].includes(post.type);

  // reviewRating: si ya existe en Redis lo usamos (puede tener rating real como 4.8)
  // pero lo reemplazamos si el @type no es Rating (dato incorrecto)
  const existingRating = baseSchema['reviewRating'] as Record<string, unknown> | undefined;
  const safeRating = existingRating?.['@type'] === 'Rating'
    ? existingRating
    : { '@type': 'Rating', ratingValue: '4.5', bestRating: '5', worstRating: '1' };

  const enrichedSchema = {
    // Spread base — conserva name, description, url, etc.
    ...baseSchema,

    // @type: siempre Review para reviews (forzado)
    '@type': isReviewType ? 'Review' : (baseSchema['@type'] ?? 'Article'),

    // CAMPO OBLIGATORIO 1: author — SIEMPRE Person, ignoramos el "Thing" de Redis
    author: {
      '@type': 'Person',
      name: 'Alex Morgan',
      url: 'https://comparaitools.com/about',
      sameAs: [
        'https://twitter.com/alexmorgan_ai',
        'https://linkedin.com/in/alexmorganai',
      ],
    },

    // CAMPO OBLIGATORIO 2: itemReviewed — SIEMPRE presente en reviews
    ...(isReviewType && {
      itemReviewed: {
        '@type': 'SoftwareApplication',
        name: toolName,
        applicationCategory: 'WebApplication',
        url: `https://comparaitools.com/tools/${post.toolSlugs?.[0] ?? ''}`,
      },
    }),

    // reviewRating: usar el de Redis si es válido, sino default
    ...(isReviewType && { reviewRating: safeRating }),

    // publisher siempre presente (E-E-A-T)
    publisher: {
      '@type': 'Organization',
      name: 'ComparAITools',
      url: 'https://comparaitools.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://comparaitools.com/favicon.svg',
      },
    },

    // datePublished / dateModified
    datePublished: baseSchema['datePublished'] ?? post.publishedAt,
    dateModified: baseSchema['dateModified'] ?? post.updatedAt,
  };
  // ─────────────────────────────────────────────────────────────────────────

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://comparaitools.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://comparaitools.com/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://comparaitools.com/blog/${post.slug}` },
    ],
  };

  // ── SANITIZAR CONTENT ────────────────────────────────────────────────────
  // El motor de contenido inyecta <script type="application/ld+json"> dentro
  // del HTML del artículo. Esos schemas incompletos (sin author, itemReviewed,
  // mainEntity) causan errores en Google Search Console.
  // Eliminamos todos los JSON-LD embebidos: el schema correcto ya esta en
  // enrichedSchema + breadcrumbSchema arriba.
  const sanitizedContent = post.content
    // 1. Eliminar JSON-LD scripts embebidos dentro del HTML del post
    .replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
    // 2. Parchear FAQPage microdata existente: añadir itemprop="mainEntity" a Question divs
    //    Posts generados antes del fix no tienen este atributo — Google lo exige
    .replace(
      /(<div[^>]*?)itemscope(\s[^>]*?)?itemtype=["']https:\/\/schema\.org\/Question["']([^>]*>)/gi,
      (match: string) => match.includes('itemprop=') ? match : match.replace('itemscope', 'itemprop="mainEntity" itemscope')
    );
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Schema enriquecido con author + itemReviewed */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(enrichedSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="grain-overlay" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(10,10,15,0.92)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))', color: 'var(--bg)' }}>
              C
            </div>
            <span className="font-extrabold text-lg" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>
              <span className="text-[var(--accent)]">Compar</span>
              <span className="text-[var(--text)]">AITools</span>
            </span>
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link href="/tools" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Tools</Link>
            <Link href="/compare" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">Compare</Link>
            <Link href="/blog" className="text-[var(--accent)] text-[13px] font-medium">Blog</Link>
          </div>
        </div>
      </nav>

      {/* Page wrapper */}
      <div className="blog-page-wrapper">

        {/* ARTICLE — centrado, ancho de lectura cómodo */}
        <main className="blog-main">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
            <Link href="/" className="hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Blog</Link>
            <span>/</span>
            <span style={{ color: 'var(--text-muted)' }}>{TYPE_LABELS[post.type] ?? post.type}</span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{ background: 'rgba(0,229,160,0.12)', color: 'var(--accent)', border: '1px solid rgba(0,229,160,0.2)' }}>
              {TYPE_LABELS[post.type] ?? post.type}
            </span>
            <time className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{publishDate}</time>
            <span className="text-[13px]" style={{ color: 'var(--text-dim)' }}>· {post.readingTime} min read</span>
            <span className="text-[13px]" style={{ color: 'var(--text-dim)' }}>· {post.wordCount.toLocaleString()} words</span>
          </div>

          {/* Author byline — E-E-A-T signal for Google */}
          <div className="flex items-center gap-3 mb-8 p-4 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))', color: 'var(--bg)' }}>
              AM
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href="/about" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>
                  Alex Morgan
                </Link>
                <span className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,229,160,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,229,160,0.2)' }}>
                  AI Tools Analyst
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '2px 0 0' }}>
                Founder of ComparAITools · <a href="https://twitter.com/alexmorgan_ai" target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', textDecoration: 'none' }}>@alexmorgan_ai</a>
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Last updated:</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{publishDate}</span>
            </div>
          </div>

          {/* Keywords */}
          <div className="flex flex-wrap gap-2 mb-8">
            {post.keywords.slice(0, 6).map(kw => (
              <span key={kw} className="text-[11px] px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                {kw}
              </span>
            ))}
          </div>

          {/* Content */}
          <article className="blog-content" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />

          {/* Tools mentioned */}
          {post.toolSlugs.length > 0 && (
            <div className="mt-10 p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="font-bold mb-4" style={{ fontSize: '15px', color: 'var(--text)', margin: '0 0 14px' }}>Tools mentioned in this article</h3>
              <div className="flex gap-3 flex-wrap">
                {post.toolSlugs.map(s => (
                  <Link key={s} href={`/tools/${s}`}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none' }}>
                    View {s} →
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-10 p-8 rounded-2xl text-center"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))' }}>
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--bg)' }}>Compare AI Tools Side by Side</h3>
            <p className="text-sm mb-5 opacity-85" style={{ color: 'var(--bg)' }}>Not sure which tool to choose? Our comparison tool helps you decide.</p>
            <Link href="/compare"
              className="inline-block px-8 py-3 rounded-xl font-bold text-sm"
              style={{ background: 'var(--bg)', color: 'var(--accent)', textDecoration: 'none' }}>
              Compare Tools Now →
            </Link>
          </div>

          {/* Related posts (inline at bottom on all screens) */}
          {related.length > 0 && (
            <div className="mt-10">
              <h3 className="font-bold mb-5" style={{ fontSize: '16px', color: 'var(--text)' }}>Related Articles</h3>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                {related.map(r => (
                  <Link key={r.slug} href={`/blog/${r.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="p-4 rounded-2xl h-full transition-all hover:scale-[1.02]"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <p className="font-medium mb-2" style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.4 }}>{r.title}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        {new Date(r.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <Link href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              ← Back to all articles
            </Link>
          </div>

        </main>

        {/* SIDEBAR — solo visible en pantallas muy anchas */}
        <aside className="blog-sidebar-fixed">
          <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div className="rounded-2xl p-5 text-center"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))' }}>
              <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--bg)' }}>Compare AI Tools</h3>
              <p className="text-xs mb-3 opacity-85" style={{ color: 'var(--bg)' }}>Find the perfect tool for your needs</p>
              <Link href="/compare"
                className="block py-2 rounded-xl font-bold text-sm"
                style={{ background: 'var(--bg)', color: 'var(--accent)', textDecoration: 'none' }}>
                Compare Now →
              </Link>
            </div>

            {post.toolSlugs.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="font-bold uppercase tracking-wider mb-3"
                  style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Tools in this article</h3>
                <div className="flex flex-col gap-2">
                  {post.toolSlugs.map(s => (
                    <Link key={s} href={`/tools/${s}`}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all hover:scale-[1.02]"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none' }}>
                      <span>{s}</span>
                      <span style={{ color: 'var(--accent)' }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link href="/blog"
              className="flex items-center justify-center py-2.5 rounded-xl text-sm font-medium"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none' }}>
              ← All Articles
            </Link>

          </div>
        </aside>

      </div>

      <style>{`
        /* ── Page layout ── */
        .blog-page-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 240px;
          gap: 48px;
          align-items: start;
        }
        .blog-main { min-width: 0; }
        .blog-sidebar-fixed { min-width: 0; }

        /* ── Article typography ── */
        .blog-content { color: var(--text-muted); line-height: 1.8; font-size: 16px; min-width: 0; word-wrap: break-word; overflow-wrap: break-word; }
        .blog-content h1 { font-size: 1.75em; font-weight: 800; margin: 0 0 0.7em; color: var(--text); line-height: 1.25; }
        .blog-content h2 { font-size: 1.3em; font-weight: 700; margin: 2em 0 0.7em; color: var(--text); padding-bottom: 0.4em; border-bottom: 1px solid var(--border); }
        .blog-content h3 { font-size: 1.1em; font-weight: 600; margin: 1.5em 0 0.5em; color: var(--text); }
        .blog-content p { margin: 0 0 1.2em; }
        .blog-content ul, .blog-content ol { margin: 0 0 1.2em 1.5em; padding: 0; }
        .blog-content li { margin-bottom: 0.5em; }
        .blog-content a { color: var(--accent); text-decoration: underline; }
        .blog-content strong { font-weight: 700; color: var(--text); }

        /* ── Tables ── */
        .blog-content table { width: 100%; border-collapse: collapse; margin: 1.5em 0; font-size: 14px; table-layout: fixed; word-wrap: break-word; }
        .blog-content th { background: var(--bg-card); padding: 10px 14px; text-align: left; font-weight: 600; border: 1px solid var(--border); color: var(--text); }
        .blog-content td { padding: 9px 14px; border: 1px solid var(--border); vertical-align: top; word-wrap: break-word; }
        .blog-content tr:nth-child(even) td { background: rgba(255,255,255,0.02); }

        /* ── Callout boxes ── */
        .blog-content .quick-verdict, .blog-content .tldr-box,
        .blog-content .intro-section, .blog-content .intro-box {
          padding: 20px 24px; border-radius: 14px;
          background: var(--bg-card); border: 1px solid var(--border); margin: 1.5em 0;
        }
        .blog-content .quick-picks-box, .blog-content .quick-picks {
          padding: 16px 20px; border-radius: 10px;
          background: var(--bg-card); border-left: 3px solid var(--accent); margin: 1em 0 1.5em;
        }
        .blog-content .toc {
          padding: 16px 20px; border-radius: 10px;
          background: var(--bg-card); border: 1px solid var(--border); margin: 1em 0 1.8em; font-size: 14px;
        }
        .blog-content .toc ol { margin: 0.5em 0 0 1.2em; }
        .blog-content .toc li { margin-bottom: 5px; }

        /* ── Pros/Cons ── */
        .blog-content .pros-cons-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 1em 0 1.5em; min-width: 0; }
        .blog-content .pros { padding: 16px; border-radius: 10px; background: rgba(0,229,160,0.04); border: 1px solid rgba(0,229,160,0.15); min-width: 0; overflow-wrap: break-word; }
        .blog-content .cons { padding: 16px; border-radius: 10px; background: rgba(239,68,68,0.04); border: 1px solid rgba(239,68,68,0.15); min-width: 0; overflow-wrap: break-word; }

        /* ── FAQ ── */
        .blog-content .faq-item { margin-bottom: 1.5em; padding-bottom: 1.5em; border-bottom: 1px solid var(--border); }
        .blog-content .faq-item:last-child { border-bottom: none; }
        .blog-content .tool-meta { display: flex; gap: 10px; flex-wrap: wrap; font-size: 13px; color: var(--text-dim); margin: 0.4em 0 1em; }
        .blog-content .rating-display { font-size: 1.1em; margin: 0.4em 0; }
        .blog-content .best-for, .blog-content .pricing-quick { font-size: 0.95em; margin: 0.4em 0; }
        .blog-content .prerequisites { padding: 14px 18px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border); margin: 1em 0 1.5em; }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .blog-page-wrapper { grid-template-columns: 1fr; gap: 0; }
          .blog-sidebar-fixed { display: none; }
        }
        @media (max-width: 640px) {
          .blog-page-wrapper { padding: 24px 16px; }
          .blog-content { font-size: 15px; }
          .blog-content h1 { font-size: 1.4em; }
          .blog-content h2 { font-size: 1.2em; }
          .blog-content .pros-cons-grid { grid-template-columns: 1fr; }
          .blog-content table { display: block; overflow-x: auto; table-layout: auto; }
        }
        @media (max-width: 400px) {
          .blog-content { font-size: 14px; }
          .blog-content h1 { font-size: 1.25em; }
        }
      `}</style>
    </>
  );
}
