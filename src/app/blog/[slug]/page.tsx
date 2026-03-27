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

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://comparaitools.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://comparaitools.com/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://comparaitools.com/blog/${post.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(post.schemaOrg) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="grain-overlay" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(10,10,15,0.92)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[1400px] mx-auto px-6 py-3.5 flex justify-between items-center">
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

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 relative z-10">

        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-6">
          <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[var(--accent)] transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">{TYPE_LABELS[post.type] ?? post.type}</span>
        </nav>

        {/* Layout: article + sidebar */}
        <div className="blog-layout">

          {/* ── ARTICLE ── */}
          <article className="blog-article">

            {/* Meta row */}
            <div className="flex items-center gap-3 flex-wrap mb-5">
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                style={{ background: 'rgba(0,229,160,0.12)', color: 'var(--accent)', border: '1px solid rgba(0,229,160,0.2)' }}>
                {TYPE_LABELS[post.type] ?? post.type}
              </span>
              <time className="text-[13px] text-[var(--text-muted)]">{publishDate}</time>
              <span className="text-[13px] text-[var(--text-dim)]">· {post.readingTime} min read</span>
              <span className="text-[13px] text-[var(--text-dim)]">· {post.wordCount.toLocaleString()} words</span>
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
            <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.content }} />

            {/* Tools mentioned */}
            {post.toolSlugs.length > 0 && (
              <div className="mt-10 p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-[var(--text)] font-bold text-[15px] mb-4">Tools mentioned in this article</h3>
                <div className="flex gap-3 flex-wrap">
                  {post.toolSlugs.map(s => (
                    <Link key={s} href={`/tools/${s}`}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      View {s} →
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile sidebar CTA */}
            <div className="blog-mobile-cta mt-8 p-6 rounded-2xl text-center"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))' }}>
              <p className="font-bold text-[15px] mb-1" style={{ color: 'var(--bg)' }}>Compare AI Tools Side by Side</p>
              <p className="text-[13px] mb-4 opacity-80" style={{ color: 'var(--bg)' }}>Find the perfect tool for your needs</p>
              <Link href="/compare" className="inline-block px-6 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: 'var(--bg)', color: 'var(--accent)' }}>
                Compare Now →
              </Link>
            </div>

          </article>

          {/* ── SIDEBAR ── */}
          <aside className="blog-sidebar">

            {/* Compare CTA */}
            <div className="rounded-2xl p-6 text-center mb-6"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))' }}>
              <h3 className="font-bold text-[15px] mb-2" style={{ color: 'var(--bg)' }}>Compare AI Tools</h3>
              <p className="text-[13px] mb-4 opacity-80" style={{ color: 'var(--bg)' }}>Find the perfect tool for your needs</p>
              <Link href="/compare" className="block py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: 'var(--bg)', color: 'var(--accent)' }}>
                Compare Now →
              </Link>
            </div>

            {/* Tools mentioned */}
            {post.toolSlugs.length > 0 && (
              <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-[var(--text)] font-bold text-[13px] uppercase tracking-wider mb-4">Tools in this article</h3>
                <div className="flex flex-col gap-2">
                  {post.toolSlugs.map(s => (
                    <Link key={s} href={`/tools/${s}`}
                      className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <span>{s}</span>
                      <span className="text-[var(--accent)]">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related posts */}
            {related.length > 0 && (
              <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-[var(--text)] font-bold text-[13px] uppercase tracking-wider mb-4">Related Articles</h3>
                <div className="flex flex-col gap-3">
                  {related.map(r => (
                    <Link key={r.slug} href={`/blog/${r.slug}`} style={{ textDecoration: 'none' }}>
                      <div className="p-3 rounded-xl transition-all hover:scale-[1.01]"
                        style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}>
                        <p className="text-[var(--text)] text-[13px] font-medium leading-snug mb-1">{r.title}</p>
                        <p className="text-[var(--text-dim)] text-[11px]">
                          {new Date(r.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Back to blog */}
            <Link href="/blog" className="flex items-center justify-center py-3 rounded-xl text-[13px] font-semibold transition-colors hover:text-[var(--accent)]"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              ← All Articles
            </Link>

          </aside>
        </div>
      </main>

      <style>{`
        /* ── Layout ── */
        .blog-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 48px;
          align-items: start;
        }
        .blog-sidebar {
          position: sticky;
          top: 80px;
        }
        .blog-mobile-cta { display: none; }

        /* ── Content typography ── */
        .blog-content { color: var(--text-muted); line-height: 1.85; font-size: 16px; }
        .blog-content h1 { font-size: 1.75em; font-weight: 800; margin: 1.4em 0 0.5em; color: var(--text); font-family: var(--font-mono); line-height: 1.2; }
        .blog-content h2 { font-size: 1.35em; font-weight: 700; margin: 2em 0 0.7em; color: var(--text); padding-bottom: 0.4em; border-bottom: 1px solid var(--border); }
        .blog-content h3 { font-size: 1.1em; font-weight: 600; margin: 1.5em 0 0.5em; color: var(--text); }
        .blog-content p { margin: 0 0 1.2em; }
        .blog-content ul, .blog-content ol { margin: 0 0 1.2em 1.5em; padding: 0; }
        .blog-content li { margin-bottom: 0.5em; }
        .blog-content a { color: var(--accent); text-decoration: underline; }
        .blog-content a:hover { opacity: 0.8; }
        .blog-content strong { font-weight: 700; color: var(--text); }
        .blog-content em { font-style: italic; }

        /* ── Tables ── */
        .blog-content table { width: 100%; border-collapse: collapse; margin: 1.5em 0; font-size: 14px; border-radius: 12px; overflow: hidden; }
        .blog-content th { background: var(--bg-card); padding: 12px 16px; text-align: left; font-weight: 600; border-bottom: 2px solid var(--border); color: var(--text); }
        .blog-content td { padding: 10px 16px; border-bottom: 1px solid var(--border); vertical-align: top; }
        .blog-content tr:last-child td { border-bottom: none; }
        .blog-content tr:nth-child(even) td { background: rgba(255,255,255,0.02); }

        /* ── Boxes ── */
        .blog-content .quick-verdict,
        .blog-content .tldr-box,
        .blog-content .intro-section,
        .blog-content .intro-box {
          padding: 24px; border-radius: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          margin: 1.5em 0;
        }
        .blog-content .quick-picks-box,
        .blog-content .quick-picks {
          padding: 20px 24px; border-radius: 12px;
          background: var(--bg-card);
          border-left: 3px solid var(--accent);
          margin: 1em 0 1.5em;
        }
        .blog-content .toc {
          padding: 20px 24px; border-radius: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          margin: 1em 0 2em; font-size: 14px;
        }
        .blog-content .toc ol { margin: 0.5em 0 0 1.2em; }
        .blog-content .toc li { margin-bottom: 6px; }

        /* ── Pros/Cons ── */
        .blog-content .pros-cons-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 1em 0 1.5em; }
        .blog-content .pros { padding: 18px; border-radius: 12px; background: rgba(0,229,160,0.04); border: 1px solid rgba(0,229,160,0.15); }
        .blog-content .cons { padding: 18px; border-radius: 12px; background: rgba(239,68,68,0.04); border: 1px solid rgba(239,68,68,0.15); }

        /* ── FAQ ── */
        .blog-content .faq-item { margin-bottom: 1.5em; padding-bottom: 1.5em; border-bottom: 1px solid var(--border); }
        .blog-content .faq-item:last-child { border-bottom: none; }
        .blog-content .faq-list { margin: 0; }

        /* ── Misc ── */
        .blog-content .tool-meta { display: flex; gap: 12px; flex-wrap: wrap; font-size: 13px; color: var(--text-dim); margin: 0.5em 0 1em; }
        .blog-content .rating-display { font-size: 1.1em; margin: 0.5em 0; }
        .blog-content .best-for, .blog-content .pricing-quick { font-size: 0.95em; margin: 0.5em 0; }
        .blog-content .prerequisites { padding: 16px 20px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border); margin: 1em 0 1.5em; }

        /* ── Mobile ── */
        @media (max-width: 900px) {
          .blog-layout {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .blog-sidebar { display: none; }
          .blog-mobile-cta { display: block; }
          .blog-content { font-size: 15px; }
          .blog-content h1 { font-size: 1.5em; }
          .blog-content h2 { font-size: 1.25em; }
          .blog-content .pros-cons-grid { grid-template-columns: 1fr; }
          .blog-content table { font-size: 13px; }
          .blog-content th, .blog-content td { padding: 8px 10px; }
        }

        @media (max-width: 480px) {
          .blog-content { font-size: 14px; }
          .blog-content h1 { font-size: 1.35em; }
          .blog-content table { display: block; overflow-x: auto; }
        }
      `}</style>
    </>
  );
}
