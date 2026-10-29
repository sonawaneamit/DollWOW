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

48 focused assertions across three files pass, plus one explicitly enabled
read-only source test. Full TypeScript check and scoped ESLint pass (two
pre-existing ProductOptions unused-variable warnings). A configured build and
both 4950-owned-asset gates pass; final source recheck is pending below.
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

## Unfinished Checkpoint

1. Read fresh DOL-314 discussion and check other active chats before continuing.
2. Complete final-source build recheck, then deploy the exact flagged private
   preview. Recheck actual hosted facts, mobile total, disabled checkout and
   noindex. Do not count an unflagged Git preview as included-feature proof.
3. Expand actual source/compatibility coverage if needed for review. Preserve
   missing-data qualifications and product-specific prices/entitlements. The
   existing shared clipped-total correction is already live via PR229; this
   follow-up does not need another release just for that correction.
4. Keep source snapshots private and excluded from deployment. No settings,
   production flags, Shopify writes or new options are authorized here.
5. Provide the exact preview and limitations for Dolly, then Martin. Do not
   call the whole catalog complete or release-ready based on this helper.

DOL-285 remains Blocked at its existing quotation question, DOL-306 remains
paused, and DOL-303 must not become a fourth active issue. Active tickets are
DOL-224, DOL-84 umbrella and DOL-314.
