// src/app/blog/[slug]/page.tsx

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPost, getRelatedPosts } from '@/lib/kv-storage';

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = await getPost(params.slug);
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
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle,
      description: post.metaDescription,
    },
    alternates: {
      canonical: `https://comparaitools.com/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
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
      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(10,10,15,0.9)', borderBottom: '1px solid var(--border)' }}>
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

      <main className="max-w-[1200px] mx-auto px-6 py-10 relative z-10">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-8">
          <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[var(--accent)]">Blog</Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">{TYPE_LABELS[post.type] ?? post.type}</span>
        </nav>

        <div className="grid gap-12" style={{ gridTemplateColumns: '1fr 280px' }}>
          {/* Main content */}
          <article>
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{ background: 'rgba(0,229,160,0.1)', color: 'var(--accent)' }}>
                  {TYPE_LABELS[post.type] ?? post.type}
                </span>
                <time className="text-[13px] text-[var(--text-muted)]">{publishDate}</time>
                <span className="text-[13px] text-[var(--text-dim)]">· {post.readingTime} min read</span>
                <span className="text-[13px] text-[var(--text-dim)]">· {post.wordCount.toLocaleString()} words</span>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {post.keywords.slice(0, 5).map(kw => (
                  <span key={kw} className="text-[11px] px-2.5 py-1 rounded-lg"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                    {kw}
                  </span>
                ))}
              </div>
            </header>

            {/* Content */}
            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tools mentioned */}
            {post.toolSlugs.length > 0 && (
              <div className="mt-10 p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-[var(--text)] font-bold text-[15px] mb-4">Tools mentioned in this article</h3>
                <div className="flex gap-3 flex-wrap">
                  {post.toolSlugs.map(slug => (
                    <Link key={slug} href={`/tools/${slug}`}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      View {slug} →
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6" style={{ position: 'sticky', top: '80px', alignSelf: 'start' }}>
            {/* Compare CTA */}
            <div className="rounded-2xl p-6 text-center"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))', color: 'var(--bg)' }}>
              <h3 className="font-bold text-[15px] mb-2" style={{ color: 'var(--bg)' }}>Compare AI Tools</h3>
              <p className="text-[13px] mb-4 opacity-80" style={{ color: 'var(--bg)' }}>Find the perfect tool for your needs</p>
              <Link href="/compare"
                className="block py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: 'var(--bg)', color: 'var(--accent)' }}>
                Compare Now →
              </Link>
            </div>

            {/* Related posts */}
            {related.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-[var(--text)] font-bold text-[14px] mb-4">Related Articles</h3>
                <div className="flex flex-col gap-3">
                  {related.map(r => (
                    <Link key={r.slug} href={`/blog/${r.slug}`} style={{ textDecoration: 'none' }}>
                      <div className="p-3 rounded-xl" style={{ border: '1px solid var(--border)' }}>
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
            <Link href="/blog"
              className="text-center py-3 rounded-xl text-[13px] font-semibold"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              ← All Articles
            </Link>
          </aside>
        </div>
      </main>

      <style>{`
        .blog-content { color: var(--text-muted); line-height: 1.8; font-size: 15px; }
        .blog-content h1 { font-size: 1.9em; font-weight: 800; margin: 1.5em 0 0.5em; color: var(--text); font-family: var(--font-mono); }
        .blog-content h2 { font-size: 1.4em; font-weight: 700; margin: 2em 0 0.75em; color: var(--text); padding-bottom: 0.4em; border-bottom: 1px solid var(--border); }
        .blog-content h3 { font-size: 1.15em; font-weight: 600; margin: 1.5em 0 0.5em; color: var(--text); }
        .blog-content p { margin: 0 0 1.2em; }
        .blog-content ul, .blog-content ol { margin: 0 0 1.2em 1.5em; padding: 0; }
        .blog-content li { margin-bottom: 0.5em; }
        .blog-content table { width: 100%; border-collapse: collapse; margin: 1.5em 0; font-size: 14px; }
        .blog-content th { background: var(--bg-card); padding: 10px 14px; text-align: left; font-weight: 600; border: 1px solid var(--border); color: var(--text); }
        .blog-content td { padding: 9px 14px; border: 1px solid var(--border); vertical-align: top; }
        .blog-content tr:nth-child(even) td { background: var(--bg-card); }
        .blog-content a { color: var(--accent); text-decoration: underline; }
        .blog-content strong { font-weight: 700; color: var(--text); }
        .blog-content .quick-verdict, .blog-content .tldr-box, .blog-content .intro-section { padding: 20px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border); margin: 1.5em 0; }
        .blog-content .pros-cons-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 1em 0 1.5em; }
        .blog-content .pros { padding: 16px; border-radius: 8px; background: rgba(0,229,160,0.05); border: 1px solid rgba(0,229,160,0.2); }
        .blog-content .cons { padding: 16px; border-radius: 8px; background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.2); }
        .blog-content .faq-item { margin-bottom: 1.5em; padding-bottom: 1.5em; border-bottom: 1px solid var(--border); }
        .blog-content .faq-item:last-child { border-bottom: none; }
        .blog-content .tool-meta { display: flex; gap: 12px; flex-wrap: wrap; font-size: 13px; color: var(--text-dim); margin: 0.5em 0 1em; }
        .blog-content .quick-picks-box, .blog-content .quick-picks { padding: 16px 20px; border-radius: 8px; background: var(--bg-card); border-left: 3px solid var(--accent); margin: 1em 0 1.5em; }
        .blog-content .toc { padding: 16px 20px; border-radius: 8px; background: var(--bg-card); border: 1px solid var(--border); margin: 1em 0 2em; font-size: 14px; }
        .blog-content .toc ol { margin: 0.5em 0 0 1.2em; }
        .blog-content .rating-display { font-size: 1.1em; margin: 0.5em 0; }
        .blog-content .best-for, .blog-content .pricing-quick { font-size: 0.95em; margin: 0.5em 0; }
        @media (max-width: 768px) {
          .blog-content .pros-cons-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
