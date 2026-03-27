import { NextRequest, NextResponse } from 'next/server';
import tools from '@/data/tools.json';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'No API key found' }, { status: 500 });
  }

  try {
    const year = new Date().getFullYear();
    const randomTool = tools[Math.floor(Math.random() * tools.length)];
    const topic = `${randomTool.name} Review ${year}: Is It Worth It?`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Write a short SEO paragraph about: ${topic}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message, type: data.error.type, keyPrefix: apiKey.substring(0, 20) }, { status: 500 });
    }

    const text = data.content?.[0]?.text || 'No content';

    return NextResponse.json({
      success: true,
      topic: topic,
      contentLength: text.length,
      preview: text.substring(0, 200),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, keyPrefix: apiKey.substring(0, 20) }, { status: 500 });
  }
}
```

**Guarda y cierra.** Luego:
```
git add .
git commit -m "Debug: better error logging for auto-generate"
git push