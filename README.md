# ComparAITools — research-backed growth pack

This package turns the site into a stronger content system for:
- source-backed reviews
- pricing pages
- alternatives and versus pages
- cluster-led topic discovery
- internal QA for thin or weak posts

## What is included

### Core app improvements
- secure cron handling with `CRON_SECRET`
- search-backed article generation
- premium hybrid blog design
- canonical compare URLs
- ranked source selection in the search layer
- content audit endpoint
- topic queue endpoint for better keyword targeting

### New planning assets
- `docs/30-day-roadmap.md`
- `docs/backlink-playbook.md`
- `docs/monetization-model.md`
- `docs/content-clusters.csv`
- `src/data/topic-clusters.json`
- `src/lib/topic-planner.ts`
- `src/app/api/topic-queue/route.ts`
- `src/app/api/content-audit/route.ts`

## Required environment variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SITE_URL`
- `CRON_SECRET`
- `ANTHROPIC_API_KEY`
- one search provider:
  - `SEARCH_PROVIDER=tavily` + `TAVILY_API_KEY`
  - or `SEARCH_PROVIDER=serpapi` + `SERPAPI_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Local commands

```bash
npm install
npm run build
npm run dev
```

## Useful internal routes

All protected routes expect either:
- `Authorization: Bearer <CRON_SECRET>`
- or `?secret=<CRON_SECRET>`

### Generate one content item
- `GET /api/auto-generate`

### Preview the best topic opportunities
- `GET /api/topic-queue?limit=40`

### Audit existing posts for weak pages
- `GET /api/content-audit`

### Discover additional tools
- `GET /api/discover-tools?approve=true`

## Recommended rollout order

1. Rotate any leaked credentials.
2. Deploy this package.
3. Test `topic-queue` and `content-audit` first.
4. Generate 5 pages and QA them manually.
5. Push the strongest page types first:
   - pricing
   - versus
   - switching guides
   - best-for-role roundups
6. Review Search Console before increasing publishing volume.

## Philosophy

The aim is not “publish the most pages”.
The aim is “publish the pages with the best chance of satisfying intent, earning trust, and making money”.
