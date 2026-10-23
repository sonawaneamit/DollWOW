# Contextual Internal Links: DOL-225 Sample

Status: sample retained as historical evidence. Martin approved the full-site
pattern and production rollout on 23 October through DOL-225 comment
`d62fe502-19c1-4ed1-8ddc-0f29f9a857ef`. Implementation is being verified; approval
is not a claim that the full rollout is already live.

## Boundaries

Twenty live canonical source pages are recorded in `data/internal-link-sample.json`:
six existing Sprint1 collections, four brand hubs and ten public product pages.
Before records were checked for HTTP200, exact canonical ownership and absence
of noindex on22Oct. The unresolved IronAI listing was excluded; the other sample
handles were cross-checked against DOL-177's flagged/excluded identity records.
No product identity, price, image, checkout behavior, hold or draft status changes.

The approved `contextualLinksEnabled` gate covers canonical product, brand-hub
and collection paths on Preview and Production, not arbitrary paths, query
variants or draft articles. Local development/unset remain disabled. The
dedicated DollVue collection uses the same links after its existing verified
product grid; its eligibility/readiness source is unchanged. `/shop` still
redirects to its existing canonical owner.

Eighteen retained source exclusions (the fifteen pending DOL-177 identities,
two unresolved form/model records, and DOL-240's WM identity conflict) remain
outside new contextual links. This is a server-only navigation exclusion, not
a product-status, legal, media, title or canonical decision. Current hold tags
and hidden-brand exclusions apply as before. Private draft previews and
editorial-preview pages receive no new contextual links. No new product-page
targets are generated, so pending duplicate listings are not newly promoted
as destinations by this block.

## Rules

- Product brand text links to the registry's preferred `/brands/` owner instead
  of a `/shop/` alias. Below specifications, a compact row links to one matching
  parent collection and up to two visible, relevant guides.
- Product form precedes material; torso and hips are not routed as full dolls.
  Male-bodied products use the male collection/guide. Hybrids do not link to
  full-silicone as their parent. Unknown facts do not generate guessed matches.
- Collection pages show up to two brands actually represented in their filtered
  catalog, plus the broad collection parent, below the product grid/pagination.
- Brand hubs show the broad parent and up to two material choices represented
  in their catalog. These links compare the whole material collection, not a
  silently pre-filtered brand-only result.
- The shared catalog filters determine membership. Counts choose relevant
  navigation, not popularity/quality claims. No numerical stock claim is added.
- Held/test/system/hidden-brand sources cannot create new links. New guide
  targets use the existing visible-publication predicate. Self-links, duplicate
  targets, query parameters, aliases and manufactured keyword pages are excluded.
- Ordinary reciprocal brand/collection navigation is useful, not an SEO loop.
  No redirect loops, artificial link chains or intermediate doorway pages.

## Acceptance Evidence

Private `data/exports/dol-225-2026-10-22/` contains:
`before.json` (original full-page links), `expected.json` (native-catalog rules
and unique public target checks), and hosted before/after/visual receipts when
completed. A global header/footer link already present does not count as a new
URL discovered; report the new contextual placement separately from the
whole-page unique URL delta. Do not imply every existing unrelated link was
audited just because the newly added targets passed.

Protected previews intentionally have noindex. Target checks resolve against
the public production canonical URLs, not the preview's noindex headers.
Desktop/mobile checks must confirm no overflow and preserve the approved
swipeable guide row and product-first collection layout. The new blocks stay
below products, not ahead of them.

This is navigation on established canonical owners, not new keyword content or
proof of search demand. Existing canonical/intent evidence in the collection
and brand SEO records is reused; no paid research is billed to another company.
Full-rollout acceptance still needs Martin's yes, target/identity exclusions,
production checks and actual release rows in the DOL-224 ledger. No invented
release date, ranking benefit, indexing guarantee or organic-sales attribution.
