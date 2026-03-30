# ComparAITools — 30-day growth roadmap

## Goal
Turn the site into a higher-trust, higher-intent content engine that compounds through:
- source-backed reviews
- pricing pages
- alternatives and versus pages
- cluster-led internal linking
- a smaller number of pages with stronger buying intent

## Week 1 — stabilize the machine
1. Rotate all leaked credentials.
2. Ship the refactored cron security and keep `CRON_SECRET` only in environment variables.
3. Replace the blog index and blog post pages with the premium hybrid versions.
4. Validate `/api/auto-generate`, `/api/topic-queue`, and `/api/content-audit`.
5. Generate 5 articles only, then QA them manually.

## Week 2 — attack better intent
1. Pull the top 30 opportunities from `/api/topic-queue`.
2. Prioritize in this order:
   - pricing
   - versus
   - switching guides
   - best-for-role roundups
3. Publish 1–2 strong pages per day, not 10 weak ones.
4. Link every new page to:
   - its tool page
   - 2 related compare pages
   - 1 category page
   - 2 older blog pages

## Week 3 — strengthen trust and conversions
1. Add visible source blocks to the strongest posts.
2. Refresh the best 10 tool pages using the same research-backed pattern.
3. Add a newsletter CTA inside blog posts and comparison pages.
4. Add “who should buy / who should skip” to all new high-intent pages.
5. Audit weak posts with `/api/content-audit` and improve the bottom 10.

## Week 4 — push authority
1. Publish one linkable asset:
   - AI pricing index
   - AI tool benchmark
   - best tools by role report
2. Outreach to:
   - AI newsletters
   - SaaS blogs
   - startup blogs
   - niche communities
3. Review Search Console and rewrite pages with impressions but low CTR.
4. Noindex or merge pages that stay thin or duplicated.

## Page mix target for the first 60 pages
- 15 pricing pages
- 15 versus pages
- 10 alternatives pages
- 10 best-for-role roundups
- 10 workflow guides

## Success metrics to track weekly
- indexed pages
- impressions by page type
- CTR by page type
- clicks by page type
- assisted conversions / affiliate clicks
- average evidence score
- number of pages with 5+ quality sources

## What not to do
- do not mass-publish vague trend posts with no buying angle
- do not create every possible tool-vs-tool combination
- do not claim hands-on testing unless it really happened
- do not let the cron publish unchecked for days without QA
