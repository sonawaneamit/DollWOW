# DOL-6 SE first — September free bonuses on PDPs

Martin 30 Aug: **static only this wave.** No banner animation, video, GIF, or Ken Burns. SE PDP freebie blocks + `/promo` still images. Venice image-to-video later after static is live.

Same Codex job as DOL-25 `/promo` + collection banner. Prepared 30 Aug 2026 PT from live `product-feed.json` (423 SE Doll SKUs). Do not publish extra factory %. Sitewide 10% stays at checkout. Care-kit gift is not live. Other brands wait.

Linear: [DOL-6](https://linear.app/dollwow/issue/DOL-6/pdp-freebie-blocks-on-live-brands) · [DOL-25](https://linear.app/dollwow/issue/DOL-25/brand-collection-promo-banners-promo-index) · [DOL-20](https://linear.app/dollwow/issue/DOL-20/ingest-sedoll-september-2026-promo-and-factory-banners)

Handle lists: `se-pdp-frees-handles.json`

## Dates

1–30 September 2026 (factory banners + Sherry mail). Show on SE PDP freebie blocks.

## Layout

Rosemary-style PDP freebie/promo block. Factory/brand art only. Never Rosemary or Your Doll banners.

Collection + `/promo` live-safe factory banner only: `banners/sedoll/TPE-doll-1920x750-SEdoll.jpg` (plus TPE 800×600 / 1200×1800 if a card/portrait slot needs it).

Do **not** mount `Silicone-doll-*`, `Silicone-torso-*`, `US-EU-stock-*` (extra % in pixels).

## Copy — TPE / STPE PDPs (custom)

Use on live **custom** TPE SE PDPs (`material=TPE`, `stockStatus=custom`): **268 handles**.

Free (Sept 1–30, 2026):

- STPE upgrade
- EVO skeleton
- Gel breasts
- Lubricant-free vagina
- Realistic body painting
- Fixed tongue

Do not add stock 10/15 or option % (makeup/eyelid/gel-butt/skin-texture).

## Copy — Silicone Pro PDPs (custom)

Use on live **custom** silicone SE PDPs (`material=Silicone`, `stockStatus=custom`): **100 handles**.

Free (Sept 1–30, 2026):

- Realistic body painting
- Hard hands and hard feet
- Realistic oral structure (say this on the PDP; do not write ROS — that is a different factory upgrade)
- Implanted eyebrow and eyelash
- Gel breasts
- Soft vagina
- Articulated or ultra-flex fingers
- Soft belly — **only** on factory body codes T148, T155, T159, T165, T175

Live catalog has no T148 / T159 / T175 silicone customs. Height proxy for T155 + T165: **26** of the 100 custom silicone handles (`heightCm` 155 or 165) in `silicone_pro_soft_belly_height_proxy_handles`. Prefer real body-code metafield if Codex finds one; do not print soft belly on 153/157/160/161/163/167/170.

## RTS / warehouse PDPs — skip custom-order frees

54 ready-to-ship SE PDPs (28 TPE + 26 silicone). Dolls are already built. Do **not** put September custom-order frees on them. Do **not** put parked US/EU stock 10/15 on them. Sitewide 10% at checkout still applies. Handles in `tpe_rts_handles` and `silicone_rts_handles`.

## Skip

- `sedoll-realistic-ai-companion-companion-doll-1wijh` (Sophie Lane AI companion)

## HOLD (off PDP copy, same as collection)

- Lusandy +5% US stock
- SEDOLL US/EU stock 10% silicone / 15% STPE
- SEDOLL option %: Master Makeup 10, eyelids 30, gel butt 50, skin texture 50
- Care-kit review-for-gift

