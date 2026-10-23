# DOL-229 Batch B: Preview Review

Status: implementation staged for preview; hosted checks and required research
gate pending. Not a production release or completed ticket.

## Scope And Dependencies

This batch is stacked on PR159's verified guide-row repair. Its separate diff
preserves Batch A's independent review. Martin must approve each batch before
release; accepting one does not authorize the other. The existing 24 October
Batch B milestone is unchanged.

| Existing Owner | Exact GSC Impressions / Clicks | Preview Disposition |
| --- | ---: | --- |
| `/shop/new-sex-dolls` | 35 / 3 | Correct copy to current listing-creation order; no reordering. |
| `/brands/moonvale-dolls` | 30 / 2 | Preview product-first layout; retain factual copy and unknown-weight warning. |
| `/shop/lightweight-sex-dolls` | 30 / 2 | Describe the current positive weight up to 74 lb, without changing the filter. |
| `/brands/tantaly-dolls` | 20 / 0 | Preview product-first layout; retain qualified material/product-form copy. |
| `/shop/cheap-sex-dolls` | 18 / 0 | Retain source-supported existing copy and page identity. |

Working order uses final exact-canonical GSC web observations, 22 September to
19 October, not market demand, causal attribution, profit or DOL-223's missing
Growth scores. All five already have self-canonical 200 pages with
CollectionPage, ItemList, BreadcrumbList and FAQPage schema. No missing-page or
missing-schema recreation is warranted.

## Source Findings

Strict read-only Shopify snapshot: 3,526 public records. Existing native filters
and exclusions yield New 3,525, Moonvale 10, lightweight 785, Tantaly 30 and
affordable 149. All current starting-price currencies are USD. These dated
counts are evidence, not new fixed claims in public copy or catalog clearance.

New's SEO product query/map does not expose sourceReleaseRank; the latest
comparator therefore preserves CREATED_AT-desc query order. Intro, buyer note,
comparison and FAQs now describe creation order rather than asserting supplier
release ordering. A creation date does not prove a manufacturer launch or public
listing date. No query, mapper, comparator or product order is changed.

Lightweight's current filter is `0-74`, with positive known weights only.
Intro, metadata, buyer note, comparison and FAQ now say 74 lb or less (about
33.6 kg). Nine 74.5/74.96 lb metadata records remain excluded, exactly as before.
Dolly assigned the desired future threshold/order decisions to DOL-230; the
global filter badge wording is not changed under this batch either.

Moonvale's ten listed weights are unknown; its existing warning not to infer
weight from height remains. Tantaly has 28 generic material values and two TPE
values: no claim that all products are TPE is added. Generic construction is
unknown, not verified TPE. Affordable prices currently span USD149-999; the
existing filter allows up to 1,000. No exact 1,000 match currently exists, and
no cosmetic title rewrite is needed.

## Layout And Preserved Boundaries

Moonvale and Tantaly reuse the existing compact brand layout only when
VERCEL_ENV is preview: one mobile guide row, short expandable intro, product
grid before native collapsed comparison/authorization/notes/FAQ. All content
and links stay server-rendered. Production layout and unreviewed brands remain
unchanged. Tantaly's existing 320 px document overflow was observed before this
change and must be measured again, not assumed repaired by choosing a pattern.

The same 50 Top Fire hold-tag records occur in New and 42 in lightweight;
there are no newly discovered held handles beyond the existing exception set.
Leave these untouched under DOL-238/157 and outside clean-catalog signoff.
Unknown-height exceptions stay owned by DOL-216/239. No hold reason, imagery
clearance, private eligibility, measurement, material or stock is inferred.
Existing 4-6-hour service sentences remain byte-for-byte unchanged and are not
propagated to new pages.

## Acceptance And Receipts

41 focused tests and scoped lint must be recorded with the actual run outcome.
Hosted source-text/schema/link/identity checks, responsive captures, keyboard
and native no-JavaScript checks remain pending until recorded on Linear.
The dated private source snapshot is `batch-b-inventory.json`; reproducible
source audit is `batch-b.test.ts` under the same ignored export directory.

Required fresh DataForSEO SERP/AI evidence remains blocked by the already-tagged
IP allowlist dependency. Drafting is authorized; final quality clearance is not.
No production changes, Shopify writes, pricing/option changes, publication,
new release-ledger event or claims of ranking/revenue impact.
