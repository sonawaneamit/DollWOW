# DOL-286 Lusandy November Campaign

Martin approved the reviewed scheduled release on 29 October09:47,
Linear comment6b91bdb8-112f-4a58-968f-be5747e81e08. His28October clarification
confirms back-to-back October/November offers, with no October conflict to
reopen. Black Friday and Shopify price/discount writes remain excluded.

## Source And Timing

- Original banner: Drive `1dpt2_2_4Ps9taYc_Gzsut9ww_z04SO4k`, 463,927 bytes,
  2048x1075 JPEG, retained unchanged in public/promo/lusandy-november-2026/.
- Notice: Drive `1TPTCX-4gIkL61J6AjZ5U8x62jwlcvitr`, 370,093-byte PNG retained
  privately. Both originals were visually inspected against the ticket.
- Eight campaign benefits and six standard inclusions match the notice.
- The reviewed and approved clock follows the existing factory-Pacific convention:
  starts 1 November 00:00 PDT (`2026-11-01T07:00:00Z`), expires 1 December
  00:00 PST (`2026-12-01T08:00:00Z`, exclusive). This accounts for November DST.
  The factory provided dates, not an exact timezone/time. These constants are
  easy to change if the factory supplies a different exact time later.
- Existing October ends at that same start instant. Components use a 15-second
  live clock unless a Preview-only review clock is explicitly frozen.

## Scope And Pricing

Only custom, full-size Lusandy silicone dolls qualify. RTS, heads, body parts,
unknown height, minis, anime and other brands are excluded. No menu choices,
compatibilities or product records are invented.

A read-only Admin census of all 60 tagged records found 46 active products and
34 qualifying active products. All 34 have all eight exact primary promotional
choices already priced zero. All 1,496 paid option occurrences stay at their
original amounts, including ultra-soft body at USD130. No price field is changed.
No paid or unavailable option is relabeled free, and extra-head choices do not
gain a new campaign entitlement.

Campaign labels and banners expire. Existing catalog-zero options remain zero;
no unsupported post-campaign prices are invented. The other six standard
inclusions are factory statements, not added option selections. Original menus
and conflicts remain authoritative.

Factory benefits coexist with the existing HALLOWEEN299 base-doll discount until
8 November at 23:59 Portugal time. This work does not create/edit a Shopify
discount or validate redemption with a test order. The November component stops
showing Halloween stacking copy after the existing Halloween end instant.

## Preview Guard

The campaign now uses the approved date window on production, without a new
environment setting. Nothing appears before the start. Both
NEXT_PUBLIC_VERCEL_ENV=preview and NEXT_PUBLIC_DOL286_PREVIEW=1 remain required
only for isolated review controls, not for the production campaign schedule.
PDPs are noindex, have no Product offer schema or PDP tracking, and checkout is
disabled while the preview gate is on. The /promo page is also noindex.
Frozen clocks use the existing Preview-only promoClock query; production ignores
that query. This is campaign-clock QA, not a simulated checkout or order.

Release rebased onto75ee30c9, preserving newer SE Halloween artwork/private-draft
guards and all newer DollVue changes. Production ignores promoClock query
overrides; no production clock settings, prices or menu records were changed.

Private readback, menu census, source checks, responsive screenshots and durable
checkpoint live under data/exports/dol-286-2026-10-29/ in the ticket worktree.

## Scheduled Production Receipt

PR212 source08bd1833 merged659cdcf6 at29October17:47:53UTC. Production
dpl_BWYdHnviAwUnt2Dhh1MVcnBEE5rc is READY and independently confirmed on
apex/www. Schedule is installed, not early-visible: actual current-date index
and Belle PDP retain October and show no November banner even with a future
promoClock query. Desktop1319 and mobile390 have no overflow; Belle purchase
control is enabled. No cart or order was submitted. Viewport restored.

Exact dated review dpl_EnpVmgTynjyZiKpJJ34MtEwy3tzt on source08bd1833 verifies
November artwork2048x1075, index/PDP desktop/mobile, accordion and before/after
boundaries. These frozen preview checks are not proof that real November time
has elapsed or a discount was redeemed. No production environment setting or
Shopify price/discount/menu record changed.

Fresh60-record read-only census confirms46active/34eligible, each with8exact
catalog-zero primary benefits, and1496paid option occurrences unchanged.
44focused tests including that census pass, fullTSC/scopedlint and hosted
build/two4950asset gates/allCI pass. Broader promotions:127/128 pass; the lone
Fanreal September assertion expects obsolete sitewide10percent copy and fails
identically on pre-release main75ee30c9 in the separate170worktree. Its related
files were not changed; this is not counted as a passing test or silently fixed.

Linear receipt5c5b3efe-49a2-45d3-838b-7b5b24176b63 includes four screenshots
clearly labeled current production versus dated preview. The ticket remains
In Review for Dolly, not self-closed. Do not remerge/redeploy the schedule.
