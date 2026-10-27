# DOL-257 Top Fire Pricing Preview

This is a read-only preview, not a Shopify price update. The latest 27 October
Linear instruction requires preview first and Martin's explicit go-live approval.

Read-only Shopify Admin verification on 27 October confirmed the exact seven
product/variant pairs, current prices, SKUs and single-variant product shape.
All seven compare-at prices were null. The public-page handoff's torso SKU
assumption was incorrect; the manifest retains the verified admin SKUs.

| Product | Variant | Before USD | Preview USD |
| --- | --- | ---: | ---: |
| Top Fire Doll 165cm C-Cup Silicone Body (Auto Blowjob, Dark Tan) with Your Choice of Head - In Stock US | 54335385534648 | 1653 | 2065 |
| Top Fire Doll 170cm H-Cup Silicone Body (Auto Blowjob, Dark Tan) with Your Choice of Head - In Stock US | 54335377080504 | 1686 | 2065 |
| Top Fire Doll 170cm H-Cup Silicone Body (Auto Blowjob + Hip Swing & Rotation, Dark Tan) with Your Choice of Head - In Stock US | 54335377408184 | 1808 | 2399 |
| Top Fire Doll 176cm D-Cup Silicone Body (Auto Blowjob + Hip Swing & Rotation, Dark Tan) with Your Choice of Head - In Stock US | 54335385600184 | 1926 | 2399 |
| Top Fire Doll Amelia 102cm F-Cup Silicone Torso Companion Doll | 54355750355128 | 1045 | 1299 |
| Top Fire Doll Isabella 106cm J-Cup Silicone Torso Companion Doll | 54355748683960 | 1045 | 1299 |
| Top Fire Doll Megan 106cm I-Cup Silicone Torso Companion Doll | 54355748225208 | 1045 | 1299 |

## Isolation

- Both `VERCEL_ENV=preview` and `DOLLWOW_TOPFIRE_PRICE_PREVIEW=1` are required.
- Only exact approved product IDs, handles and variants receive an overlay.
- A changed source price, variant set, currency or handle fails closed.
- Product options, promo rules, tags, descriptions, imagery and compare-at logic remain unchanged.
- The preset loader retains the original Shopify product identity for existing approval checks, while the UI uses the proposed base amount.
- Both cart APIs block before lookup/analytics attachment/mutation; direct cart helpers block too. PDP checkout and hero buy actions are unavailable.
- Review page and PDP robots are noindex/nofollow in the flagged preview.
- No persistent environment setting, production deployment, Shopify price/cost write, real cart/order or contact was performed.

Review table: `/review/topfire-prices`; each row links to the actual shared PDP.
Private raw admin receipt: `data/exports/dol-257-2026-10-27/admin-before.json`.
That receipt contains costs and stays ignored/private. The committed manifest
contains only public retail values and product identifiers, no costs or margins.

## Remaining Gates

Dolly's preview pass, then Martin's exact release yes are required before live
variant price writes. Re-read each exact variant immediately before writing;
abort on source drift. Preserve compare-at values and all options/promos.
Verify all seven live PDPs visually and capture before/after variant receipts.

COGS is not completed by this price preview. Reconcile the source sheet and
explicit approved load scope separately; do not infer permission to load all
913 rows from this seven-price ticket. Flagged torso costs omit US shipping and
must not be used as complete landed costs or net-margin evidence.
