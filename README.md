# ComparAITools — search-backed refactor

This refactor changes the project from a persona-based content generator into a research-backed publishing system for AI tool pages.

## What changed

- unified tool source of truth with static JSON + optional Upstash overlay
- secure cron endpoints using `Authorization: Bearer <CRON_SECRET>`
- automatic content generation backed by live web search
- no fake founder persona and no invented `we tested it` claims
- canonical comparison URLs (`/compare/tool-a-vs-tool-b`)
- cleaner sitemap generation and cache headers
- blog pages now show visible research sources

## Required environment variables

Copy `.env.example` to `.env.local` and fill in:

- `CRON_SECRET`
- `ANTHROPIC_API_KEY`
- one search provider:
  - `SEARCH_PROVIDER=tavily` + `TAVILY_API_KEY`
  - or `SEARCH_PROVIDER=serpapi` + `SERPAPI_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Cron setup on Vercel

This project expects Vercel cron jobs to hit:

- `GET /api/auto-generate`
- `GET /api/discover-tools?approve=true`

Per Vercel docs, if you set `CRON_SECRET`, Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically.

## Recommended immediate actions

1. Rotate any secrets that were previously committed or uploaded.
2. Delete `.env.local`, `.next`, `.git`, and `node_modules` from deployment uploads.
3. Connect Search Console and analytics before scaling content volume.
4. Start by generating a small number of pages and review output quality.
5. Only expand clusters that show impressions, CTR, and conversions.

## Content model philosophy

The goal is not to pause automation. The goal is to make automation honest:

- search gathers current facts
- structured product data supplies base fields
- prompts synthesize tradeoffs and buying advice
- pages expose research basis instead of pretending first-hand tests

## Next recommended layer

For a stronger production stack, add:

- a proper database instead of Redis-only overlays
- claim-level freshness timestamps for pricing/features
- Search Console driven pruning + refresh jobs
- a custom page score for thin content and duplicate intent
- manual upgrade workflow for the top 20 revenue pages
