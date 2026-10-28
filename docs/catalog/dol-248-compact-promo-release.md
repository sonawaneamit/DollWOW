# DOL-248 Compact Desktop Promo Release

Martin's 28 October 19:39 approval, recorded in Linear comment
`3c91e034-fcaf-4346-98b6-a8a1e815afaf`, permits only the reviewed compact
desktop layout from PR 209. Both Zarga Shopify records remain draft under
the separate channel-scope hold. This release does not include PR 207.

The reviewed CSS is byte-identical after renaming its scoped wrapper from
`compact-promo-preview` to `compact-promo`. The only existing page changes
are the stylesheet import and wrapper class. All offers, images, dates,
eligibility, metadata and structured data remain unchanged.

At 1024px and above, the two promo sections are limited to 960px, main
artwork to 320px height, brand images to 280px with uncropped containment,
and brand gaps to 24px. Below 1024px the stylesheet has no declarations.
The production baseline has four brand banners, not the fifth Zarga banner
seen in the held product preview; this layout-only release adds no offer.

53 focused tests in five files, full TypeScript, scoped lint and source
isolation checks pass. Hosted and final production responsive receipts
are recorded on Linear and in the private ticket export directory.

Rollback is a revert of this scoped release, not promotion of the stacked
Zarga preview branch. No Shopify, channel, discount or other settings writes.
