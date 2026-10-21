# DOL-217 Halloween Preview

## Delivered Preview

Isolated from production at commit292772ba. Preview mode is enabled only for the
`codex/dol-217-halloween-preview` Vercel preview branch, or an explicit local
`DOLLWOW_HALLOWEEN_PREVIEW=1`. Production refuses that flag. No live discounts,
catalog products, supplier bonuses or DOL-177 changes are included.

The announcement links to the existing `/promo` page. One mobile/two desktop
edge spiders reveal a dismissible, keyboard-accessible card. Revealing or hiding
persists for this campaign on the device when browser storage is available.
Reduced motion is static. The animation pauses on hover/focus. Interactive
controls, photos and dialogs are checked before positioning. If no safe position
exists, the spider is omitted and the ordinary promo link remains available.

## Release Dependencies, Not Preview Blockers

- Dolly confirms campaign dates, shared code and the approved full-size/mini rule.
- The preview uses the staged code `HALLOWEEN299`; it is not active at checkout.
- DOL-218 near-cost RTS review remains required before live activation.
- Reviewed eligible base variants must exclude parts, minis and option-charge
  variants. Product form alone must not accidentally classify loose heads as dolls.
- `prepareHalloweenDiscount` prepares a fixedUSD299 payload, applied once across
  eligible items, with bounded variant batches. It performs no Admin mutation.
- Create a future-scheduled/inactive Shopify code only once the reviewed manifest
  and dates are supplied. Read back every eligibility batch and currency setting;
  test custom, RTS, exclusions, add-ons, quantity and multi-doll carts without a
  paid/test order. Verify currency conversion in Shopify rather than estimating it.
- Factory bonuses remain as configured; confirm they still price correctly.
- Only after Martin approves the exact preview: activate the approved campaign,
  deactivate the old10% discount at the coordinated switch, update banner/terms,
  and independently verify live checkout. No automated return to an old offer.
- Set a hard campaign end and a separate visual kill switch for the release.

## QA Evidence

Private browser receipts/screenshots live in `data/exports/dol-217/` on the SSD.
Unit tests cover the preview production guard, route whitelist and discount
payload. Browser checks cover desktop/mobile reveal, copy, focus/Escape, dismissal,
reduced motion and excluded paths. These are functional receipts, not SEO uplift
or proof that an inactive Shopify code applies at checkout.
