// src/app/blog/[slug]/page.tsx
// Crea la carpeta: src/app/blog/[slug]/ y pon este archivo dentro como page.tsx

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPost, getManifest, getRelatedPosts } from '@/lib/kv-storage';

export const revalidate = 3600;

// ─── generateStaticParams — pre-render known slugs ───────────────────────────

export async function generateStaticParams() {
  const manifest = await getManifest();
  return manifest.map(m => ({ slug: m.slug }));
}

// ─── generateMetadata — SEO dinámico ─────────────────────────────────────────

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

// ─── Page Component ───────────────────────────────────────────────────────────

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

  // BreadcrumbList schema
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
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(post.schemaOrg) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          <Link href="/" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Home</Link>
          {' / '}
          <Link href="/blog" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Blog</Link>
          {' / '}
          <span>{TYPE_LABELS[post.type] ?? post.type}</span>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '48px', alignItems: 'start' }}>
          {/* Main content */}
          <article>
            {/* Post header */}
            <header style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{
                  fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.05em', padding: '4px 10px', borderRadius: '4px',
                  background: '#3b82f620', color: '#3b82f6',
                }}>
                  {TYPE_LABELS[post.type] ?? post.type}
                </span>
                <time style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  {publishDate}
                </time>
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  · {post.readingTime} min read
                </span>
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  · {post.wordCount.toLocaleString()} words
                </span>
              </div>

              {/* Keywords */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                {post.keywords.slice(0, 5).map(kw => (
                  <span key={kw} style={{
                    fontSize: '12px', padding: '3px 8px', borderRadius: '4px',
                    border: '1px solid var(--color-border-tertiary)',
                    color: 'var(--color-text-secondary)',
                  }}>
                    {kw}
                  </span>
                ))}
              </div>
            </header>

            {/* Article content — rendered as HTML from Claude */}
            <div
              className="blog-content"
              style={{
                lineHeight: 1.8,
                fontSize: '16px',
                color: 'var(--color-text-primary)',
              }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tool links */}
            {post.toolSlugs.length > 0 && (
              <div style={{
                marginTop: '40px', padding: '24px', borderRadius: '12px',
                background: 'var(--color-background-secondary)',
                border: '1px solid var(--color-border-tertiary)',
              }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>
                  Tools mentioned in this article
                </h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {post.toolSlugs.map(slug => (
                    <Link
                      key={slug}
                      href={`/tools/${slug}`}
                      style={{
                        padding: '8px 16px', borderRadius: '8px',
                        border: '1px solid var(--color-border-secondary)',
                        background: 'var(--color-background-primary)',
                        textDecoration: 'none', color: 'var(--color-text-primary)',
                        fontSize: '14px', fontWeight: 500,
                      }}
                    >
                      View {slug} →
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside style={{ position: 'sticky', top: '24px' }}>
            {/* Compare CTA */}
            <div style={{
              padding: '24px', borderRadius: '12px',
              background: '#3b82f6',
              color: '#fff',
              marginBottom: '24px',
              textAlign: 'center',
            }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#fff' }}>
                Compare AI Tools
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '13px', opacity: 0.9 }}>
                Find the perfect tool for your needs
              </p>
              <Link
                href="/compare"
                style={{
                  display: 'block', padding: '10px', borderRadius: '8px',
                  background: '#fff', color: '#3b82f6', textDecoration: 'none',
                  fontWeight: 600, fontSize: '14px',
                }}
              >
                Compare Now →
              </Link>
            </div>

            {/* Related posts */}
            {related.length > 0 && (
              <div style={{
                padding: '20px', borderRadius: '12px',
                border: '1px solid var(--color-border-tertiary)',
                background: 'var(--color-background-secondary)',
              }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px' }}>Related Articles</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {related.map(r => (
                    <Link
                      key={r.slug}
                      href={`/blog/${r.slug}`}
                      style={{ textDecoration: 'none', color: 'var(--color-text-primary)' }}
                    >
                      <div style={{
                        padding: '12px', borderRadius: '8px',
                        border: '1px solid var(--color-border-tertiary)',
                        background: 'var(--color-background-primary)',
                      }}>
                        <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 500, lineHeight: 1.4 }}>
                          {r.title}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {new Date(r.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Blog content styles */}
      <style>{`
        .blog-content h1 { font-size: 2em; font-weight: 700; margin: 1.5em 0 0.5em; }
        .blog-content h2 { font-size: 1.5em; font-weight: 600; margin: 2em 0 0.75em; padding-bottom: 0.3em; border-bottom: 1px solid var(--color-border-tertiary); }
        .blog-content h3 { font-size: 1.2em; font-weight: 600; margin: 1.5em 0 0.5em; }
        .blog-content p  { margin: 0 0 1.2em; }
        .blog-content ul, .blog-content ol { margin: 0 0 1.2em 1.5em; padding: 0; }
        .blog-content li { margin-bottom: 0.5em; }
        .blog-content table { width: 100%; border-collapse: collapse; margin: 1.5em 0; font-size: 14px; }
        .blog-content th { background: var(--color-background-secondary); padding: 10px 14px; text-align: left; font-weight: 600; border: 1px solid var(--color-border-tertiary); }
        .blog-content td { padding: 9px 14px; border: 1px solid var(--color-border-tertiary); vertical-align: top; }
        .blog-content tr:nth-child(even) td { background: var(--color-background-secondary); }
        .blog-content a { color: #3b82f6; text-decoration: underline; }
        .blog-content a:hover { text-decoration: none; }
        .blog-content strong { font-weight: 600; }
        .blog-content .quick-verdict, .blog-content .tldr-box, .blog-content .intro-box, .blog-content .intro-section { padding: 20px; border-radius: 10px; background: var(--color-background-secondary); border: 1px solid var(--color-border-tertiary); margin: 1.5em 0; }
        .blog-content .pros-cons-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 1em 0 1.5em; }
        .blog-content .pros { padding: 16px; border-radius: 8px; background: #10b98110; border: 1px solid #10b98130; }
        .blog-content .cons { padding: 16px; border-radius: 8px; background: #ef444410; border: 1px solid #ef444430; }
        .blog-content .faq-item { margin-bottom: 1.5em; padding-bottom: 1.5em; border-bottom: 1px solid var(--color-border-tertiary); }
        .blog-content .faq-item:last-child { border-bottom: none; }
        .blog-content .tool-meta { display: flex; gap: 12px; flex-wrap: wrap; font-size: 13px; color: var(--color-text-secondary); margin: 0.5em 0 1em; }
        .blog-content .quick-picks-box, .blog-content .quick-picks { padding: 16px 20px; border-radius: 8px; background: var(--color-background-secondary); border-left: 3px solid #3b82f6; margin: 1em 0 1.5em; }
        .blog-content .toc { padding: 16px 20px; border-radius: 8px; background: var(--color-background-secondary); border: 1px solid var(--color-border-tertiary); margin: 1em 0 2em; font-size: 14px; }
        .blog-content .toc ol { margin: 0.5em 0 0 1.2em; }
        .blog-content .toc li { margin-bottom: 4px; }
        @media (max-width: 768px) {
          .blog-content .pros-cons-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
