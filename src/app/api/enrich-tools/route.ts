// src/app/api/enrich-tools/route.ts
// Re-enriquece tools con campos vacíos usando Claude

import { NextRequest, NextResponse } from 'next/server';
import { getAllTools, saveTool, bootstrapStaticTools } from '@/lib/tools-storage';

function isEmpty(val: any): boolean {
  if (!val) return true;
  if (typeof val === 'string') return val.trim().length < 5;
  if (Array.isArray(val)) return val.length === 0 || val.every(v => !v || v.trim().length < 3);
  return false;
}

function needsEnrichment(tool: any): boolean {
  return (
    isEmpty(tool.description) ||
    isEmpty(tool.longDescription) ||
    isEmpty(tool.bestFor) ||
    isEmpty(tool.features) ||
    isEmpty(tool.pros) ||
    isEmpty(tool.cons)
  );
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const slug   = request.nextUrl.searchParams.get('slug'); // optional: enrich specific tool

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 });

  try {
    await bootstrapStaticTools();
    const allTools = await getAllTools();

    // Find tools that need enrichment
    const toEnrich = slug
      ? allTools.filter(t => t.slug === slug)
      : allTools.filter(t => t.source === 'discovered' && needsEnrichment(t));

    if (toEnrich.length === 0) {
      return NextResponse.json({ success: true, message: 'All tools already have complete data' });
    }

    const enriched: string[] = [];
    const failed:   string[] = [];

    for (const tool of toEnrich) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            system: `You are an AI tools researcher. Generate accurate, complete data about AI tools.
CRITICAL: Output ONLY valid JSON, no markdown, no code fences, no HTML, no citations.
All values must be plain text strings only.`,
            messages: [{
              role: 'user',
              content: `Generate complete, accurate data for this AI tool: "${tool.name}" by ${tool.company}.
Website: ${tool.url}
Category: ${tool.categoryLabel}
Pricing: ${tool.pricing}

Return ONLY this JSON object with no other text:
{
  "description": "One clear sentence explaining what ${tool.name} does and who it's for",
  "longDescription": "2-3 sentences with more detail about ${tool.name}'s main capabilities and value proposition",
  "bestFor": "Specific type of user or use case, e.g. 'Video creators who need AI-generated footage'",
  "features": [
    "Specific feature name 1",
    "Specific feature name 2",
    "Specific feature name 3",
    "Specific feature name 4",
    "Specific feature name 5"
  ],
  "pros": [
    "Specific advantage 1 of ${tool.name}",
    "Specific advantage 2 of ${tool.name}",
    "Specific advantage 3 of ${tool.name}",
    "Specific advantage 4 of ${tool.name}"
  ],
  "cons": [
    "Specific limitation 1 of ${tool.name}",
    "Specific limitation 2 of ${tool.name}",
    "Specific limitation 3 of ${tool.name}"
  ]
}`,
            }],
          }),
        });

        const data = await response.json();
        if (data.error) { failed.push(tool.name); continue; }

        const rawText = data.content?.filter((b: any) => b.type === 'text')?.map((b: any) => b.text)?.join('') ?? '';

        let enrichedData: any = {};
        try {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) enrichedData = JSON.parse(jsonMatch[0]);
        } catch { failed.push(tool.name); continue; }

        // Validate parsed data
        if (!enrichedData.description || enrichedData.description.length < 10) {
          failed.push(tool.name + ' (bad data)');
          continue;
        }

        // Clean any accidental HTML
        const cleanStr = (s: any) => typeof s === 'string' ? s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
        const cleanArr = (a: any) => Array.isArray(a) ? a.map(cleanStr).filter(s => s.length > 3) : [];

        // Update tool with enriched data
        const updatedTool = {
          ...tool,
          description:     cleanStr(enrichedData.description),
          longDescription: cleanStr(enrichedData.longDescription),
          bestFor:         cleanStr(enrichedData.bestFor),
          features:        cleanArr(enrichedData.features).slice(0, 5),
          pros:            cleanArr(enrichedData.pros).slice(0, 4),
          cons:            cleanArr(enrichedData.cons).slice(0, 3),
        };

        await saveTool(updatedTool);
        enriched.push(tool.name);

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 500));

      } catch (err: any) {
        failed.push(tool.name + ': ' + err.message);
      }
    }

    return NextResponse.json({
      success: true,
      enriched,
      failed,
      message: `Enriched ${enriched.length} tools. ${failed.length} failed.`,
      total: toEnrich.length,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
