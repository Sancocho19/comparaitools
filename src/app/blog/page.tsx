// src/app/blog/page.tsx

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Metadata } from 'next';
import Link from 'next/link';
import { getManifest } from '@/lib/kv-storage';
import type { ManifestEntry } from '@/lib/kv-storage';

export const metadata: Metadata = {
  title: 'AI Tools Blog: Reviews, Comparisons & Guides 2026 | comparaitools.com',
  description: 'Expert AI tool reviews, in-depth comparisons, and practical guides. Stay ahead with the latest analysis on ChatGPT, Claude, Midjourney, and more.',
  openGraph: {
    title: 'AI Tools Blog | comparaitools.com',
    description: 'Expert reviews, comparisons & guides for the best AI tools in 2026.',
    url: 'https://comparaitools.com/blog',
    type: 'website',
  },
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  review:     { label: 'Review',      color: '#00e5a0' },
  comparison: { label: 'Comparison',  color: '#a78bfa' },
  roundup:    { label: 'Best Of',     color: '#10b981' },
  guide:      { label: 'Guide',       color: '#f59e0b' },
  pricing:    { label: 'Pricing',     color: '#ef4444' },
  opinion:    { label: 'Opinion',     color: '#f43f5e' },
};

function PostCard({ post }: { post: ManifestEntry }) {
  const typeInfo = TYPE_LABELS[post.type] ?? { label: post.type, color: '#6b7280' };
  const date = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <article className="post-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{
          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', padding: '3px 9px', borderRadius: '20px',
          background: typeInfo.color + '18', color: typeInfo.color,
          border: `1px solid ${typeInfo.color}30`,
        }}>
          {typeInfo.label}
        </span>
        <time style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{date}</time>
      </div>

      <h2 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, lineHeight: 1.4 }}>
        <Link href={`/blog/${post.slug}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
          {post.title}
        </Link>
      </h2>

      {post.excerpt && (
        <p style={{
          margin: '0 0 16px', fontSize: '13px', color: 'var(--text-muted)',
          lineHeight: 1.6, display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.excerpt}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {post.toolSlugs.slice(0, 3).map(slug => (
            <Link key={slug} href={`/tools/${slug}`} style={{
              fontSize: '11px', color: 'var(--text-dim)', textDecoration: 'none',
              padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--border)',
            }}>
              {slug}
            </Link>
          ))}
        </div>
        <Link href={`/blog/${post.slug}`} style={{
          fontSize: '12px', color: 'var(--accent)', textDecoration: 'none',
          fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '8px',
        }}>
          Read more →
        </Link>
      </div>
    </article>
  );
}

export default async function BlogPage() {
  const manifest = await getManifest();
  const sorted = [...manifest].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const reviews     = sorted.filter(p => p.type === 'review');
  const comparisons = sorted.filter(p => p.type === 'comparison');
  const roundups    = sorted.filter(p => p.type === 'roundup');
  const guides      = sorted.filter(p => p.type === 'guide' || p.type === 'pricing');
  const opinions    = sorted.filter(p => p.category === 'opinion');

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'comparaitools.com Blog',
    description: 'Expert AI tool reviews, comparisons, and guides',
    url: 'https://comparaitools.com/blog',
    publisher: { '@type': 'Organization', name: 'comparaitools.com', url: 'https://comparaitools.com' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />

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

      <main className="max-w-[1200px] mx-auto px-6 py-12 relative z-10">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
            <span className="text-[var(--accent)]">AI Tools</span>
            <span className="text-[var(--text)]"> Blog</span>
          </h1>
          <p className="text-[15px] text-[var(--text-muted)] max-w-xl mx-auto">
            Expert reviews, in-depth comparisons, and practical guides for the best AI tools in 2026
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-12">
          {[
            { label: 'Reviews',      count: reviews.length,     color: '#00e5a0' },
            { label: 'Comparisons',  count: comparisons.length, color: '#a78bfa' },
            { label: 'Best-of Lists',count: roundups.length,    color: '#10b981' },
            { label: 'Guides',       count: guides.length,      color: '#f59e0b' },
            { label: 'Opinions',     count: opinions.length,    color: '#f43f5e' },
          ].map(({ label, count, color }) => (
            <div key={label} className="text-center p-4 rounded-2xl"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div className="text-3xl font-extrabold mb-1" style={{ color, fontFamily: 'var(--font-mono)' }}>{count}</div>
              <div className="text-[12px] text-[var(--text-dim)]">{label}</div>
            </div>
          ))}
        </div>

        {/* Articles */}
        {sorted.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <p className="text-lg mb-2">Content is being generated. Check back soon!</p>
            <p className="text-[13px] text-[var(--text-dim)]">Our AI generates new articles automatically every day.</p>
          </div>
        ) : (
          <>
            {/* Opinion/Trending — destacados arriba */}
            {opinions.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-xl font-bold text-[var(--text)]">🔥 Trending Opinions</h2>
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-bold"
                    style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>
                    HOT
                  </span>
                </div>
                <div className="blog-grid mb-10">
                  {opinions.slice(0, 3).map(post => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </div>
              </>
            )}

            <h2 className="text-xl font-bold mb-6 text-[var(--text)]">Latest Articles</h2>
            <div className="blog-grid mb-12">
              {sorted.filter(p => p.category !== 'opinion').map(post => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        <div className="text-center p-10 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))' }}>
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--bg)' }}>
            Compare AI Tools Side by Side
          </h2>
          <p className="mb-6 text-sm opacity-85" style={{ color: 'var(--bg)' }}>
            Not sure which tool to choose? Use our comparison tool to find the perfect fit.
          </p>
          <Link href="/compare"
            className="inline-block px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{ background: 'var(--bg)', color: 'var(--accent)', textDecoration: 'none' }}>
            Compare Tools Now →
          </Link>
        </div>

      </main>

      <style>{`
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .post-card {
          display: flex;
          flex-direction: column;
          border-radius: 16px;
          border: 1px solid var(--border);
          padding: 20px;
          background: var(--bg-card);
          transition: border-color 0.2s, transform 0.2s;
          cursor: pointer;
        }
        .post-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
        }
        @media (max-width: 640px) {
          .blog-grid { grid-template-columns: 1fr; }
          .grid.grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </>
  );
}
