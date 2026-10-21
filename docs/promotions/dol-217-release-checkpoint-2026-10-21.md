# DOL-217 production release checkpoint

## Approved release update (21 October, after preflight below)

Martin answered both commercial questions: end 8 November 2026 at 23:59
Europe/Lisbon (23:59 UTC), keep both near-cost Top Fire RTS variants included.
Linear receipt: `40147e5c-4524-4068-8d17-ef052d836f90`.

The sections below describe the earlier read-only checkpoint, not current state.
Release implementation adds an independent Shopify end timestamp, bounded page
revalidation, client expiry for open tabs, and `DOLLWOW_HALLOWEEN_ENABLED=0` as
the visual kill switch. No automatic return to the old 10% offer after expiry.

Actual API validation rejected 250 explicit variants: Shopify limits selected
variants to 100. No discount was created by that rejection. The release instead
uses one unpublished manual collection of the 3,147 reviewed products (each has
exactly one base variant), with exact product membership readback. Separate
option-charge products remain outside it. Do not publish this internal
collection. Newly published full-size dolls during the campaign must be added
to this collection after the same eligibility checks; do not add drafts,
torsos/hips/minis/heads/accessories or charge products. Five unresolved catalog
identities are excluded until their body form/height is established.

Release commands are explicit in `scripts/release-halloween-discount.mjs`:
`stage` (future-dated), `activate` (exact readback first), `retire-10` (only the
recorded old automatic discount), `read`. Private receipts are under
`data/exports/dol-217/`. No product or order mutations are implemented.
Do not claim completion until production and real checkout receipts exist.

## Authorization and current state

Martin approved making the reviewed v5 campaign live, replacing the current
10% offer and verifying $299 at checkout. Approval recorded on DOL-217 in
comment `90ba654d-3381-4ac3-88a7-e90139585bd5`.

No production, discount, product, publication or order mutations have been made.
The old 10% automatic discount remains active. HALLOWEEN299 does not exist yet.
Checkout validation of the new code has NOT happened and must not be reported
as passed based on the UI or existing unit tests.

## Preflight evidence

- Existing authorized Shopify app authentication and read/write-discount scopes
  are available. No browser sign-in or token extraction was needed.
- Store currency: USD.
- Exact current automatic discount: `gid://shopify/DiscountAutomaticNode/1811452526776`,
  title `10% off`, status ACTIVE. Do not change unrelated discounts.
- Read-only inventory: 5,611 public Storefront channel products and 5,611 active
  Admin products; 3,147 candidate eligible full-body base variants, 2,459 exclusions,
  5 unresolved height/identity records. Existing site mini boundary is <=120cm.
- Two known-cost Top Fire US RTS variants have only $31 and $12 above recorded
  unit cost after the offer. Another 48 eligible RTS variants have no usable USD
  recorded unit cost. Missing cost is unknown, not zero; freight/fees are not
  assumed included. Full DOL-218 backfill is not an added launch prerequisite.
- Current main is `292772ba`; approved preview source is `9c1df450`.
  Remote branch has that commit, but GitHub PR151 still reports stale `6a7210a1`.
  Do not treat old CI or blindly promoting the preview deployment as release-ready:
  preview guards and inactive/placeholder copy still need a production release.

Private artifacts under `data/exports/dol-217/`:

- `release-discount-preflight.json`
- `release-eligibility-audit.json`
- `release-unresolved-source-facts.json`

Reproducible read-only inventory script: `scripts/audit-halloween-release.mjs`.
It never creates discounts, updates products or places orders.

## Waiting On Martin / Dolly

1. Exact campaign end date/time. Start is authorized now; end was never set.
   Suggested for confirmation, NOT adopted: 31 October 2026 at 23:59 Lisbon.
2. Keep both near-cost Top Fire RTS variants in the all-full-size offer or approve
   an exception. Flags and exact prices/costs are on DOL-217 comment
   `35411e81-610a-401b-bb36-eae2251254a7`.

Both questions are on Linear and surfaced to Martin asynchronously. Do not infer
an answer, waive the recorded guardrail, invent an end date, or quietly change
retail prices/exclusions while waiting.

## Remaining Release Work

After answers: finalize/validate manifest, implement hard-dated live visibility
and expiry/kill switch with actual dates/copy (no automatic revival of old 10%),
reconcile PR/source state, create/read back the code and all eligible batches,
coordinate deactivating only the old 10% with the approved live release, then
verify live custom/RTS, quantity/multi-doll, excluded-only, paid-add-on and mixed
carts at Shopify checkout. Check exact $299 total allocation, no 10% stacking,
currency handling and unchanged factory bonuses. No paid or test order needed.
Maintain rollback evidence and report real outcomes on DOL-217 for Dolly review.

API reference checked: Shopify Admin GraphQL 2026-04 `DiscountProductsInput`,
`discountCodeBasicCreate`, `discountCodeBasicUpdate`, `discountAutomaticDeactivate`.
The existing payload helper batches variant IDs to 250 per call and requires
explicit valid dates. Its unit tests do not prove live checkout correctness.
