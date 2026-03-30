# Audit and deploy notes

## What changed in this package
- premium hybrid blog design restored
- search-backed article generation kept intact
- source-ranking layer added to improve evidence quality
- topic opportunity engine added for better keyword targeting
- content audit route added to find weak posts fast
- 30-day roadmap, backlink playbook, and monetization plan included

## Before deploying
1. Rotate every previously leaked API key.
2. Put all secrets only in Vercel environment variables.
3. Confirm `CRON_SECRET`, search provider key, Anthropic key, and Upstash values are present.
4. Remove `.env.local`, `.git`, `.next`, and `node_modules` from any upload bundle.

## After deploying
1. Test `/api/topic-queue` with bearer auth.
2. Test `/api/content-audit` with bearer auth.
3. Generate one article with `/api/auto-generate`.
4. Review the page manually before increasing cadence.
5. Generate 5–10 pages, then inspect Search Console.

## Build status
- TypeScript check passed locally with `npx tsc --noEmit`.
- `next build` in this container stopped on Google Fonts fetches from `next/font/google`, which is expected here because the environment has no internet access. Vercel should be able to fetch those during a real deployment.
