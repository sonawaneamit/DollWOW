# DOL-216: standalone IronAI head preview

21 October 2026. Preview only; no Shopify mutation, production release or price change.

## Reviewed correction

Exact product ID 10518042575032 and existing handle
`irontech-ironai-head-companion-doll-1v3pz` are incorrectly typed as a full doll.
The legacy read-model repair changes the title, description, SEO, classification
and displayed specs to head-only. It drops body-only imported groups from the
customer payload. Both the detail mapper and lightweight SEO mapper apply it.
Existing SKU/variant, price, photographs, handle and canonical remain unchanged.
An already corrected future Shopify product type is not overridden.

The existing configurator is already head + stand only; it is not replaced with
a full-doll menu or artificial three-tier presets. Head-only classification also
excludes this product from DollVue's full-doll preview eligibility.

## Source checks and unresolved package decisions

- Primary: https://www.irontechdoll.com/product/sex-doll-ironai-head/
- Primary: https://www.irontechdoll.com/ironai-head/
- Related family: https://www.real-lady.com/products/sex-doll-ironai-heads/
- Supporting dealer: https://www.rosemarydoll.com/product/irontech-doll-ironai-head/

Current official evidence supports standalone head, voice/text operation, 2.4 GHz
Wi-Fi, OTA updates and selected M16 body compatibility, not universal fit.
It does not establish the exact five Real Lady model codes currently exposed by
our existing menu. Preserve that menu pending Dolly's evidence/decision; do not
claim the code list is independently verified in this change.

Official head details say a high display stand is included. The existing Shopify
stand menu charges $300 tall / $420 bust, while its base price is $552. The
official current product advertises $662. No price is changed under this ticket;
these conflicts require Dolly/Martin's package and commercial decision.

Raw read-only records and source results are private in `data/exports/dol-216/`.
Free TinyFish extraction plus one bounded structured check ($0.010848; call
`a6136c6ed6a9473eb205abd73df79145`) found no selectable-model evidence. An empty
result is not proof that those models are unavailable or supported.

## Review acceptance

Check one H1 and clear head-only copy/specs, unchanged $552 base SKU, only head
and stand groups, unchanged $300/$420 existing paid stand deltas, no body-only
presets, no DollVue badge, no overflow at mobile and desktop sizes. Preview and
Martin's approval are required before release. Package/model questions above
remain open even if classification tests pass.
