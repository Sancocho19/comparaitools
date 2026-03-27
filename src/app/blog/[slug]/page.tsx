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
        <div className="max-w-[1100px] mx-auto px-6 py-3.5 flex justify-between items-center">
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

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '24px' }}>
          <Link href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }} className="hover:text-[var(--accent)]">Home</Link>
          <span>/</span>
          <Link href="/blog" style={{ color: 'var(--text-dim)', textDecoration: 'none' }} className="hover:text-[var(--accent)]">Blog</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-muted)' }}>{TYPE_LABELS[post.type] ?? post.type}</span>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '40px', alignItems: 'start' }}>

          {/* ARTICLE */}
          <article style={{ minWidth: 0, width: '100%' }}>

            {/* Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 10px', borderRadius: '20px', background: 'rgba(0,229,160,0.12)', color: 'var(--accent)', border: '1px solid rgba(0,229,160,0.2)' }}>
                {TYPE_LABELS[post.type] ?? post.type}
              </span>
              <time style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{publishDate}</time>
              <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>· {post.readingTime} min read</span>
              <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>· {post.wordCount.toLocaleString()} words</span>
            </div>

            {/* Keywords */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '28px' }}>
              {post.keywords.slice(0, 6).map(kw => (
                <span key={kw} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                  {kw}
                </span>
              ))}
            </div>

            {/* Content */}
            <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.content }} />

            {/* Tools mentioned */}
            {post.toolSlugs.length > 0 && (
              <div style={{ marginTop: '40px', padding: '20px 24px', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '14px', color: 'var(--text)', fontWeight: 600 }}>Tools in this article</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {post.toolSlugs.map(s => (
                    <Link key={s} href={`/tools/${s}`} style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
                      View {s} →
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile CTA */}
            <div className="mobile-cta" style={{ marginTop: '32px', padding: '24px', borderRadius: '16px', textAlign: 'center', background: 'linear-gradient(135deg, var(--accent), var(--purple))' }}>
              <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--bg)', margin: '0 0 6px' }}>Compare AI Tools</p>
              <p style={{ fontSize: '13px', color: 'var(--bg)', opacity: 0.85, margin: '0 0 16px' }}>Find the perfect tool for your needs</p>
              <Link href="/compare" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', background: 'var(--bg)', color: 'var(--accent)', textDecoration: 'none' }}>
                Compare Now →
              </Link>
            </div>

          </article>

          {/* SIDEBAR */}
          <aside style={{ position: 'sticky', top: '80px', minWidth: 0 }}>

            <div style={{ padding: '20px', borderRadius: '16px', textAlign: 'center', marginBottom: '16px', background: 'linear-gradient(135deg, var(--accent), var(--purple))' }}>
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--bg)', margin: '0 0 6px' }}>Compare AI Tools</h3>
              <p style={{ fontSize: '12px', color: 'var(--bg)', opacity: 0.85, margin: '0 0 14px' }}>Find the perfect tool for your needs</p>
              <Link href="/compare" style={{ display: 'block', padding: '9px', borderRadius: '10px', fontWeight: 600, fontSize: '13px', background: 'var(--bg)', color: 'var(--accent)', textDecoration: 'none' }}>
                Compare Now →
              </Link>
            </div>

            {post.toolSlugs.length > 0 && (
              <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', margin: '0 0 12px' }}>Tools in this article</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {post.toolSlugs.map(s => (
                    <Link key={s} href={`/tools/${s}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px' }}>
                      <span>{s}</span>
                      <span style={{ color: 'var(--accent)' }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {related.length > 0 && (
              <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', margin: '0 0 12px' }}>Related Articles</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {related.map(r => (
                    <Link key={r.slug} href={`/blog/${r.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)' }}>
                        <p style={{ margin: '0 0 3px', fontSize: '12px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>{r.title}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)' }}>
                          {new Date(r.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link href="/blog" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
              ← All Articles
            </Link>

          </aside>
        </div>
      </main>

      <style>{`
        .blog-content { color: var(--text-muted); line-height: 1.85; font-size: 16px; min-width: 0; word-wrap: break-word; overflow-wrap: break-word; }
        .blog-content h1 { font-size: 2em; font-weight: 800; margin: 0 0 0.6em; color: var(--text); line-height: 1.2; font-family: inherit; }
        .blog-content h2 { font-size: 1.3em; font-weight: 700; margin: 2em 0 0.7em; color: var(--text); padding-bottom: 0.4em; border-bottom: 1px solid var(--border); }
        .blog-content h3 { font-size: 1.1em; font-weight: 600; margin: 1.5em 0 0.5em; color: var(--text); }
        .blog-content p { margin: 0 0 1.2em; }
        .blog-content ul, .blog-content ol { margin: 0 0 1.2em 1.5em; padding: 0; }
        .blog-content li { margin-bottom: 0.5em; }
        .blog-content a { color: var(--accent); text-decoration: underline; }
        .blog-content strong { font-weight: 700; color: var(--text); }
        .blog-content table { width: 100%; border-collapse: collapse; margin: 1.5em 0; font-size: 14px; table-layout: fixed; word-wrap: break-word; }
        .blog-content th { background: var(--bg-card); padding: 10px 14px; text-align: left; font-weight: 600; border: 1px solid var(--border); color: var(--text); }
        .blog-content td { padding: 9px 14px; border: 1px solid var(--border); vertical-align: top; word-wrap: break-word; }
        .blog-content tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
        .blog-content .quick-verdict, .blog-content .tldr-box, .blog-content .intro-section, .blog-content .intro-box { padding: 20px 24px; border-radius: 14px; background: var(--bg-card); border: 1px solid var(--border); margin: 1.5em 0; }
        .blog-content .quick-picks-box, .blog-content .quick-picks { padding: 16px 20px; border-radius: 10px; background: var(--bg-card); border-left: 3px solid var(--accent); margin: 1em 0 1.5em; }
        .blog-content .toc { padding: 16px 20px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border); margin: 1em 0 1.8em; font-size: 14px; }
        .blog-content .toc ol { margin: 0.5em 0 0 1.2em; }
        .blog-content .toc li { margin-bottom: 5px; }
        .blog-content .pros-cons-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 1em 0 1.5em; min-width: 0; }
        .blog-content .pros { padding: 16px; border-radius: 10px; background: rgba(0,229,160,0.04); border: 1px solid rgba(0,229,160,0.15); min-width: 0; overflow-wrap: break-word; }
        .blog-content .cons { padding: 16px; border-radius: 10px; background: rgba(239,68,68,0.04); border: 1px solid rgba(239,68,68,0.15); min-width: 0; overflow-wrap: break-word; }
        .blog-content .faq-item { margin-bottom: 1.5em; padding-bottom: 1.5em; border-bottom: 1px solid var(--border); }
        .blog-content .faq-item:last-child { border-bottom: none; }
        .blog-content .tool-meta { display: flex; gap: 10px; flex-wrap: wrap; font-size: 13px; color: var(--text-dim); margin: 0.4em 0 1em; }
        .blog-content .rating-display { font-size: 1.1em; margin: 0.4em 0; }
        .blog-content .best-for, .blog-content .pricing-quick { font-size: 0.95em; margin: 0.4em 0; }
        .blog-content .prerequisites { padding: 14px 18px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border); margin: 1em 0 1.5em; }
        .mobile-cta { display: none; }
        @media (max-width: 860px) {
          main > div[style] { grid-template-columns: 1fr !important; }
          aside { display: none !important; }
          .mobile-cta { display: block !important; }
          .blog-content { font-size: 15px; }
          .blog-content h1 { font-size: 1.5em; }
          .blog-content h2 { font-size: 1.2em; }
          .blog-content .pros-cons-grid { grid-template-columns: 1fr; }
          .blog-content table { display: block; overflow-x: auto; table-layout: auto; }
        }
        @media (max-width: 480px) {
          .blog-content { font-size: 14px; }
          .blog-content h1 { font-size: 1.3em; }
        }
      `}</style>
    </>
  );
}
