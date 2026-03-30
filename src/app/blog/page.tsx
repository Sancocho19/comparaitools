import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/kv-storage';
import { formatDate } from '@/lib/utils';
import { SITE_URL } from '@/lib/site';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'AI Tools Blog: Reviews, Comparisons & Guides 2026 | ComparAITools',
  description:
    'Research-backed AI tool reviews, comparisons, pricing guides, and practical tutorials to help you choose the right software faster.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'AI Tools Blog | ComparAITools',
    description:
      'Research-backed AI tool reviews, comparisons, pricing guides, and practical tutorials.',
    url: `${SITE_URL}/blog`,
    type: 'website',
    siteName: 'ComparAITools',
  },
};

type BlogPost = Awaited<ReturnType<typeof getAllPosts>>[number];

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  review: { label: 'Review', color: '#00e5a0' },
  comparison: { label: 'Comparison', color: '#a78bfa' },
  roundup: { label: 'Best Of', color: '#10b981' },
  guide: { label: 'Guide', color: '#f59e0b' },
  pricing: { label: 'Pricing', color: '#ef4444' },
  opinion: { label: 'Opinion', color: '#f43f5e' },
};

function PostCard({ post }: { post: BlogPost }) {
  const typeInfo = TYPE_LABELS[post.type] ?? { label: post.type, color: '#6b7280' };

  return (
    <article className="post-card">
      <div className="post-card-top">
        <span
          className="post-badge"
          style={{
            background: `${typeInfo.color}18`,
            color: typeInfo.color,
            border: `1px solid ${typeInfo.color}30`,
          }}
        >
          {typeInfo.label}
        </span>
        <time className="post-meta">{formatDate(post.publishedAt)}</time>
        <span className="post-meta">· {post.readingTime} min read</span>
      </div>

      <h2 className="post-title">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>

      {post.excerpt ? <p className="post-excerpt">{post.excerpt}</p> : null}

      <div className="post-footer">
        <div className="post-tags">
          {post.toolSlugs?.slice(0, 3).map((slug) => (
            <Link key={slug} href={`/tools/${slug}`} className="post-tag-link">
              {slug}
            </Link>
          ))}
        </div>
        <Link href={`/blog/${post.slug}`} className="post-readmore">
          Read article →
        </Link>
      </div>
    </article>
  );
}

export default async function BlogIndexPage() {
  const posts = await getAllPosts(60);

  const reviews = posts.filter((p) => p.type === 'review');
  const comparisons = posts.filter((p) => p.type === 'comparison');
  const roundups = posts.filter((p) => p.type === 'roundup');
  const guides = posts.filter((p) => p.type === 'guide' || p.type === 'pricing');
  const opinions = posts.filter((p) => p.category === 'opinion');
  const featured = posts.slice(0, 3);

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'ComparAITools Blog',
    description:
      'Research-backed AI tool reviews, comparisons, pricing guides, and practical tutorials.',
    url: `${SITE_URL}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'ComparAITools',
      url: SITE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
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

      <main className="max-w-[1200px] mx-auto px-6 py-12 relative z-10">
        <div className="blog-hero">
          <div className="hero-copy">
            <div className="hero-breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <span>Blog</span>
            </div>

            <div className="hero-chip">Research-backed content</div>

            <h1 className="hero-title">
              <span className="text-[var(--accent)]">AI Tools</span>{' '}
              <span className="text-[var(--text)]">Blog</span>
            </h1>

            <p className="hero-description">
              High-intent reviews, comparisons, pricing breakdowns, and buying guides built from
              live search signals, official product pages, and structured tool data.
            </p>

            <div className="hero-actions">
              <Link href="/compare" className="hero-button-primary">
                Compare Tools Now →
              </Link>
              <Link href="/tools" className="hero-button-secondary">
                Browse All Tools
              </Link>
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-card-label">Editorial system</div>
            <h2 className="hero-card-title">Scaled with data, not fluff</h2>
            <p className="hero-card-copy">
              Every article should help someone make a better software decision faster. The content
              can scale, but it still needs real sources, real intent, and real usefulness.
            </p>
            <div className="hero-card-points">
              <span>Live-source research</span>
              <span>Commercial intent focus</span>
              <span>Human-style structure</span>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          {[
            { label: 'Reviews', count: reviews.length, color: '#00e5a0' },
            { label: 'Comparisons', count: comparisons.length, color: '#a78bfa' },
            { label: 'Best-of Lists', count: roundups.length, color: '#10b981' },
            { label: 'Guides', count: guides.length, color: '#f59e0b' },
            { label: 'Opinions', count: opinions.length, color: '#f43f5e' },
          ].map(({ label, count, color }) => (
            <div key={label} className="stats-card">
              <div className="stats-number" style={{ color }}>
                {count}
              </div>
              <div className="stats-label">{label}</div>
            </div>
          ))}
        </div>

        {featured.length > 0 ? (
          <section className="mb-12">
            <div className="section-head">
              <h2 className="section-title">Featured articles</h2>
              <p className="section-subtitle">Strong pages to push internally and externally.</p>
            </div>
            <div className="blog-grid featured-grid">
              {featured.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </section>
        ) : null}

        {opinions.length > 0 ? (
          <section className="mb-12">
            <div className="section-head">
              <div className="flex items-center gap-3">
                <h2 className="section-title">Trending opinions</h2>
                <span className="hot-badge">HOT</span>
              </div>
              <p className="section-subtitle">Fast takes for changes worth paying attention to.</p>
            </div>
            <div className="blog-grid">
              {opinions.slice(0, 3).map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <div className="section-head">
            <h2 className="section-title">Latest articles</h2>
            <p className="section-subtitle">
              Articles designed to rank on intent, convert on clarity, and stay useful as the tool
              market changes.
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">No posts yet.</p>
              <p className="empty-copy">
                Run your generation endpoint after configuring the model, search provider, and KV
                store.
              </p>
            </div>
          ) : (
            <div className="blog-grid">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </section>

        <section className="blog-cta">
          <h2 className="blog-cta-title">Compare AI tools side by side</h2>
          <p className="blog-cta-copy">
            Not sure which tool to choose? Use the comparison engine to find the best fit for your
            workflow, budget, and team size.
          </p>
          <Link href="/compare" className="blog-cta-button">
            Compare Tools Now →
          </Link>
        </section>
      </main>

      <style>{`
        .blog-hero {
          display: grid;
          grid-template-columns: 1.4fr 0.9fr;
          gap: 24px;
          align-items: stretch;
          margin-bottom: 32px;
        }
        .hero-copy,
        .hero-card {
          border-radius: 24px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          padding: 28px;
        }
        .hero-copy {
          background:
            radial-gradient(circle at top left, rgba(0,229,160,0.08), transparent 40%),
            var(--bg-card);
        }
        .hero-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-dim);
          margin-bottom: 14px;
        }
        .hero-breadcrumb a {
          color: var(--text-dim);
          text-decoration: none;
        }
        .hero-breadcrumb a:hover {
          color: var(--accent);
        }
        .hero-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--accent);
          background: rgba(0,229,160,0.1);
          border: 1px solid rgba(0,229,160,0.18);
          margin-bottom: 16px;
        }
        .hero-title {
          font-size: 44px;
          line-height: 1.05;
          font-weight: 900;
          margin: 0 0 14px;
          font-family: var(--font-mono);
        }
        .hero-description {
          font-size: 15px;
          line-height: 1.8;
          color: var(--text-muted);
          max-width: 720px;
          margin: 0 0 20px;
        }
        .hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hero-button-primary,
        .hero-button-secondary,
        .blog-cta-button {
          text-decoration: none;
          border-radius: 14px;
          font-weight: 800;
          font-size: 14px;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .hero-button-primary:hover,
        .hero-button-secondary:hover,
        .blog-cta-button:hover {
          transform: translateY(-1px);
        }
        .hero-button-primary {
          padding: 13px 18px;
          background: linear-gradient(135deg, var(--accent), var(--purple));
          color: var(--bg);
        }
        .hero-button-secondary {
          padding: 13px 18px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text);
        }
        .hero-card-label {
          display: inline-block;
          margin-bottom: 12px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-dim);
        }
        .hero-card-title {
          font-size: 22px;
          line-height: 1.25;
          color: var(--text);
          margin: 0 0 12px;
          font-weight: 800;
        }
        .hero-card-copy {
          font-size: 14px;
          line-height: 1.8;
          color: var(--text-muted);
          margin: 0 0 18px;
        }
        .hero-card-points {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .hero-card-points span {
          font-size: 12px;
          color: var(--text-dim);
          border: 1px solid var(--border);
          background: var(--bg);
          padding: 8px 10px;
          border-radius: 12px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 40px;
        }
        .stats-card {
          text-align: center;
          padding: 18px;
          border-radius: 18px;
          border: 1px solid var(--border);
          background: var(--bg-card);
        }
        .stats-number {
          font-size: 32px;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 6px;
          font-family: var(--font-mono);
        }
        .stats-label {
          font-size: 12px;
          color: var(--text-dim);
        }
        .section-head {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }
        .section-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--text);
          margin: 0;
        }
        .section-subtitle {
          font-size: 13px;
          color: var(--text-dim);
          margin: 0;
        }
        .hot-badge {
          font-size: 11px;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 800;
          color: #f43f5e;
          background: rgba(244,63,94,0.1);
          border: 1px solid rgba(244,63,94,0.2);
        }
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .featured-grid .post-card {
          min-height: 240px;
        }
        .post-card {
          display: flex;
          flex-direction: column;
          padding: 22px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
          min-height: 220px;
        }
        .post-card:hover {
          transform: translateY(-2px);
          border-color: rgba(0,229,160,0.35);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
        }
        .post-card-top {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .post-badge {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 4px 10px;
          border-radius: 999px;
        }
        .post-meta {
          font-size: 12px;
          color: var(--text-dim);
        }
        .post-title {
          margin: 0 0 10px;
          font-size: 19px;
          line-height: 1.35;
          font-weight: 800;
        }
        .post-title a {
          color: var(--text);
          text-decoration: none;
        }
        .post-title a:hover {
          color: var(--accent);
        }
        .post-excerpt {
          margin: 0 0 18px;
          font-size: 14px;
          line-height: 1.75;
          color: var(--text-muted);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .post-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: end;
        }
        .post-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .post-tag-link {
          font-size: 11px;
          text-decoration: none;
          color: var(--text-dim);
          padding: 5px 8px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.01);
        }
        .post-tag-link:hover {
          color: var(--accent);
          border-color: rgba(0,229,160,0.22);
        }
        .post-readmore {
          white-space: nowrap;
          font-size: 12px;
          font-weight: 700;
          color: var(--accent);
          text-decoration: none;
        }
        .empty-state {
          padding: 26px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: var(--bg-card);
        }
        .empty-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text);
          margin: 0 0 6px;
        }
        .empty-copy {
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-muted);
          margin: 0;
        }
        .blog-cta {
          margin-top: 42px;
          border-radius: 24px;
          text-align: center;
          padding: 40px 24px;
          background: linear-gradient(135deg, var(--accent), var(--purple));
        }
        .blog-cta-title {
          margin: 0 0 10px;
          color: var(--bg);
          font-size: 30px;
          line-height: 1.15;
          font-weight: 900;
        }
        .blog-cta-copy {
          max-width: 680px;
          margin: 0 auto 18px;
          color: var(--bg);
          opacity: 0.88;
          font-size: 14px;
          line-height: 1.8;
        }
        .blog-cta-button {
          display: inline-block;
          padding: 14px 20px;
          background: var(--bg);
          color: var(--accent);
        }
        @media (max-width: 1024px) {
          .blog-hero {
            grid-template-columns: 1fr;
          }
          .stats-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .hero-copy,
          .hero-card {
            padding: 22px;
          }
          .hero-title {
            font-size: 34px;
          }
          .section-head {
            align-items: start;
            flex-direction: column;
          }
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .blog-grid {
            grid-template-columns: 1fr;
          }
          .post-footer {
            flex-direction: column;
            align-items: start;
          }
          .blog-cta-title {
            font-size: 24px;
          }
        }
      `}</style>
    </>
  );
}
