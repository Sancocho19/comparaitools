// src/app/blog/page.tsx
// Crea la carpeta: src/app/blog/ y pon este archivo dentro como page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { getManifest } from '@/lib/kv-storage';
import type { ManifestEntry } from '@/lib/kv-storage';

export const revalidate = 3600; // Re-genera cada hora

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
  review:     { label: 'Review',      color: '#3b82f6' },
  comparison: { label: 'Comparison',  color: '#8b5cf6' },
  roundup:    { label: 'Best Of',     color: '#10b981' },
  guide:      { label: 'Guide',       color: '#f59e0b' },
  pricing:    { label: 'Pricing',     color: '#ef4444' },
};

function PostCard({ post }: { post: ManifestEntry }) {
  const typeInfo = TYPE_LABELS[post.type] ?? { label: post.type, color: '#6b7280' };
  const date = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <article style={{
      borderRadius: '12px',
      border: '1px solid var(--color-border-tertiary)',
      padding: '24px',
      background: 'var(--color-background-secondary)',
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '3px 8px',
          borderRadius: '4px',
          background: typeInfo.color + '20',
          color: typeInfo.color,
        }}>
          {typeInfo.label}
        </span>
        <time style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {date}
        </time>
      </div>

      <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600, lineHeight: 1.4 }}>
        <Link
          href={`/blog/${post.slug}`}
          style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }}
        >
          {post.title}
        </Link>
      </h2>

      {post.excerpt && (
        <p style={{
          margin: '0 0 16px',
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {post.excerpt}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {post.toolSlugs.slice(0, 3).map(slug => (
            <Link
              key={slug}
              href={`/tools/${slug}`}
              style={{
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid var(--color-border-tertiary)',
              }}
            >
              {slug}
            </Link>
          ))}
        </div>
        <Link
          href={`/blog/${post.slug}`}
          style={{ fontSize: '13px', color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
        >
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

  const reviews    = sorted.filter(p => p.type === 'review');
  const comparisons= sorted.filter(p => p.type === 'comparison');
  const roundups   = sorted.filter(p => p.type === 'roundup');
  const guides     = sorted.filter(p => p.type === 'guide' || p.type === 'pricing');

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'comparaitools.com Blog',
    description: 'Expert AI tool reviews, comparisons, and guides',
    url: 'https://comparaitools.com/blog',
    publisher: {
      '@type': 'Organization',
      name: 'comparaitools.com',
      url: 'https://comparaitools.com',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 700, margin: '0 0 12px' }}>
            AI Tools Blog
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Expert reviews, in-depth comparisons, and practical guides for the best AI tools in 2026
          </p>
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '48px',
        }}>
          {[
            { label: 'Reviews', count: reviews.length, color: '#3b82f6' },
            { label: 'Comparisons', count: comparisons.length, color: '#8b5cf6' },
            { label: 'Best-of Lists', count: roundups.length, color: '#10b981' },
            { label: 'Guides', count: guides.length, color: '#f59e0b' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border-tertiary)',
              background: 'var(--color-background-secondary)',
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color }}>{count}</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Latest posts — all mixed */}
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--color-text-secondary)' }}>
            <p>Content is being generated. Check back soon!</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>
              Our AI generates new articles automatically every day.
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '24px' }}>
              Latest Articles
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '24px',
              marginBottom: '48px',
            }}>
              {sorted.map(post => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        <div style={{
          textAlign: 'center',
          padding: '40px',
          borderRadius: '12px',
          background: 'var(--color-background-secondary)',
          border: '1px solid var(--color-border-tertiary)',
        }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '22px' }}>
            Compare AI Tools Side by Side
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 24px' }}>
            Not sure which tool to choose? Use our comparison tool to find the perfect fit.
          </p>
          <Link
            href="/compare"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: '#3b82f6',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Compare Tools Now →
          </Link>
        </div>
      </main>
    </>
  );
}
