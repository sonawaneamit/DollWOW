# DOL-217: catch and once-per-visitor fallback

## Controlling revision

Linear comment `81bd4de6-537a-42b4-a8d7-1cf836f99f39`, 21 October,
15:09 Lisbon, supersedes the purely decorative revision:

- Tap a spider's body to make it scurry and open the offer card.
- Never take a click from shopping controls underneath.
- Remove the announcement's Hide spiders button; keep Escape.
- If untouched for 30 seconds, reveal the card once per visitor and retire
  the spiders. Keep reduced motion and cart/checkout exclusions.
- Approved artwork/layout remains unchanged. Preview only on draft PR151.

## Implementation

All spider SVGs and containers retain `pointer-events:none`. A normal document
click listener checks only a small ellipse around the visible abdomen. It
never prevents a default action or stops propagation, and ignores interactive
targets/ancestors (links, buttons, inputs, summaries, labels, roles and tabbable
elements). This permits catching a spider over ordinary content without placing
an intercepting button over a product, link or configurator control. The static
announcement gift control remains the accessible keyboard alternative.

A caught spider runs rapidly sideways and fades over 400ms; at 420ms the card
opens and all walkers retire. Reduced motion skips the scurry and reveals the
card directly. Escape retires the walkers or closes an open card.

The first eligible route stores a deadline 30 seconds ahead in localStorage.
It is not reset by route changes or reloads. At the deadline, the existing
suppression for hidden tabs, menus, consent/chat overlays and excluded routes
defers the popup until an eligible visible page is available. A stored reveal
flag prevents automatic repetition; Web Locks serialize claims between same-
origin tabs where supported. An explicit gift-button click can reopen the card.

"Visitor" here means the same browser profile and origin while its localStorage
is retained, not a known person across devices. If storage is denied or cleared,
cross-visit persistence cannot be guaranteed. No identifying tracking token or
new account integration was introduced.

## Verification

- 97 focused unit tests passed across visitor state, motion, preview boundaries,
  discount payload preparation, cart and existing factory promotions.
- Typecheck, scoped lint and whitespace checks passed.
- `scripts/qa-halloween-catch.mjs` passed nine browser scenario groups:
  actual body clicks and scurry on desktop/mobile; code copy/focus trap/Escape;
  persistent retirement; a real shopping button deliberately beneath a spider;
  a real 30-second fallback (341ms after stored deadline); no repeat on navigation
  or another tab; overdue fallbacks excluded from cart/account/support; deadline
  preserved through reload and deferred by an open menu; reduced-motion reveal.
- Private receipt: `data/exports/dol-217/v5-catch-qa.json`.
- Actual mobile interaction recording: `v5-catch-mobile.webm`; card screenshots
  `v5-card-1366.png` and `v5-card-390.png` in the same private evidence folder.
- The older roaming QA script now checks Escape dismissal rather than the
  intentionally removed Hide spiders control. Its historical revision-4
  screenshots/receipts are not substitutes for the new interaction receipts.

No production activation, discount creation, 10% change, date setting or draft
product publication. Final review and outstanding commercial release checks
remain separate.
