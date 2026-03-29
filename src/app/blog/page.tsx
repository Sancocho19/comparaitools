import Link from 'next/link';
import { getAllPosts } from '@/lib/kv-storage';
import { formatDate } from '@/lib/utils';

export const revalidate = 3600;

export default async function BlogIndexPage() {
  const posts = await getAllPosts(50);

  return (
    <>
      <div className="grain-overlay" />
      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(10,10,15,0.92)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black" style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))', color: 'var(--bg)' }}>C</div><span className="font-extrabold text-lg" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}><span className="text-[var(--accent)]">Compar</span><span className="text-[var(--text)]">AITools</span></span></Link>
          <div className="hidden md:flex gap-6 items-center"><Link href="/tools" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)]">Tools</Link><Link href="/compare" className="text-[var(--text-muted)] text-[13px] font-medium hover:text-[var(--accent)]">Compare</Link><Link href="/blog" className="text-[var(--accent)] text-[13px] font-medium">Blog</Link></div>
        </div>
      </nav>
      <main className="max-w-[960px] mx-auto px-6 py-12 relative z-10">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-4"><Link href="/" className="hover:text-[var(--accent)]">Home</Link><span>/</span><span className="text-[var(--text-muted)]">Blog</span></div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text)] mb-3" style={{ fontFamily: 'var(--font-mono)' }}>Research-led buying guides and comparisons</h1>
          <p className="text-[var(--text-muted)] text-[15px] max-w-xl">Built from live search results, official product pages, and structured tool data so the site can scale without becoming fluff.</p>
        </div>
        <div className="grid gap-4">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-2xl p-6 transition-all hover:scale-[1.01]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'none' }}>
              <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-[var(--text-dim)]"><span className="px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,229,160,0.1)', color: 'var(--accent)' }}>{post.type}</span><span>{formatDate(post.publishedAt)}</span><span>{post.readingTime} min read</span></div>
              <h2 className="text-[var(--text)] text-xl font-bold mb-2">{post.title}</h2>
              <p className="text-[var(--text-muted)] text-sm leading-6">{post.excerpt}</p>
            </Link>
          ))}
          {!posts.length ? <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>No posts yet. Run the generation endpoint after configuring your search and model keys.</div> : null}
        </div>
      </main>
    </>
  );
}
