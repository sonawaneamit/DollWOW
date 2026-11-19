# DOL-371 approved preview implementation scope

Source: Linear comment 8d7b784f-13d3-4c38-bee7-57222a3d1286, 18 November 2026.
Checkpoint: c86dac72-2710-49ed-9098-22c45257a9c4.
Base: origin/main 57cb2146. Production changes are not authorized by this brief.

@Codex **Build the confirmed brand BFCM promos (Top Fire, Galatea, Climax) on dollwow.com. PREVIEW ONLY.** Martin asked for this (18 Nov, Lisbon). He's travelling until Sun 22 Nov, so post everything here for one yes/no review.

Use only the terms below. They are all logged earlier on this ticket. Where a term isn't in this table, don't add it.

## 1. Confirmed brand promos

| Brand | Cash deal (goes into the price) | Free extras (shown as $0 options) | Covers | Excludes | Brand dates | Source (logged on this ticket) |
| --- | --- | --- | --- | --- | --- | --- |
| **Top Fire** | **$150 off** each eligible doll | **Free second head** | Full silicone Top Fire dolls (e.g. Wendy 170cm, if she is full silicone; check the PDP) | TPE and hybrid (silicone head + TPE body) Top Fire dolls: no change | 15 Nov – 14 Dec 2026 | Official Top Fire banner sent to Martin on WeChat, 17 Nov: "BLACK FRIDAY MEGA SALE: FREE SECOND HEAD + $150 OFF, FULL SILICONE DOLL, WORLDWIDE" (comment 0f161e9f). Alvin confirmed on WeChat that the $150 is brand-funded (comment ea529299). |
| **Galatea** (Dolls Castle line) | None | **3 free upgrades: Body Heating, Vagina Suction, Oral Heating** | Galatea custom (factory) orders, e.g. Galatea Alice / Ginger / Emma GT06 163cm | Non-Galatea Dolls Castle products. They weren't in Martin's approved pick, so leave them unchanged. | 18 Nov – 31 Dec 2026 | Tena, sales@ 17 Nov 08:05, msg 1a1e88a49a51adee (comment 1fae1bf5). Use this 17 Nov wording, which supersedes Tena's 12 Nov "oral suction" line. |
| **Climax** | **10% off** the listed price on full-size dolls priced $900+ | **Full-size:** free extra head, gel hips/butt, and hands/feet upgrade. **Torso:** free gel butt + extra head. | Climax custom/factory-order dolls, including the 5 new models from 13 Nov (ULW SiP157 Lexi/Frida, ULW 886# Mabel, ULW 774 Midori, Si60 X Horty) and the 100P+ models due 23 Nov, if listed | **Warehouse / in-stock Climax dolls get nothing.** Torsos and items under $900 (e.g. the $881 torso) get no cash discount; the torso freebies above still apply. | 13 Nov – 11 Dec 2026 (US time) | Arvin, sales@ 13 Nov, msg 1a1d3ccb7dc0a5ad + "CLM-2026 -BFCM(English).pdf" (comments f02052b5, 34b4713e). Official Climax TDF post https://www.dollforum.com/forum/viewtopic.php?t=217991 (comment e508ea65). Martin's pick #5 (comment 63db6622). |

**Climax hands/feet wording:** the dealer PDF says "hard hands/feet" and the TDF post says "wired hands/feet". Make free whichever hands/feet upgrade option actually exists on each Climax PDP. If neither or both exist, leave it unset and flag it here. Don't guess.

**Skipped brands:** none of the three. All three are confirmed in writing by the brand. Every other brand stays untouched in this task.

## 2. Rules (from Martin)

1. **Cash deals go into the product price.** A brand-funded promo lowers our vendor cost by the same amount, so margin is unchanged. Pass it through in full (Top Fire $150, Climax 10%). Show the original price as the struck-through compare-at price.
2. **Stacks with BLACKFRIDAYWOW26.** It's already live: $299 off orders of $900+, combines with product discounts, ends 10 Dec 2026 23:59 ET. Don't change the code.
3. **Free extras show as $0 / FREE options on the PDP** and match the brand's promo one-to-one. Don't add or drop any.
4. **Promo breakdown before checkout.** On the PDP near the total (or in the cart if the PDP gets too busy), state which brand promo was applied, e.g. "Top Fire Black Friday: $150 off + free second head applied", and that the customer can take another $299 off with code BLACKFRIDAYWOW26.
5. **Everything reverts automatically on 10 Dec 2026 at 11:59 pm US Eastern** (11 Dec 04:59 Lisbon). That covers prices, $0 options and promo copy. Use a scheduled job, not a manual to-do. This date comes before all three brands' end dates.
6. **Preview or feature flag only, never live.**
   - No production Shopify price or option changes until Martin says yes.
   - Prepare the Shopify price/option changes and the scheduled revert as a dry run. Post the per-SKU diff (old → new, revert time) here.
   - **Don't touch the homepage.** The PR #269 announcement bar is live, so leave it as it is.
7. **Customer-facing marketing copy only.** Make it enthusiastic and easy to scan. No internal notes, caveats, sources or labels on the page. All notes go here on Linear.
8. **Match DollWOW's existing design language** in sonawaneamit/DollWOW: components, type, colours and the maroon BFCM campaign style.
9. **Never pay and never create orders** during testing.

## 3. Acceptance criteria

- [ ] A Vercel preview URL (or a flag-gated build) with all three brand promos. Production is unchanged.
- [ ] **QA on at least 3 dolls per brand**, mixing sizes and materials:
  - Top Fire: include at least 1 TPE or hybrid doll to show it is **not** discounted.
  - Climax: include 1 warehouse-stock doll and 1 torso to show the exclusions.
  - Galatea: test 3 custom dolls.
- [ ] For each test, record:
  - the doll and the options picked
  - the expected price (brand deal, then $299)
  - the PDP price
  - whether the free options show at $0
  - the cart total with BLACKFRIDAYWOW26
  - pass/fail
  - a screenshot
- [ ] The PDP/cart promo breakdown shows on every eligible doll and doesn't appear on excluded ones.
- [ ] The dry-run Shopify diff and the scheduled-revert method (10 Dec 23:59 ET) are posted here.
- [ ] The full test table, screenshots and preview link are posted on DOL-371, ending with a single line for Martin: **"Preview ready for your yes/no: <link>"**.


## Later decisions, read in full

- 71711ebb: add 6YE, identified by tags/title (121 active products), 5% off and one free extra head on the current full-size range. Never publish drafts.
- a2764e49: calculated preview cart stacking is sufficient before owner approval. Do not create Shopify test copies or repeat Dolly's checkout tests.
- d141049d: add IDO after the four brands, $2,499 warehouse / $2,599 China, expiry end Nov 30.
- Source Gmail 1a1857e21b42b8d4: IDO China offer includes both a random wig and a doll moving pad. International freight is separate on the dealer quote; the retail offer is as explicitly authorized for preview.
- ca19be07: Erovenus consumer offer remains excluded pending dealer confirmation.
