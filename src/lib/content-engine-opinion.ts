// AÑADIR AL FINAL DE content-engine.ts — justo antes del export function buildPrompt

// ─── TRENDING OPINION TOPICS ─────────────────────────────────────────────────
// Artículos controversiales y de alto impacto que generan shares y backlinks

const OPINION_TOPICS = [
  // Controversiales sobre herramientas específicas
  { slug: `chatgpt-is-losing-ground-${YEAR}`,         title: `Is ChatGPT Losing Its Edge in ${YEAR}? The Data Says Yes`,                    tools: ['chatgpt', 'claude', 'gemini'] },
  { slug: `ai-tools-not-worth-paying-${YEAR}`,        title: `5 AI Tools That Aren't Worth Paying For in ${YEAR} (Honest Take)`,            tools: ['jasper', 'chatgpt', 'midjourney'] },
  { slug: `claude-vs-chatgpt-winner-${YEAR}`,         title: `Claude vs ChatGPT in ${YEAR}: We Finally Have a Clear Winner`,               tools: ['claude', 'chatgpt'] },
  { slug: `midjourney-overrated-${YEAR}`,             title: `Is Midjourney Overrated in ${YEAR}? We Tested 5 Alternatives`,               tools: ['midjourney', 'dall-e-3'] },
  { slug: `ai-tools-replacing-jobs-${YEAR}`,          title: `Which AI Tools Are Actually Replacing Jobs in ${YEAR}? Real Data`,           tools: ['chatgpt', 'cursor', 'jasper'] },
  { slug: `perplexity-killing-google-${YEAR}`,        title: `Perplexity Is Quietly Killing Google Search in ${YEAR}`,                     tools: ['perplexity'] },
  { slug: `cursor-better-than-copilot-${YEAR}`,       title: `Cursor vs GitHub Copilot: Why Developers Are Switching in ${YEAR}`,          tools: ['cursor', 'github-copilot'] },
  { slug: `ai-tools-privacy-risks-${YEAR}`,           title: `The AI Tools Privacy Problem Nobody Talks About in ${YEAR}`,                 tools: ['chatgpt', 'claude', 'gemini'] },
  { slug: `free-ai-tools-vs-paid-${YEAR}`,            title: `Free AI Tools vs Paid in ${YEAR}: Are Premium Plans Worth It?`,              tools: ['chatgpt', 'claude', 'midjourney'] },
  { slug: `ai-bubble-which-tools-survive-${YEAR}`,    title: `The AI Bubble: Which Tools Will Survive Beyond ${YEAR}?`,                    tools: ['chatgpt', 'midjourney', 'jasper'] },
  { slug: `gemini-underrated-${YEAR}`,                title: `Why Gemini Is the Most Underrated AI Tool of ${YEAR}`,                       tools: ['gemini', 'chatgpt', 'claude'] },
  { slug: `suno-changing-music-industry-${YEAR}`,     title: `Suno Is Changing the Music Industry Forever — What It Means for Creators`,   tools: ['suno', 'elevenlabs'] },
  { slug: `ai-tools-for-small-business-${YEAR}`,      title: `Best AI Tools for Small Business in ${YEAR}: No Hype, Just ROI`,             tools: ['chatgpt', 'jasper', 'cursor'] },
  { slug: `runway-ml-vs-sora-${YEAR}`,                title: `Runway ML vs Sora: The AI Video War of ${YEAR}`,                             tools: ['runway-ml'] },
  { slug: `elevenlabs-voice-cloning-ethics-${YEAR}`,  title: `ElevenLabs Voice Cloning Is Getting Scary Good — And That's a Problem`,      tools: ['elevenlabs'] },
  { slug: `ai-tools-productivity-myth-${YEAR}`,       title: `The AI Productivity Myth: Do These Tools Actually Save Time?`,               tools: ['chatgpt', 'cursor', 'perplexity'] },
  { slug: `chatgpt-vs-human-writers-${YEAR}`,         title: `ChatGPT vs Human Writers in ${YEAR}: We Ran a Blind Test`,                   tools: ['chatgpt', 'jasper'] },
  { slug: `best-ai-stack-${YEAR}`,                    title: `The Perfect AI Tool Stack for ${YEAR}: What We Actually Use Daily`,          tools: ['chatgpt', 'cursor', 'perplexity', 'midjourney'] },
  { slug: `ai-tools-too-expensive-${YEAR}`,           title: `AI Tools Are Getting Too Expensive in ${YEAR} — Here's the Math`,            tools: ['chatgpt', 'midjourney', 'jasper'] },
  { slug: `dall-e-vs-midjourney-${YEAR}`,             title: `DALL-E 3 vs Midjourney in ${YEAR}: Which Produces Better Images? (We Tested 50 Prompts)`, tools: ['dall-e-3', 'midjourney'] },
];

export interface OpinionDecision {
  type: 'opinion';
  slug: string;
  title: string;
  toolSlugs: string[];
}

export function selectOpinionTopic(publishedSlugs: string[]): OpinionDecision | null {
  const unpublished = OPINION_TOPICS.filter(t => !publishedSlugs.includes(t.slug));
  if (unpublished.length === 0) return null;
  // Rotar en orden para no repetir
  const topic = unpublished[0];
  return {
    type: 'opinion',
    slug: topic.slug,
    title: topic.title,
    toolSlugs: topic.tools,
  };
}

export function buildOpinionPrompt(decision: OpinionDecision): string {
  const toolLinks = decision.toolSlugs
    .map(s => `<a href="/tools/${s}">${s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</a>`)
    .join(', ');

  const relatedComparisons = decision.toolSlugs.slice(0, 2).reduce((acc, s, i, arr) => {
    if (i < arr.length - 1) {
      const [a, b] = [s, arr[i+1]].sort();
      acc.push(`<a href="/compare/${a}-vs-${b}-${YEAR}">${s} vs ${arr[i+1]} comparison</a>`);
    }
    return acc;
  }, [] as string[]).join(' · ');

  return `You are Alex Morgan, founder of comparaitools.com and a senior AI tools analyst with 5+ years of hands-on experience. Write a high-impact, opinionated article that will generate shares, debate, and backlinks.

ARTICLE TITLE: "${decision.title}"
TOOLS TO COVER: ${decision.toolSlugs.join(', ')}
DATE: ${TODAY}

═══ WRITING STYLE ═══
- Bold, direct opinions backed by data — not wishy-washy "it depends" answers
- First person: "I've been testing this for months", "here's what I actually found"
- Acknowledge the controversial angle directly — don't shy away from it
- Be fair but decisive — take a clear position by the end
- Write like a smart tech journalist, not a corporate blog
- Include at least 3 specific data points, numbers, or test results

═══ SEO STRATEGY ═══
PRIMARY KEYWORD: "${decision.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').substring(0, 60)}"
Use naturally 5-7 times throughout the article.
SEARCH INTENT: Someone who has heard debate about this topic and wants a definitive answer.

═══ E-E-A-T SIGNALS ═══
- "After [X weeks/months] of testing..."
- "When I ran [specific test]..."
- "The data shows..."
- "In my experience reviewing [N] AI tools..."
- Last Updated: ${TODAY}

═══ INTERNAL LINKS (include all) ═══
Tool pages: ${toolLinks}
Comparisons: ${relatedComparisons}
Blog: <a href="/blog">More AI tool analysis →</a>

OUTPUT: ONLY clean semantic HTML <article>...</article>. NO markdown. Minimum 1,600 words.

<article>

<div class="last-updated">Last Updated: ${TODAY} · By Alex Morgan, comparaitools.com</div>

<h1>${decision.title}</h1>

<div class="quick-verdict">
<h2>The Short Answer</h2>
<p>[2-3 sentences giving the direct, opinionated answer upfront — no hedging. Readers want to know your position immediately.]</p>
</div>

<h2>Why This Question Matters in ${YEAR}</h2>
[150 words: Set the context. Why is this debate happening now? What's changed recently? Use real trends and numbers. Make the reader feel this is timely and relevant.]

<h2>[First major argument/point — make it specific and data-driven]</h2>
[300 words: Your strongest argument. Include: "When I tested this...", specific metrics or comparisons, what most people get wrong about this topic, internal links to relevant tool pages.]

<h2>[Second major argument — the nuance or counterpoint]</h2>
[250 words: Present the other side fairly, then explain why you still hold your position. This builds trust. Reference specific user scenarios. Include comparison links.]

<h2>[Third point — the practical implications]</h2>
[250 words: What does this mean for the reader? What should they actually DO with this information? Specific action items. Who is affected most?]

<h2>The Data: What Actually Shows in ${YEAR}</h2>
[200 words: Present 3-5 concrete data points: growth trends, pricing changes, user numbers, feature comparisons. Reference the tools directly with links: ${toolLinks}. Make this section feel like original research.]

<h2>My Verdict: Here's Exactly What I Recommend</h2>
[200 words: Clear, direct recommendation. No "it depends" without specifics. "If you [specific situation], do X. If you [other situation], do Y." Name the winner or the right answer. Be bold.]

<h2>Frequently Asked Questions</h2>
<div itemscope itemtype="https://schema.org/FAQPage">

<div itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">[Direct question version of the article's main controversy]</h3>
<div itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Direct 2-3 sentence answer]</p></div>
</div>

<div itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">[Follow-up question readers will have]</h3>
<div itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Specific answer with recommendation]</p></div>
</div>

<div itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">[Practical "what should I do" question]</h3>
<div itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Actionable answer]</p></div>
</div>

</div>

<div class="cta-box">
<p>📊 See the full data: ${toolLinks}</p>
<p>🔍 Compare head-to-head: ${relatedComparisons || `<a href="/compare">Browse all comparisons →</a>`}</p>
<p>📚 <a href="/blog">More AI tool analysis from comparaitools.com →</a></p>
</div>

</article>`;
}

export function generateOpinionSEOMetadata(decision: OpinionDecision, content: string) {
  const wordCount   = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 220));
  const rawText     = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const excerpt     = rawText.slice(0, 155).trim() + '...';

  return {
    metaTitle:       `${decision.title} | ComparAITools`,
    metaDescription: `${excerpt.substring(0, 150)}...`,
    primaryKeyword:  decision.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').substring(0, 60),
    keywords:        [
      decision.title.toLowerCase(),
      ...decision.toolSlugs.map(s => `${s.replace(/-/g, ' ')} ${YEAR}`),
      `ai tools ${YEAR}`,
      'ai tools comparison',
    ],
    excerpt,
    wordCount,
    readingTime,
    schemaOrg: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: decision.title,
      author: {
        '@type': 'Person',
        name: 'Alex Morgan',
        url: 'https://comparaitools.com/about',
      },
      publisher: {
        '@type': 'Organization',
        name: 'ComparAITools',
        url: 'https://comparaitools.com',
      },
      datePublished: new Date().toISOString(),
      dateModified:  new Date().toISOString(),
    },
  };
}
