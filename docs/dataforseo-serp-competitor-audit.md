# DataForSEO SERP Competitor Audit

Audit date: 2026-06-27
Market: United States, Google organic, desktop
Source export: `data/exports/dataforseo-serp-competitor-audit-2026-06-27T21-11-07-368Z.json`
Markdown export: `data/exports/dataforseo-serp-competitor-audit-2026-06-27T21-11-07-368Z.md`

Raw exports are intentionally ignored by git. This file tracks the strategic findings we should act on.

## Keywords Audited

- `sex dolls`
- `sex doll`
- `realistic sex dolls`
- `tpe sex doll`
- `tpe dolls`
- `silicone sex dolls`
- `male sex doll`
- `male dolls`
- `mini sex dolls`
- `torso sex dolls`
- `best sex dolls`
- `sex doll cost`
- `sex doll reviews`
- `ready to ship sex dolls`
- `custom sex doll`

## Top SERP Domains

The top domains across the 15-keyword audit were:

| Domain | Notes |
| --- | --- |
| `youtube.com` | Appears heavily for broad and review-style queries. Useful for video/content format inspiration, but not a direct ecommerce page model. |
| `amazon.com` | Strong across broad, material, male, mini, torso, and cost queries. Often ranks category/search pages. |
| `yourdoll.com` | Strongest direct adult ecommerce competitor in the set. Ranks for broad, TPE, best, torso, and ready-to-ship terms. |
| `bestrealdoll.com` | Shows up across broad and commercial queries with guide and collection patterns. |
| `joylovedolls.com` | Strong for broad, best, and male terms. |
| `siliconwives.com` | Strong for `sex doll reviews`, TPE/silicone content, and broad terms. |
| `realdoll.com` | Strong brand and broad-term presence. |
| `betterlovedoll.com` | Appears mostly with collection pages. |
| `realsexdoll.com` | Broad commercial presence. |
| `sexdolltech.com` | Strong for material and price/category pages. |
| `rosemarydoll.com` | Present for TPE and broad terms. |
| `uloversdoll.com` | Present for male and broad terms. |

Seed competitor visibility:

| Seed Competitor | Keywords Appeared | Best Rank | Priority |
| --- | ---: | ---: | --- |
| `yourdoll.com` | 11 | 1 | Highest |
| `joylovedolls.com` | 6 | 1 | High |
| `siliconwives.com` | 7 | 1 | High |
| `rosemarydoll.com` | 5 | 5 | Medium |
| `spartandolls.com` | 0 | n/a | Monitor with `spartanlover.com` and related Spartan properties |

## Page Type Pattern

The audit supports a collection-first strategy for most big commercial terms. Google is rewarding ecommerce category/search pages, homepages, and collection-style pages for broad buyer queries.

Use this rule:

- If the keyword is broad or transactional, prioritize a collection route with crawlable copy, ItemList schema, product filters, FAQ schema, and internal links.
- If the keyword is comparative, evaluative, or question-led, prioritize a Learning Center guide.
- If a current DollWow guide already exists, use the audit to strengthen internal links, product examples, and comparison sections.

## Priority Match And Exceed Targets

| Keyword | Primary DollWow Target | Page Type | Status |
| --- | --- | --- | --- |
| `sex dolls` / `sex doll` | `/shop/sex-dolls` | Collection | Need canonical collection route or alias |
| `realistic sex dolls` | `/shop/realistic-sex-dolls` | Collection | Need collection route or preset |
| `tpe sex doll` / `tpe dolls` | `/shop/tpe` | Collection | Exists, strengthen copy and links |
| `silicone sex dolls` | `/shop/silicone` | Collection | Exists, strengthen copy and links |
| `male sex doll` | `/shop/male-dolls` | Collection | Exists, strengthen copy and links |
| `male dolls` | `/shop/male-dolls` | Collection | Treat as secondary only because SERP includes non-adult toy intent |
| `mini sex dolls` | `/shop/height-under-155` plus future `/shop/mini-sex-dolls` alias | Collection | Existing height page should be strengthened |
| `torso sex dolls` | `/shop/torso-sex-dolls` | Collection | Create only if inventory exists |
| `best sex dolls` | `/learn/best-sex-dolls` | Guide | Exists, add curated product modules after review |
| `sex doll cost` | `/learn/sex-doll-cost` | Guide | Exists, add pricing examples and price-match CTA |
| `sex doll reviews` | `/learn/sex-doll-reviews` | Guide | Exists, add review-quality checklist and buyer-protection links |
| `ready to ship sex dolls` | `/shop/ready-to-ship` | Collection | Exists, strengthen copy and links |
| `custom sex doll` | `/shop/custom` | Collection | Exists, strengthen copy and links |

## What To Exceed On Every Target

For collection pages:

- 80-140 word crawlable intro that answers the query directly.
- Product filters visible above or near the product grid.
- FAQ schema with 3-5 buyer questions.
- ItemList schema.
- Internal links to relevant guides and trust pages.
- Link to support or finder for high-consideration decisions.
- Product cards based on live Shopify data only.

For guide pages:

- Quick answer near the top.
- Comparison table.
- Buyer checklist.
- Common mistakes.
- FAQ schema.
- Related collection links.
- Jesse or Alex byline linked to `/editorial-policy`.
- Product cards or collection cards only when they are relevant and verified.

## Immediate Actions

1. Create or alias `/shop/sex-dolls` to the all-catalog commercial collection.
2. Create `/shop/realistic-sex-dolls` if the catalog can support a broad realistic collection.
3. Add or alias `/shop/mini-sex-dolls` to the current under-155 cm collection after confirming the naming is accurate.
4. Strengthen `/shop/tpe`, `/shop/silicone`, `/shop/male-dolls`, `/shop/ready-to-ship`, and `/shop/custom` with query-specific intros, FAQs, and links to current guides.
5. Add curated product modules to `/learn/best-sex-dolls`, `/learn/sex-doll-cost`, and `/learn/sex-doll-reviews` after live product selection rules are reviewed.
6. Re-run the DataForSEO SERP audit monthly and after major content batches.

## Command

```bash
npm run seo:serp-competitors -- --execute --env ../ColorMine-Website/.env --depth 50
```

Use `--keywords` for smaller audits, for example:

```bash
npm run seo:serp-competitors -- --execute --env ../ColorMine-Website/.env --keywords "sex dolls,tpe dolls,male sex doll" --depth 50
```
