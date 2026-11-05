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
