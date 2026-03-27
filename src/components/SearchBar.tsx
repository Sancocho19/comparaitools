// src/components/SearchBar.tsx
// Buscador global — agrega en el navbar de todas las páginas

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface SearchResult {
  tools: { slug: string; name: string; logo: string; description: string; category: string; pricing: string; rating: number }[];
  posts: { slug: string; title: string; type: string; publishedAt: string; excerpt: string }[];
  total: number;
  query: string;
}

const TYPE_COLORS: Record<string, string> = {
  review: '#3b82f6', comparison: '#8b5cf6',
  roundup: '#10b981', guide: '#f59e0b', pricing: '#ef4444',
};

export default function SearchBar() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults(null); setOpen(false); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } catch {}
      finally { setLoading(false); }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const hasResults = results && (results.tools.length > 0 || results.posts.length > 0);

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 12px', borderRadius: '10px',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        transition: 'border-color 0.2s',
      }}>
        <span style={{ fontSize: '14px', opacity: 0.5 }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search AI tools..."
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            fontSize: '13px', color: 'var(--text)', fontFamily: 'inherit',
          }}
        />
        {loading && (
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>...</span>
        )}
        {!loading && (
          <kbd style={{
            fontSize: '10px', padding: '1px 5px', borderRadius: '4px',
            background: 'var(--bg)', border: '1px solid var(--border)',
            color: 'var(--text-dim)', fontFamily: 'var(--font-mono)',
          }}>⌘K</kbd>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          zIndex: 1000, overflow: 'hidden', minWidth: '360px',
        }}>
          {/* No results */}
          {!hasResults && !loading && (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-dim)' }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Tools results */}
          {results && results.tools.length > 0 && (
            <div>
              <div style={{
                padding: '8px 14px 4px', fontSize: '10px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)',
              }}>
                AI Tools
              </div>
              {results.tools.map(tool => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  onClick={() => { setOpen(false); setQuery(''); }}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px', transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>{tool.logo}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{tool.name}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{tool.category}</span>
                      </div>
                      <p style={{
                        margin: 0, fontSize: '12px', color: 'var(--text-muted)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{tool.description}</p>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>★ {tool.rating}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{tool.pricing.split('/')[0].trim()}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Divider */}
          {results && results.tools.length > 0 && results.posts.length > 0 && (
            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
          )}

          {/* Blog results */}
          {results && results.posts.length > 0 && (
            <div>
              <div style={{
                padding: '8px 14px 4px', fontSize: '10px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)',
              }}>
                Articles
              </div>
              {results.posts.map(post => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  onClick={() => { setOpen(false); setQuery(''); }}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '10px 14px', transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{
                      fontSize: '9px', fontWeight: 700, padding: '2px 6px',
                      borderRadius: '4px', flexShrink: 0, marginTop: '2px',
                      background: (TYPE_COLORS[post.type] ?? '#6b7280') + '20',
                      color: TYPE_COLORS[post.type] ?? '#6b7280',
                    }}>
                      {post.type.toUpperCase()}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: '0 0 2px', fontSize: '13px', fontWeight: 500,
                        color: 'var(--text)', lineHeight: 1.3,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{post.title}</p>
                      <p style={{
                        margin: 0, fontSize: '11px', color: 'var(--text-dim)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{post.excerpt}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Footer */}
          {hasResults && (
            <div style={{
              padding: '8px 14px', borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                {results!.total} results for &ldquo;{results!.query}&rdquo;
              </span>
              <Link
                href={`/tools?q=${encodeURIComponent(query)}`}
                onClick={() => { setOpen(false); setQuery(''); }}
                style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
              >
                See all →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
