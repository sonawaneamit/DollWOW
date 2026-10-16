# Learning Center timed release

## Publication contract

The parent owns the four-per-week, twelve-week manifest, moving the 48 approved posts from pending into `content/learn/drafts`, and deployment. This implementation does not move or edit posts, create a scheduler, alter product data, or deploy.

- New posts use `status: scheduled`, `author: editorial`, and `publishedAt: "2026-10-19T09:00:00+01:00"` (example only).
- `publishedAt` is optional for legacy `production` posts. Legacy production visibility and ordering remain unchanged.
- Scheduled posts require a valid timezone-aware ISO timestamp, with `Z` or an explicit offset. Missing, invalid, timezone-less, impossible calendar dates, and future timestamps fail closed. Explicit invalid/future timestamps also hide production posts; production without a timestamp remains visible.
- Release is inclusive: visible when `publishedAt <= now`. Both article loaders use the same gate and accept an injected millisecond clock for tests. No process-wide clock mocking is used.
- The loader reads only `content/learn/drafts`, not pending. Featured assets alone do not release a post. The future files must be included in the parent's deployment for subsequent time-based release.

## Dates and attribution

`datePublished` and Open Graph publication time use the actual `publishedAt`, falling back to `lastReviewed` for legacy posts. Schema modification time and sitemap last modification never precede publication. The displayed review date remains the supplied `lastReviewed` rather than inventing a later review.

`author: editorial` normalizes display attribution to DollWOW Editorial and emits an Organization author with the site URL. The existing byline layout is retained without a portrait, person title, author-profile link, or Alex/Jesse signoff. Existing person author profiles are untouched.

## Cache scope

- `/learn` and `/learn/[slug]` explicitly use `force-dynamic`; article `generateStaticParams` is removed to avoid build-time visibility and persistent pre-release 404s.
- Learning Center Markdown checks the same loader before fetching canonical HTML, fetches learning HTML with `no-store`, and marks learning responses and pre-release 404s `private, no-store`. Non-learning Markdown retains its existing hourly caching.
- Agent index, llms text, and both llms query endpoints use route revalidation of 60 seconds and response `s-maxage=60, must-revalidate`.
- Split sitemaps use route revalidation of 60 seconds, with the short response header applied only to `learn.xml`. Other sitemap response headers and product-data retrieval caching are unchanged. The root sitemap index remains hourly.
- The search API's combined content/product response cache is shortened to 60 seconds; its Shopify candidate fetch remains at 86,400 seconds. Search and knowledge loaders read visible articles on each invocation.
- These are configured freshness policies, not a verified hard end-to-end release SLA. Framework regeneration, existing CDN entries, third-party agents, and browsers can add delay. This does not make every consumer uncached; parent deployment should verify headers and the release transition.

## Verification

Passed: 83 tests across `learnScheduledRelease.test.ts`, `learnContent.test.ts`, `siteSearch.test.ts`, `agentKnowledge.test.ts`, `publicMarkdown.test.ts`, `sitemapSegments.test.ts`, and `guideShoppingLinks.test.tsx`.

The focused suite uses virtual filesystem posts and covers just-before/at/after release, equivalent timezone offsets, invalid dates, missing timezone/timestamp, legacy production, future production, organization schema/dates/rendered byline, metadata/404 behavior, search/sitemap/agent/llms exclusion, quoted CRLF frontmatter, and uncached learning Markdown retrieval.

Passed: scoped ESLint for all implementation files and the new test; `git diff --check`.

Repository-wide `npm run typecheck` initially hit concurrent merge-conflict markers, which were subsequently resolved outside this work. The final run reports only unrelated errors under `data/exports/bea-release` (missing declarations for an external `storefront.mjs` and a preset-tier type mismatch); no timed-release source/test errors remain. Those fixtures were not modified by this worker. A full Next production build and live/CDN verification have not been performed. No live deployment was attempted.
