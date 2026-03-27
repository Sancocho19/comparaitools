// src/app/api/discover-tools/route.ts
// Cron semanal: Claude busca nuevas AI tools en la web y las agrega al sistema

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTools, addPendingTool, approvePendingTool,
  getDiscoveryState, saveDiscoveryState,
  bootstrapStaticTools, saveTool,
  type DynamicTool,
} from '@/lib/tools-storage';

// ─── Queries de búsqueda rotativas ────────────────────────────────────────────

const SEARCH_QUERIES = [
  'new AI tools launched 2026',
  'best new AI writing tools 2026',
  'new AI image generation tools 2026',
  'new AI coding assistants 2026',
  'new AI video tools 2026',
  'new AI audio tools 2026',
  'trending AI productivity tools 2026',
  'new AI search engines 2026',
  'best AI tools for business 2026',
  'new AI tools for developers 2026',
  'emerging AI startups tools 2026',
  'new AI marketing tools 2026',
];

const CATEGORY_MAP: Record<string, string> = {
  'chatbot': 'Chatbot',
  'image': 'Image Generation',
  'code': 'Code Assistant',
  'video': 'Video Generation',
  'audio': 'Audio & Voice',
  'search': 'AI Search',
  'writing': 'Writing & Marketing',
  'marketing': 'Writing & Marketing',
  'productivity': 'Productivity',
  'design': 'Design',
  'data': 'Data & Analytics',
};

const LOGO_MAP: Record<string, string> = {
  chatbot: '🤖', image: '🎨', code: '👨‍💻',
  video: '🎬', audio: '🎙️', search: '🔍',
  writing: '✍️', marketing: '📢', productivity: '⚡',
  design: '🖌️', data: '📊',
};

const COLOR_MAP: Record<string, string> = {
  chatbot: '#10a37f', image: '#ff6b6b', code: '#7c3aed',
  video: '#e040fb', audio: '#ff4081', search: '#20b2aa',
  writing: '#f97316', marketing: '#f97316', productivity: '#3b82f6',
  design: '#ec4899', data: '#06b6d4',
};

// ─── GET — Llamado por Vercel Cron semanalmente ───────────────────────────────

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const force  = request.nextUrl.searchParams.get('force') === 'true';
  const autoApprove = request.nextUrl.searchParams.get('approve') === 'true';

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY missing' }, { status: 500 });

  try {
    // 1. Bootstrap tools estáticas en Redis si es primera vez
    await bootstrapStaticTools();

    // 2. Verificar si ya corrió esta semana
    const discState = await getDiscoveryState();
    if (!force && discState.lastRunAt) {
      const lastRun = new Date(discState.lastRunAt);
      const daysSince = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 6) {
        return NextResponse.json({
          success: true,
          message: `Already ran ${Math.floor(daysSince)} days ago. Next run in ${6 - Math.floor(daysSince)} days.`,
          nextRun: new Date(lastRun.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    // 3. Obtener tools existentes para evitar duplicados
    const existingTools = await getAllTools();
    const existingNames = new Set(existingTools.map(t => t.name.toLowerCase()));
    const existingSlugs = new Set(existingTools.map(t => t.slug));

    // 4. Seleccionar query no usada aún
    const unusedQuery = SEARCH_QUERIES.find(q => !discState.searchesRun.includes(q))
      ?? SEARCH_QUERIES[discState.toolsDiscovered % SEARCH_QUERIES.length];

    // 5. Llamar a Claude con web search para descubrir tools nuevas
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        tools: [{
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 5,
        }],
        system: `You are an AI tools researcher at comparaitools.com. Your job is to discover NEW, REAL AI tools that are genuinely useful and not already in our database.

EXISTING TOOLS TO SKIP: ${[...existingNames].join(', ')}

RESEARCH RULES:
1. Only include REAL tools with actual websites
2. Only tools launched or significantly updated in 2025-2026
3. Focus on tools with 1000+ users or significant press coverage
4. Do NOT include tools from our existing list
5. Gather accurate pricing, features, and descriptions

OUTPUT FORMAT: Respond ONLY with a valid JSON array, no other text:
[
  {
    "name": "Tool Name",
    "company": "Company Name", 
    "website": "https://example.com",
    "category": "chatbot|image|code|video|audio|search|writing|marketing|productivity|design|data",
    "pricing": "Free / $X/mo",
    "pricingValue": 0,
    "rating": 4.2,
    "users": "10K+",
    "description": "One sentence description of what it does",
    "longDescription": "2-3 sentence detailed description",
    "bestFor": "Specific use case description",
    "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
    "pros": ["Pro 1", "Pro 2", "Pro 3", "Pro 4"],
    "cons": ["Con 1", "Con 2", "Con 3"],
    "trend": "+45%"
  }
]

Find 3-5 genuinely new and relevant AI tools. Be accurate — users will see this data.`,
        messages: [{
          role: 'user',
          content: `Search for: "${unusedQuery}"
          
Find 3-5 new AI tools NOT in our existing database. Return ONLY a JSON array with accurate data about each tool.`,
        }],
      }),
    });

    const data = await response.json();
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    // 6. Extraer texto de la respuesta (puede tener tool_use blocks)
    const textContent = data.content
      ?.filter((b: any) => b.type === 'text')
      ?.map((b: any) => b.text)
      ?.join('') ?? '';

    // 7. Parsear el JSON de tools descubiertas
    let discoveredTools: any[] = [];
    try {
      const jsonMatch = textContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        discoveredTools = JSON.parse(jsonMatch[0]);
      }
    } catch {
      return NextResponse.json({ error: 'Failed to parse discovered tools JSON', raw: textContent.slice(0, 500) }, { status: 500 });
    }

    // 8. Validar y procesar cada tool descubierta
    const added: string[] = [];
    const skipped: string[] = [];

    for (const tool of discoveredTools) {
      if (!tool.name || !tool.category || !tool.website) {
        skipped.push(tool.name ?? 'unknown');
        continue;
      }

      // Skip si ya existe
      const nameLower = tool.name.toLowerCase();
      if (existingNames.has(nameLower)) {
        skipped.push(tool.name);
        continue;
      }

      // Generar slug limpio
      const slug = tool.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      if (existingSlugs.has(slug)) {
        skipped.push(tool.name);
        continue;
      }

      const category = tool.category in CATEGORY_MAP ? tool.category : 'productivity';

      const newTool: DynamicTool = {
        id:            slug,
        slug,
        name:          tool.name,
        company:       tool.company ?? tool.name,
        category,
        categoryLabel: CATEGORY_MAP[category] ?? 'AI Tool',
        pricing:       tool.pricing ?? 'Free / Paid',
        pricingValue:  tool.pricingValue ?? 0,
        rating:        Math.min(5, Math.max(3, tool.rating ?? 4.2)),
        users:         tool.users ?? '10K+',
        logo:          LOGO_MAP[category] ?? '🤖',
        color:         COLOR_MAP[category] ?? '#6366f1',
        features:      (tool.features ?? []).slice(0, 5),
        pros:          (tool.pros ?? []).slice(0, 4),
        cons:          (tool.cons ?? []).slice(0, 3),
        description:   tool.description ?? '',
        longDescription: tool.longDescription ?? tool.description ?? '',
        bestFor:       tool.bestFor ?? '',
        lastUpdated:   new Date().toISOString().split('T')[0],
        trend:         tool.trend ?? '+10%',
        url:           tool.website,
        source:        'discovered',
        discoveredAt:  new Date().toISOString(),
        verified:      autoApprove, // auto-approve o esperar revisión manual
      };

      if (autoApprove) {
        await saveTool(newTool);
      } else {
        await addPendingTool(newTool);
      }

      existingNames.add(nameLower);
      existingSlugs.add(slug);
      added.push(tool.name);
    }

    // 9. Actualizar estado del discovery
    const updatedState = {
      lastRunAt:       new Date().toISOString(),
      toolsDiscovered: discState.toolsDiscovered + added.length,
      searchesRun:     [...new Set([...discState.searchesRun, unusedQuery])],
      totalAdded:      discState.totalAdded + (autoApprove ? added.length : 0),
    };
    await saveDiscoveryState(updatedState);

    // 10. Ping Google sitemap si se agregaron tools
    if (added.length > 0 && autoApprove) {
      try {
        await fetch('https://www.google.com/ping?sitemap=https://comparaitools.com/sitemap.xml');
      } catch {}
    }

    return NextResponse.json({
      success:    true,
      query:      unusedQuery,
      discovered: added,
      skipped,
      autoApproved: autoApprove,
      message:    autoApprove
        ? `${added.length} tools added to the site automatically`
        : `${added.length} tools queued for review at /api/discover-tools/pending`,
      totalToolsNow: existingTools.length + (autoApprove ? added.length : 0),
      nextRunIn:  '7 days',
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── GET /api/discover-tools/pending — ver tools pendientes ───────────────────
// Nota: esto se maneja en /api/discover-tools/pending/route.ts
