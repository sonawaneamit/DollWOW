# DOL-221 — Gynoid Early Bird private presentation

Started from origin/main e8b570d4 on 5 November. This is a private presentation,
not a completed purchasable Lyra rollout. Production and Shopify are unchanged.

## Evidence and scope

Factory PDF `1JSEncdZOuB5a_1RZNyXiHtQC-P4V58jp`, read via Drive on 5 Nov:
M25 with any head, or Lyra with another body; $500 / $300 / $100 off during
5–14 Nov / 15–24 Nov / 25 Nov–4 Dec. Lyra heads have $150 off and a free holder.
No.17 torso excluded. The existing eleven non-M25/non-Lyra products are not
eligible. Existing menus, prices, variants and checkout remain untouched.

Original supplier photograph `1ylxyblVF4Eu2B6qTWJKPJjo13Xj0df7I`, 5,193,907 bytes,
2560x3840 JPEG, from the authorized Early Bird folder. Visually inspected:
adult doll in blouse/skirt. Retained unchanged; responsive display crop only.
It is a campaign photo, not verified as a particular body/head combination.

Eric's 29 Oct mail `1a186dda8a6bf851` confirms dealer discount on Early Bird
prices and fluctuating reference freight of $760 US / $688 Germany for a
163cm carton. These are planning costs, not a firm M25 shipping quote.

## Preview guard

Requires VERCEL_ENV=preview AND NEXT_PUBLIC_DOL221_PREVIEW=1.
Only /promo and /brands/gynoid-dolls receive the component. Both are noindex
when enabled. No global project setting or production flag was changed.
The preview uses Lisbon calendar days (UTC during this campaign); the factory
provides dates without a timezone. A preview-only promoClock query can inspect
tier boundaries without changing the actual clock or checkout.

## Checks

10 boundary/isolation tests pass. TypeScript and configured build pass, including
both 4,954-asset ownership gates and public promotion data validation.
Actual local browser observations: /promo 1319 and 390; brand 320 and 768;
no document overflow, original campaign image decoded, noindex/nofollow,
disclosure opens with mouse and Enter, enquiry link navigates to /support.
Screenshots and build/deploy logs: data/exports/dol-221-2026-11-05/ (ignored).

## Pending commercial decision

Asked Dolly/Martin once in Linear comment 73af0419-5bd1-4b3e-93f2-bafe4551d884:
M25 advertised $3899/$4399 leaves only ~$20/$120 after 80% dealer cost plus
$760 reference freight. Need DollWOW selling prices before a purchasable
M25 Standard/Deluxe listing. No assumption that current price approval covers
these new models. The source factory prices are not advertised as our final
selling prices in this presentation. No claim of cart/checkout testing for a
new model. Sale completion and production release remain pending.

## Martin's 16:03 review — text revision

Linear fb8f586e-e9e4-4731-96e7-46922493fabb requests browse links instead of
Ask buttons, tiers on Gynoid PDPs, Gynoid in the hand-picked Explore by brand
list, one approved-model artwork concept, and automatic expiry. Prices stay
unchanged. The list is hard-coded in HalloweenLandingSections, not automated
ranking. Its new Gynoid link uses the same live campaign clock and expires.

Implemented the non-artwork items. Every Gynoid PDP shows qualified campaign
terms, not a discount on its current non-M25/non-Lyra listing. Original prices
remain intact. Client clock removes offer and its browse link after4Dec; all
tiers switch by date. The brand-list link has the same clock. No unrelated
brands or sitewide discounts were changed.

Actual local /promo: no old Ask link; one Gynoid link inside Explore by brand;
browse navigates to /brands/gynoid-dolls#brand-products. Lisa PDP1319/390 has
readable tiers/no overflow, unchanged5299,300 benefit at15Nov and no offer/browse
link at5Dec. Desktop PDP uses a full-width campaign photograph above its text
to keep the three date blocks readable inside the narrow gallery column.

Artwork generation is STOPPED pending the missing exact skill/model evidence.
Searched installed skills, plugin skills and both local skill/repository roots;
dollwow-campaign-artwork and /workspace/design-bar/codex-56-se-sept-bonus-inspo.png
are absent. Asked Dolly once in1c18fa3e-4e45-46bd-9ca0-3a68c8a51273 to provide
an accessible SKILL.md, design-bar file and approved model. Do not substitute
another model/process, generate more sizes, or claim the existing photo is the
requested new banner concept. Price question also remains open.

## Approved presentation release — 10 November

Martin approved the exact hosted preview in Codex chat on 10 November. The
campaign presentation is now enabled in production, retaining its date-based
$500/$300/$100 stages and 5 December expiry. Existing eleven product prices,
variants, options and checkout are unchanged. This does not publish a new M25
or Lyra product. Contact-before-order qualification remains in the approved copy.
Preview-only clock overrides and noindex guards remain separate from production
visibility; existing Greenback and Grace changes are preserved on current main.

Validation: TypeScript; 11 campaign boundary/isolation tests; webpack production
build; source and built-chunk asset gates (4,954 assets). Turbopack cannot build
with the local external node_modules symlink, so webpack was used successfully.
