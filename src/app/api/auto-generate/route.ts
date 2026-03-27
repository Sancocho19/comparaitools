// src/app/api/auto-generate/route.ts
// REEMPLAZA el archivo existente completo

import { NextRequest, NextResponse } from 'next/server';
import {
  getGenerationState,
  saveGenerationState,
  savePost,
  type BlogPost,
} from '@/lib/kv-storage';
import {
  selectNextContent,
  generateSlug,
  buildPrompt,
  generateSEOMetadata,
  makePairKey,
} from '@/lib/content-engine';

// ─── Config ───────────────────────────────────────────────────────────────────

const MODEL    = 'claude-sonnet-4-20250514'; // Sonnet para calidad máxima
const MAX_TOKENS = 4000;

// ─── GET — Llamado por Vercel Cron ────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const force  = request.nextUrl.searchParams.get('force') === 'true';

  // Verificar autenticación
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY missing' }, { status: 500 });
  }

  try {
    // 1. Leer estado actual (anti-duplicados)
    const state = await getGenerationState();

    // 2. Seleccionar qué generar (lógica inteligente)
    const decision = selectNextContent(state);
    if (!decision) {
      return NextResponse.json({ success: true, message: 'Nothing to generate right now' });
    }

    // 3. Generar slug y verificar que no exista ya
    const slug = generateSlug(decision);
    if (!force && state.publishedSlugs.includes(slug)) {
      // Si ya existe y no forzamos, intentar con el siguiente
      const nextState = { ...state, totalGenerated: state.totalGenerated + 1 };
      const nextDecision = selectNextContent(nextState);
      if (!nextDecision) {
        return NextResponse.json({ success: true, message: 'All content up to date' });
      }
    }

    // 4. Construir prompt de alta calidad
    const prompt = buildPrompt(decision);

    // 5. Llamar a Claude para generar el contenido
    const startTime = Date.now();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: `You are a senior AI tools analyst at comparaitools.com. 
You write comprehensive, SEO-optimized content about AI tools. 
Your writing is authoritative, specific, and never vague.
You always output ONLY clean HTML as instructed — never markdown, never code fences, never explanatory text outside the HTML.
Every article must meet a minimum word count and include all required structural elements.`,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Anthropic error:', data.error);
      return NextResponse.json({ error: data.error.message, type: data.error.type }, { status: 500 });
    }

    const content = data.content?.[0]?.text || '';
    if (!content || content.length < 500) {
      return NextResponse.json({ error: 'Content too short or empty' }, { status: 500 });
    }

    const generationMs = Date.now() - startTime;

    // 6. Generar metadata SEO automáticamente
    const seoMeta = generateSEOMetadata(decision, content);

    // 7. Determinar toolSlugs y categoría para el post
    let toolSlugs: string[] = [];
    let category = '';
    let type: BlogPost['type'] = 'review';

    switch (decision.type) {
      case 'review':
        toolSlugs = [decision.tool.slug];
        category  = decision.tool.category;
        type      = 'review';
        break;
      case 'comparison':
        toolSlugs = [decision.toolA.slug, decision.toolB.slug];
        category  = decision.toolA.category;
        type      = 'comparison';
        break;
      case 'roundup':
        toolSlugs = decision.tools.map(t => t.slug);
        category  = decision.category;
        type      = 'roundup';
        break;
      case 'guide':
        toolSlugs = [decision.tool.slug];
        category  = decision.tool.category;
        type      = 'guide';
        break;
      case 'pricing':
        toolSlugs = [decision.tool.slug];
        category  = decision.tool.category;
        type      = 'pricing';
        break;
    }

    // 8. Crear el post completo
    const post: BlogPost = {
      slug,
      title:          seoMeta.metaTitle.replace(/ \[.*\]$/, ''), // clean title
      metaTitle:      seoMeta.metaTitle,
      metaDescription:seoMeta.metaDescription,
      primaryKeyword: seoMeta.primaryKeyword,
      keywords:       seoMeta.keywords,
      excerpt:        seoMeta.excerpt,
      content,
      type,
      toolSlugs,
      category,
      publishedAt:    new Date().toISOString(),
      updatedAt:      new Date().toISOString(),
      wordCount:      seoMeta.wordCount,
      readingTime:    seoMeta.readingTime,
      featured:       false,
      schemaOrg:      seoMeta.schemaOrg,
    };

    // 9. Guardar en Vercel KV
    await savePost(post);

    // 10. Actualizar estado anti-duplicados
    const updatedState = { ...state };
    updatedState.totalGenerated  += 1;
    updatedState.lastRunAt        = new Date().toISOString();
    updatedState.publishedSlugs   = [...new Set([...state.publishedSlugs, slug])];

    switch (decision.type) {
      case 'review':
        updatedState.reviewedTools = [...new Set([...state.reviewedTools, decision.tool.slug])];
        break;
      case 'comparison':
        updatedState.comparedPairs = [...new Set([...state.comparedPairs, makePairKey(decision.toolA.slug, decision.toolB.slug)])];
        break;
      case 'roundup':
        updatedState.roundupsDone = [...new Set([...state.roundupsDone, decision.category])];
        break;
      case 'guide':
        updatedState.guidesDone = [...new Set([...state.guidesDone, decision.tool.slug])];
        break;
      case 'pricing':
        updatedState.pricingDone = [...new Set([...state.pricingDone, decision.tool.slug])];
        break;
    }

    await saveGenerationState(updatedState);

    // 11. Respuesta de éxito con stats
    return NextResponse.json({
      success:       true,
      slug,
      type:          decision.type,
      title:         post.title,
      wordCount:     post.wordCount,
      readingTime:   post.readingTime,
      generationMs,
      primaryKeyword:post.primaryKeyword,
      totalGenerated:updatedState.totalGenerated,
      url:           `/blog/${slug}`,
    });

  } catch (error: any) {
    console.error('Auto-generate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST — Trigger manual desde dashboard ────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { secret, forceType } = body;

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Si forceType está definido, podemos forzar un tipo específico
  // Por ahora delega al GET con force=true
  const url = new URL(request.url);
  url.searchParams.set('secret', secret);
  url.searchParams.set('force', 'true');

  return GET(new NextRequest(url));
}
