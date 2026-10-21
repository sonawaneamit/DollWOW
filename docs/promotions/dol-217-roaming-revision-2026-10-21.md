# DOL-217: compact landing page and click-through walkers

## Controlling decisions

Martin's 14:07 Lisbon revision is recorded in Linear comment
`9a2d007d-16fc-4821-a524-17db2ac13af1`:
cap laptop artwork height, organize `/promo`, let spiders cross content without
intercepting clicks. This supersedes the earlier edge-only/clickable behavior.
Comment `2e55e23e-52f6-4891-9122-0b6678c6af64` removes the portrait identity
dependency: keep the exact current doll, unnamed, without a product link.

## Changes

- Real visible H1 and concise offer summary before the artwork.
- Desktop artwork uses the smaller of 66% of the viewport height or the
  viewport minus 360px for navigation and introductory content. Contain rather
  than crop the exact approved artwork. Mobile retains its separate composition.
- Server-rendered how-it-works, eligibility/exclusions, date placeholders,
  current public catalog cards, brand links and accessible FAQ disclosures.
- Featured examples are the existing homepage Vivian, Freya and Isla records,
  retrieved through the public catalog API. No invented prices or stock claims.
  These examples do not replace the reviewed activation eligibility manifest.
- Metadata/CollectionPage description matches preview copy. Canonical ownership
  stays `/promo`. No active Offer schema or made-up start/end dates.
- Six desktop/four mobile articulated decorative spiders, distributed throughout
  the viewport below the header. They cross content and turn at viewport limits.
- The entire spider layer and its descendants have `pointer-events:none`.
  Decorative spans are aria-hidden, not buttons or tab stops. No hover trapping.
- The announcement's gift control opens the retained offer card. The announcement
  link and ordinary page code/CTA remain usable without chasing moving targets.
- Existing hide persistence, Escape, reduced motion, route exclusions and
  menu/cart/consent suppression remain. No production or Shopify activation.

## Reproducible checks

`scripts/qa-halloween-roaming.mjs` tests five viewports across home, promo,
TPE collection and Vivian PDP. Its assertions cover full desktop artwork in
the first viewport, visible H1/sections, three public cards, JSON-LD parsing,
no active structured Offer, interior walkers, counts, movement/articulated legs,
click-through styling, no horizontal overflow, scroll/consent suppression,
and no page exceptions. A spider is deliberately positioned over a real copy
button to verify browser hit testing and an actual pointer click still copies
the correct code. Further checks cover the gift-triggered dialog, Escape,
persistent dismissal, excluded routes, static reduced motion and no-JavaScript
copy/FAQ availability. Receipts and screenshots are private in
`data/exports/dol-217/v4-*`.

The first browser run found a 320px featured-card minimum-width overflow.
The fix is scoped to this landing page's product grid and cards.
Previous obstacle/collision QA and counts describe the superseded edge-only
version; they are not acceptance evidence for this revision. Obsolete obstacle
helpers/tests were replaced with whole-page boundary/reflection tests.

This is a layout/offer preview, not a new keyword research project or a claim
of validated search impact. No fresh DataForSEO demand/AI visibility study was
run for this revision. The existing SEO release protocol remains applicable
before any broader SEO-completion claim.

## Not done by this revision

No production release, Shopify code creation, discount activation, date setting,
existing 10% change, supplier contact, or publication of draft dolls. Campaign
dates, reviewed exact eligibility and near-cost RTS review remain go-live
dependencies, followed by Martin's final approval and checkout verification.
