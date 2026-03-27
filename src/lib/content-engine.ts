// src/lib/content-engine.ts
// El cerebro del sistema — selección inteligente + prompts de calidad ultra-alta

import tools from '@/data/tools.json';
import type { BlogPost, GenerationState } from './kv-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  | { type: 'guide';       topic: string; tool: Tool }
  | { type: 'pricing';     tool: Tool }
  | null;

const TOOLS = tools as Tool[];
const YEAR  = new Date().getFullYear();

// ─── Categorías únicas ────────────────────────────────────────────────────────

function getCategories(): { category: string; categoryLabel: string }[] {
  const seen = new Set<string>();
  return TOOLS.reduce((acc, t) => {
    if (!seen.has(t.category)) {
      seen.add(t.category);
      acc.push({ category: t.category, categoryLabel: t.categoryLabel });
    }
    return acc;
  }, [] as { category: string; categoryLabel: string }[]);
}

// ─── Par normalizado (anti-duplicado de comparaciones) ────────────────────────

export function makePairKey(slugA: string, slugB: string): string {
  return [slugA, slugB].sort().join('___');
}

// ─── Selección inteligente de contenido ──────────────────────────────────────
// Rotación: review → compare → review → compare → roundup → review → guide → pricing
// Prioridad: tools con mayor trend primero

export function selectNextContent(state: GenerationState): ContentDecision {
  const n = state.totalGenerated;
  const ROTATION = [
    'review', 'comparison', 'review', 'comparison',
    'roundup', 'review', 'comparison', 'guide',
    'review', 'comparison', 'pricing', 'review',
  ];
  const desiredType = ROTATION[n % ROTATION.length];

  // ── Review ─────────────────────────────────────────────────────────────────
  if (desiredType === 'review' || desiredType === 'guide' || desiredType === 'pricing') {
    const unreviewed = TOOLS
      .filter(t => !state.reviewedTools.includes(t.slug))
      .sort((a, b) => {
        const av = parseFloat(a.trend.replace(/[^0-9.]/g, ''));
        const bv = parseFloat(b.trend.replace(/[^0-9.]/g, ''));
        return bv - av;
      });

    if (desiredType === 'guide') {
      // Guide: usa tool ya reseñada para más links internos
      const reviewed = TOOLS.find(t => state.reviewedTools.includes(t.slug) && !state.guidesDone.includes(t.slug));
      if (reviewed) return { type: 'guide', topic: `How to Get the Most Out of ${reviewed.name} in ${YEAR}`, tool: reviewed };
    }

    if (desiredType === 'pricing') {
      const noPricing = TOOLS.find(t => !state.pricingDone.includes(t.slug));
      if (noPricing) return { type: 'pricing', tool: noPricing };
    }

    if (unreviewed.length > 0) return { type: 'review', tool: unreviewed[0] };

    // Todas reseñadas → re-review con "Updated" en el ciclo siguiente
    const oldestReviewed = TOOLS[n % TOOLS.length];
    return { type: 'review', tool: oldestReviewed };
  }

  // ── Comparison ─────────────────────────────────────────────────────────────
  if (desiredType === 'comparison') {
    // Primero: mismo category (más SEO-relevante)
    for (const { category } of getCategories()) {
      const catTools = TOOLS.filter(t => t.category === category);
      for (let i = 0; i < catTools.length; i++) {
        for (let j = i + 1; j < catTools.length; j++) {
          const pair = makePairKey(catTools[i].slug, catTools[j].slug);
          if (!state.comparedPairs.includes(pair)) {
            return { type: 'comparison', toolA: catTools[i], toolB: catTools[j] };
          }
        }
      }
    }
    // Luego: cross-category (más variedad de contenido)
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
      const catTools = TOOLS.filter(t => t.category === undone.category)
        .sort((a, b) => b.rating - a.rating);
      return { type: 'roundup', category: undone.category, categoryLabel: undone.categoryLabel, tools: catTools };
    }
    // Redo más antiguo
    const redo = cats[Math.floor(n / cats.length) % cats.length];
    return {
      type: 'roundup',
      category: redo.category,
      categoryLabel: redo.categoryLabel,
      tools: TOOLS.filter(t => t.category === redo.category).sort((a, b) => b.rating - a.rating),
    };
  }

  // Fallback seguro
  const fallback = TOOLS.find(t => !state.reviewedTools.includes(t.slug)) ?? TOOLS[0];
  return { type: 'review', tool: fallback };
}

// ─── Generación de slugs únicos ───────────────────────────────────────────────

export function generateSlug(decision: ContentDecision): string {
  if (!decision) return '';
  switch (decision.type) {
    case 'review':     return `${decision.tool.slug}-review-${YEAR}`;
    case 'comparison': return `${decision.toolA.slug}-vs-${decision.toolB.slug}-${YEAR}`;
    case 'roundup':    return `best-${decision.category}-ai-tools-${YEAR}`;
    case 'guide':      return `how-to-use-${decision.tool.slug}-guide-${YEAR}`;
    case 'pricing':    return `${decision.tool.slug}-pricing-guide-${YEAR}`;
  }
}

// ─── Links internos automáticos ───────────────────────────────────────────────

function buildInternalLinks(toolSlugs: string[]): string {
  return TOOLS
    .filter(t => toolSlugs.includes(t.slug))
    .map(t => `<a href="/tools/${t.slug}">${t.name}</a>`)
    .join(', ');
}

function relatedComparisons(toolSlug: string): string {
  const related = TOOLS.filter(t => t.slug !== toolSlug).slice(0, 3);
  return related.map(t => `<a href="/compare/${[toolSlug, t.slug].sort().join('-vs-')}-${YEAR}">${TOOLS.find(x => x.slug === toolSlug)?.name} vs ${t.name}</a>`).join(' · ');
}

// ─── PROMPTS DE ALTA CALIDAD ──────────────────────────────────────────────────
// Cada prompt tiene estructura obligatoria, keyword targets, y requisitos de calidad

export function buildReviewPrompt(tool: Tool): string {
  const competitors = TOOLS
    .filter(t => t.category === tool.category && t.slug !== tool.slug)
    .slice(0, 3);
  const compLinks = competitors.map(t => `<a href="/tools/${t.slug}">${t.name}</a>`).join(', ');

  return `You are a senior AI tools analyst at comparaitools.com writing for ${YEAR}. Write a comprehensive, authoritative review of ${tool.name}.

TOOL DATA (use all specific numbers from this):
${JSON.stringify(tool, null, 2)}

SEO TARGETS:
- Primary keyword: "${tool.name} review ${YEAR}" (use 6-8 times naturally)
- Secondary: "${tool.name} pricing", "${tool.name} features", "${tool.name} alternatives", "is ${tool.name} worth it ${YEAR}", "${tool.company} ${tool.name}"

OUTPUT RULES:
- Output ONLY valid semantic HTML starting with <article> and ending with </article>
- No markdown, no backticks, no explanatory text outside the HTML
- Minimum 1,600 words of actual content (not counting tags)
- Every claim must be specific — use exact numbers from tool data
- Natural, expert tone — not salesy, not robotic

REQUIRED HTML STRUCTURE (follow exactly, expand each section):

<article itemscope itemtype="https://schema.org/Review">
<meta itemprop="datePublished" content="${new Date().toISOString()}"/>
<meta itemprop="author" content="comparaitools.com"/>

<h1 itemprop="name">${tool.name} Review ${YEAR}: [Write a compelling subtitle with the primary keyword — make it specific and benefit-driven, not generic]</h1>

<div class="quick-verdict" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
<meta itemprop="ratingValue" content="${tool.rating}"/>
<meta itemprop="bestRating" content="5"/>
<h2>Quick Verdict: ${tool.name} in ${YEAR}</h2>
<p class="rating-display">⭐ ${tool.rating}/5 — [One sentence verdict]</p>
<ul>
[4 bullet points: what makes this tool stand out this year — be specific, use numbers]
</ul>
<p class="best-for"><strong>Best for:</strong> ${tool.bestFor}</p>
<p class="pricing-quick"><strong>Pricing:</strong> ${tool.pricing}</p>
</div>

<nav class="toc" aria-label="Table of contents">
<h2>What We Cover in This Review</h2>
<ol>
<li><a href="#what-is">What is ${tool.name}?</a></li>
<li><a href="#features">Key Features</a></li>
<li><a href="#pricing">Pricing & Plans</a></li>
<li><a href="#pros-cons">Pros and Cons</a></li>
<li><a href="#who-for">Who Should Use It</a></li>
<li><a href="#alternatives">Alternatives</a></li>
<li><a href="#faq">FAQ</a></li>
<li><a href="#verdict">Final Verdict</a></li>
</ol>
</nav>

<h2 id="what-is">What is ${tool.name}?</h2>
[160-200 words: what the tool is, who built it (${tool.company}), when it launched, its mission/purpose. Include primary keyword once. Mention ${tool.users} users and explain why that matters.]

<h2 id="features">${tool.name} Key Features in ${YEAR}</h2>
[For EACH feature in this list: ${tool.features.join(' | ')} — write 2-4 sentences explaining: what the feature does, why it matters, how it works in practice. Give concrete examples. 350+ words total for this section.]

<h2 id="pricing">${tool.name} Pricing: Is It Worth the Cost in ${YEAR}?</h2>
[200+ words: Break down ${tool.pricing}. What do you get at each tier? Compare price to actual value delivered. Who should pay? When the free tier is enough. Include a recommendation on which plan to choose. Be decisive.]

<h2 id="pros-cons">Pros and Cons of ${tool.name}</h2>
<div class="pros-cons-grid">
<div class="pros">
<h3>✅ Pros</h3>
<ul>
${tool.pros.map(p => `<li><strong>${p.split(' ').slice(0,3).join(' ')}:</strong> [Expand this pro with specific detail and a real use case. 2-3 sentences.]</li>`).join('\n')}
</ul>
</div>
<div class="cons">
<h3>❌ Cons</h3>
<ul>
${tool.cons.map(c => `<li><strong>${c.split(' ').slice(0,3).join(' ')}:</strong> [Explain this limitation honestly. When does it actually hurt users? 2-3 sentences.]</li>`).join('\n')}
</ul>
</div>
</div>

<h2 id="who-for">Who Should Use ${tool.name} in ${YEAR}?</h2>
[Describe 3 specific user personas — each with: persona name (e.g. "The Professional Marketer"), their specific challenge, exactly how ${tool.name} solves it, and why it's the right choice for them. 250+ words total.]
<p><strong>Skip ${tool.name} if:</strong> [2-3 specific situations where this tool is NOT the right choice — be honest, this builds trust]</p>

<h2 id="alternatives">How ${tool.name} Compares to Alternatives</h2>
[Compare to these specific competitors: ${compLinks}. For each: one clear advantage ${tool.name} has, one area where the competitor wins. Use specific features and pricing. 200+ words. Include links.]

<h2 id="faq">Frequently Asked Questions About ${tool.name}</h2>
[Write 5 FAQs that real users search for. Use questions with "${tool.name}" in them. Each answer: 60-100 words, specific and useful.]
<div class="faq-list" itemscope itemtype="https://schema.org/FAQPage">

<div class="faq-item" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Is ${tool.name} free to use?</h3>
<div itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Answer based on ${tool.pricing} — specific, detailed]</p></div>
</div>

<div class="faq-item" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Who is ${tool.name} best for?</h3>
<div itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Specific answer based on bestFor: ${tool.bestFor}]</p></div>
</div>

<div class="faq-item" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">What are the main features of ${tool.name}?</h3>
<div itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Summarize top 3 features with specifics]</p></div>
</div>

<div class="faq-item" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">How does ${tool.name} compare to competitors?</h3>
<div itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Brief, specific comparison — 2-3 sentences]</p></div>
</div>

<div class="faq-item" itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Is ${tool.name} worth it in ${YEAR}?</h3>
<div itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Clear verdict — for whom yes, for whom no. Include rating ${tool.rating}/5]</p></div>
</div>

</div>

<h2 id="verdict">Final Verdict: Is ${tool.name} Worth It in ${YEAR}?</h2>
[150-200 words: Strong, definitive conclusion. Restate rating. Clear "buy it if..." and "skip it if..." guidance. End exactly with this CTA:]
<p>Ready to compare ${tool.name} with alternatives? <a href="/compare">See our full AI tool comparison →</a></p>
<p>Also compare: ${relatedComparisons(tool.slug)}</p>

</article>

CRITICAL — failure conditions to avoid:
- Generic phrases like "a powerful tool" or "cutting-edge AI" — always be specific
- Keyword stuffing — natural placement only
- Missing the word count minimum (1,600+ words)
- Any markdown or code fences in output`;
}

export function buildComparisonPrompt(toolA: Tool, toolB: Tool): string {
  return `You are a senior AI tools analyst at comparaitools.com. Write the definitive ${toolA.name} vs ${toolB.name} comparison for ${YEAR}.

TOOL A: ${JSON.stringify(toolA, null, 2)}
TOOL B: ${JSON.stringify(toolB, null, 2)}

SEO TARGETS:
- Primary: "${toolA.name} vs ${toolB.name} ${YEAR}" (use 7-9 times)
- Secondary: "${toolA.name} or ${toolB.name}", "${toolA.name} alternative", "${toolB.name} alternative", "compare ${toolA.name} ${toolB.name}"

OUTPUT: ONLY valid HTML starting with <article> ending with </article>. Minimum 1,800 words.

<article>
<h1>${toolA.name} vs ${toolB.name} (${YEAR}): Which One Should You Choose?</h1>

<div class="tldr-box">
<h2>TL;DR — Quick Verdict</h2>
<p><strong>Choose <a href="/tools/${toolA.slug}">${toolA.name}</a></strong> if: [specific, concrete use case — 1 sentence]</p>
<p><strong>Choose <a href="/tools/${toolB.slug}">${toolB.name}</a></strong> if: [specific, concrete use case — 1 sentence]</p>
<p><em>[1-2 sentences on the core philosophical difference between these two tools]</em></p>
</div>

<h2>Overview: ${toolA.name} vs ${toolB.name}</h2>
[200 words: Context for this comparison. Who uses each tool? Why does this comparison matter in ${YEAR}? What changed recently? Use specific numbers: ${toolA.users} vs ${toolB.users} users, ${toolA.rating} vs ${toolB.rating} rating.]

<h2>Feature-by-Feature Comparison</h2>
<table>
<thead><tr><th>Feature</th><th>${toolA.logo} ${toolA.name}</th><th>${toolB.logo} ${toolB.name}</th><th>Winner</th></tr></thead>
<tbody>
<tr><td>Starting Price</td><td>${toolA.pricing}</td><td>${toolB.pricing}</td><td>[pick winner]</td></tr>
<tr><td>User Base</td><td>${toolA.users}</td><td>${toolB.users}</td><td>[pick winner]</td></tr>
<tr><td>Rating</td><td>${toolA.rating}/5</td><td>${toolB.rating}/5</td><td>[pick winner]</td></tr>
<tr><td>Free Tier</td><td>[yes/no/limited]</td><td>[yes/no/limited]</td><td>[pick winner]</td></tr>
[Add 5-6 more rows comparing specific features from their data]
<tr><td><strong>Overall Winner</strong></td><td colspan="3">[clear winner or "depends on use case"]</td></tr>
</tbody>
</table>

<h2>Pricing Comparison: ${toolA.name} vs ${toolB.name}</h2>
[200+ words: Compare ${toolA.pricing} vs ${toolB.pricing}. Which offers better value? Free tiers compared. Who gets the better deal at which price point? Be specific with dollar amounts.]

<h2>${toolA.name} Strengths: Where It Wins</h2>
[200+ words: ${toolA.name}'s top 3 advantages over ${toolB.name}. For each: explain why it matters, give a specific use case, cite data from tool profile (features: ${toolA.features.join(', ')})]

<h2>${toolB.name} Strengths: Where It Wins</h2>
[200+ words: ${toolB.name}'s top 3 advantages over ${toolA.name}. Same format. (features: ${toolB.features.join(', ')})]

<h2>When to Choose ${toolA.name}</h2>
<ul>
[3 specific scenarios. Each: describe the user/situation, explain why ${toolA.name} is the right pick here. 150+ words total.]
</ul>

<h2>When to Choose ${toolB.name}</h2>
<ul>
[3 specific scenarios. Same format. 150+ words total.]
</ul>

<h2>User Experience Comparison</h2>
[150+ words: Learning curve, UI quality, onboarding, mobile experience, integrations. Which is easier for beginners? Which is more powerful for experts?]

<h2>Frequently Asked Questions</h2>
<div itemscope itemtype="https://schema.org/FAQPage">

<div itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Is ${toolA.name} better than ${toolB.name}?</h3>
<div itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Nuanced answer — it depends on X. For Y use case ${toolA.name} wins, for Z ${toolB.name} wins.]</p></div>
</div>

<div itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Can I use both ${toolA.name} and ${toolB.name}?</h3>
<div itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Practical answer about whether they complement each other]</p></div>
</div>

<div itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Which is cheaper: ${toolA.name} or ${toolB.name}?</h3>
<div itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Specific pricing comparison]</p></div>
</div>

<div itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">What is ${toolA.name} best at compared to ${toolB.name}?</h3>
<div itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Specific capability comparison]</p></div>
</div>

<div itemscope itemtype="https://schema.org/Question">
<h3 itemprop="name">Which should a beginner choose: ${toolA.name} or ${toolB.name}?</h3>
<div itemscope itemtype="https://schema.org/Answer"><p itemprop="text">[Clear, specific recommendation for beginners]</p></div>
</div>

</div>

<h2>Final Verdict: ${toolA.name} vs ${toolB.name} (${YEAR})</h2>
[150-200 words: Decisive verdict. Rate each for different use cases. Clear recommendation matrix. End with:]
<p>Explore more AI tool comparisons: <a href="/compare">comparaitools.com/compare →</a></p>

</article>`;
}

export function buildRoundupPrompt(category: string, categoryLabel: string, catTools: Tool[]): string {
  return `You are a senior AI tools analyst at comparaitools.com. Write the definitive ${YEAR} guide to the best ${categoryLabel} AI tools.

TOOLS TO RANK: ${JSON.stringify(catTools, null, 2)}

SEO TARGETS:
- Primary: "best ${categoryLabel.toLowerCase()} AI tools ${YEAR}" (use 7-9 times)
- Secondary: "top ${categoryLabel.toLowerCase()} AI", "${categoryLabel.toLowerCase()} AI comparison ${YEAR}", "best AI for ${categoryLabel.toLowerCase()}"

OUTPUT: ONLY HTML starting with <article> ending with </article>. Minimum 2,000 words.

<article>
<h1>Best ${categoryLabel} AI Tools in ${YEAR}: ${catTools.length} Expert Picks Ranked</h1>

<div class="intro-section">
[150 words: Why this category matters in ${YEAR}, what criteria we used to rank these tools (features, pricing, user base, real-world testing), who this guide is for. Include primary keyword naturally.]
</div>

<div class="quick-picks-box">
<h2>Quick Picks: Best ${categoryLabel} AI Tools at a Glance</h2>
<ol>
${catTools.map((t, i) => `<li><a href="/tools/${t.slug}"><strong>${t.logo} ${t.name}</strong></a> — [One specific, compelling reason this ranks #${i+1}]</li>`).join('\n')}
</ol>
</div>

<h2>How We Evaluated These ${categoryLabel} AI Tools</h2>
[150 words: Testing methodology — what we actually tested, time spent, metrics used. Build trust by being specific about the evaluation process.]

${catTools.map((tool, index) => `
<h2>#${index + 1} ${tool.logo} ${tool.name}: Best for ${tool.bestFor}</h2>
<div class="tool-meta">
<span>⭐ ${tool.rating}/5</span>
<span>💰 ${tool.pricing}</span>
<span>👥 ${tool.users} users</span>
<span>📈 Trending ${tool.trend}</span>
</div>
<p>[200+ words: What makes ${tool.name} stand out among ALL ${categoryLabel} tools. Its key differentiator. The 2-3 features (${tool.features.slice(0,3).join(', ')}) that make it special. Who it's perfect for. Main limitation to be aware of: ${tool.cons[0]}. Clear mini-verdict.]</p>
<p><strong>Best for:</strong> ${tool.bestFor}</p>
<p><strong>Pricing:</strong> ${tool.pricing}</p>
<p>✅ <strong>Key pro:</strong> ${tool.pros[0]}</p>
<p>❌ <strong>Key con:</strong> ${tool.cons[0]}</p>
<p><a href="/tools/${tool.slug}">Read our full ${tool.name} review →</a></p>
`).join('\n')}

<h2>Side-by-Side Comparison: All ${categoryLabel} AI Tools</h2>
<table>
<thead><tr><th>Tool</th><th>Price</th><th>Rating</th><th>Users</th><th>Best For</th><th>Trend</th></tr></thead>
<tbody>
${catTools.map(t => `<tr><td><a href="/tools/${t.slug}">${t.logo} ${t.name}</a></td><td>${t.pricing}</td><td>${t.rating}/5</td><td>${t.users}</td><td>${t.bestFor}</td><td>${t.trend}</td></tr>`).join('\n')}
</tbody>
</table>

<h2>How to Choose the Right ${categoryLabel} AI Tool in ${YEAR}</h2>
[250 words: 4-5 decision factors with specific guidance: budget constraints, use case, technical skill level, team size, integration requirements. Frame as questions the reader should ask themselves.]

<h2>Frequently Asked Questions</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
[5 FAQs about ${categoryLabel} AI tools generally — real questions people ask. Each answer 60-100 words, specific to the tools in this list. Use FAQ schema markup as shown in the structure.]
</div>

<h2>Final Recommendations: Which ${categoryLabel} AI Tool Is Right for You?</h2>
[200 words: Decision matrix — best for beginners, best for professionals, best free option, best for teams, best value overall. Each with a 1-2 sentence justification. End with:]
<p>Compare any two ${categoryLabel} AI tools head-to-head: <a href="/compare">comparaitools.com/compare →</a></p>

</article>`;
}

export function buildGuidePrompt(topic: string, tool: Tool): string {
  return `You are an expert AI workflow consultant at comparaitools.com. Write a practical, step-by-step guide: "${topic}"

TOOL: ${JSON.stringify(tool, null, 2)}

SEO TARGETS:
- Primary: "${topic.toLowerCase()}" (use 5-7 times)
- Secondary: "${tool.name} tips ${YEAR}", "${tool.name} tutorial", "${tool.name} workflow", "how to use ${tool.name}"

OUTPUT: ONLY HTML starting with <article> ending with </article>. Minimum 1,800 words.

<article>
<h1>${topic}: Complete ${YEAR} Guide</h1>

[100 words intro: Who this guide is for, what they'll learn, the specific outcome they'll achieve. Include primary keyword.]

<div class="prerequisites">
<h2>What You Need Before You Start</h2>
[Account type (free vs paid ${tool.pricing}), any skills assumed, estimated time to follow this guide. 80-100 words.]
</div>

[7 detailed steps — for EACH step:
- Clear h2 header: "Step N: [Action verb] [Specific thing]"
- 200-250 words per step
- Specific actions to take, not just what to do
- Common mistake to avoid in this step
- Pro tip where relevant]

<h2>Pro Tips: Advanced ${tool.name} Techniques</h2>
[5 power-user tips most beginners miss. Each: name the tip, explain it, give a specific example. 250+ words.]

<h2>Common Mistakes to Avoid</h2>
[4-5 mistakes with solutions. Specific to ${tool.name}'s actual limitations: ${tool.cons.join(', ')}. 200 words.]

<h2>Real-World Examples</h2>
[3 concrete workflows with ${tool.name}. Each: describe the user's goal, the exact steps they'd take, the result they get. 300+ words.]

<h2>Frequently Asked Questions</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
[5 how-to FAQs specific to this guide topic. FAQ schema markup.]
</div>

<h2>Next Steps</h2>
[Suggest related tools to compare. End with:]
<p>Compare ${tool.name} with alternatives to find the best fit: <a href="/compare">comparaitools.com/compare →</a></p>
<p>Read our full <a href="/tools/${tool.slug}">${tool.name} review →</a></p>

</article>`;
}

export function buildPricingPrompt(tool: Tool): string {
  const competitors = TOOLS
    .filter(t => t.category === tool.category && t.slug !== tool.slug)
    .slice(0, 3);

  return `You are a senior pricing analyst at comparaitools.com. Write a comprehensive ${tool.name} pricing guide for ${YEAR}.

TOOL: ${JSON.stringify(tool, null, 2)}
COMPETITORS: ${JSON.stringify(competitors, null, 2)}

SEO TARGETS:
- Primary: "${tool.name} pricing ${YEAR}" (use 6-8 times)
- Secondary: "${tool.name} cost", "${tool.name} free vs paid", "${tool.name} plans", "how much is ${tool.name}"

OUTPUT: ONLY HTML starting with <article> ending with </article>. Minimum 1,400 words.

<article>
<h1>${tool.name} Pricing Guide ${YEAR}: Plans, Costs, and Is It Worth It?</h1>

[100 word intro with primary keyword]

<h2>${tool.name} Pricing Plans: Complete Breakdown</h2>
[300 words: Detailed breakdown of ${tool.pricing}. What's included at each tier. Who each tier is designed for. What features are gated behind paid plans. Be specific.]

<h2>Is ${tool.name} Free? What You Get Without Paying</h2>
[200 words: Honest assessment of the free tier (if any). What limits hit you first. When you'll need to upgrade. Real use cases where free is enough vs when you need paid.]

<h2>${tool.name} vs Competitors: Pricing Comparison</h2>
<table>
<thead><tr><th>Tool</th><th>Starting Price</th><th>Free Tier</th><th>Best Value For</th></tr></thead>
<tbody>
<tr><td><a href="/tools/${tool.slug}">${tool.name}</a></td><td>${tool.pricing}</td><td>[yes/no/limited]</td><td>${tool.bestFor}</td></tr>
${competitors.map(c => `<tr><td><a href="/tools/${c.slug}">${c.name}</a></td><td>${c.pricing}</td><td>[yes/no/limited]</td><td>${c.bestFor}</td></tr>`).join('\n')}
</tbody>
</table>

<h2>Is ${tool.name} Worth the Price in ${YEAR}?</h2>
[250 words: ROI analysis for different user types. When it pays for itself. When cheaper alternatives are smarter.]

<h2>How to Get the Best Deal on ${tool.name}</h2>
[150 words: Annual vs monthly billing, team discounts, student/nonprofit deals, trial periods, freemium strategies.]

<h2>Frequently Asked Questions About ${tool.name} Pricing</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
[5 pricing-specific FAQs with schema markup]
</div>

<h2>Final Verdict on ${tool.name} Pricing</h2>
[120 words: Clear verdict on value. Who should pay, who should stick to free, who should look elsewhere. Link to full review.]
<p>Read our full <a href="/tools/${tool.slug}">${tool.name} review →</a> or <a href="/compare">compare pricing across all AI tools →</a></p>

</article>`;
}

// ─── SEO Metadata Generator ───────────────────────────────────────────────────

export function generateSEOMetadata(
  decision: ContentDecision,
  content: string
): Pick<BlogPost, 'metaTitle' | 'metaDescription' | 'primaryKeyword' | 'keywords' | 'excerpt' | 'wordCount' | 'readingTime' | 'schemaOrg'> {
  const wordCount = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 220));
  const rawText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const excerpt = rawText.slice(0, 160).trim() + (rawText.length > 160 ? '...' : '');

  if (!decision) {
    return { metaTitle: '', metaDescription: '', primaryKeyword: '', keywords: [], excerpt, wordCount, readingTime, schemaOrg: {} };
  }

  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    publisher: { '@type': 'Organization', name: 'comparaitools.com', url: 'https://comparaitools.com' },
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
  };

  switch (decision.type) {
    case 'review': {
      const t = decision.tool;
      return {
        metaTitle:      `${t.name} Review ${YEAR}: Is It Worth It? [Expert Analysis]`,
        metaDescription:`Comprehensive ${t.name} review for ${YEAR}. Features, pricing (${t.pricing}), pros & cons analyzed. Rated ${t.rating}/5 by our experts. Read before you decide.`,
        primaryKeyword: `${t.name} review ${YEAR}`,
        keywords: [`${t.name} review`, `${t.name} ${YEAR}`, `${t.name} pricing`, `${t.name} features`, `is ${t.name} worth it`, `${t.name} alternatives`, `${t.company} ${t.name}`],
        excerpt, wordCount, readingTime,
        schemaOrg: {
          ...baseSchema,
          '@type': 'Review',
          name: `${t.name} Review ${YEAR}`,
          reviewRating: { '@type': 'Rating', ratingValue: t.rating, bestRating: 5 },
          itemReviewed: { '@type': 'SoftwareApplication', name: t.name, applicationCategory: t.categoryLabel },
        },
      };
    }
    case 'comparison': {
      const { toolA, toolB } = decision;
      return {
        metaTitle:      `${toolA.name} vs ${toolB.name} (${YEAR}): Which Is Better? Full Comparison`,
        metaDescription:`${toolA.name} vs ${toolB.name}: In-depth ${YEAR} comparison. Features, pricing, and use cases analyzed. We tested both — here's which one wins for your needs.`,
        primaryKeyword: `${toolA.name} vs ${toolB.name} ${YEAR}`,
        keywords: [`${toolA.name} vs ${toolB.name}`, `${toolA.name} or ${toolB.name}`, `${toolA.name} alternative`, `${toolB.name} alternative`, `compare ${toolA.name} ${toolB.name} ${YEAR}`],
        excerpt, wordCount, readingTime,
        schemaOrg: { ...baseSchema, name: `${toolA.name} vs ${toolB.name} ${YEAR}` },
      };
    }
    case 'roundup': {
      const label = decision.categoryLabel;
      return {
        metaTitle:      `Best ${label} AI Tools in ${YEAR}: Top ${decision.tools.length} Picks Ranked`,
        metaDescription:`We tested the best ${label.toLowerCase()} AI tools in ${YEAR}. Compare ${decision.tools.length} tools by features, pricing & use cases. Find the perfect tool.`,
        primaryKeyword: `best ${label.toLowerCase()} AI tools ${YEAR}`,
        keywords: [`best ${label.toLowerCase()} AI`, `top ${label.toLowerCase()} AI tools`, `${label.toLowerCase()} AI comparison ${YEAR}`],
        excerpt, wordCount, readingTime,
        schemaOrg: { ...baseSchema, name: `Best ${label} AI Tools ${YEAR}` },
      };
    }
    case 'guide': {
      const t = decision.tool;
      return {
        metaTitle:      `${decision.topic}: Complete Guide ${YEAR}`,
        metaDescription:`Step-by-step guide to getting the most out of ${t.name} in ${YEAR}. Expert tips, workflows, and real examples. ${readingTime} min read.`,
        primaryKeyword: decision.topic.toLowerCase(),
        keywords: [`${t.name} tutorial`, `how to use ${t.name}`, `${t.name} tips ${YEAR}`, `${t.name} workflow`],
        excerpt, wordCount, readingTime,
        schemaOrg: { ...baseSchema, '@type': 'HowTo', name: decision.topic },
      };
    }
    case 'pricing': {
      const t = decision.tool;
      return {
        metaTitle:      `${t.name} Pricing ${YEAR}: Plans, Costs & Is It Worth It?`,
        metaDescription:`Complete ${t.name} pricing breakdown for ${YEAR}. Free vs paid plans compared. Is it worth it? We analyze the cost vs value for every use case.`,
        primaryKeyword: `${t.name} pricing ${YEAR}`,
        keywords: [`${t.name} cost`, `${t.name} plans`, `${t.name} free vs paid`, `how much is ${t.name} ${YEAR}`],
        excerpt, wordCount, readingTime,
        schemaOrg: { ...baseSchema, name: `${t.name} Pricing Guide ${YEAR}` },
      };
    }
  }
}

// ─── Selector de prompt ───────────────────────────────────────────────────────

export function buildPrompt(decision: ContentDecision): string {
  if (!decision) return '';
  switch (decision.type) {
    case 'review':     return buildReviewPrompt(decision.tool);
    case 'comparison': return buildComparisonPrompt(decision.toolA, decision.toolB);
    case 'roundup':    return buildRoundupPrompt(decision.category, decision.categoryLabel, decision.tools);
    case 'guide':      return buildGuidePrompt(decision.topic, decision.tool);
    case 'pricing':    return buildPricingPrompt(decision.tool);
  }
}
