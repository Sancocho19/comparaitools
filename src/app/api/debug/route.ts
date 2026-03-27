import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    const manifest = await redis.get('cit:manifest');
    const post = await redis.get('cit:post:cursor-review-2026');
    return NextResponse.json({
      manifest,
      postExists: !!post,
      url: process.env.UPSTASH_REDIS_REST_URL?.slice(0, 30),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}