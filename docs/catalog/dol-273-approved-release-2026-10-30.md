# DOL-273 Approved Release Checkpoint

## Current Decision

Martin's 30 Oct 12:08 approval `7bc009b1-0291-4544-9c8a-0ee213b2eacb`
approves the eight final prices and Gynoid release. Do not ask again for prices,
the certificate or preview approval. Dolly's 15:05 priority is Gynoid, FU241,
then the DOL315 ten-category preview, before further DOL229 work.

**Not live.** Real body variants are now registered on two unpublished drafts.
Production runtime, complete configuration/preset and paid-charge bindings,
discount exclusion, country/shipping checks and publication remain unfinished.

## Latest Menu Integration

30 Oct 15:52 UTC: read all eleven exact parents and ten existing upgrade variants
without writes. All parents are still unpublished DRAFT, with thirteen total
variants including the two registered Deluxe versions. The eight Gynoid-specific
upgrade products remain DRAFT; the two shared accessories remain ACTIVE. All ten
observed prices/titles match their retained mappings and require no shipping.
All eleven customization metafield definitions are PUBLIC_READ, and effective
menus equal the retained reviewed menus after owned-asset mapping.

The clean runtime now preserves every reviewed fixed/conditional group and the
two exact compatibility rule sets, scoped to eleven ID/handle pairs. It keeps
alternate heads unavailable/unpriced instead of treating saved zero prices as
free entitlements. Model 21's fixed supplier field is labelled Body model, distinct
from the real Standard/Deluxe selector. All eleven photographed head identities
and approved Standard variant IDs/USD prices are checked, including checkout
requests without structured selections. Missing/drifted menus do not fall through
to generic defaults.

Retained Starter/Enthusiast/Collector recipes are prepared only as candidates;
production template and named-upgrade registries remain unchanged. A private
thirteen-parent-variant / ten-upgrade binding candidate is BLOCKED/unsigned:
`data/exports/dol-273-approved-2026-10-30/named-upgrades-candidate-1552.json`.

The Gynoid-only dependency plan attaches the free implanted-hair color to its
verified $599 hair line. Removing that line removes its color, not independent
free inclusions. Unknown, paid, multiple-owner and cyclic dependent details fail
closed. The generic paid-group guard incorrectly flags the inactive hair branch
when bionic breasts share its group; the scoped active-condition plan handles
that case without weakening the guard for other brands. Existing IDO/MD planning
is unchanged; the shared line renderer explicitly recognizes the new Gynoid scope.

Actual read-only evidence: `menu-charge-read-1552/verified.json`, timestamp
15:52:01.572 UTC. It includes 169 local server repricings: thirteen real variant
bases times three tiers and ten paid options. A further 169 local checks of the
final Standard/head guards use that saved Admin snapshot in `local-repricing-1555/`,
not another merchant read or cart replay. Publication availability is explicitly
simulated. These are not Storefront, actual cart, browser, discount, shipping or
country acceptance. No Shopify mutation or staging occurred in this menu pass.

New focused tests cover all eleven full menus, both Deluxe bases, head holds,
compatibility, missing/drifted identity, dependent removal and legacy checkout
regressions. The earlier 63-test milestone below is historical, not the final
menu-pass count. Final scoped verification: 223 tests across sixteen files pass,
including shared named-upgrade/order/template and promotion regressions;
TypeScript and changed-module lint pass without errors/warnings. The configured
local build, public promotion-data check and both 4,950-asset gates pass. Existing
visual-index/DollVue static-render diagnostics remain, not an all-repository claim.
No remote deploy, browser/canvas inspection or production acceptance is claimed.
No brand/media/source hold, settings, order or email changed.

Next: current-source private integration of PDP/version qualifications, brand and
certificate, then complete paid-charge/discount/country/shipping actual QA and
evidence signing before authorized publication. Do not replay the two variant
registrations, ask again for approval, or resume DOL229 ahead of this release.

## Clean Integration

Use `/Volumes/Extreme Pro/Projects/DollWOW-dol273-gynoid`, branch
`codex/dol273-approved-release`, created from freshly fetched and verified
`origin/main` `7a2073aa8ea7fa092ffa8b1119901d75a907d264`.
The old PR199 branch `codex/dol-273-gynoid-preview` is preserved at `788f6f49`.
Its 190-file difference includes unrelated historical changes; never merge it
wholesale for this release. Main's worktree was not reset or modified.

## Registered Body Versions

The exact approved parents were freshly read at 15:36:54 UTC. A reviewed dry run
preceded four successful mutation requests at 15:37: two option/value renames
and two single-variant creations. No product was created or published.

| Parent | Standard Variant / USD | Deluxe Variant / USD |
| --- | --- | --- |
| Lisa M13 `10637911163064` | `54252188663992` / 5299 | `54595304489144` / 5799 |
| Elsa M21 `10637915029688` | `54252192497848` / 4799 | `54595305504952` / 5099 |

`Body version` is the only option axis, with Standard and Deluxe values. The
original Standard IDs and prices were retained. Both parents remain DRAFT and
unpublished. Full observed readbacks match before for title, handle, description,
tags, all returned metafields, media IDs, publication state and original variant
inventory/tax/SKU fields; only body-option labels and the new variants differ.
Observed gallery IDs remain five for Lisa and ten for Elsa, not a fresh audit of
all 94 cohort photos. No media was appended or replaced.

Evidence is private and immutable under
`data/exports/dol-273-approved-2026-10-30/registration-execute-1537/`:
`before.json`, four mutation responses and `M13-verified.json` /
`M21-verified.json`. Do not replay registration for a newer receipt. The preceding
`registration-dryrun-1538/` folder name is an arbitrary label; the actual saved
timestamp is 15:36:54, not 15:38.

## Runtime Work

`lib/catalog/gynoid-body-versions.ts` binds both exact parent ID/handle pairs and
all four real variant IDs to approved USD prices. It rejects synthetic, unknown,
mislabelled, duplicated, incorrectly priced or non-USD versions. Body/head names
do not grant another product a Deluxe mapping. Both server checkout paths use
this validation before uncustomized or structured selections are accepted, and
derive the parent line's Body version attribute from Shopify rather than browser
text. Existing option guards remain intact.

The existing checkout lookup mapped only the requested variant. For these two
parents only, a second uncached, bounded Storefront query now reads up to three
sibling variants and rejects truncation, missing parents or changed requested
variant fields. Other products retain the original exact-node query, including
variants beyond position 30. A narrow real-ID selector wrapper uses a div to
avoid the label/button double-click issue found in the private preview.

Four saved actual Admin variant readbacks pass the local binding function.
That evidence explicitly simulates publication availability; it is **not** a
Storefront availability read, cart, deployed runtime or browser acceptance.

## Verification

- 63 focused tests across six files pass, including both checkout routes,
  exact-node lookup regression, failure cases and resumable registration.
- One actual read-only registration dry run and one actual registration/readback
  test pass. Registration is opt-in and skipped in ordinary test runs.
- TypeScript passes after installing this clean base's locked dependencies and
  regenerating route types; no manifest or lockfile was changed.
- Scoped lint has zero errors and two pre-existing ProductOptions warnings.
- Both owned-asset gates pass at 4,950 assets; public promotion data check passes.
- Configured local Next build passes on local Node 26.12.1, with the existing
  broad visual-index warning and DollVue dynamic/static diagnostics retained.
  Initial direct `node --env-file ... next build` failed worker argument handling;
  the successful build loads env through a parent process instead.
- The local Homebrew Node22 executable has a missing simdjson dylib. No system
  repair or Node22 acceptance is claimed. No remote build/deploy acceptance is claimed.

## Source And Preserved Private Proof

Current official PO Guidance 2026.10.29 source read at 15:09 confirms Deluxe is
life-cast hand/foot detailing, not softness or a separate head. M13 Standard is
30 kg/body, bust 89 cm; Deluxe 32 kg/body, bust 91 cm. M21 both versions are
30 kg/body. Body weights have +/-3 kg variation and exclude the head. Do not
present these as packed shipping weights or invent Deluxe-specific photos.

Previous private preview remains
https://doll-qdhy9bi4g-sonawaneamits-projects.vercel.app/review/gynoid-prices,
deployment `dpl_66YrKiLfiTWdiggmToKq5pc6h3nq`, runtime `3d15f103`.
Its 36 hosted version/tier/viewport cases are preserved dated private proof, not
proof of this new integration. Old snapshots still contain one Standard variant;
do not overwrite source snapshots or relabel them as current Shopify data.

## Next

Continue the approved release on this clean branch: exact reviewed menus/rules
with alternate heads still unavailable unless priced/cleared; retained recipes
and signed evidence only after actual paid-charge QA; exact base/upgrade discount
exclusion; supported-country and shipping checks; current-source PDP version
qualification and brand registration. Preserve other brands and all source holds.
Do not publish ahead of these technical checks, repeat prior draft/media writes,
merge PR199's old stack, or return to DOL229 ahead of this priority.

DOL284's five-market proposal still needs its separate exact yes. Gynoid release
approval does not authorize Managed Markets/settings activation or payment QA.

Private305 refreshed at 15:25:34.459 UTC: two rows match all twelve automated cells
in fresh A5:L6, numeric dates to eight decimals; approved four named permissions
hash and Limited parent unchanged; fresh 1000x26 bounds, DATE_TIME format,
top/wrap/no formulas and accepted delivery state healthy. No sheet write or PII
output. Refresh next run, not again this run.

Latest private305 check for the menu pass: 15:43:57.177 UTC, fresh two-row export
equals all twelve A5:L6 cells to eight-decimal numeric dates. Four approved named
permissions hash, Limited parent, fresh 1000x26 bounds, date format, top/wrap and
no-formula/accepted state remain healthy. No sheet write or PII output; do not
repeat this check within the same run.
