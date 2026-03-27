// src/app/api/cleanup-tools/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAllTools, saveTool, bootstrapStaticTools } from '@/lib/tools-storage';

function clean(text: any): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/]*>[\s\S]*?<\/antml:cite>/gi, '')
    .replace(/<cite[^>]*>[\s\S]*?<\/cite>/gi, '')
    .replace(/\[[\d,\s]+\]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanArr(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(clean).filter(s => s && s.length > 3);
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await bootstrapStaticTools();
    const tools   = await getAllTools();
    const cleaned: string[] = [];
    const skipped: string[] = [];

    for (const tool of tools) {
      const fields  = [tool.description, tool.longDescription, tool.bestFor, ...(tool.features||[]), ...(tool.pros||[]), ...(tool.cons||[])];
      const hasDirty = fields.some(f => f && (f.includes('<cite') || f.includes('[') || f.includes('<')));

      if (hasDirty) {
        await saveTool({
          ...tool,
          description:     clean(tool.description),
          longDescription: clean(tool.longDescription || tool.description),
          bestFor:         clean(tool.bestFor),
          features:        cleanArr(tool.features),
          pros:            cleanArr(tool.pros),
          cons:            cleanArr(tool.cons),
        });
        cleaned.push(tool.name);
      } else {
        skipped.push(tool.name);
      }
    }

    return NextResponse.json({
      success: true,
      cleaned,
      skipped,
      total: tools.length,
      message: `Cleaned ${cleaned.length} tools. ${skipped.length} were already clean.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
