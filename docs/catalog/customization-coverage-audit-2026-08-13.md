# Customization data-presence audit

Generated: 2026-08-13T10:43:48.313Z

This is a read-only snapshot of active Shopify products. It measures only the presence of stored manufacturer/dealer option data before the storefront applies brand-specific compatibility rules. It is **not** a visual audit and must never be used to call a brand complete.

## Coverage by brand

| Brand | Products | With options | Choices | Priced | With photos | Photo coverage | Head choices | Head photos | Unpriced non-default choices |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| WM Dolls | 447 | 447 | 88,341 | 80,563 | 86,105 | 97% | 29,080 | 28,627 | 181 |
| Irontech Dolls | 412 | 412 | 120,498 | 71,178 | 117,256 | 97% | 45,933 | 45,545 | 36,739 |
| SE Doll | 388 | 388 | 43,496 | 41,280 | 41,758 | 96% | 23,176 | 23,070 | 4 |
| SY Dolls | 298 | 195 | 49,497 | 49,497 | 49,497 | 100% | 21,938 | 21,938 | 0 |
| Starpery Dolls | 226 | 218 | 51,354 | 47,066 | 48,094 | 94% | 20,499 | 20,499 | 1,639 |
| YL Dolls | 161 | 161 | 31,929 | 29,186 | 31,112 | 97% | 10,392 | 10,225 | 0 |
| Climax Doll | 136 | 135 | 15,484 | 14,396 | 14,925 | 96% | 3,525 | 3,506 | 0 |
| 6YE Dolls | 121 | 121 | 21,567 | 20,125 | 20,965 | 97% | 8,817 | 8,817 | 0 |
| HR Dolls | 104 | 104 | 16,985 | 15,665 | 16,448 | 97% | 6,600 | 6,550 | 0 |
| Jarliet Dolls | 103 | 99 | 16,234 | 15,078 | 15,821 | 97% | 4,933 | 4,933 | 0 |
| Dolls Castle | 95 | 95 | 10,552 | 9,603 | 9,986 | 95% | 3,067 | 2,987 | 3 |
| Angelkiss | 78 | 78 | 14,040 | 12,792 | 13,650 | 97% | 5,928 | 5,850 | 0 |
| Piper Dolls | 65 | 65 | 5,392 | 4,848 | 5,124 | 95% | 0 | 0 | 0 |
| Doll Castle | 64 | 64 | 6,303 | 2,421 | 6,006 | 95% | 1,437 | 1,417 | 2,369 |
| Real Lady | 49 | 36 | 10,682 | 10,142 | 10,394 | 97% | 4,670 | 4,634 | 0 |
| Tantaly | 30 | 30 | 256 | 226 | 196 | 77% | 0 | 0 | 0 |
| Erovenus | 28 | 28 | 717 | 688 | 642 | 90% | 436 | 417 | 1 |
| WM Doll | 27 | 27 | 5,237 | 4,788 | 5,104 | 97% | 1,670 | 1,645 | 0 |
| IL Doll | 19 | 19 | 2,679 | 2,318 | 2,546 | 95% | 323 | 304 | 0 |
| Avant Doll | 14 | 14 | 1,204 | 1,204 | 980 | 81% | 28 | 28 | 0 |
| Moonvale | 10 | 10 | 2,339 | 2,339 | 2,339 | 100% | 1,180 | 1,180 | 0 |
| Irontch Dolls | 9 | 9 | 2,745 | 540 | 2,673 | 97% | 1,026 | 1,017 | 1,746 |
| Irontech Doll | 9 | 9 | 2,201 | 1,142 | 2,136 | 97% | 838 | 830 | 792 |
| Ai-Tech | 7 | 7 | 546 | 490 | 511 | 94% | 0 | 0 | 0 |
| HR Doll | 2 | 2 | 356 | 70 | 346 | 97% | 152 | 152 | 238 |
| Total | 2,902 | 2,773 | 520,634 | 437,645 | 504,614 | 97% | 195,648 | 194,171 | 43,712 |

## Interpretation

- **Priced** means the stored choice has a numeric price delta, including a verified zero-dollar choice.
- **With photos** means only that a choice contains an image-swatch URL. It does not prove the image is current, accurate, compatible, successfully loaded, source-matched, customer-ready, or Visualizer-ready.
- **Unpriced non-default choices** are retained in the manufacturer record but must not interrupt checkout. They require a current manufacturer, Rosemary, or YourDoll price before becoming purchasable.
- A head image is not automatically Visualizer-ready. Identity-preserving head replacement remains gated until its dedicated workflow passes QA.

## Data-quality target — not a completion claim

- One included replacement head choice is single-select where the body supports compatible heads.
- Additional heads are a separately priced multi-select group and charge once for every selected head.
- Special/exclusive replacement heads retain their verified surcharge.
- Every public paid choice has a numeric source-backed delta.
- Appearance choices have accurate option photos before Visualizer exposure.
- Unsupported, incompatible, or unverified choices remain out of checkout without replacing the purchase CTA with a contact-team detour.

The actual completion gate is maintained in `docs/catalog/brand-option-visual-reconciliation-2026-08-13.md` and requires source counts, prices, images, compatibility, selection rules, rendered desktop/mobile behavior, both themes, and regression evidence for every relevant product family.
