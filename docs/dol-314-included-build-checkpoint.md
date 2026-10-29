# DOL-314: Catalog Included Features

## Authority And Scope

Martin authorized Chiku first, then the rest. Chiku was released through PR229
and verified live. DOL-313 is externally Done since 29 October 22:16:10 UTC;
preserve that state and do not repeat its release or checkout test.
DOL-314 tracks only the remaining private catalog preview. Additional live
publication requires review of the exact preview and Martin's approval.

Worktree: `/Volumes/Extreme Pro/Projects/DollWOW-dol314-included`
Branch: `codex/dol314-included-preview`
Base: `7a2073aa8ea7fa092ffa8b1119901d75a907d264`

## Completed Internal Preparation

`verifiedFixedBuildFacts` is a pure display-only extractor, wired only to the
explicit `DOL314_INCLUDED_BUILD_PREVIEW=1` private-preview flag. Production is
excluded even if that flag is set. It requires a product-recorded
required single choice with a verified zero price and no explicit availability
restriction. Conditional groups and both sides of compatibility rules are
excluded. Duplicate identities, generic placeholders, unknown prices and paid
choices are excluded. Group and option labels remain separate so a bare color
or ambiguous option does not become an invented feature label.

137 focused tests across twelve files pass, one existing test is skipped,
and one separate explicitly enabled read-only source test passes. Full
TypeScript check and scoped ESLint pass (two pre-existing ProductOptions
unused-variable warnings). Final-source configured build and both
4950-owned-asset gates pass.
No Shopify, source-menu, pricing, eye-entitlement, image, checkout, production,
settings or email change was performed. Chiku's accepted live
eight-item presentation and four free eye colors are untouched.

## Current Source And Browser Proof

Read-only source sampling returned six current products across Irontech,
SE Doll and Dolls Castle. Exact vendor queries for FunWest and Top Fire
returned no records; those brands are not claimed covered. The private source
snapshot records each original menu SHA256 and unchanged default quote.
Irontech Molly/Suki have three eligible facts each; Dolls Castle Emma/Ginger
have eleven each. SE Luis/Samantha have no qualifying records: this is not
proof that the products lack included features.

Ten actual local-browser cases passed: Molly and Emma at desktop 1319 and
mobile 390/320; Luis and Chiku at mobile 390/320. All had no document overflow,
noindex/nofollow and disabled checkout. Mobile totals occupy full 310/240px
with no ellipsis or text overflow. Chiku still shows its eight accepted facts.
`local-browser-proof.json` and two screenshots are saved privately. These
are local results, not hosted or live proof. No cart was created.

## Hosted Preview Verified

Source: `39dc4885163752ce9379251439024c32b35c4754`, draft PR230.
Exact final READY deployment: `dpl_9od9YrTBmuEo49oC7Bkqcw5hWQKs`.
Host: `https://doll-q3987fm4d-sonawaneamits-projects.vercel.app`
Open `/products/irontech-molly-166cm-2-0-s44-ros-max-silicone-doll` or
`/products/dolls-castle-galatea-emma-gt06-163cm-c-cup-silicone-doll`.

Ten actual hosted browser cases match the local matrix: no overflow,
noindex/nofollow, disabled checkout and full 310/240px mobile totals.
Molly has three facts, Emma eleven, Luis zero qualifying facts, Chiku its
eight accepted facts. All four original images decoded; Chiku was initially
still loading and independently rechecked at 1466x2250. Hosted Molly preset
labels/descriptions/prices match an independent actual live-page read.
Actual hosted preset clicks resolve 3199/3497/3656 without changing facts.
Viewport reset. No cart created and no live QA cart replayed.

The first host `doll-hbshj4oay` is superseded: its preview environment omitted
the existing released preset registry. The final deployment enables
`DOLLWOW_TEMPLATE_RELEASE=1` only for this deployment alongside the DOL314
preview flag; production and project settings are unchanged. Both remote
Node22 builds and asset gates passed. Exact source39dc PR CI is all green.
Any later documentation commit has separate CI and is not asserted green.

The shared clipping fix is already LIVE on other dolls via PR229: actual
Molly320 manual-wizard expansion shows a full 240px total with no overflow.
There is no reason to re-release PR229 for this.

Receipt `0ec9ac73-feb7-4df3-84a0-32fcb6a82d20` includes two hosted screenshots.
DOL-314 is In Review for Dolly. This is private-preview acceptance, not a
completed live whole-catalog rollout.

## Unfinished Checkpoint

1. Read fresh DOL-314 discussion and check other active chats before continuing.
2. Wait for Dolly's review and exact preview approval before any production
   activation or release. No live release is approved by this receipt.
3. Expand actual source/compatibility coverage if needed for review. Preserve
   missing-data qualifications and product-specific prices/entitlements. The
   existing shared clipped-total correction is already live via PR229; this
   follow-up does not need another release just for that correction.
4. Keep source snapshots private and excluded from deployment. No settings,
   production flags, Shopify writes or new options are authorized here.
5. Provide the exact preview and limitations for Dolly, then Martin. Do not
   call the whole catalog complete or release-ready based on this helper.

DOL-285 remains Blocked at its existing quotation question; DOL-306 remains
paused. DOL-314 is now In Review, leaving DOL-224 and DOL-84 umbrella active.
Martin explicitly ordered autonomous overnight queue work after this catalog
priority. Read fresh Linear before continuing the approved DOL-303 November
preview; do not turn unrelated blocked tickets into unapproved live work.
