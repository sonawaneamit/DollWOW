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

## Unfinished Task A

These are not complete PDP or Shopify-draft deliverables. Needed from
Dolly / supplier-provided evidence: exact new-SKU customization menus
(especially the new 153A body) and a supported delivery range. The current
shared PDP otherwise projects a fixed 21-day date, which must not become
an unsupported commitment for these made-to-order China builds.

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

Whole DOL-275 remains unfinished while Task A lacks those dependencies.
Dolly can review the banner component and specification/photo subset
without treating that partial handoff as resolution. Martin's explicit
live approval is still required. Do not merge, publish, create purchasable
products, submit indexing requests or send supplier/customer messages.
