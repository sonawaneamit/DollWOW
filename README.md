# DollWow Headless Shopify Storefront

Premium black/gold headless Shopify storefront for DollWow.com, built with Next.js App Router, TypeScript, Tailwind CSS, Shopify Storefront/Admin APIs, Supabase-ready persistence, and launch-safe price comparison.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app runs without credentials using sample products and a gitignored local JSON fallback for quiz/comparison requests. Add real credentials in `.env.local` when ready.

## Environment

Copy `.env.example` to `.env.local` and fill:

```bash
NEXT_PUBLIC_SITE_URL=https://dollwow.com
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=...
SHOPIFY_ADMIN_ACCESS_TOKEN=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
GA_MEASUREMENT_ID=...
```

Shopify Storefront/Admin API version is pinned in code to `2026-04`.
`SHOPIFY_STOREFRONT_ACCESS_TOKEN` can be either the Headless channel private token or a public Storefront API token; the app chooses the correct request header automatically.

## Implemented Flows

- Home with hero, LIVE Price Comparison card, trust strip, product preview, Warehouse/quiz/customize blocks, and human help.
- Shop, collection, product detail, configurable option panel, mock/local cart fallback, and Shopify checkout wiring.
- Help Me Choose quiz with rule-based recommendations.
- Compare a Listing with SSRF-safe URL validation, static page extraction, catalog matching, local/Supabase persistence, and guarded discount-code plumbing.
- Doll Warehouse, Customize, support, shipping, returns, adult-only, why DollWow, and supplier pitch pages.
- Supabase migration for launch tables in `supabase/migrations/0001_initial_schema.sql`.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Browser QA screenshots are saved in `qa-screenshots/` and ignored by git.

## Integration Smoke Test

After `.env.local` is filled and the Supabase SQL migration has run:

```bash
npm run smoke:integrations
```

This checks Shopify Storefront API access and verifies that the Supabase `support_leads` table is reachable. It does not print secret values.

## RosemaryDoll Import Reviews

RosemaryDoll product data can be scraped into a review JSON file before any Shopify import:

```bash
npm run scrape:rosemary -- --brand zelex --limit 20
```

Supported brand shortcuts are `wm`, `zelex`, `irontech`, `starpery`, and `doll-castle`. Add `APIFY_API_TOKEN` to `.env.local` to run the Apify actor; without it, the script uses local fetch mode. Output goes to `data/imports/`, which is ignored by git.

Use the generated JSON as a review/staging artifact. Do not publish directly to Shopify until product handles, prices, images, supplier authorization, and customization option mapping have been reviewed.
