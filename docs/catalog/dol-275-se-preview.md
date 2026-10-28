# DOL-275 SE Elf And Halloween Preview

Preview-only branch: `codex/dol-275-se-elf-halloween`. No live Shopify,
pricing, stock, discount, registry, settings or production writes.

## Implemented For Review

- Original SEDOLL Crimson Flame / Dark Temptation JPGs, with separate
  1200x900 desktop and 900x1200 mobile assets. No image generation or edits.
- Flagged preview banners on SE PDPs, SE brand hub and `/promo` only.
- Working inferred SE end: 31 October 2026, end of day Europe/Lisbon.
  The single boundary is `SE_HALLOWEEN_2026.endsAt`; supplier confirmation
  remains pending. SE October benefits use this boundary in the isolated
  preview. Other brands retain their clocks. HALLOWEEN299 is unchanged.
- Preview-only SE option safety rules: loose-joint support warning;
  robot menu limited to neutral, Nodding and Waist-spin choices; head
  #120 Melody conflicts with movable eyelids. No option prices invented.
- `/review/se-elf` contains four approved-price photo/specification
  previews. No purchase controls, product creation or fake inventory.
  Three original supplier photographs per model are included for review,
  not claimed to be the complete supplier gallery or video import.

| SKU | Model | Body | Head | Skin | Approved USD | Net kg |
|---|---|---|---|---|---:|---:|
| SED338 | Samantha.L | 153 A | W022 | Red | 1,429 | 28.7 |
| SED339 | Luis.G | 157 H | W021 | Red | 1,599 | 41 |
| SED340 | Samantha.K | 161 F | W022 | Black | 1,659 | 35 |
| SED341 | Luis.H | 163 E | W021 | Black | 1,659 | 37 |

Source: Sherry's 27 October partner folders linked in DOL-275, exact
Parameters text and original media IDs retained privately in
`data/exports/dol-275-2026-10-27/source/provenance.json`. Asset hashes,
decoded dimensions and MIME checks accompany the private checkpoint.

## Task A Continuation (28 October)

Dolly's 27 October 20:15 decision and 28 October correction clear the menu
and delivery dependencies: reuse the exact live same-body SE menus and
Est. 3 weeks, photographed head as default. W021/W022 are existing head
numbers, so no new head-menu options or swatch replacements are added.

Four private PDP snapshots now extend the same isolated preview flag:

| SKU | Preview path | Copied parent menu |
|---|---|---|
| SED338 | /products/sedoll-samantha-l-153cm-a-cup-red-tpe-elf-sed338 | sedoll-skyler-b-153cm-f-cup-tpe-companion-doll-11km0 |
| SED339 | /products/sedoll-luis-g-157cm-h-cup-red-tpe-elf-sed339 | sedoll-akina-157cm-h-cup-tpe-companion-doll-z7mv2 |
| SED340 | /products/sedoll-samantha-k-161cm-f-cup-black-tpe-elf-sed340 | sedoll-elodie-161cm-f-cup-tpe-companion-doll-13es3 |
| SED341 | /products/sedoll-luis-h-163cm-e-cup-black-tpe-elf-sed341 | sedoll-luis-d-163cm-e-cup-tpe-companion-doll-1k068 |

SED338's explicitly approved Skyler B151/153 menu source is currently titled
153F in Shopify. Only its menu is copied, never its conflicting body specs;
Elf 153A measurements remain from Sherry. Parent raw menu capture and mapping
are private in data/exports/dol-275-2026-10-28. Image references are mechanically
resolved through the existing owned-asset map without changing choice identity.

The normal private-PDP path, configurator and original three reviewed photographs
per SKU are reused. This is not a full source-gallery/video import. All variants
use non-Shopify preview IDs and are unavailable for sale. Hero buy controls,
Product/FAQ offer schema and PDP tracking are omitted; builder checkout and
single/multi-line server cart validation fail closed. No Shopify drafts created.
No inherited preset/charge approvals are transferred: three preview-only recipe
selections are copied from each exact parent's released recipe and resolved
against the copied menu. Exact new-parent bindings still need approval. The photographed head
defaults to As shown; the inherited skin menu/defaults remain unchanged, not
invented red/black swatches. Dolly should review that inherited skin presentation
before live release, separately from the approved photographed base price.

Existing STPE + silicone-head upgrade remains +100 USD retail and retains
its verified STPE / Light Tan restriction. Red/black silicone-head
compatibility is not inferred. Existing parent-specific approvals are not
copied to the four new products. Release also needs approved named-charge
coverage and menu/preset validation; no live registry rollout is implied.

SED339's source text pairs 41 kg with 77.2 lb. Metric source value is kept;
the review calculates 90.4 lb. SED341's feet/inches shorthand conflicts
with 163 cm, so metric height is retained rather than copying the typo.
No factory kg/cm specification has been silently changed.

## Release Gate

The older menu/delivery blocker is superseded; do not ask it again. Hosted
four-PDP verification passed on 28 October; Dolly review is pending in In Review.
Source-gallery completion and any exact new-parent charge/preset bindings remain
release qualifications, not inferred from reusing a live menu. Martin's explicit
live approval is still required. Do not merge, publish, create purchasable
products, submit indexing requests or send supplier/customer messages.

## Hosted Verification - 28 October 2026

Preview: https://doll-ng786i7fl-sonawaneamits-projects.vercel.app/review/se-elf
Deployment dpl_9qnxzm2r4h4QCYfkdHbaRWwwfoe4 uses source 7d6acdb0 and has
Preview target only. All four PDP links are on the review index.

60 focused tests across 10 files, TypeScript, hosted build and the 4,950-asset
gate passed. Browser verification covered 24 actual preset selections across
four PDPs, three tiers and desktop/mobile widths; totals updated, checkout stayed
disabled, no horizontal overflow, and noindex/nofollow remained present.
Gallery navigation covered 24 states. Final 12 gallery decoding states all had
complete images and nonzero natural dimensions, covering three photos per SKU.
Unauthenticated CLI media probes returned preview sign-in HTML; those are not
image response/decode passes. No authentication bypass or HTTP cart mutation
was used. Private receipts and screenshots: data/exports/dol-275-2026-10-28.

Sherry's 28 October stock reply, relayed by Dolly, confirms these four Elf SKUs
are not on the US stock sheet. Keep made-to-order delivery; no US-stock claim.
The separate November skin-colour promotion is outside this ticket's scope.
No Shopify writes, live deployment, orders or external contacts were made.
