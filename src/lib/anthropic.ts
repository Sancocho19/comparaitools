import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateToolReview(toolName: string, toolData: any) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: `Write a comprehensive, SEO-optimized review of ${toolName}. Data: ${JSON.stringify(toolData)}. Requirements: Title with H1 tag, 800+ words, include pros/cons, pricing analysis, Who is it best for section, FAQ section (3-5 questions), natural keyword placement, engaging expert tone, verdict/rating. Format as clean HTML with semantic tags.`
    }]
  });
  return message.content[0].type === 'text' ? message.content[0].text : '';
}

export async function generateComparison(toolA: any, toolB: any) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `Write an SEO-optimized comparison: ${toolA.name} vs ${toolB.name} (2026). Tool A: ${JSON.stringify(toolA)}. Tool B: ${JSON.stringify(toolB)}. Include: compelling intro, feature-by-feature comparison table, pricing comparison, use cases where each wins, final verdict, FAQ section. Format as semantic HTML.`
    }]
  });
  return message.content[0].type === 'text' ? message.content[0].text : '';
}

export async function generateBlogPost(topic: string) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `Write an SEO blog post about: ${topic}. Requirements: 1200+ words, use H2 and H3 subheadings, include internal links to /tools/[name] pages, data-driven with specific numbers, end with a CTA to explore our tool comparison at comparaitools.com. Format as semantic HTML.`
    }]
  });
  return message.content[0].type === 'text' ? message.content[0].text : '';
}
```

**Guarda con Ctrl+S y cierra Notepad.** Luego ejecuta:
```
git add .
git commit -m "Fix anthropic.ts - remove extra text"
git push