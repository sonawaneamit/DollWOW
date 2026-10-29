# DOL-286 Lusandy November Preview

Preview only. Nothing is approved for production or Shopify writes.
Martin's 29 October instruction moves Gynoid to Blocked and prioritizes this
preview. His 28 October clarification confirms back-to-back October/November
offers, with no October conflict to reopen. Black Friday is excluded.

## Source And Timing

- Original banner: Drive `1dpt2_2_4Ps9taYc_Gzsut9ww_z04SO4k`, 463,927 bytes,
  2048x1075 JPEG, retained unchanged in public/promo/lusandy-november-2026/.
- Notice: Drive `1TPTCX-4gIkL61J6AjZ5U8x62jwlcvitr`, 370,093-byte PNG retained
  privately. Both originals were visually inspected against the ticket.
- Eight campaign benefits and six standard inclusions match the notice.
- Tentative clock follows the existing factory-Pacific convention:
  starts 1 November 00:00 PDT (`2026-11-01T07:00:00Z`), expires 1 December
  00:00 PST (`2026-12-01T08:00:00Z`, exclusive). This accounts for November DST.
  The factory provided dates, not an exact timezone/time. These constants are
  easy to change and require explicit acceptance before release.
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

Both NEXT_PUBLIC_VERCEL_ENV=preview and NEXT_PUBLIC_DOL286_PREVIEW=1 are required
for November visibility and benefit labels. No production environment setting
is changed. This gate needs a separately reviewed release change after approval.
PDPs are noindex, have no Product offer schema or PDP tracking, and checkout is
disabled while the preview gate is on. The /promo page is also noindex.
Frozen clocks use the existing Preview-only promoClock query; production ignores
that query. This is campaign-clock QA, not a simulated checkout or order.

Approval required on Linear: after Dolly reviews the exact hosted preview,
does Martin approve the Lusandy-only release with this provisional Pacific
start/end policy and catalog-zero prices preserved? No release on silence.

Private readback, menu census, source checks, responsive screenshots and durable
checkpoint live under data/exports/dol-286-2026-10-29/ in the ticket worktree.
