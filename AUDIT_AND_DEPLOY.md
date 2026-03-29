# What this package changes

## Critical fixes

- removes hardcoded cron secret from `vercel.json`
- adds `.env.example`
- secures `/api/debug`
- merges the tool layer into a single source of truth
- switches content generation to live-search-backed prompts
- removes fake first-person testing claims from the new generator
- cleans comparison canonicals to `/compare/tool-a-vs-tool-b`
- rebuilds sitemap to emit only one comparison URL pattern
- shows research sources on blog pages

## Main files changed

- `src/lib/tools-storage.ts`
- `src/lib/kv-storage.ts`
- `src/lib/search-provider.ts`
- `src/lib/content-engine.ts`
- `src/app/api/auto-generate/route.ts`
- `src/app/api/discover-tools/route.ts`
- `src/app/api/debug/route.ts`
- `src/app/api/search/route.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/compare/[pair]/page.tsx`
- `src/app/blog/[slug]/page.tsx`
- `src/app/blog/page.tsx`
- `src/app/about/page.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `vercel.json`
- `.env.example`

## Before deploying

1. Rotate the old cron secret and any other secret that was previously uploaded.
2. Set the new environment variables in Vercel.
3. Redeploy.
4. Hit `/api/auto-generate` manually with the Bearer token once and inspect output.
5. Review the first 5 generated pages manually before scaling cron frequency.
6. Connect Search Console and track which pages get impressions.
