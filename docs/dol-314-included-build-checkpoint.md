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

`verifiedFixedBuildFacts` is a pure display-only extractor, not wired to any
page, resolver, cart or production feature flag. It requires a product-recorded
required single choice with a verified zero price and no explicit availability
restriction. Conditional groups and both sides of compatibility rules are
excluded. Duplicate identities, generic placeholders, unknown prices and paid
choices are excluded. Group and option labels remain separate so a bare color
or ambiguous option does not become an invented feature label.

34 focused assertions pass; full TypeScript check and scoped ESLint pass.
No Shopify, source-menu, pricing, eye-entitlement, image, checkout, production,
settings, email or deployment change was performed. Chiku's accepted live
eight-item presentation and four free eye colors are untouched.

## Unfinished Checkpoint

1. Read fresh DOL-314 discussion and check other active chats before continuing.
2. Review a bounded set of current product-specific source menus across brands.
   Preserve missing-data qualifications; absence from a menu is not proof of
   absence from the product. Do not infer standard features or new entitlements.
3. Wire the reviewed extractor only into a private preview with noindex and
   disabled checkout. Preserve the production Chiku behavior and all server
   option/pricing contracts. No public-wide activation is approved.
4. Exercise actual multi-brand PDPs at desktop and narrow mobile widths,
   including empty/conditional/paid menus. Verify unchanged presets, prices,
   checkout contracts and no overflow. No hosted or browser proof exists yet.
5. Provide the exact preview and limitations for Dolly, then Martin. Do not
   call the whole catalog complete or release-ready based on this helper.

DOL-285 remains Blocked at its existing quotation question, DOL-306 remains
paused, and DOL-303 must not become a fourth active issue. Active tickets are
DOL-224, DOL-84 umbrella and DOL-314.
