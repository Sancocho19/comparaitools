import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost, getRelatedPosts } from '@/lib/kv-storage';
import { SITE_URL } from '@/lib/site';
import { formatDate } from '@/lib/utils';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      url: `${SITE_URL}/blog/${post.slug}`,
      title: post.metaTitle,
      description: post.metaDescription,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      siteName: 'ComparAITools',
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.slug, post.toolSlugs, 4);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: 'ComparAITools Research Desk', url: `${SITE_URL}/about` },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="grain-overlay" />
      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(10,10,15,0.92)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black" style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))', color: 'var(--bg)' }}>C</div><span className="font-extrabold text-lg" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}><span className="text-[var(--accent)]">Compar</span><span className="text-[var(--text)]">AITools</span></span></Link>
          <div className="hidden md:flex gap-6 items-center"><Link href="/tools" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)]">Tools</Link><Link href="/compare" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)]">Compare</Link><Link href="/blog" className="text-[var(--accent)] text-[13px] font-medium">Blog</Link></div>
        </div>
      </nav>

      <div className="blog-page-wrapper">
        <main className="blog-main">
          <div className="flex items-center gap-2 text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
            <Link href="/" className="hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Blog</Link>
            <span>/</span>
            <span style={{ color: 'var(--text-muted)' }}>{post.type}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: 'rgba(0,229,160,0.12)', color: 'var(--accent)', border: '1px solid rgba(0,229,160,0.2)' }}>{post.type}</span>
            <time className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{formatDate(post.publishedAt)}</time>
            <span className="text-[13px]" style={{ color: 'var(--text-dim)' }}>· {post.readingTime} min read</span>
            <span className="text-[13px]" style={{ color: 'var(--text-dim)' }}>· {post.wordCount.toLocaleString()} words</span>
          </div>

          <div className="mb-8 p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-[var(--text)] font-semibold mb-1">ComparAITools Research Desk</div>
            <p className="text-[13px] text-[var(--text-muted)] leading-6 m-0">This page was generated from live search results and structured tool data, then shaped into a commercial decision guide. It does not claim first-hand testing unless the site itself has actually done it.</p>
          </div>

          <article className="prose-wrapper" dangerouslySetInnerHTML={{ __html: post.content }} />

          {post.research?.sources?.length ? (
            <section className="mt-10 rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h2 className="text-xl font-bold text-[var(--text)] mb-3">Research basis</h2>
              <p className="text-[13px] text-[var(--text-muted)] mb-4">Provider: {post.research.provider} · Evidence score: {post.research.evidenceScore}/100 · Queries run: {post.research.queries.length}</p>
              <ol className="space-y-3 pl-5 text-sm text-[var(--text-muted)]">
                {post.research.sources.slice(0, 10).map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">{source.title}</a>
                    <span className="text-[var(--text-dim)]"> · {source.domain}{source.publishedAt ? ` · ${source.publishedAt}` : ''}</span>
                    <div className="mt-1 text-[13px] leading-6">{source.snippet}</div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold text-[var(--text)] mb-4">Related reading</h2>
              <div className="grid gap-3">
                {related.map((item) => (
                  <Link key={item.slug} href={`/blog/${item.slug}`} className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'none' }}>
                    <div className="text-[var(--text)] font-semibold">{item.title}</div>
                    <div className="text-[13px] text-[var(--text-muted)] mt-1">{item.excerpt}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
