# DOL-382: Nov 19 new dolls go-live (21 Nov 2026)

Martin approved on 21 Nov 2026, 09:12 Vienna: "Make all those previews live if they pass your visual browser checks.
It needs to have pricing tiers and editorial text section ... Also make sure you get all FU live too", then
"PDPs and cert can says. Approved and cert is pending."

## Going live

| Product | Shopify ID | Base | Starter / Enthusiast / Collector | Binding | Checkout family |
|---|---|---|---|---|---|
| Climax Lexi SiP157 157cm F | 10745002033336 | $1,799 | $1,859 / $1,859 / $1,959 | live Climax female silicone (`8586064917…`, same as Mayu/Rhea) | Mayu/Rhea family `2b7031e6…` |
| Climax Frida SiP157 157cm F | 10745002688696 | $1,799 | $1,859 / $1,859 / $1,959 | same | same |
| FU Doll White Peach 163cm I | 10745005473976 | $2,299 | $2,359 / $2,459 / $2,659 | `fudoll-female-silicone-044e91b62c4d` | `fudoll-silicone-nov21` |
| FU Doll Qin Xingyue 163cm I | 10745005637816 | $2,299 | $2,359 / $2,459 / $2,659 | same | same |
| FU Doll Luo Chengchuan 176cm male | 10745005801656 | $2,299 | $2,324 / $2,424 / $2,624 | `fudoll-male-silicone-55e8ec088468` | same |

Tier totals are full price, as Martin saw them on the 19 Nov previews. FU tier recipes are the reviewed preview
recipes from `data/draft-previews/dol382-new-dolls-recipes-nov19.json`.

## Changes

- Shopify (drafts, before relink): `custom.editorial_intro` written for all five (customer copy only); internal
  tags `dollwow-test` and `dol382-nov19` removed; `catalog-review-hold` removed from the three FU dolls.
- `scripts/register-dol382-nov21-golive.mts` reads the drafts from the production Admin API, maps them with
  `mapShopifyProduct` and the PDP's Admin `body_code`/`head_model` merge (same method as
  `scripts/relink-dol381-382-from-admin.mts`), and writes the template-release entries, the named checkout parents and
  the FU Doll charge family. Every paid option of every product binds to exactly one released charge at the same
  price (checked in the script and in `tests/dol382-nov21-golive.test.ts`).
- FU Doll charge family: the 48 existing `dollwow-fu-upgrade-*` charge products (tag `fu-intake-2026-10-03`,
  `dollwow-system`, `exact-upgrade-pilot`), plus the shared Vaginal Irrigator / Reusable Drying Rod charges already
  live in the Climax family. Lingerie styles share one charge product per price (choice labels list the styles).
  The FU charge products are activated and published with the dolls.
- FU Doll is now a catalog brand (`fudoll`, hub `/brands/fu-doll`) with a certificate-pending authorization:
  "Authorized FU Doll dealer: approved, certificate pending." Same layout as SE Doll.

## Held (not published)

- Climax Mabel 886 with/without head, Midori 774 with/without head, Horty Si60 X: fixed-configuration torsos/mini
  with no Starter / Enthusiast / Collector tiers, and base prices not ending in 9 ($1,175 / $1,058 / $1,999 / $1,881 /
  $455; Horty's price row is labelled "Hani" in the Climax PDF). Need Martin's call on tiers and prices.
- Older FU drafts Anna 162, Tifa 162, Lisa 157, Ziqing 165 (Oct intake): 5-8 photos only, generic copy, prices
  ($2,399 / $2,299) not matched to the FU price sheet, no reviewed tier recipe.

No orders, payments or discounts were created. PR #280, the BFCM discounts and `BFCM_BRAND_PROMO_LIVE` are untouched.
