# Twelve-week Learning Center release

## Scope

Owner authorized completing the 48-post release checks and scheduling four posts per week starting the week of 12 October 2026. This release affects educational content and its discovery surfaces only. It does not publish draft products, change discounts, alter product configuration or send customer email.

The canonical publication system is the repository-backed `/learn` section. The 48 Shopify articles remain unpublished review copies, not a second indexed blog. Current corrected titles, content and descriptions were synchronized back to the same article IDs with receipt/hash guards and readback. Two misleading legacy `case-study` handles were changed to `worksheet` before release; these are clearly hypothetical examples, not customer cases.

## Schedule

- Week one: Friday 16 October at 18:00, Saturday 17 October at 10:00, Sunday 18 October at 10:00 and 18:00.
- Weeks two through twelve: Monday, Wednesday, Friday and Sunday at 10:00.
- Time zone: Europe/Lisbon, including the 25 October daylight-saving change.
- Last planned release: Sunday 3 January 2027 at 10:00.
- All timestamps are explicit UTC instants in each article's `publishedAt` field. These are future release slots, not backdated publications.

`status: scheduled` is public only at or after its valid timestamp. Legacy production pages retain their existing behavior. Every scheduled article is bundled into the deployment, but future article URLs return 404 and the loader excludes them from the Learning Center, search, sitemap, agent index and knowledge endpoints until due. The Learning Center renders dynamically; other discovery endpoints have short cache lifetimes. A request/cache boundary or external crawler can delay discovery, so this is not a guarantee of exact search-engine pickup.

## Review and Corrections

All 48 complete source files were manually reviewed in three non-overlapping batches. Primary manufacturer pages and current DollWOW policies/catalog were checked for the claims actually retained. Titles and scope were narrowed where a proposed dataset, matched-build test or customer case did not exist. Hypothetical examples remain prominently labelled. No fictional customer outcome, hands-on test, universal compatibility, active future promotion or individual expert signoff was introduced. The byline is DollWOW Editorial, with Organization schema.

Existing broad guide/collection owners were retained. New pages focus on specific manufacturer explanations, identified dated examples, calculations or distinct decision worksheets; they link back to controlling guides and policies. Stock is not US-only, and preorder is not presented as a DollWOW route. Dated prices are observations, not future quotes or promises of availability.

Original proposed ambitions are not represented as completed research: a single net/gross example is not ten measured shipments, a three-product arithmetic lesson is not a catalog census, and a worksheet is not a customer case study.

## Validation Evidence

- 48 real Next article routes fetched without JavaScript: correct H1, canonical URL, source HTML, Organization Article schema, featured image and alt text; no private source data; no links requiring a later article release.
- 96 actual browser checks: all 48 at desktop and mobile sizes, with no page overflow, broken article images or browser script errors. Representative full-page screenshots reviewed against existing DollWOW styling.
- 87 focused tests: timestamp validation and exact before/at/after boundaries, legacy pages, future 404 behavior, Markdown handling, search/sitemap/agent discovery, real 48-file schedule and Lisbon DST.
- Shopify draft creation/image safeguards have eight additional passing focused tests. No orders were placed or checkout success claimed by the listed-price article.
- 48 featured covers were visually reviewed; selected WebP assets only are public. PNG masters, prompts and rejected/superseded candidates stay privately on the external SSD.
- The final hosted build, preview and production verification must be recorded before claiming the schedule is active. Local QA temporarily used local-only publication times; those copies were replaced with future schedule timestamps before commit.

## SEO/GEO Coverage and Limits

Relevant same-day planning evidence includes keyword demand, AI keyword demand, competitor Labs/domain evidence, content analysis and AI response/mention observations. The release pass added page-level qualified organic queries, AI Mode groups and twelve corrected ChatGPT question/source samples. Unqualified initial searches producing toy, reborn or unrelated MD results were rejected, not adopted.

Provider coverage is partial: Google returned successful desktop tasks for 28/48 and mobile tasks for 18/48; Bing fallback succeeded technically for 17, with only two focused sets useful. Eight of twelve AI Mode requests returned results (three direct answers and five link-only outputs); four failed. All twelve corrected ChatGPT samples returned, but only five actually used web search. Generic/unsupported model claims, guessed specifications and source contamination were rejected. These are not 48 successful Google/AI rankings or broad citation-visibility proof. Failed tasks are preserved and never treated as zero demand or a pass. OnPage/technical acceptance here uses actual rendered-page checks; unpublished URLs have no Search Console performance history. Post-release indexability and traffic monitoring remain pending. Merchant, app and local-business APIs are not relevant to these informational articles.

Private per-page decisions and endpoint/status/cost evidence live under the external SSD research batch `seo-geo-plan-2026-10-16/content-batch-01/`. None of that raw material is included in the public article copy or client payloads. Separate catalog notes retain conflicting Renata weight and Amy ROS price-label observations; this content release does not claim to have repaired those products.

## Future Upload Rule

New posts need verified factual scope, distinct canonical purpose, permitted imagery/alt, source-HTML/schema/link/mobile QA, appropriate attribution and owner release authorization before setting `status: scheduled`. Use a timezone-aware `publishedAt`; do not backdate or rely on publishing a Shopify review copy to update `/learn`. Do not claim complete SEO/GEO monitoring or rankings merely because a scheduled file has deployed.
