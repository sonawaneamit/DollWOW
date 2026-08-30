# DOL-25 Codex pack — brand promo banners + `/promo` index

Prepared 30 Aug 2026, 08:58 PT (Europe/Lisbon, UTC+1). Store asset+copy only.

**Do not publish, deploy, merge, email factories, change Shopify prices, or advertise extra factory % on any live page.** Do not interrupt DOL-23 Bina. Coding is Codex 5.6 Sol on Martin’s Mac after Kaia launches it.

Linear: [DOL-25](https://linear.app/dollwow/issue/DOL-25/brand-collection-promo-banners-promo-index) · [DOL-14](https://linear.app/dollwow/issue/DOL-14/ship-lusandy-sept-promo) · [DOL-20](https://linear.app/dollwow/issue/DOL-20/ingest-sedoll-september-2026-promo-and-factory-banners) · DOL-21 note only.

## MARTIN LOCK (do not re-ask)

Martin 30 Aug: **do not animate banners in this wave.** Static SE PDP freebie blocks + `/promo` only. Banner-to-video later with cheap Venice image-to-video **after** static is live. No autoplay, GIF, video, or Ken Burns on factory banners now.


Extra factory % is **parked**. Sitewide 10% stays at checkout. Lusandy +5% US stock and SEDOLL stock 10/15 stay **off** all `/promo` and collection copy until **Martin brings it up**. Do **not** ask stack vs replace. Extra % is not a question.

Structured facts: `facts.json`.

## What Kaia should tell Codex

1. Add `/promo` listing every **active** brand promo. Page is 404 today (`https://dollwow.com/promo`).
2. Put factory/brand banner + SAFE details on that brand’s **collection** page. Brand hubs live at `/brands/{handle}`, not `/shop/{brand}`. `/shop/*` is attribute collections (some redirect).
3. Factory/brand art only. Never Rosemary or Your Doll banners. Adult, no youth/school looks.
4. Sitewide 10% stays at checkout. Do not invent a stack. Do not advertise extra factory %.
5. Split copy: **SAFE TO SHOW NOW** vs **HOLD/PARKED**. Extra % is parked, not a question.
6. Use files in this pack. Do not invent dates, frees, or percentages.
7. Do not ship Lusandy +5% US stock. Do not swap Irontech/Real Lady galleries (DOL-21). Adela is live; Yui stays parked.
8. First brands: **SEDOLL** (12 factory JPGs; TPE banner is the live-safe hero). **Lusandy** (checkout frees can be copy; **banner blocker**).

---

## Collection URLs (verified live 30 Aug 2026 PT)

| Brand | Canonical collection | Live? |
| --- | --- | --- |
| SEDOLL / SE Doll | https://dollwow.com/brands/se-doll | **Yes (200).** `/shop/se-dolls` and `/shop/sedoll` redirect here. `/brands/sedoll` and `/brands/se-dolls` also 200 — prefer canonical `/brands/se-doll`. |
| Lusandy | https://dollwow.com/brands/lusandy-dolls | **No (404).** Also 404: `/brands/lusandy`, `/brands/lusandy-doll`, `/shop/lusandy-dolls`. Products are live (e.g. https://dollwow.com/products/lusandy-belle-159cm-h-cup-silicone-companion-doll). Codex should **create** `/brands/lusandy-dolls` to match `/brands/irontech-dolls`. Do not use `/shop/lusandy-dolls`. |
| `/promo` | https://dollwow.com/promo | **404** — create. |

---

## Copy split

### A. SAFE TO SHOW NOW

- DollWOW **sitewide 10% at checkout**. Live bar text: “Summer sale. 10% off everything. Applied at checkout.” Do not describe it as stacking with factory extra %.
- **Dates (SEDOLL only, from factory banners + mail):** 1–30 September 2026 (`Date: 2026 Sept. 1-30` printed on factory art).
- **SEDOLL TPE / STPE custom frees** (factory mail + TPE banners; unverified SKU-by-SKU vs live checkout):
  - Free STPE upgrade
  - Free EVO skeleton
  - Free gel breasts
  - Free fixed tongue
  - Free lubricant-free vagina
  - Free realistic body painting
- **SEDOLL Silicone Pro custom frees** (factory mail; implantation notes here). Option **%** on the same mail/art is PARKED:
  - Free realistic body painting
  - Free hard hands & hard feet
  - Free realistic oral structure
  - Free implanted eyebrow & eyelash
  - Free gel breasts
  - Free soft vagina
  - Free articulated fingers **or** ultra-flex fingers
  - Free soft belly (bodies T148, T155, T159, T165, T175)
- **SEDOLL live-safe banner:** `banners/sedoll/TPE-doll-1920x750-SEdoll.jpg` (plus TPE 800×600 card and 1200×1800 portrait). Art lists frees + dates only. No extra factory %.
- **Lusandy checkout truth (sampled live PDP, not a factory Sept letter):** Lusandy Belle 159 custom already includes as FREE: ROS, gel breasts, EVO, reduce weight / super weight reduction, standing, hyper-realism body painting, realistic head painting, implanted eyebrows, implanted eyelashes, articulated fingers, hard hands, finger puncture protection, soft vagina, toe bones. Can stay as “already included at checkout.” Do **not** invent a September date range or extra %. Do not call this a factory Sept promo.

### B. HOLD / PARKED (until Martin brings it up)

Do not put these on `/promo` or collection copy, and do not use banners that print them.

- **Lusandy +5% US stock** (DOL-14 Linear claim). **Not going live.** No factory mail found in sales@ or hello@. WeChat forward `1a04e0ebd8d958fc` is empty MIME.
- **SEDOLL US/EU stock 10% silicone + 15% STPE**, plus free realistic skin on silicone stock (factory mail + US/EU stock banners).
- **SEDOLL option discounts** printed on Silicone Pro / torso factory art: Master Makeup 10% off, movable eyelids 30% off, gel butt 50% off, realistic skin texture 50% off (torso: eyelids 30% + gel butt 50% only).
- Banners with extra % **baked into pixels** (in pack, do not mount live yet):
  - `Silicone-doll-*`
  - `Silicone-torso-*`
  - `US-EU-stock-*`

Factory PS (unverified vs live DollWOW checkout; do not rewrite Shopify prices): STPE from US/EU warehouses priced without body makeup; previously in-stock STPE that has body makeup is sold with makeup included. Overseas web prices to update before 1 Sept.

---

## Banner files

### SEDOLL — 12 factory JPGs (brand art)

Drive folder (from Sherry mail): https://drive.google.com/drive/folders/1w9fZW8dBzibdNxQfa-LOUQGfMMjSO3NB
Gmail: `sales@` threadId `1a04819d8d73037d`, 2026-08-28 12:20 WEST, subject `SEDOLL monthly promotion in September 2026`. Four 1920×750 JPGs also attached to that mail.

All under `banners/sedoll/`. Recommended live hero is the TPE 1920×750.

| File | Size | SHA256 | Live now? | Alt (adult, specific, not school) |
| --- | --- | --- | --- | --- |
| TPE-doll-1920x750-SEdoll.jpg | 1920×750 | f740fc16078366718adfa16e0e42f2ad7a70903b05b901ac5a83d8affa20697d | **Yes** | SEDOLL TPE September 2026 promo: adult companion doll with dark hair in high buns, white ruffled chemise, lace gloves and thigh-high stockings, reclining by a window. Dates 1–30 Sept 2026; free STPE, EVO skeleton, gel breasts, lubricant-free vagina, realistic body painting, fixed tongue. |
| TPE-doll-800x600-SEdoll.jpg | 800×600 | 54b7d5c7cee3117d34450968b4b938977a23fe68ac24db01810a7a17aa313d3a | **Yes** | SEDOLL TPE September 2026 promo card: adult companion doll in white ruffled lingerie and lace stockings; free STPE upgrade and listed TPE custom frees, 1–30 Sept 2026. |
| TPE-doll-1200x1800-SEdoll.jpg | 1200×1800 | cbee5a43b6f26fcb71ed876a4d9bf511ca6311bce596b92bc889c4590ee9c868 | **Yes** | SEDOLL TPE September 2026 portrait promo: adult companion doll with dark hair buns in white lingerie; factory free upgrades for TPE custom orders, 1–30 Sept 2026. |
| Silicone-doll-1920x750-SEdoll.jpg | 1920×750 | 94e1135daa1a7d49f0936dfd496d0ca04fc64859eddbaa1ddfe42f4e525abb1d | HOLD | SEDOLL Silicone Pro September 2026 promo: adult blonde companion doll in a blue athletic top and dark leggings, gym portrait and kneeling pose. Extra option % on the art — parked. |
| Silicone-doll-800x600-SEdoll.jpg | 800×600 | 374c397a3b2f0083727c311bb3563a1711905840cfebf26a2180cd036cd282c8 | HOLD | Same offer set; extra option % on the art — parked. |
| Silicone-doll-1200x1800-SEdoll.jpg | 1200×1800 | a8857a255fd98304a155ac4dfe9b9464b682427ab4fd1bf53e3bdef9a7c91f0d | HOLD | Same offer set; extra option % on the art — parked. |
| Silicone-torso-1920x750-SEdoll.jpg | 1920×750 | fd7c4b2c1029006bdff19e092fdddbf3ce96545081ef316d7af688a675e27d46 | HOLD | SEDOLL silicone torso September 2026 promo: adult blonde torso figure with grey cat ears and black lace lingerie. 30% eyelids / 50% gel butt on the art — parked. |
| Silicone-torso-800x600-SEdoll.jpg | 800×600 | d7290fa0bbc368a7223a04f89f29a3fbfbd8db5c41513eda5ea7be6822b47ee9 | HOLD | Same; extra % on the art — parked. |
| Silicone-torso-1200x1800-SEdoll.jpg | 1200×1800 | de10aec234c19e3536b4f5e814eda505044795025038cbaa3e142dde28442b0d | HOLD | Same; extra % on the art — parked. |
| US-EU-stock-1920x750-SEdoll.jpg | 1920×750 | ad75990340f6c6b3d3047f87c0efd8b6684ab200148db0d01778277c5fd81cd5 | HOLD | SEDOLL US and EU in-stock September 2026 promo: four adult companion dolls in casual tops, US flags left, EU flags right. Stock 10/15% off on the art — parked. |
| US-EU-stock-800x600-SEdoll.jpg | 800×600 | 237f94de4243bb042713724d643ca69ac284c5560b6714ac66e5b8f33c84f415 | HOLD | Same; stock extra % on the art — parked. |
| US-EU-stock-1200x1800-SEdoll.jpg | 1200×1800 | c7564780bbdf6ca0da80df4cc63835671aa630c537964ea8d1bf56a584dc5eee | HOLD | Same; stock extra % on the art — parked. |

Do not use the July 2026 SEDOLL banner set still sitting in Drive under other parent folders. Do not use PSDs (not requested; huge).

### Lusandy — 0 factory banners (blocker)

`banners/lusandy/` is empty except `MISSING.txt`.

Searched, read-only:

- Gmail `sales@`: no Lusandy September promo / banner thread.
- Gmail `hello@`: thread `1a04e0ebd8d958fc` subject “Lusandy WeChat” (2026-08-29 16:06 WEST) is empty MIME — no body, no screenshots.
- Drive `sales@` Lusandy supplier folder: catalog PDF + price list only.
- Drive `hello@`: no Lusandy/SEDOLL title hits (SOP folder is not the promo pack).
- lusandydoll.com: no Sept 2026 promo page.

**Missing exactly:** Lusandy factory JPG/PNG/WebP for September 2026. Do not substitute competitor art.

---

## DOL-21 note only (no gallery swap)

No Irontech/Real Lady factory **promo** banner is in this pack. Treat Aug packs as gallery refresh later.

- Pearl, Vanessa, Kurumi: already live. Refresh later, not this task.
- Yui: parked. Do not list.
- **Adela is live** (do not swap images now):
  - https://dollwow.com/products/real-lady-adela-159cm-h-cup-silicone-companion-doll-1gb70 — Head #R1, 159cm H-Cup custom, **$3231**. Matches DOL-21 RL159 R1 Adela.
  - https://dollwow.com/products/real-lady-adela-168cm-h-cup-silicone-companion-doll-tikoh

---

## Suggested `/promo` entries Codex can ship now

1. **SE Doll — September 2026 custom frees** (active 1–30 Sept 2026). Banner: TPE 1920×750. Copy from SAFE list only. Link https://dollwow.com/brands/se-doll.
2. **Lusandy** — omit from `/promo` as a dated Sept promo until a factory banner exists. Optional: text-only “already included at checkout” free-options note with **no extra % and no invented dates**. Brand hub still needs to be created.

Factory mail is **unverified vs live DollWOW checkout**. Do not change Shopify prices.

Extra % stays parked. Do not ask Martin stack vs replace.
