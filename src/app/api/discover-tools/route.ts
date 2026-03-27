// src/app/api/discover-tools/route.ts
// V2: Limpia datos antes de guardar + prompt mejorado sin web search citations

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTools, saveTool, addPendingTool,
  getDiscoveryState, saveDiscoveryState,
  bootstrapStaticTools, type DynamicTool,
} from '@/lib/tools-storage';

// ─── Limpieza agresiva de cualquier artefacto HTML/citation ──────────────────

function clean(text: any): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/]*>[\s\S]*?<\/antml:cite>/gi, '')
    .replace(/<cite[^>]*>[\s\S]*?<\/cite>/gi, '')
    .replace(/\[[\d,\s]+\]/g, '')           // [1], [2,3], etc
    .replace(/<[^>]+>/g, '')                // any HTML tag
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanArr(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(clean).filter(s => s && s.length > 3);
}

// ─── Queries rotativas ────────────────────────────────────────────────────────

const SEARCH_QUERIES = [
  'new AI tools launched 2026',
  'best new AI productivity tools 2026',
  'new AI image generation tools 2026',
  'new AI coding assistants 2026',
  'new AI video generation tools 2026',
  'new AI audio voice tools 2026',
  'trending AI startups 2026',
  'new AI search engines 2026',
  'best AI tools for business 2026',
  'new AI writing marketing tools 2026',
];

const CATEGORY_MAP: Record<string, string> = {
  chatbot: 'Chatbot', image: 'Image Generation', code: 'Code Assistant',
  video: 'Video Generation', audio: 'Audio & Voice', search: 'AI Search',
  writing: 'Writing & Marketing', marketing: 'Writing & Marketing',
  productivity: 'Productivity', design: 'Design', data: 'Data & Analytics',
};
const LOGO_MAP: Record<string, string> = {
  chatbot: '🤖', image: '🎨', code: '👨‍💻', video: '🎬', audio: '🎙️',
  search: '🔍', writing: '✍️', marketing: '📢', productivity: '⚡',
  design: '🖌️', data: '📊',
};
const COLOR_MAP: Record<string, string> = {
  chatbot: '#10a37f', image: '#ff6b6b', code: '#7c3aed', video: '#e040fb',
  audio: '#ff4081', search: '#20b2aa', writing: '#f97316', marketing: '#f97316',
  productivity: '#3b82f6', design: '#ec4899', data: '#06b6d4',
};

export async function GET(request: NextRequest) {
  const secret      = request.nextUrl.searchParams.get('secret');
  const force       = request.nextUrl.searchParams.get('force') === 'true';
  const autoApprove = request.nextUrl.searchParams.get('approve') !== 'false'; // default true

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY missing' }, { status: 500 });

  try {
    await bootstrapStaticTools();

    // Check weekly rate limit
    const discState = await getDiscoveryState();
    if (!force && discState.lastRunAt) {
      const daysSince = (Date.now() - new Date(discState.lastRunAt).getTime()) / 86400000;
      if (daysSince < 6) {
        return NextResponse.json({
          success: true,
          message: `Already ran ${Math.floor(daysSince)} days ago. Next run in ${6 - Math.floor(daysSince)} days.`,
        });
      }
    }

    const existingTools = await getAllTools();
    const existingNames = new Set(existingTools.map(t => t.name.toLowerCase()));
    const existingSlugs = new Set(existingTools.map(t => t.slug));

    const unusedQuery = SEARCH_QUERIES.find(q => !discState.searchesRun.includes(q))
      ?? SEARCH_QUERIES[discState.toolsDiscovered % SEARCH_QUERIES.length];

    // ─── Llamar a Claude sin web_search para evitar citations ─────────────────
    // En cambio, usamos el conocimiento interno del modelo sobre tools nuevas
    // y solo pedimos JSON limpio sin ningún HTML
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: `You are an AI tools researcher. Your task is to identify real, recently launched AI tools.

CRITICAL OUTPUT RULES:
- Output ONLY a valid JSON array, nothing else
- NO markdown, NO code fences, NO explanations
- NO HTML tags of any kind
- NO citation markers like [1] or <cite>
- Every string value must be plain text only
- If you're not 100% sure about a fact, use a conservative estimate

The JSON array must follow this exact schema:
[{"name":"string","company":"string","website":"string","category":"chatbot|image|code|video|audio|search|writing|productivity|design|data","pricing":"string","pricingValue":0,"rating":4.2,"users":"string","description":"plain text one sentence","longDescription":"plain text 2-3 sentences","bestFor":"plain text specific use case","features":["string","string","string","string","string"],"pros":["string","string","string","string"],"cons":["string","string","string"],"trend":"+X%"}]`,
        messages: [{
          role: 'user',
          content: `List 4-5 real AI tools that are NEW or significantly trending in 2026 and NOT in this existing list: ${[...existingNames].slice(0, 20).join(', ')}.

Topic focus: ${unusedQuery}

Requirements for each tool:
- Must be a real product with an actual website
- Must have been launched or gained significant traction in 2025-2026
- Rating should be between 3.5 and 4.9 (realistic, not inflated)
- Users field format examples: "50K+", "1M+", "500K+"
- Trend field format examples: "+45%", "+120%", "+30%"
- Description: one clear sentence explaining what it does
- longDescription: 2-3 sentences with more detail
- bestFor: specific use case, e.g. "Video creators who need AI-generated b-roll footage"
- features: exactly 5 specific feature names
- pros: exactly 4 specific advantages
- cons: exactly 3 honest limitations

Output ONLY the JSON array, no other text.`,
        }],
      }),
    });

    const data = await response.json();
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 });

    const rawText = data.content?.filter((b: any) => b.type === 'text')?.map((b: any) => b.text)?.join('') ?? '';

    // Parse JSON — manejo robusto de diferentes formatos
    let discovered: any[] = [];
    try {
      // Intentar parsear directamente
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) discovered = JSON.parse(jsonMatch[0]);
    } catch {
      // Fallback: buscar entre ```json y ```
      const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenced) {
        try { discovered = JSON.parse(fenced[1]); } catch {}
      }
    }

    if (!Array.isArray(discovered) || discovered.length === 0) {
      return NextResponse.json({
        error: 'No valid tools parsed',
        raw: rawText.slice(0, 300),
      }, { status: 500 });
    }

    const added: string[] = [];
    const skipped: string[] = [];

    for (const tool of discovered) {
      if (!tool.name || !tool.category) { skipped.push(tool.name ?? 'unknown'); continue; }

      const nameLower = tool.name.toLowerCase();
      if (existingNames.has(nameLower)) { skipped.push(tool.name); continue; }

      const slug = tool.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (existingSlugs.has(slug)) { skipped.push(tool.name); continue; }

      const category = CATEGORY_MAP[tool.category] ? tool.category : 'productivity';

      // ─── Limpiar TODOS los campos antes de guardar ────────────────────────
      const newTool: DynamicTool = {
        id:              slug,
        slug,
        name:            clean(tool.name),
        company:         clean(tool.company || tool.name),
        category,
        categoryLabel:   CATEGORY_MAP[category] ?? 'AI Tool',
        pricing:         clean(tool.pricing || 'Free / Paid'),
        pricingValue:    Number(tool.pricingValue) || 0,
        rating:          Math.min(5, Math.max(3, Number(tool.rating) || 4.0)),
        users:           clean(tool.users || '10K+'),
        logo:            LOGO_MAP[category] ?? '🤖',
        color:           COLOR_MAP[category] ?? '#6366f1',
        features:        cleanArr(tool.features).slice(0, 5),
        pros:            cleanArr(tool.pros).slice(0, 4),
        cons:            cleanArr(tool.cons).slice(0, 3),
        description:     clean(tool.description),
        longDescription: clean(tool.longDescription || tool.description),
        bestFor:         clean(tool.bestFor || ''),
        lastUpdated:     new Date().toISOString().split('T')[0],
        trend:           clean(tool.trend || '+10%'),
        url:             clean(tool.website || `https://${slug}.com`),
        source:          'discovered',
        discoveredAt:    new Date().toISOString(),
        verified:        autoApprove,
      };

      // Validar que tiene descripción real
      if (!newTool.description || newTool.description.length < 10) {
        skipped.push(tool.name + ' (no description)');
        continue;
      }

      if (autoApprove) {
        await saveTool(newTool);
      } else {
        await addPendingTool(newTool);
      }

      existingNames.add(nameLower);
      existingSlugs.add(slug);
      added.push(newTool.name);
    }

    await saveDiscoveryState({
      lastRunAt:       new Date().toISOString(),
      toolsDiscovered: discState.toolsDiscovered + added.length,
      searchesRun:     [...new Set([...discState.searchesRun, unusedQuery])],
      totalAdded:      discState.totalAdded + (autoApprove ? added.length : 0),
    });

    if (added.length > 0 && autoApprove) {
      try { await fetch('https://www.google.com/ping?sitemap=https://comparaitools.com/sitemap.xml'); } catch {}
    }

    return NextResponse.json({
      success: true, query: unusedQuery,
      discovered: added, skipped,
      autoApproved: autoApprove,
      message: `${added.length} tools added`,
      totalToolsNow: existingTools.length + (autoApprove ? added.length : 0),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
