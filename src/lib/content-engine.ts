// src/lib/content-engine.ts
// SEO ULTRA-PRO: E-E-A-T + Long-tail + Semantic clusters + Internal linking + New tool detection

import tools from '@/data/tools.json';
import type { BlogPost, GenerationState } from './kv-storage';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tool {
  id: string; slug: string; name: string; company: string;
  category: string; categoryLabel: string; pricing: string; pricingValue: number;
  rating: number; users: string; logo: string; color: string;
  features: string[]; pros: string[]; cons: string[];
  description: string; longDescription: string; bestFor: string;
  lastUpdated: string; trend: string;
}

export type ContentDecision =
  | { type: 'review';      tool: Tool }
  | { type: 'comparison';  toolA: Tool; toolB: Tool }
  | { type: 'roundup';     category: string; categoryLabel: string; tools: Tool[] }
  | { type: 'guide';       topic: string; topicType: string; tool: Tool }
  | { type: 'pricing';     tool: Tool }
  | { type: 'alternatives';tool: Tool; alternatives: Tool[] }
  | null;

const TOOLS = tools as Tool[];
const YEAR  = new Date().getFullYear();
const TODAY = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// ─── Alex Morgan Persona & Human Touch System ────────────────────────────────

const ALEX_TOOL_OPINIONS: Record<string, string> = {
  chatgpt:            "my daily driver but I think most people massively overpay for Pro when Claude exists",
  claude:             "my personal favorite for deep work — I use it for all my long writing and analysis",
  gemini:             "criminally underrated — Google is doing a terrible job marketing it",
  midjourney:         "worth every penny — I use it weekly for thumbnails and mockups",
  "dall-e-3":         "solid for quick work but Midjourney consistently beats it on quality",
  cursor:             "switched from VS Code in early 2024 and haven't looked back since",
  "github-copilot":   "used it for 2 years before Cursor — still appreciate what it started",
  perplexity:         "my default search now — I barely use Google for research anymore",
  "runway-ml":        "blown away by every update — I think it'll replace stock footage within 2 years",
  elevenlabs:         "use it for my own audio content — the voice quality is genuinely impressive",
  suno:               "spent a whole weekend exploring it — it's going to disrupt stock music",
  jasper:             "tried it in 2022, cancelled after 3 months — too expensive for what it delivered",
};

const HUMAN_TOUCHES: Record<string, string[]> = {
  review: [
    "HUMAN MOMENT: In ONE natural place (not every section), Alex can mention his 30-day rule — he never pays for a tool until he has used the free tier for at least 30 days. Note whether this tool passed or failed that test. 1-2 sentences max.",
    "HUMAN MOMENT: Share one genuinely unexpected discovery during testing — something that surprised Alex, good or bad. Lead with 'I didn't expect this, but...' Keep it to 2 sentences. Make it feel like a real observation.",
    "HUMAN MOMENT: In the final verdict only, write like advising a friend. Not 'users may find' — but 'if you're like most people I talk to' or 'I'd tell my developer friends to try this before committing to X'.",
    "HUMAN MOMENT: Open with why Alex tested this tool right now — perhaps he noticed a trend spike or someone in his network asked. One sentence of context, then move on. Does not need to be in every review.",
    "HUMAN MOMENT: In the pros section, mention one pro that surprised Alex during testing. The rest of the pros can be standard analysis — just one of them should feel like a genuine personal discovery.",
  ],
  comparison: [
    "HUMAN MOMENT: In the FINAL VERDICT ONLY, Alex reveals which tool he personally uses and why — 1-2 sentences. Everywhere else, remain fully balanced. The personal reveal makes the conclusion feel earned.",
    "HUMAN MOMENT: Alex admits if his opinion changed during testing — 'I went in expecting X to win, but after running both through [specific scenario], Y surprised me.' This builds massive reader trust. Place this in the performance section.",
    "HUMAN MOMENT: If natural for these two tools, frame the intro with 'I get asked this comparison more than almost any other.' Then move immediately into the analysis. 1 sentence only.",
    "HUMAN MOMENT: Reference the real friction of switching tools — what you actually lose, what you gain, realistic transition time. Place this in the 'who should switch' section. 2-3 sentences, practical.",
  ],
  roundup: [
    "HUMAN MOMENT: Briefly explain one tool Alex excluded from the list and why. 1-2 sentences. Feels honest and builds credibility.",
    "HUMAN MOMENT: In the intro or conclusion, reveal Alex's personal top pick from the list — 'if I had to pick just one right now, it would be X because Y.' Makes it feel curated, not algorithmic.",
    "HUMAN MOMENT: Mention the specific benchmark task Alex ran all tools through to rank them. Name the task. Makes the ranking feel earned, not arbitrary.",
  ],
  guide: [
    "HUMAN MOMENT: In ONE section, Alex can mention a mistake he made when first using this tool — and what he learned. 2-3 sentences, genuinely useful. Don't force it if it doesn't fit naturally.",
    "HUMAN MOMENT: Name which part of Alex's own workflow this guide is based on. One sentence of context makes it feel tested and real, not theoretical.",
    "HUMAN MOMENT: Frame as an answer to a question Alex gets asked often. 'The most common question I get about X is...' — then answer it. Makes it feel community-driven.",
  ],
  pricing: [
    "HUMAN MOMENT: Briefly reference Alex's experience being burned by overpaying — 'I learned to always start with free tier after paying for a tool that got deprecated 4 months later.' 1 sentence, then move on.",
    "HUMAN MOMENT: In the verdict section only: 'If I were starting fresh today, I'd go with X plan because Y.' More useful than a generic recommendation.",
    "HUMAN MOMENT: Do the exact annual vs monthly math and show the specific dollar savings. Alex's thing is specifics — show the number, don't just say 'annual is cheaper'.",
  ],
  alternatives: [
    "HUMAN MOMENT: Mention the real friction of switching — what you actually lose when leaving the original tool. 2-3 sentences, practical. Not every alternative article needs this.",
    "HUMAN MOMENT: Frame the guide around the actual reason most people switch — usually price or one specific missing feature, not overall quality. Alex can state this directly in the intro.",
  ],
};

const VOICE_VARIATIONS: string[] = [
  "VOICE: Direct and confident. Short punchy sentences for strong points. No hedging language. Pick a position and defend it.",
  "VOICE: Conversational — like explaining to a smart friend. Some contractions. Sentences can start with And or But for flow. Accessible but not dumbed down.",
  "VOICE: Analytical and precise today. Lead with data. Explain what numbers mean, don't just list them. Human but data-forward.",
  "VOICE: Slightly skeptical — Alex has seen too many overhyped tools. Cut through marketing language. Fair but critical.",
  "VOICE: Genuinely engaged with this topic today. Can use 'this genuinely impressed me' when warranted. Always backed by specifics — never hype without substance.",
];

function getHumanTouch(type: string, toolSlug?: string, seed: number = Date.now()): string {
  const opinion = toolSlug ? (ALEX_TOOL_OPINIONS[toolSlug] || '') : '';
  const pool    = HUMAN_TOUCHES[type] || HUMAN_TOUCHES.review;
  const base    = pool[seed % pool.length];
  if (opinion) {
    return base + `\n\nALEX'S PERSONAL TAKE ON THIS TOOL: "${opinion}" — weave this into the verdict or a relevant section if it fits naturally. Skip entirely if it feels forced.`;
  }
  return base;
}

function getVoice(seed: number = Date.now()): string {
  return VOICE_VARIATIONS[seed % VOICE_VARIATIONS.length];
}



// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategories() {
  const seen = new Set<string>();
  return TOOLS.reduce((acc, t) => {
    if (!seen.has(t.category)) {
      seen.add(t.category);
      acc.push({ category: t.category, categoryLabel: t.categoryLabel });
    }
    return acc;
  }, [] as { category: string; categoryLabel: string }[]);
}

export function makePairKey(slugA: string, slugB: string): string {
  return [slugA, slugB].sort().join('___');
}

// ─── Internal Link Builder — el corazón del semantic clustering ───────────────

function buildClusterLinks(currentTool: Tool, type: string): {
  toolLinks: string;
  compareLinks: string;
  blogLinks: string;
  categoryLink: string;
  sameCategory: Tool[];
} {
  const sameCategory = TOOLS.filter(t => t.category === currentTool.category && t.slug !== currentTool.slug);
  const topCompetitors = sameCategory.slice(0, 4);

  const toolLinks = topCompetitors
    .map(t => `<a href="/tools/${t.slug}">${t.name}</a>`)
    .join(', ');

  const compareLinks = topCompetitors
    .slice(0, 3)
    .map(t => {
      const [a, b] = [currentTool.slug, t.slug].sort();
      return `<a href="/compare/${a}-vs-${b}-${YEAR}">${currentTool.name} vs ${t.name}</a>`;
    })
    .join(' · ');

  const blogLinks = [
    `<a href="/blog/best-${currentTool.category}-ai-tools-${YEAR}">Best ${currentTool.categoryLabel} AI Tools ${YEAR}</a>`,
    `<a href="/blog/${currentTool.slug}-pricing-guide-${YEAR}">${currentTool.name} Pricing Guide</a>`,
    `<a href="/blog/how-to-use-${currentTool.slug}-guide-${YEAR}">${currentTool.name} Complete Guide</a>`,
  ].join(' · ');

  const categoryLink = `/category/${currentTool.category}`;

  return { toolLinks, compareLinks, blogLinks, categoryLink, sameCategory };
}

// ─── Long-tail keyword generator ─────────────────────────────────────────────

function getLongTailKeywords(tool: Tool, type: string): string[] {
  const base = tool.name.toLowerCase();
  const cat = tool.categoryLabel.toLowerCase();

  const universalLongTail = [
    `best ${base} alternatives ${YEAR}`,
    `is ${base} worth it ${YEAR}`,
    `${base} free vs paid`,
    `${base} for beginners`,
    `${base} for professionals`,
    `how to use ${base}`,
    `${base} tutorial ${YEAR}`,
    `${base} tips and tricks`,
  ];

  const byType: Record<string, string[]> = {
    review: [
      `${base} honest review ${YEAR}`,
      `${base} review reddit ${YEAR}`,
      `${base} pros and cons`,
      `is ${base} safe`,
      `${base} vs competitors`,
      `${base} for small business`,
      `${base} for students`,
      `${base} for developers`,
    ],
    comparison: [
      `${base} or competitor`,
      `switch from competitor to ${base}`,
      `${base} better than competitor`,
      `${base} comparison ${YEAR}`,
    ],
    roundup: [
      `best free ${cat} ai tools`,
      `top ${cat} ai ${YEAR}`,
      `${cat} ai tools for business`,
      `${cat} ai tools for beginners`,
      `affordable ${cat} ai tools`,
      `${cat} ai tools comparison ${YEAR}`,
    ],
    pricing: [
      `${base} monthly cost`,
      `${base} annual plan discount`,
      `${base} team pricing`,
      `${base} enterprise pricing`,
      `${base} student discount`,
      `cancel ${base} subscription`,
    ],
    guide: [
      `${base} best practices`,
      `${base} workflow automation`,
      `${base} productivity tips`,
      `getting started with ${base}`,
      `${base} advanced features`,
      `${base} shortcuts and tips`,
    ],
    alternatives: [
      `${base} alternatives free`,
      `${base} competitors ${YEAR}`,
      `tools like ${base}`,
      `${base} replacement`,
      `best ${base} alternative for business`,
      `cheaper ${base} alternatives`,
    ],
  };

  return [...(byType[type] || []), ...universalLongTail];
}

// ─── Selección inteligente con detección de tools nuevas ─────────────────────

export function selectNextContent(state: GenerationState): ContentDecision {
  const n = state.totalGenerated;

  // 1. PRIORIDAD MÁXIMA: tools nuevas no reseñadas (detecta tools añadidas al JSON)
  const newUnreviewed = TOOLS
    .filter(t => !state.reviewedTools.includes(t.slug))
    .sort((a, b) => {
      const av = parseFloat(a.trend.replace(/[^0-9.]/g, ''));
      const bv = parseFloat(b.trend.replace(/[^0-9.]/g, ''));
      return bv - av;
    });

  // Si hay tools nuevas sin reseñar, priorizar según rotación
  const ROTATION = [
    'review', 'comparison', 'review', 'comparison',
    'roundup', 'review', 'comparison', 'guide',
    'review', 'comparison', 'pricing', 'alternatives',
    'review', 'comparison', 'review', 'guide',
  ];
  const desiredType = ROTATION[n % ROTATION.length];

  // ── Review ─────────────────────────────────────────────────────────────────
  if (desiredType === 'review') {
    if (newUnreviewed.length > 0) return { type: 'review', tool: newUnreviewed[0] };
    // Re-review del más antiguo (freshen content)
    const oldest = [...TOOLS].sort((a, b) =>
      new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
    )[0];
    return { type: 'review', tool: oldest };
  }

  // ── Guide — múltiples tipos de guías ──────────────────────────────────────
  if (desiredType === 'guide') {
    const guideTypes = [
      { key: 'howto',    topic: (t: Tool) => `How to Use ${t.name} for Maximum Productivity in ${YEAR}` },
      { key: 'beginners',topic: (t: Tool) => `${t.name} for Beginners: Complete ${YEAR} Getting Started Guide` },
      { key: 'advanced', topic: (t: Tool) => `Advanced ${t.name} Tips and Tricks: Power User Guide ${YEAR}` },
      { key: 'business', topic: (t: Tool) => `How to Use ${t.name} for Business: ROI Guide ${YEAR}` },
    ];

    for (const gt of guideTypes) {
      const tool = TOOLS.find(t =>
        state.reviewedTools.includes(t.slug) &&
        !state.guidesDone.includes(`${t.slug}-${gt.key}`)
      );
      if (tool) return { type: 'guide', topic: gt.topic(tool), topicType: gt.key, tool };
    }

    // Fallback: cualquier tool sin guide
    const anyTool = TOOLS.find(t => state.reviewedTools.includes(t.slug) && !state.guidesDone.includes(t.slug));
    if (anyTool) return { type: 'guide', topic: `How to Get the Most Out of ${anyTool.name} in ${YEAR}`, topicType: 'howto', tool: anyTool };
  }

  // ── Pricing ────────────────────────────────────────────────────────────────
  if (desiredType === 'pricing') {
    const noPricing = TOOLS.find(t => !state.pricingDone.includes(t.slug));
    if (noPricing) return { type: 'pricing', tool: noPricing };
    // Re-do pricing de tool con mayor trend
    return { type: 'pricing', tool: TOOLS.sort((a, b) => parseFloat(b.trend) - parseFloat(a.trend))[0] };
  }

  // ── Alternatives — muy buscado en Google ──────────────────────────────────
  if (desiredType === 'alternatives') {
    const tool = TOOLS.find(t => !state.publishedSlugs.includes(`${t.slug}-alternatives-${YEAR}`));
    if (tool) {
      const alternatives = TOOLS
        .filter(t2 => t2.slug !== tool.slug)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);
      return { type: 'alternatives', tool, alternatives };
    }
  }

  // ── Comparison ─────────────────────────────────────────────────────────────
  if (desiredType === 'comparison') {
    // Primero: mismo category (mayor SEO value)
    for (const { category } of getCategories()) {
      const catTools = TOOLS.filter(t => t.category === category);
      // Priorizar comparaciones con tools más trendentes
      const sorted = [...catTools].sort((a, b) =>
        parseFloat(b.trend.replace(/[^0-9.]/g, '')) - parseFloat(a.trend.replace(/[^0-9.]/g, ''))
      );
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const pair = makePairKey(sorted[i].slug, sorted[j].slug);
          if (!state.comparedPairs.includes(pair)) {
            return { type: 'comparison', toolA: sorted[i], toolB: sorted[j] };
          }
        }
      }
    }
    // Cross-category
    for (let i = 0; i < TOOLS.length; i++) {
      for (let j = i + 1; j < TOOLS.length; j++) {
        const pair = makePairKey(TOOLS[i].slug, TOOLS[j].slug);
        if (!state.comparedPairs.includes(pair)) {
          return { type: 'comparison', toolA: TOOLS[i], toolB: TOOLS[j] };
        }
      }
    }
  }

  // ── Roundup ────────────────────────────────────────────────────────────────
  if (desiredType === 'roundup') {
    const cats = getCategories();
    const undone = cats.find(c => !state.roundupsDone.includes(c.category));
    if (undone) {
      const catTools = TOOLS.filter(t => t.category === undone.category).sort((a, b) => b.rating - a.rating);
      return { type: 'roundup', category: undone.category, categoryLabel: undone.categoryLabel, tools: catTools };
    }
    const redo = cats[Math.floor(n / cats.length) % cats.length];
    return {
      type: 'roundup', category: redo.category, categoryLabel: redo.categoryLabel,
      tools: TOOLS.filter(t => t.category === redo.category).sort((a, b) => b.rating - a.rating),
    };
  }

  // Fallback
  const fallback = newUnreviewed[0] ?? TOOLS[n % TOOLS.length];
  return { type: 'review', tool: fallback };
}

// ─── Slug generator ───────────────────────────────────────────────────────────

export function generateSlug(decision: ContentDecision): string {
  if (!decision) return '';
  switch (decision.type) {
    case 'review':       return `${decision.tool.slug}-review-${YEAR}`;
    case 'comparison':   return `${decision.toolA.slug}-vs-${decision.toolB.slug}-${YEAR}`;
    case 'roundup':      return `best-${decision.category}-ai-tools-${YEAR}`;
    case 'guide':        return `how-to-use-${decision.tool.slug}-${decision.topicType}-guide-${YEAR}`;
    case 'pricing':      return `${decision.tool.slug}-pricing-guide-${YEAR}`;
    case 'alternatives': return `${decision.tool.slug}-alternatives-${YEAR}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPTS ULTRA-PRO CON E-E-A-T + LONG-TAIL + SEMANTIC CLUSTERS
// ═══════════════════════════════════════════════════════════════════════════════

export function buildReviewPrompt(tool: Tool): string {
  const { toolLinks, compareLinks, blogLinks, categoryLink, sameCategory } = buildClusterLinks(tool, 'review');
  const longTail = getLongTailKeywords(tool, 'review');
  const competitors = sameCategory.slice(0, 3);

  const reviewSeed = tool.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const humanTouch = getHumanTouch('review', tool.slug, reviewSeed);
  const voice = getVoice(reviewSeed);

  return `You are Alex Morgan, founder of comparaitools.com, with 5+ years of hands-on experience testing AI software. You have personally tested ${tool.name} extensively. Write the most comprehensive, authoritative, and SEO-optimized review of ${tool.name} for ${YEAR}.

${voice}

${humanTouch}

NOTE ON HUMAN ELEMENTS: Apply the human moment in ONE place only — where it fits most naturally. The rest of the article should be professional analysis. Never mention Alex Morgan by name in the article — write in first person. Never repeat the same personal story in multiple sections.

TOOL DATA (cite exact numbers — never round or approximate):
${JSON.stringify(tool, null, 2)}

COMPETITORS FOR COMPARISON: ${competitors.map(c => c.name).join(', ')}

═══ SEO STRATEGY ═══
PRIMARY KEYWORD: "${tool.name} review ${YEAR}" — use 7-9 times naturally
SECONDARY KEYWORDS (use 2-3 each): "${tool.name} pricing", "${tool.name} features ${YEAR}", "is ${tool.name} worth it", "${tool.name} pros and cons", "${tool.name} alternatives"
LONG-TAIL KEYWORDS (sprinkle naturally 1-2 each): ${longTail.slice(0, 6).join(' | ')}
SEARCH INTENT: Someone who has heard of ${tool.name} and wants to know if they should pay for it

═══ E-E-A-T REQUIREMENTS (CRITICAL for Google ranking) ═══
- ALWAYS write in first person plural: "we tested", "our team found", "in our experience"
- Include: "We tested ${tool.name} for 2 weeks across [specific use cases]"
- Include specific test results: "When we ran [specific task], ${tool.name} completed it in [timeframe]"
- Mention date: "As of ${TODAY}, ${tool.name} offers..."
- Show expertise: reference specific features by exact name, not generic descriptions
- Show authority: compare to industry benchmarks and competitor metrics

═══ INTERNAL LINKING (MANDATORY — include ALL of these) ═══
- Link to tool pages: ${toolLinks}
- Link to comparisons: ${compareLinks}
- Link to blog articles: ${blogLinks}
- Link to category: <a href="${categoryLink}">${tool.categoryLabel} AI Tools</a>

═══ OUTPUT FORMAT ═══
ONLY output valid semantic HTML starting with <article> ending with </article>
NO markdown, NO backticks, NO explanations outside HTML
MINIMUM 1,800 words of actual content

<article itemscope itemtype="https://schema.org/Review">
<meta itemprop="datePublished" content="${new Date().toISOString()}"/>
<meta itemprop="dateModified" content="${new Date().toISOString()}"/>
<meta itemprop="author" content="Alex Morgan"/>

<div class="last-updated" style="font-size:13px;color:#888;margin-bottom:1em">
  <strong>Last Updated:</strong> ${TODAY} · <strong>Testing Period:</strong> 2 weeks · <strong>Our Rating:</strong> ${tool.rating}/5
</div>

<h1 itemprop="name">${tool.name} Review ${YEAR}: [Write compelling subtitle — specific, benefit-driven, includes primary keyword naturally]</h1>

<div class="quick-verdict" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
<meta itemprop="ratingValue" content="${tool.rating}"/>
<meta itemprop="bestRating" content="5"/>
<h2>Our ${tool.name} Verdict (${YEAR})</h2>
<p class="rating-display">⭐ ${tool.rating}/5 — [One decisive sentence based on our testing]</p>
<p><strong>After testing ${tool.name} for two weeks</strong>, here's what we found:</p>
<ul>
[4 specific findings from "our testing" — concrete, numbered, with real details from the tool data]
</ul>
<p class="best-for">✅ <strong>Best for:</strong> ${tool.bestFor}</p>
<p class="pricing-quick">💰 <strong>Pricing:</strong> ${tool.pricing} — [one sentence on value]</p>
<p>Jump to: <a href="#pricing">Pricing breakdown</a> · <a href="#pros-cons">Pros & cons</a> · <a href="#verdict">Final verdict</a></p>
</div>

<nav class="toc">
<h2>What This Review Covers</h2>
<ol>
<li><a href="#what-is">What is ${tool.name} and who is it for?</a></li>
<li><a href="#testing">How we tested ${tool.name}</a></li>
<li><a href="#features">Key features in ${YEAR}</a></li>
<li><a href="#pricing">Pricing and plans</a></li>
<li><a href="#pros-cons">Pros and cons</a></li>
<li><a href="#who-for">Who should use it</a></li>
<li><a href="#alternatives">Best alternatives</a></li>
<li><a href="#faq">Frequently asked questions</a></li>
<li><a href="#verdict">Final verdict</a></li>
</ol>
</nav>

<h2 id="what-is">What Is ${tool.name} and Who Is It For?</h2>
[180 words: Clear explanation of what ${tool.name} does, who made it (${tool.company}), current user base (${tool.users}), and its core mission. Include primary keyword. Mention: "In this ${tool.name} review, we'll cover everything you need to know before subscribing." Include link to <a href="${categoryLink}">${tool.categoryLabel} AI Tools</a>.]

<h2 id="testing">How We Tested ${tool.name}</h2>
[120 words: "Our team spent two weeks testing ${tool.name} across [3 specific use cases relevant to ${tool.bestFor}]. We evaluated performance, reliability, speed, and value for money. Here's exactly what we did: [3 specific test scenarios with outcomes.]" — This E-E-A-T section is critical for Google trust signals.]

<h2 id="features">${tool.name} Key Features in ${YEAR}</h2>
[For EACH of these features, write 3-4 sentences: what it does, how we tested it, what we found, who benefits most: ${tool.features.join(' | ')}. Total 400+ words. Include at least one "When we tested [feature], we found..." per feature.]

<h2 id="pricing">${tool.name} Pricing: Is It Worth the Money in ${YEAR}?</h2>
[220 words: Full breakdown of ${tool.pricing}. What's included at each tier. "In our testing, the [tier] plan was sufficient for [use case] but [higher tier] was needed for [advanced use case]." Clear recommendation on which plan to choose and why. Compare value to alternatives: ${toolLinks}. Include mention of free trial if applicable.]

<h2 id="pros-cons">Pros and Cons of ${tool.name} (Based on Our Testing)</h2>
<div class="pros-cons-grid">
<div class="pros">
<h3>✅ What We Loved</h3>
<ul>
${tool.pros.map(p => `<li><strong>${p.split(' ').slice(0,3).join(' ')}:</strong> [Expand with specific detail from our testing. What exactly impressed us? Give numbers or specific examples. 2-3 sentences.]</li>`).join('\n')}
</ul>
</div>
<div class="cons">
<h3>❌ What Disappointed Us</h3>
<ul>
${tool.cons.map(c => `<li><strong>${c.split(' ').slice(0,3).join(' ')}:</strong> [Be specific about this limitation. When did it actually hurt us in testing? Who does it affect most? 2-3 sentences.]</li>`).join('\n')}
</ul>
</div>
</div>

<h2 id="who-for">Who Should Use ${tool.name} in ${YEAR}?</h2>
[Write 4 user personas. For EACH: Name the persona (e.g. "The Freelance Writer"), describe their specific pain point, explain how ${tool.name} solves it based on our testing, and give a concrete example. 60-80 words per persona.]

<p><strong>Skip ${tool.name} if:</strong> [3 specific situations where it's the wrong choice — be honest, this builds trust with readers AND Google]</p>

<h2 id="alternatives">${tool.name} Alternatives Worth Considering</h2>
[Compare to: ${toolLinks}. For each competitor: 1 key advantage over ${tool.name}, 1 area where ${tool.name} wins. Be fair and balanced. Include direct comparison links: ${compareLinks}. 200+ words total.]

<p>📊 For a detailed breakdown: ${compareLinks}</p>

<h2 id="faq">Frequently Asked Questions About ${tool.name}</h2>
<div class="faq-list" itemscope itemtype="https://schema.org/FAQPage">

<div class="faq-item" itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Is ${tool.name} free to use in ${YEAR}?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Specific answer about ${tool.pricing} — mention exactly what you get free vs paid]</p></div>
</div>

<div class="faq-item" itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Is ${tool.name} worth it in ${YEAR}?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Clear answer based on our testing. For whom yes, for whom no. Reference rating ${tool.rating}/5.]</p></div>
</div>

<div class="faq-item" itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">What is ${tool.name} best used for?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Specific answer from our testing: best use cases, specific results we achieved]</p></div>
</div>

<div class="faq-item" itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">How does ${tool.name} compare to its competitors?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Brief comparison with links to detailed comparisons: ${compareLinks}]</p></div>
</div>

<div class="faq-item" itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">What are the best ${tool.name} alternatives?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Top 3 alternatives with one line on when to pick each: ${toolLinks}]</p></div>
</div>

</div>

<h2 id="verdict">Final Verdict: Should You Use ${tool.name} in ${YEAR}?</h2>
[180 words: Decisive conclusion. Reference our testing. "After two weeks of rigorous testing, our verdict is..." Clear rating. Who it's perfect for, who should look elsewhere. Strong closing sentence.]

<div class="cta-box">
<p>🔍 <strong>Compare ${tool.name} vs alternatives:</strong> ${compareLinks}</p>
<p>📚 <strong>More resources:</strong> ${blogLinks}</p>
<p>Browse all <a href="${categoryLink}">${tool.categoryLabel} AI tools →</a></p>
</div>

</article>`;
}

export function buildComparisonPrompt(toolA: Tool, toolB: Tool): string {
  const { compareLinks: linksA, blogLinks: blogLinksA } = buildClusterLinks(toolA, 'comparison');
  const { toolLinks: toolLinksB } = buildClusterLinks(toolB, 'comparison');
  const longTail = [
    `${toolA.name.toLowerCase()} vs ${toolB.name.toLowerCase()} ${YEAR}`,
    `${toolA.name.toLowerCase()} or ${toolB.name.toLowerCase()} which is better`,
    `${toolA.name.toLowerCase()} vs ${toolB.name.toLowerCase()} reddit`,
    `${toolA.name.toLowerCase()} vs ${toolB.name.toLowerCase()} for business`,
    `switch from ${toolB.name.toLowerCase()} to ${toolA.name.toLowerCase()}`,
  ];

  const compSeed = (toolA.slug + toolB.slug).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const humanTouch = getHumanTouch('comparison', toolA.slug, compSeed);
  const voice = getVoice(compSeed + 1);

  return `You are Alex Morgan, founder of comparaitools.com, who has tested both ${toolA.name} AND ${toolB.name} extensively. Write the definitive, most comprehensive ${toolA.name} vs ${toolB.name} comparison for ${YEAR}.

${voice}

${humanTouch}

NOTE: Apply the human moment ONCE, where most natural. The comparison must remain balanced everywhere except the final verdict. Never mention Alex Morgan by name — write in first person.

TOOL A DATA: ${JSON.stringify(toolA, null, 2)}
TOOL B DATA: ${JSON.stringify(toolB, null, 2)}

═══ SEO STRATEGY ═══
PRIMARY: "${toolA.name} vs ${toolB.name} ${YEAR}" — use 8-10 times
SECONDARY: "${toolA.name} or ${toolB.name}", "compare ${toolA.name} ${toolB.name}", "${toolA.name} alternative to ${toolB.name}"
LONG-TAIL: ${longTail.join(' | ')}
SEARCH INTENT: Someone deciding between these two tools, probably ready to pay

═══ E-E-A-T SIGNALS (MANDATORY) ═══
- "We tested both ${toolA.name} and ${toolB.name} for [timeframe]"
- "In our head-to-head testing, we found..."
- Include specific test scenarios and results for BOTH tools
- Be fair — readers trust balanced reviews more
- Last updated: ${TODAY}

═══ INTERNAL LINKS TO INCLUDE ═══
- ${toolA.name} review: <a href="/tools/${toolA.slug}">${toolA.name} full review</a>
- ${toolB.name} review: <a href="/tools/${toolB.slug}">${toolB.name} full review</a>  
- Related comparisons: ${linksA}
- Category roundup: <a href="/blog/best-${toolA.category}-ai-tools-${YEAR}">Best ${toolA.categoryLabel} Tools ${YEAR}</a>

OUTPUT: ONLY HTML <article>...</article>. MINIMUM 2,000 words.

<article>

<div class="last-updated">Last Updated: ${TODAY} · Tested by: comparaitools.com Expert Team</div>

<h1>${toolA.name} vs ${toolB.name} (${YEAR}): Which One Should You Actually Choose?</h1>

<div class="tldr-box">
<h2>TL;DR — Our Verdict After Testing Both</h2>
<p>✅ <strong>Choose <a href="/tools/${toolA.slug}">${toolA.name}</a> if:</strong> [Specific, concrete situation — 1 sentence based on actual testing]</p>
<p>✅ <strong>Choose <a href="/tools/${toolB.slug}">${toolB.name}</a> if:</strong> [Specific, concrete situation — 1 sentence based on actual testing]</p>
<p><em>[1-2 sentences on the fundamental philosophical difference between these tools based on our hands-on experience]</em></p>
<p>⚡ Read our detailed reviews: <a href="/tools/${toolA.slug}">${toolA.name} Review</a> · <a href="/tools/${toolB.slug}">${toolB.name} Review</a></p>
</div>

<h2>How We Compared ${toolA.name} vs ${toolB.name}</h2>
[100 words: "We spent [timeframe] using both ${toolA.name} and ${toolB.name} across identical tasks to give you a fair, data-driven comparison. Our test scenarios included: [3 specific scenarios]. Here's exactly what we found." — E-E-A-T critical.]

<h2>At a Glance: ${toolA.name} vs ${toolB.name}</h2>
<table>
<thead><tr><th>Feature</th><th>${toolA.logo} ${toolA.name}</th><th>${toolB.logo} ${toolB.name}</th><th>Winner</th></tr></thead>
<tbody>
<tr><td>Starting Price</td><td>${toolA.pricing}</td><td>${toolB.pricing}</td><td>[Pick one with reason]</td></tr>
<tr><td>Rating</td><td>⭐ ${toolA.rating}/5</td><td>⭐ ${toolB.rating}/5</td><td>[Pick one]</td></tr>
<tr><td>User Base</td><td>${toolA.users}</td><td>${toolB.users}</td><td>[Pick one]</td></tr>
<tr><td>Free Tier</td><td>[Yes/No/Limited]</td><td>[Yes/No/Limited]</td><td>[Pick one]</td></tr>
<tr><td>Best For</td><td>[Short phrase]</td><td>[Short phrase]</td><td>[Depends on use case]</td></tr>
[Add 4-5 more specific feature rows comparing actual features from the tool data]
<tr><td><strong>Our Pick</strong></td><td colspan="3">[Clear winner or "It depends — see breakdown below"]</td></tr>
</tbody>
</table>

<h2>Pricing Compared: ${toolA.name} vs ${toolB.name}</h2>
[250 words: Detailed pricing breakdown. "In our testing, here's what we found about value..." Compare ${toolA.pricing} vs ${toolB.pricing}. Annual vs monthly savings. Who gets better value at which tier. Be specific with dollar amounts.]

<h2>${toolA.name} Performance in Our Tests</h2>
[200 words: Specific results from our testing of ${toolA.name}. What worked well, what didn't, specific metrics or observations. Top 3 strengths over ${toolB.name} with testing evidence. Features: ${toolA.features.slice(0,3).join(', ')}]

<h2>${toolB.name} Performance in Our Tests</h2>
[200 words: Same format for ${toolB.name}. Fair and balanced. Top 3 strengths over ${toolA.name}. Features: ${toolB.features.slice(0,3).join(', ')}]

<h2>Real-World Use Cases: When to Pick Each</h2>

<h3>Choose ${toolA.name} When...</h3>
<ul>
[4 specific scenarios with "In our testing, we found ${toolA.name} excels when..." for each. Concrete, not generic. 150+ words.]
</ul>

<h3>Choose ${toolB.name} When...</h3>
<ul>
[4 specific scenarios. Same format. 150+ words.]
</ul>

<h2>User Experience Comparison</h2>
[180 words: Learning curve, UI quality, mobile experience, integrations. "We onboarded both tools from scratch and timed the learning curve..." Which is better for beginners vs power users? Real observations.]

<h2>Frequently Asked Questions</h2>
<div itemscope itemtype="https://schema.org/FAQPage">

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Is ${toolA.name} better than ${toolB.name} in ${YEAR}?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Nuanced answer with specific use case guidance. Reference our testing.]</p></div>
</div>

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Can I use both ${toolA.name} and ${toolB.name} together?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Practical workflow answer]</p></div>
</div>

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Which is cheaper: ${toolA.name} or ${toolB.name}?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Specific pricing comparison with exact numbers]</p></div>
</div>

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Which is better for beginners: ${toolA.name} or ${toolB.name}?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Clear beginner recommendation with reasons from our testing]</p></div>
</div>

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Should I switch from ${toolB.name} to ${toolA.name}?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[When yes, when no, what the migration looks like]</p></div>
</div>

</div>

<h2>Final Verdict: ${toolA.name} vs ${toolB.name} (${YEAR})</h2>
[200 words: Decisive conclusion. "After extensive testing, our recommendation is..." Clear winner matrix by use case. Reference both tools' strengths from testing.]

<div class="cta-box">
<p>📖 Read our full reviews: <a href="/tools/${toolA.slug}">${toolA.name} Review ${YEAR}</a> · <a href="/tools/${toolB.slug}">${toolB.name} Review ${YEAR}</a></p>
<p>🔍 More comparisons: ${linksA}</p>
<p>📊 <a href="/blog/best-${toolA.category}-ai-tools-${YEAR}">Best ${toolA.categoryLabel} AI Tools ${YEAR} →</a></p>
</div>

</article>`;
}

export function buildRoundupPrompt(category: string, categoryLabel: string, catTools: Tool[]): string {
  const allToolLinks = catTools.map(t => `<a href="/tools/${t.slug}">${t.name}</a>`).join(', ');
  const compareLinks = catTools.slice(0, 3).reduce((acc, t, i, arr) => {
    if (i < arr.length - 1) {
      const [a, b] = [t.slug, arr[i+1].slug].sort();
      acc.push(`<a href="/compare/${a}-vs-${b}-${YEAR}">${t.name} vs ${arr[i+1].name}</a>`);
    }
    return acc;
  }, [] as string[]).join(' · ');

  const longTail = [
    `best free ${categoryLabel.toLowerCase()} ai tools ${YEAR}`,
    `top ${categoryLabel.toLowerCase()} ai for beginners`,
    `best ${categoryLabel.toLowerCase()} ai for business ${YEAR}`,
    `affordable ${categoryLabel.toLowerCase()} ai tools`,
    `${categoryLabel.toLowerCase()} ai tools comparison`,
  ];

  const roundupSeed = category.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const humanTouch = getHumanTouch('roundup', undefined, roundupSeed);
  const voice = getVoice(roundupSeed + 2);

  return `You are Alex Morgan, founder of comparaitools.com, who has personally tested all ${catTools.length} ${categoryLabel} AI tools listed below. Write the definitive ${YEAR} guide ranking the best ${categoryLabel} AI tools.

${voice}

${humanTouch}

NOTE: Use the human moment once. The rest is expert analysis. First person throughout.

TOOLS TO RANK: ${JSON.stringify(catTools, null, 2)}

═══ SEO STRATEGY ═══
PRIMARY: "best ${categoryLabel.toLowerCase()} AI tools ${YEAR}" — use 8-10 times
SECONDARY: "top ${categoryLabel.toLowerCase()} AI", "${categoryLabel.toLowerCase()} AI comparison"
LONG-TAIL: ${longTail.join(' | ')}
SEARCH INTENT: Someone researching which ${categoryLabel.toLowerCase()} AI tool to buy

═══ E-E-A-T (MANDATORY) ═══
- "We spent [X weeks] testing all ${catTools.length} tools"
- Give specific test results for each tool
- Be honest about limitations — Google trusts balanced content
- Last Updated: ${TODAY}

═══ INTERNAL LINKS ═══
All tool pages: ${allToolLinks}
Head-to-head comparisons: ${compareLinks}

OUTPUT: ONLY HTML <article>...</article>. MINIMUM 2,200 words.

<article>

<div class="last-updated">Last Updated: ${TODAY} · Tools Tested: ${catTools.length} · By: comparaitools.com Expert Team</div>

<h1>Best ${categoryLabel} AI Tools in ${YEAR}: We Tested ${catTools.length} Options — Here Are Our Top Picks</h1>

<div class="quick-picks-box">
<h2>Quick Picks: Best ${categoryLabel} AI Tools at a Glance</h2>
<ol>
${catTools.map((t, i) => `<li><a href="/tools/${t.slug}"><strong>${t.logo} ${t.name}</strong></a> — [One compelling, specific reason this ranks #${i+1} — from our testing, not marketing copy]</li>`).join('\n')}
</ol>
</div>

<h2>How We Chose These ${categoryLabel} AI Tools</h2>
[150 words: "Our team tested ${catTools.length} ${categoryLabel.toLowerCase()} AI tools over [X weeks]. We evaluated: performance quality, pricing transparency, ease of use, feature depth, reliability, and value for money. We ran identical test scenarios on each tool to ensure fair comparison. Here's exactly what our testing involved: [3 specific test scenarios]. Tools that didn't meet our minimum quality threshold were excluded." — This E-E-A-T section is critical.]

${catTools.map((tool, index) => `
<h2>#${index + 1} <a href="/tools/${tool.slug}">${tool.logo} ${tool.name}</a>: Best for ${tool.bestFor}</h2>

<div class="tool-meta">
<span>⭐ ${tool.rating}/5</span> · <span>💰 ${tool.pricing}</span> · <span>👥 ${tool.users} users</span> · <span>📈 ${tool.trend} growth</span>
</div>

[250 words: Start with "In our testing, ${tool.name} [specific finding]." Cover: what makes it stand out among ALL ${catTools.length} tools (not just generic description), the 2-3 features (${tool.features.slice(0,3).join(', ')}) that actually make a difference in real use, a specific test result or workflow we tried, who it's absolutely perfect for, and one honest limitation we found (${tool.cons[0]}). End with a clear mini-verdict.]

<p>✅ <strong>We loved:</strong> ${tool.pros[0]}</p>
<p>⚠️ <strong>Watch out for:</strong> ${tool.cons[0]}</p>
<p>💰 <strong>Pricing:</strong> ${tool.pricing}</p>
<p><a href="/tools/${tool.slug}">Read our full ${tool.name} review →</a></p>
`).join('\n')}

<h2>Side-by-Side Comparison: All ${categoryLabel} AI Tools</h2>
<table>
<thead><tr><th>Tool</th><th>Our Rating</th><th>Price</th><th>Users</th><th>Best For</th><th>Trend</th></tr></thead>
<tbody>
${catTools.map(t => `<tr><td><a href="/tools/${t.slug}">${t.logo} ${t.name}</a></td><td>${t.rating}/5</td><td>${t.pricing}</td><td>${t.users}</td><td>${t.bestFor}</td><td>${t.trend}</td></tr>`).join('\n')}
</tbody>
</table>

<h2>How to Choose the Right ${categoryLabel} AI Tool in ${YEAR}</h2>
[250 words: Frame as questions the reader should ask themselves. 5 decision factors: budget, use case, technical skill, team size, integration needs. For each: what to look for and which tools in our list are best for that factor. Very practical.]

<h2>Head-to-Head Comparisons</h2>
<p>Still deciding? Check our detailed comparisons: ${compareLinks}</p>

<h2>Frequently Asked Questions</h2>
<div itemscope itemtype="https://schema.org/FAQPage">

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">What is the best free ${categoryLabel.toLowerCase()} AI tool in ${YEAR}?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Specific answer from our testing — name the best free option and what you get]</p></div>
</div>

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Which ${categoryLabel.toLowerCase()} AI tool is best for beginners?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Clear recommendation with reasons from our testing]</p></div>
</div>

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">What is the best ${categoryLabel.toLowerCase()} AI for business use?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Business-focused recommendation with specific features that matter]</p></div>
</div>

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">How much does a good ${categoryLabel.toLowerCase()} AI tool cost?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Price range from our testing, what you get at each tier]</p></div>
</div>

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Is there a free alternative to [top tool in list]?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Honest answer about free alternatives and their trade-offs]</p></div>
</div>

</div>

<h2>Our Final Recommendations</h2>
[200 words: Clear decision matrix. "Based on our testing: Best overall → [tool]. Best free → [tool]. Best for teams → [tool]. Best value → [tool]. Each with 1-2 sentence justification from our testing.]

<div class="cta-box">
<p>🔍 Compare any two tools: ${compareLinks}</p>
<p>📖 Read individual reviews: ${allToolLinks}</p>
</div>

</article>`;
}

export function buildAlternativesPrompt(tool: Tool, alternatives: Tool[]): string {
  const { compareLinks, categoryLink } = buildClusterLinks(tool, 'alternatives');
  const altLinks = alternatives.map(t => `<a href="/tools/${t.slug}">${t.name}</a>`).join(', ');

  const altSeed = (tool.slug + 'alternatives').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const humanTouch = getHumanTouch('alternatives', tool.slug, altSeed);
  const voice = getVoice(altSeed + 4);

  return `You are Alex Morgan, founder of comparaitools.com. Write the most comprehensive guide to ${tool.name} alternatives for ${YEAR}. This is a HIGH-VALUE SEO page because people searching for alternatives are ready to switch tools.

${voice}

${humanTouch}

NOTE: Human moment once, where most natural. First person throughout.

MAIN TOOL: ${JSON.stringify(tool, null, 2)}
ALTERNATIVES: ${JSON.stringify(alternatives, null, 2)}

═══ SEO STRATEGY ═══
PRIMARY: "${tool.name} alternatives ${YEAR}" — use 7-9 times
SECONDARY: "best ${tool.name} alternatives", "tools like ${tool.name}", "${tool.name} competitors", "switch from ${tool.name}"
LONG-TAIL: "${tool.name} alternatives free", "cheaper ${tool.name} alternatives", "${tool.name} alternative for beginners"
SEARCH INTENT: Someone unhappy with ${tool.name} (price, features, or limits) looking to switch

═══ E-E-A-T ═══
- "We tested all ${alternatives.length} alternatives to ${tool.name}"
- Be honest about why someone would leave ${tool.name}
- Include specific switching guidance
- Last Updated: ${TODAY}

═══ INTERNAL LINKS ═══
Alternative tool pages: ${altLinks}
Comparisons: ${compareLinks}
Category: <a href="${categoryLink}">${tool.categoryLabel} AI Tools</a>

OUTPUT: ONLY HTML <article>...</article>. MINIMUM 1,800 words.

<article>

<div class="last-updated">Last Updated: ${TODAY} · Alternatives Tested: ${alternatives.length}</div>

<h1>Best ${tool.name} Alternatives in ${YEAR}: ${alternatives.length} Options We Actually Tested</h1>

<div class="intro-section">
[120 words: "If you're looking for ${tool.name} alternatives, you're probably dealing with [top 2-3 pain points from ${tool.cons.join(', ')}]. We get it — we've been there. Our team tested ${alternatives.length} alternatives and this is what we found." Include primary keyword naturally. Acknowledge ${tool.name}'s strengths before listing alternatives — this builds trust.]
</div>

<h2>Why People Look for ${tool.name} Alternatives</h2>
<ul>
${tool.cons.map(c => `<li><strong>${c}:</strong> [Expand on why this drives users away, from our experience testing ${tool.name}]</li>`).join('\n')}
<li><strong>Pricing:</strong> [Comment on ${tool.pricing} — is it competitive or expensive for what you get?]</li>
</ul>

${alternatives.map((alt, i) => `
<h2>#${i+1} ${alt.logo} <a href="/tools/${alt.slug}">${alt.name}</a> — Best ${tool.name} Alternative for [Specific Use Case]</h2>

<div class="tool-meta">⭐ ${alt.rating}/5 · 💰 ${alt.pricing} · 👥 ${alt.users}</div>

[200 words per alternative: WHY it beats ${tool.name} for specific use cases (be specific — reference ${alt.pros[0]} and how it compares to ${tool.name}'s weakness). WHO should switch to this (specific persona). HOW to migrate from ${tool.name} to ${alt.name} (1-2 practical steps). HONEST limitation vs ${tool.name} (what you'd lose by switching). End with: "Compared to ${tool.name}: [one clear advantage, one clear trade-off]."]

<p>✅ <strong>Why switch from ${tool.name}:</strong> [Specific reason]</p>
<p>⚠️ <strong>What you'll miss from ${tool.name}:</strong> [Honest trade-off]</p>
<p>💰 <strong>Pricing:</strong> ${alt.pricing}</p>
<p><a href="/tools/${alt.slug}">Full ${alt.name} review →</a> · <a href="/compare/${[tool.slug, alt.slug].sort().join('-vs-')}-${YEAR}">${tool.name} vs ${alt.name} comparison →</a></p>
`).join('\n')}

<h2>Quick Comparison: ${tool.name} vs All Alternatives</h2>
<table>
<thead><tr><th>Tool</th><th>Price</th><th>Rating</th><th>Best For</th><th>vs ${tool.name}</th></tr></thead>
<tbody>
<tr><td><a href="/tools/${tool.slug}">${tool.name}</a> (original)</td><td>${tool.pricing}</td><td>${tool.rating}/5</td><td>${tool.bestFor}</td><td>—</td></tr>
${alternatives.map(a => `<tr><td><a href="/tools/${a.slug}">${a.name}</a></td><td>${a.pricing}</td><td>${a.rating}/5</td><td>${a.bestFor}</td><td>[Better/Worse/Different — for what use case]</td></tr>`).join('\n')}
</tbody>
</table>

<h2>How to Choose the Right ${tool.name} Alternative</h2>
[200 words: Decision framework based on reason for leaving ${tool.name}. If price → recommend X. If features → recommend Y. If ease of use → recommend Z. Very practical, short sentences.]

<h2>Frequently Asked Questions</h2>
<div itemscope itemtype="https://schema.org/FAQPage">

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">What is the best free alternative to ${tool.name}?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Specific answer with the best free option from our alternatives list]</p></div>
</div>

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Is there a cheaper alternative to ${tool.name}?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Price comparison with the most affordable alternative]</p></div>
</div>

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">How do I switch from ${tool.name} to an alternative?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Practical 3-step migration guide]</p></div>
</div>

</div>

<h2>Our Verdict on ${tool.name} Alternatives</h2>
[150 words: "After testing all ${alternatives.length} alternatives: Best overall → [tool]. Best free → [tool]. Easiest to switch to → [tool]." Clear, decisive, based on our testing.]

<div class="cta-box">
<p>🔍 Compare head-to-head: ${compareLinks}</p>
<p>📊 See all <a href="${categoryLink}">${tool.categoryLabel} AI tools →</a></p>
</div>

</article>`;
}

export function buildGuidePrompt(topic: string, topicType: string, tool: Tool): string {
  const { compareLinks, blogLinks, categoryLink } = buildClusterLinks(tool, 'guide');
  const longTail = getLongTailKeywords(tool, 'guide');

  const guideIntros: Record<string, string> = {
    howto: `maximizing ${tool.name} for productivity`,
    beginners: `getting started with ${tool.name} from scratch`,
    advanced: `mastering advanced ${tool.name} features`,
    business: `using ${tool.name} to grow your business`,
  };

  const guideSeed = tool.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + topicType.length;
  const humanTouch = getHumanTouch('guide', tool.slug, guideSeed);
  const voice = getVoice(guideSeed);

  return `You are Alex Morgan, founder of comparaitools.com — an expert ${tool.categoryLabel} practitioner who uses ${tool.name} daily. Write a comprehensive, actionable guide: "${topic}"

${voice}

${humanTouch}

NOTE: The human moment goes in ONE place only where it genuinely adds value. First person throughout.

TOOL: ${JSON.stringify(tool, null, 2)}
GUIDE FOCUS: ${guideIntros[topicType] || 'getting the most from the tool'}

═══ SEO STRATEGY ═══
PRIMARY: "${topic.toLowerCase()}" — use 6-7 times
SECONDARY: "${tool.name} tips", "${tool.name} tutorial ${YEAR}", "how to use ${tool.name}"
LONG-TAIL: ${longTail.slice(0, 5).join(' | ')}
SEARCH INTENT: Someone who already has ${tool.name} and wants to use it better

═══ E-E-A-T ═══
- Write as a practitioner: "In our workflow, we use ${tool.name} for..."
- Include specific prompts, settings, or configurations
- Give real examples with expected outputs
- Last Updated: ${TODAY}

═══ INTERNAL LINKS ═══
Full review: <a href="/tools/${tool.slug}">${tool.name} Review ${YEAR}</a>
Alternatives: <a href="/blog/${tool.slug}-alternatives-${YEAR}">${tool.name} alternatives</a>
Comparisons: ${compareLinks}
Category: <a href="${categoryLink}">${tool.categoryLabel} AI Tools</a>

OUTPUT: ONLY HTML <article>...</article>. MINIMUM 1,800 words.

<article>

<div class="last-updated">Last Updated: ${TODAY} · By: comparaitools.com Expert Team</div>

<h1>${topic}: Step-by-Step ${YEAR} Guide</h1>

<div class="prerequisites">
<h2>Before You Start</h2>
<p><strong>Who this guide is for:</strong> [Specific user description]</p>
<p><strong>What you'll need:</strong> ${tool.name} account (${tool.pricing}), [other requirements]</p>
<p><strong>Time to complete:</strong> [estimated time]</p>
<p><strong>Skill level:</strong> [Beginner/Intermediate/Advanced]</p>
<p>Not sure if ${tool.name} is right for you? Read our <a href="/tools/${tool.slug}">${tool.name} review →</a></p>
</div>

[Write 6-8 detailed steps. Each step must have:]
[- Clear h2 header: "Step N: [Action Verb] [Specific Thing]"]
[- 180-250 words of specific, actionable instructions]
[- "In our testing/workflow, we found that..." for E-E-A-T]
[- A specific example or result]
[- A common mistake to avoid]
[- A pro tip where relevant]

<h2>Advanced Tips from Our Team</h2>
[5 power-user techniques. Each: name it, explain it, give exact example. "Our team discovered that..." 300+ words total.]

<h2>Common Mistakes to Avoid</h2>
[5 mistakes with solutions. Specific to ${tool.name}'s limitations: ${tool.cons.join(', ')}. "We made this mistake ourselves..." 200 words.]

<h2>Real Workflow Examples</h2>
[3 complete workflows using ${tool.name}. Each: user persona, their goal, exact steps, result. "Here's how [persona] uses ${tool.name} to [achieve goal] in [timeframe]." 350+ words total.]

<h2>Frequently Asked Questions</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
[5 how-to FAQs. Real questions people ask. Each answer 60-80 words with actionable specifics.]
</div>

<h2>Next Steps</h2>
[100 words: What to do after completing this guide. Link to advanced content. Suggest comparing with alternatives.]

<div class="cta-box">
<p>📖 Full review: <a href="/tools/${tool.slug}">${tool.name} Review ${YEAR}</a></p>
<p>🔍 Compare: ${compareLinks}</p>
<p>📊 All ${tool.categoryLabel} tools: <a href="${categoryLink}">Browse →</a></p>
</div>

</article>`;
}

export function buildPricingPrompt(tool: Tool): string {
  const { compareLinks, categoryLink } = buildClusterLinks(tool, 'pricing');
  const competitors = TOOLS.filter(t => t.category === tool.category && t.slug !== tool.slug).slice(0, 3);

  const pricingSeed = (tool.slug + 'pricing').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const humanTouch = getHumanTouch('pricing', tool.slug, pricingSeed);
  const voice = getVoice(pricingSeed + 3);

  return `You are Alex Morgan, founder of comparaitools.com — a senior pricing analyst who has subscribed to ${tool.name} across multiple plans. Write the most comprehensive ${tool.name} pricing guide for ${YEAR}.

${voice}

${humanTouch}

NOTE: Apply human moment once, in the most natural section. First person throughout.

TOOL: ${JSON.stringify(tool, null, 2)}
COMPETITORS: ${JSON.stringify(competitors, null, 2)}

═══ SEO STRATEGY ═══
PRIMARY: "${tool.name} pricing ${YEAR}" — use 7-9 times
SECONDARY: "${tool.name} cost", "${tool.name} free vs paid", "${tool.name} plans", "how much is ${tool.name}"
LONG-TAIL: "${tool.name} pricing for teams", "${tool.name} annual plan", "${tool.name} student discount", "cancel ${tool.name} subscription"
SEARCH INTENT: Someone evaluating whether to pay for ${tool.name} — HIGH purchase intent

═══ E-E-A-T ═══
- "We subscribed to all ${tool.name} plans and here's what we found..."
- Specific observations from using each tier
- Honest ROI analysis
- Last Updated: ${TODAY}

═══ INTERNAL LINKS ═══
Full review: <a href="/tools/${tool.slug}">${tool.name} Review ${YEAR}</a>
Compare pricing: ${compareLinks}
Category overview: <a href="${categoryLink}">${tool.categoryLabel} AI Tools</a>

OUTPUT: ONLY HTML <article>...</article>. MINIMUM 1,500 words.

<article>

<div class="last-updated">Last Updated: ${TODAY} · Plans Tested: All tiers · By: comparaitools.com</div>

<h1>${tool.name} Pricing ${YEAR}: Every Plan Explained (Is It Worth It?)</h1>

[100 word intro: Frame for high purchase intent readers. "If you're wondering whether ${tool.name} is worth paying for, you're in the right place. We've subscribed to every ${tool.name} plan so you don't have to. Here's exactly what you get and whether it's worth it." Include primary keyword naturally.]

<h2>${tool.name} Pricing Plans: Complete ${YEAR} Breakdown</h2>
[350 words: Detailed breakdown of ${tool.pricing}. What's EXACTLY included at each tier (not just marketing language — what we actually found when we subscribed). Who each tier is genuinely designed for. What features are gated. Our experience upgrading between plans. "When we tested the [free/basic] tier, we hit these limits after [timeframe]..."]

<h2>Is ${tool.name} Free? What You Actually Get Without Paying</h2>
[200 words: Honest assessment. "We used the free tier for [X days/weeks] and here's what happened..." What limits hit first. When you'll need to upgrade. Real use cases where free is enough. "For [use case], free is sufficient. For [use case], you'll need to upgrade within [timeframe]."]

<h2>${tool.name} Pricing vs Competitors</h2>
<table>
<thead><tr><th>Tool</th><th>Starting Price</th><th>Free Tier</th><th>Best Value For</th><th>Our Rating</th></tr></thead>
<tbody>
<tr><td><a href="/tools/${tool.slug}"><strong>${tool.name}</strong></a></td><td>${tool.pricing}</td><td>[Yes/No/Limited from our testing]</td><td>${tool.bestFor}</td><td>${tool.rating}/5</td></tr>
${competitors.map(c => `<tr><td><a href="/tools/${c.slug}">${c.name}</a></td><td>${c.pricing}</td><td>[Yes/No/Limited]</td><td>${c.bestFor}</td><td>${c.rating}/5</td></tr>`).join('\n')}
</tbody>
</table>
<p>See detailed comparisons: ${compareLinks}</p>

<h2>Is ${tool.name} Worth the Price in ${YEAR}?</h2>
[270 words: Real ROI analysis. "After subscribing for [period], here's our honest assessment..." For freelancers: worth it if [condition]. For teams: worth it if [condition]. For enterprises: worth it if [condition]. Specific break-even analysis. When to stick with free. When cheaper alternatives make more sense.]

<h2>How to Get the Best ${tool.name} Deal</h2>
[180 words: Annual vs monthly savings (specific %). Team discounts. Student/nonprofit deals. Trial period strategy. "We found that..." Specific money-saving tips from our experience subscribing.]

<h2>Frequently Asked Questions About ${tool.name} Pricing</h2>
<div itemscope itemtype="https://schema.org/FAQPage">

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">How much does ${tool.name} cost per month in ${YEAR}?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Specific pricing: ${tool.pricing}. What each tier includes from our testing.]</p></div>
</div>

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Is ${tool.name} free?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Honest answer about free tier from our experience]</p></div>
</div>

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Can I cancel ${tool.name} anytime?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Cancellation policy details from our experience subscribing]</p></div>
</div>

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Does ${tool.name} offer a student discount?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Honest answer about student/nonprofit pricing]</p></div>
</div>

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Is ${tool.name} cheaper than [top competitor]?</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Specific price comparison with context from our testing]</p></div>
</div>

</div>

<h2>Final Verdict on ${tool.name} Pricing</h2>
[140 words: Clear verdict. "After subscribing to all plans, our recommendation is..." Buy it if [X]. Skip it if [Y]. Best value tier recommendation.]

<div class="cta-box">
<p>📖 Full review: <a href="/tools/${tool.slug}">${tool.name} Review ${YEAR} →</a></p>
<p>🔍 Compare pricing: ${compareLinks}</p>
<p>📊 All <a href="${categoryLink}">${tool.categoryLabel} tools and pricing →</a></p>
</div>

</article>`;
}

// ─── SEO Metadata Ultra-Pro ───────────────────────────────────────────────────

export function generateSEOMetadata(
  decision: ContentDecision,
  content: string
): Pick<BlogPost, 'metaTitle' | 'metaDescription' | 'primaryKeyword' | 'keywords' | 'excerpt' | 'wordCount' | 'readingTime' | 'schemaOrg'> {
  const wordCount    = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readingTime  = Math.max(1, Math.ceil(wordCount / 220));
  const rawText      = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const excerpt      = rawText.slice(0, 155).trim() + '...';

  if (!decision) return { metaTitle: '', metaDescription: '', primaryKeyword: '', keywords: [], excerpt, wordCount, readingTime, schemaOrg: {} };

  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    publisher: { '@type': 'Organization', name: 'ComparAITools', url: 'https://comparaitools.com', logo: { '@type': 'ImageObject', url: 'https://comparaitools.com/favicon.ico' } },
    datePublished: new Date().toISOString(),
    dateModified:  new Date().toISOString(),
    author: { '@type': 'Person', name: 'Alex Morgan', url: 'https://comparaitools.com/about', sameAs: ['https://twitter.com/alexmorgan_ai'] },
  };

  switch (decision.type) {
    case 'review': {
      const t = decision.tool;
      const longTail = getLongTailKeywords(t, 'review');
      return {
        metaTitle:       `${t.name} Review ${YEAR}: Is It Worth It? (We Tested It)`,
        metaDescription: `Honest ${t.name} review from our team after 2 weeks of testing. Rating: ${t.rating}/5. Pricing: ${t.pricing}. Real pros, cons & who it's for. Read before you subscribe.`,
        primaryKeyword:  `${t.name} review ${YEAR}`,
        keywords:        [`${t.name} review`, `${t.name} ${YEAR}`, `${t.name} pricing`, `is ${t.name} worth it`, `${t.name} pros and cons`, ...longTail.slice(0, 5)],
        excerpt, wordCount, readingTime,
        schemaOrg: { ...baseSchema, '@type': 'Review', name: `${t.name} Review ${YEAR}`, author: { '@type': 'Person', name: 'Alex Morgan', url: 'https://comparaitools.com/about' }, reviewRating: { '@type': 'Rating', ratingValue: t.rating, bestRating: 5 }, itemReviewed: { '@type': 'SoftwareApplication', name: t.name, applicationCategory: t.categoryLabel, operatingSystem: 'Web' } },
      };
    }
    case 'comparison': {
      const { toolA, toolB } = decision;
      const longTail = [`${toolA.name.toLowerCase()} or ${toolB.name.toLowerCase()}`, `switch from ${toolB.name.toLowerCase()} to ${toolA.name.toLowerCase()}`, `${toolA.name.toLowerCase()} vs ${toolB.name.toLowerCase()} reddit`, `${toolA.name.toLowerCase()} vs ${toolB.name.toLowerCase()} for business`];
      return {
        metaTitle:       `${toolA.name} vs ${toolB.name} (${YEAR}): Which Is Better? [Tested]`,
        metaDescription: `${toolA.name} vs ${toolB.name}: We tested both for weeks. Pricing, features, and performance compared. Here's exactly which one wins for your use case.`,
        primaryKeyword:  `${toolA.name} vs ${toolB.name} ${YEAR}`,
        keywords:        [`${toolA.name} vs ${toolB.name}`, `${toolA.name} alternative`, `${toolB.name} alternative`, ...longTail],
        excerpt, wordCount, readingTime,
        schemaOrg: { ...baseSchema, name: `${toolA.name} vs ${toolB.name} ${YEAR}` },
      };
    }
    case 'roundup': {
      const label = decision.categoryLabel;
      const longTail = [`best free ${label.toLowerCase()} ai`, `top ${label.toLowerCase()} ai for beginners`, `best ${label.toLowerCase()} ai for business`];
      return {
        metaTitle:       `Best ${label} AI Tools ${YEAR}: Top ${decision.tools.length} Picks (We Tested All)`,
        metaDescription: `We tested ${decision.tools.length} ${label.toLowerCase()} AI tools in ${YEAR}. Here are the best options ranked by performance, pricing & real-world results. Updated ${TODAY}.`,
        primaryKeyword:  `best ${label.toLowerCase()} AI tools ${YEAR}`,
        keywords:        [`best ${label.toLowerCase()} AI`, `top ${label.toLowerCase()} tools`, `${label.toLowerCase()} AI comparison`, ...longTail],
        excerpt, wordCount, readingTime,
        schemaOrg: { ...baseSchema, '@type': 'ItemList', name: `Best ${label} AI Tools ${YEAR}` },
      };
    }
    case 'guide': {
      const t = decision.tool;
      const longTail = getLongTailKeywords(t, 'guide');
      return {
        metaTitle:       `${decision.topic} [${YEAR} Step-by-Step Guide]`,
        metaDescription: `Complete guide: ${decision.topic}. Expert tips, real workflows, and practical examples from our team. Updated ${TODAY}. ${readingTime} min read.`,
        primaryKeyword:  decision.topic.toLowerCase(),
        keywords:        [`${t.name} tutorial`, `how to use ${t.name}`, `${t.name} guide ${YEAR}`, ...longTail.slice(0, 4)],
        excerpt, wordCount, readingTime,
        schemaOrg: { ...baseSchema, '@type': 'HowTo', name: decision.topic, estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: t.pricingValue } },
      };
    }
    case 'pricing': {
      const t = decision.tool;
      return {
        metaTitle:       `${t.name} Pricing ${YEAR}: All Plans Explained (Worth It?)`,
        metaDescription: `Complete ${t.name} pricing breakdown for ${YEAR}. We subscribed to every plan. Free vs paid, hidden costs, and our honest verdict on value. Updated ${TODAY}.`,
        primaryKeyword:  `${t.name} pricing ${YEAR}`,
        keywords:        [`${t.name} cost`, `${t.name} plans ${YEAR}`, `${t.name} free vs paid`, `how much is ${t.name}`, `${t.name} monthly cost`, `${t.name} annual plan`],
        excerpt, wordCount, readingTime,
        schemaOrg: { ...baseSchema, name: `${t.name} Pricing Guide ${YEAR}` },
      };
    }
    case 'alternatives': {
      const t = decision.tool;
      return {
        metaTitle:       `${decision.alternatives.length} Best ${t.name} Alternatives in ${YEAR} (Free & Paid)`,
        metaDescription: `Looking for ${t.name} alternatives? We tested ${decision.alternatives.length} options. Find cheaper, better, or free alternatives to ${t.name} for your specific needs. Updated ${TODAY}.`,
        primaryKeyword:  `${t.name} alternatives ${YEAR}`,
        keywords:        [`${t.name} alternatives`, `tools like ${t.name}`, `${t.name} competitors`, `best ${t.name} alternative`, `free ${t.name} alternative`],
        excerpt, wordCount, readingTime,
        schemaOrg: { ...baseSchema, name: `${t.name} Alternatives ${YEAR}` },
      };
    }
  }
}

// ─── Selector de prompt ───────────────────────────────────────────────────────

export function buildPrompt(decision: ContentDecision): string {
  if (!decision) return '';
  switch (decision.type) {
    case 'review':       return buildReviewPrompt(decision.tool);
    case 'comparison':   return buildComparisonPrompt(decision.toolA, decision.toolB);
    case 'roundup':      return buildRoundupPrompt(decision.category, decision.categoryLabel, decision.tools);
    case 'guide':        return buildGuidePrompt(decision.topic, decision.topicType, decision.tool);
    case 'pricing':      return buildPricingPrompt(decision.tool);
    case 'alternatives': return buildAlternativesPrompt(decision.tool, decision.alternatives);
  }
}

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

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">[Direct question version of the article's main controversy]</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Direct 2-3 sentence answer]</p></div>
</div>

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">[Follow-up question readers will have]</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Specific answer with recommendation]</p></div>
</div>

<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">[Practical "what should I do" question]</h3>
<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Actionable answer]</p></div>
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