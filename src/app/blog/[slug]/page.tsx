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
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle,
      description: post.metaDescription,
    },
  };
}

const TYPE_LABELS: Record<string, string> = {
  review: 'Review',
  comparison: 'Comparison',
  roundup: 'Best Of',
  guide: 'Guide',
  pricing: 'Pricing Guide',
  opinion: 'Opinion',
};

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
    author: {
      '@type': 'Organization',
      name: 'ComparAITools Research Desk',
      url: `${SITE_URL}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ComparAITools',
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
    ],
  };

  const sanitizedContent = post.content
    .replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(
      /(<article)([^>]*?)itemscope([^>]*?)itemtype=["']https:\/\/schema\.org\/Review["']([^>]*?>)/gi,
      (_m: string, tag: string, b: string, _c: string, d: string) => `${tag}${b}${d}`,
    )
    .replace(/<meta\s+itemprop=["'](datePublished|author|dateModified)["'][^>]*\/>/gi, '')
    .replace(
      /(<div[^>]*?)itemscope([^>]*?)itemtype=["']https:\/\/schema\.org\/Question["']([^>]*?>)/gi,
      (match: string) =>
        match.includes('itemprop=') ? match : match.replace('itemscope', 'itemprop="mainEntity" itemscope'),
    )
    .replace(
      /(<div[^>]*?)itemscope([^>]*?)itemtype=["']https:\/\/schema\.org\/Answer["']([^>]*?>)/gi,
      (match: string) =>
        match.includes('itemprop=') ? match : match.replace('itemscope', 'itemprop="acceptedAnswer" itemscope'),
    );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="grain-overlay" />

      <nav
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: 'rgba(10,10,15,0.92)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--purple))',
                color: 'var(--bg)',
              }}
            >
              C
            </div>
            <span
              className="font-extrabold text-lg"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}
            >
              <span className="text-[var(--accent)]">Compar</span>
              <span className="text-[var(--text)]">AITools</span>
            </span>
          </Link>

          <div className="hidden md:flex gap-6 items-center">
            <Link
              href="/tools"
              className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors"
            >
              Tools
            </Link>
            <Link
              href="/compare"
              className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors"
            >
              Compare
            </Link>
            <Link href="/blog" className="text-[var(--accent)] text-[13px] font-medium">
              Blog
            </Link>
          </div>
        </div>
      </nav>

      <div className="blog-page-wrapper">
        <main className="blog-main">
          <div className="flex items-center gap-2 text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
            <Link
              href="/"
              className="hover:text-[var(--accent)] transition-colors"
              style={{ color: 'var(--text-dim)', textDecoration: 'none' }}
            >
              Home
            </Link>
            <span>/</span>
            <Link
              href="/blog"
              className="hover:text-[var(--accent)] transition-colors"
              style={{ color: 'var(--text-dim)', textDecoration: 'none' }}
            >
              Blog
            </Link>
            <span>/</span>
            <span style={{ color: 'var(--text-muted)' }}>{TYPE_LABELS[post.type] ?? post.type}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{
                background: 'rgba(0,229,160,0.12)',
                color: 'var(--accent)',
                border: '1px solid rgba(0,229,160,0.2)',
              }}
            >
              {TYPE_LABELS[post.type] ?? post.type}
            </span>
            <time className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              {formatDate(post.publishedAt)}
            </time>
            <span className="text-[13px]" style={{ color: 'var(--text-dim)' }}>
              · {post.readingTime} min read
            </span>
            <span className="text-[13px]" style={{ color: 'var(--text-dim)' }}>
              · {post.wordCount.toLocaleString()} words
            </span>
          </div>

          <h1 className="article-title">{post.title}</h1>

          <p className="article-excerpt">{post.excerpt || post.metaDescription}</p>

          <div
            className="article-research-box"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="article-research-head">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--purple))',
                  color: 'var(--bg)',
                }}
              >
                RD
              </div>
              <div className="min-w-0 flex-1">
                <div className="article-research-title">ComparAITools Research Desk</div>
                <p className="article-research-copy">
                  This article is built from live search results, official product pages, structured
                  tool data, and editorial synthesis. Direct hands-on testing should only be claimed
                  when explicitly labeled elsewhere on the site.
                </p>
              </div>
            </div>

            <div className="article-research-meta">
              <span>Updated: {formatDate(post.updatedAt || post.publishedAt)}</span>
              {post.research?.provider ? <span>Provider: {post.research.provider}</span> : null}
              {typeof post.research?.evidenceScore === 'number' ? (
                <span>Evidence score: {post.research.evidenceScore}/100</span>
              ) : null}
            </div>
          </div>

          {post.keywords?.length ? (
            <div className="article-keywords">
              {post.keywords.slice(0, 8).map((kw) => (
                <span key={kw} className="article-keyword">
                  {kw}
                </span>
              ))}
            </div>
          ) : null}

          <article className="blog-content" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />

          {post.research?.sources?.length ? (
            <section
              className="article-sources-box"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="section-box-head">
                <h2 className="section-box-title">Research basis</h2>
                <p className="section-box-copy">
                  Top supporting sources used to shape the article.
                </p>
              </div>
              <ol className="sources-list">
                {post.research.sources.slice(0, 10).map((source) => (
                  <li key={source.url} className="source-item">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-link"
                    >
                      {source.title}
                    </a>
                    <div className="source-meta">
                      {source.domain}
                      {source.publishedAt ? ` · ${source.publishedAt}` : ''}
                    </div>
                    {source.snippet ? <div className="source-snippet">{source.snippet}</div> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {post.toolSlugs?.length ? (
            <section className="article-tools-box">
              <h2 className="section-box-title">Tools mentioned in this article</h2>
              <div className="article-tools-links">
                {post.toolSlugs.map((slug) => (
                  <Link key={slug} href={`/tools/${slug}`} className="article-tool-link">
                    View {slug} →
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="bottom-cta-box">
            <h2 className="bottom-cta-title">Compare AI tools side by side</h2>
            <p className="bottom-cta-copy">
              Not sure which tool wins for your workflow? Use the comparison engine to narrow the
              field fast.
            </p>
            <Link href="/compare" className="bottom-cta-button">
              Compare Tools Now →
            </Link>
          </section>

          {related.length > 0 ? (
            <section className="related-box">
              <h2 className="section-box-title">Related reading</h2>
              <div className="related-grid">
                {related.map((item) => (
                  <Link key={item.slug} href={`/blog/${item.slug}`} className="related-card">
                    <div className="related-title">{item.title}</div>
                    <div className="related-excerpt">{item.excerpt}</div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
            >
              ← Back to all articles
            </Link>
          </div>
        </main>

        <aside className="blog-sidebar-fixed">
          <div className="sidebar-stack">
            <div className="sidebar-cta-box">
              <h3 className="sidebar-cta-title">Compare AI tools</h3>
              <p className="sidebar-cta-copy">Find the right fit by workflow, budget, and goals.</p>
              <Link href="/compare" className="sidebar-cta-button">
                Compare Now →
              </Link>
            </div>

            {post.toolSlugs?.length ? (
              <div className="sidebar-card-box">
                <h3 className="sidebar-card-title">Tools in this article</h3>
                <div className="sidebar-tool-links">
                  {post.toolSlugs.map((slug) => (
                    <Link key={slug} href={`/tools/${slug}`} className="sidebar-tool-link">
                      <span>{slug}</span>
                      <span style={{ color: 'var(--accent)' }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="sidebar-card-box">
              <h3 className="sidebar-card-title">Page signals</h3>
              <div className="sidebar-signal-list">
                <span>{post.readingTime} min read</span>
                <span>{post.wordCount.toLocaleString()} words</span>
                <span>{TYPE_LABELS[post.type] ?? post.type}</span>
              </div>
            </div>

            <Link href="/blog" className="sidebar-back-link">
              ← All Articles
            </Link>
          </div>
        </aside>
      </div>

      <style>{`
        .blog-page-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 260px;
          gap: 44px;
          align-items: start;
        }
        .blog-main {
          min-width: 0;
        }
        .article-title {
          margin: 0 0 14px;
          font-size: clamp(2rem, 4vw, 3.25rem);
          line-height: 1.08;
          font-weight: 900;
          color: var(--text);
          letter-spacing: -0.03em;
        }
        .article-excerpt {
          margin: 0 0 18px;
          font-size: 15px;
          line-height: 1.8;
          color: var(--text-muted);
          max-width: 860px;
        }
        .article-research-box,
        .article-sources-box,
        .article-tools-box,
        .related-box {
          margin-top: 24px;
          padding: 22px;
          border-radius: 22px;
        }
        .article-research-head {
          display: flex;
          gap: 14px;
          align-items: start;
        }
        .article-research-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 4px;
        }
        .article-research-copy {
          font-size: 13px;
          line-height: 1.75;
          color: var(--text-muted);
          margin: 0;
        }
        .article-research-meta {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 14px;
        }
        .article-research-meta span {
          font-size: 12px;
          color: var(--text-dim);
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--bg);
        }
        .article-keywords {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 18px 0 8px;
        }
        .article-keyword {
          font-size: 11px;
          color: var(--text-dim);
          padding: 6px 10px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg-card);
        }
        .blog-content {
          color: var(--text-muted);
          line-height: 1.8;
          font-size: 16px;
          min-width: 0;
          word-wrap: break-word;
          overflow-wrap: break-word;
          margin-top: 22px;
        }
        .blog-content h1 {
          font-size: 1.75em;
          font-weight: 800;
          margin: 0 0 0.7em;
          color: var(--text);
          line-height: 1.25;
        }
        .blog-content h2 {
          font-size: 1.3em;
          font-weight: 700;
          margin: 2em 0 0.7em;
          color: var(--text);
          padding-bottom: 0.4em;
          border-bottom: 1px solid var(--border);
        }
        .blog-content h3 {
          font-size: 1.1em;
          font-weight: 700;
          margin: 1.5em 0 0.5em;
          color: var(--text);
        }
        .blog-content p {
          margin: 0 0 1.2em;
        }
        .blog-content ul,
        .blog-content ol {
          margin: 0 0 1.2em 1.5em;
          padding: 0;
        }
        .blog-content li {
          margin-bottom: 0.5em;
        }
        .blog-content a {
          color: var(--accent);
          text-decoration: underline;
        }
        .blog-content strong {
          font-weight: 700;
          color: var(--text);
        }
        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
          font-size: 14px;
          table-layout: fixed;
          word-wrap: break-word;
        }
        .blog-content th {
          background: var(--bg-card);
          padding: 10px 14px;
          text-align: left;
          font-weight: 700;
          border: 1px solid var(--border);
          color: var(--text);
        }
        .blog-content td {
          padding: 9px 14px;
          border: 1px solid var(--border);
          vertical-align: top;
          word-wrap: break-word;
        }
        .blog-content tr:nth-child(even) td {
          background: rgba(255,255,255,0.02);
        }
        .blog-content .quick-verdict,
        .blog-content .tldr-box,
        .blog-content .intro-section,
        .blog-content .intro-box,
        .blog-content .quick-picks-box,
        .blog-content .quick-picks,
        .blog-content .toc,
        .blog-content .prerequisites {
          padding: 18px 20px;
          border-radius: 14px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          margin: 1.2em 0 1.6em;
        }
        .blog-content .pros-cons-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin: 1em 0 1.5em;
        }
        .blog-content .pros {
          padding: 16px;
          border-radius: 12px;
          background: rgba(0,229,160,0.04);
          border: 1px solid rgba(0,229,160,0.16);
        }
        .blog-content .cons {
          padding: 16px;
          border-radius: 12px;
          background: rgba(239,68,68,0.04);
          border: 1px solid rgba(239,68,68,0.16);
        }
        .section-box-head {
          margin-bottom: 14px;
        }
        .section-box-title {
          margin: 0 0 6px;
          font-size: 20px;
          line-height: 1.2;
          color: var(--text);
          font-weight: 800;
        }
        .section-box-copy {
          margin: 0;
          font-size: 13px;
          line-height: 1.7;
          color: var(--text-dim);
        }
        .sources-list {
          margin: 0;
          padding-left: 18px;
        }
        .source-item {
          margin-bottom: 14px;
        }
        .source-link {
          color: var(--accent);
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
        }
        .source-link:hover {
          text-decoration: underline;
        }
        .source-meta {
          margin-top: 4px;
          font-size: 12px;
          color: var(--text-dim);
        }
        .source-snippet {
          margin-top: 6px;
          font-size: 13px;
          line-height: 1.75;
          color: var(--text-muted);
        }
        .article-tools-links {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .article-tool-link {
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-muted);
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg);
        }
        .article-tool-link:hover {
          color: var(--accent);
          border-color: rgba(0,229,160,0.25);
        }
        .bottom-cta-box {
          margin-top: 28px;
          padding: 32px 24px;
          border-radius: 24px;
          text-align: center;
          background: linear-gradient(135deg, var(--accent), var(--purple));
        }
        .bottom-cta-title {
          margin: 0 0 10px;
          color: var(--bg);
          font-size: 24px;
          font-weight: 900;
        }
        .bottom-cta-copy {
          margin: 0 0 16px;
          color: var(--bg);
          opacity: 0.88;
          font-size: 14px;
          line-height: 1.8;
        }
        .bottom-cta-button,
        .sidebar-cta-button {
          display: inline-block;
          text-decoration: none;
          font-size: 14px;
          font-weight: 800;
          padding: 12px 16px;
          border-radius: 14px;
          background: var(--bg);
          color: var(--accent);
        }
        .related-grid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        }
        .related-card {
          text-decoration: none;
          padding: 16px;
          border-radius: 16px;
          background: var(--bg);
          border: 1px solid var(--border);
        }
        .related-card:hover {
          border-color: rgba(0,229,160,0.25);
        }
        .related-title {
          font-size: 14px;
          line-height: 1.45;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
        }
        .related-excerpt {
          font-size: 12px;
          line-height: 1.7;
          color: var(--text-dim);
        }
        .blog-sidebar-fixed {
          min-width: 0;
        }
        .sidebar-stack {
          position: sticky;
          top: 82px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sidebar-cta-box {
          border-radius: 22px;
          padding: 18px;
          text-align: center;
          background: linear-gradient(135deg, var(--accent), var(--purple));
        }
        .sidebar-cta-title {
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 800;
          color: var(--bg);
        }
        .sidebar-cta-copy {
          margin: 0 0 12px;
          font-size: 12px;
          line-height: 1.7;
          color: var(--bg);
          opacity: 0.88;
        }
        .sidebar-card-box {
          border-radius: 20px;
          padding: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border);
        }
        .sidebar-card-title {
          margin: 0 0 12px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-dim);
        }
        .sidebar-tool-links,
        .sidebar-signal-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sidebar-tool-link {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 12px;
          text-decoration: none;
          color: var(--text-muted);
          border: 1px solid var(--border);
          background: var(--bg);
          font-size: 13px;
        }
        .sidebar-tool-link:hover {
          border-color: rgba(0,229,160,0.25);
          color: var(--accent);
        }
        .sidebar-signal-list span {
          font-size: 12px;
          color: var(--text-dim);
          padding: 9px 10px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg);
        }
        .sidebar-back-link {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 12px 14px;
          border-radius: 14px;
          text-decoration: none;
          color: var(--text-muted);
          border: 1px solid var(--border);
          background: var(--bg-card);
          font-size: 13px;
          font-weight: 700;
        }
        @media (max-width: 1024px) {
          .blog-page-wrapper {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .blog-sidebar-fixed {
            display: none;
          }
        }
        @media (max-width: 640px) {
          .blog-page-wrapper {
            padding: 24px 16px;
          }
          .blog-content {
            font-size: 15px;
          }
          .blog-content h1 {
            font-size: 1.45em;
          }
          .blog-content h2 {
            font-size: 1.2em;
          }
          .blog-content .pros-cons-grid {
            grid-template-columns: 1fr;
          }
          .blog-content table {
            display: block;
            overflow-x: auto;
            table-layout: auto;
          }
          .article-research-head {
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}
