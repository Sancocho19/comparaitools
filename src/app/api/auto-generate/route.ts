import { NextRequest, NextResponse } from 'next/server';
import { generateBlogPost } from '@/lib/anthropic';
import tools from '@/data/tools.json';

const BLOG_TOPICS = [
  "Best AI Coding Assistants {year}: Complete Comparison",
  "AI Image Generators Ranked: Quality, Speed & Price",
  "{tool} Review {year}: Is It Worth It?",
  "Free AI Tools That Rival Paid Alternatives",
  "AI Tools for Small Business: The Complete Guide",
  "ChatGPT vs Claude vs Gemini: Which is Best in {year}?",
  "Best Free AI Tools in {year}",
  "{tool} Alternatives: Top 5 Competitors Compared",
  "AI Tools for Content Creators: The Ultimate Guide {year}",
  "How to Choose the Right AI Tool for Your Needs",
];

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const year = new Date().getFullYear();
    const randomTool = tools[Math.floor(Math.random() * tools.length)];
    const randomTopic = BLOG_TOPICS[Math.floor(Math.random() * BLOG_TOPICS.length)]
      .replace('{year}', year.toString())
      .replace('{tool}', randomTool.name);

    const content = await generateBlogPost(randomTopic);

    return NextResponse.json({
      success: true,
      topic: randomTopic,
      contentLength: content.length,
      preview: content.substring(0, 200),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}