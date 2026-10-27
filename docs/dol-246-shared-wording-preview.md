# DOL-246 Shared Wording Preview

Martin's25Oct decision43ea5cce approves Doll type plus shared title/logo/structured-name/Why-compare casing. Preview only; Dolly review then exact Martin release approval.

Inventory: root title suffix/metadata resource labels; header DOM wordmark and header/footer accessible text; ProductFilters visible label; shared collection comparison heading/table label and brand comparison label; Organization/WebSite/Article publisher/OpenGraph shared names. Only strings change. Underlying productForm key/options/filter functions, titles' subject matter, canonical/entity IDs, catalog, prices/options and all source logo image bytes unchanged.

Logo inspection: header brand name is DOM text with an uppercase CSS treatment, next to the existing clipped image mark. Change its underlying spelling and accessible home label, not the image. Footer logo uses artwork; only its alternative text changes. No generated artwork or replacement logo.

Not a sitewide body-copy rewrite: legacy casing in individual articles, FAQ answers, source titles, customer attribute keys and product/vendor data remains outside this narrowly approved pass. Consent-banner casing awaits the separately posted scope question020ab712. No consent functionality/tracking or privacy wording change. DOL247's separate internal-copy preview remains independent; no merge of that work.

Acceptance: focused source/schema/filter regression tests, type/lint/build, desktop/mobile keyboard/no-JS behavior and exact preview receipts. No publication/settings/indexing/baseline event. DOL232/233 release gates are not cleared by an unapproved246preview.

## Verified Preview Checkpoint (27 Oct)

Draft PR197: https://github.com/sonawaneamit/DollWOW/pull/197

Hosted preview: https://doll-9qan45kpd-sonawaneamits-projects.vercel.app/shop/silicone

89 focused tests across seven files, type checking, scoped lint, diff checks, full production build and 4,950 owned-asset checks passed. Desktop (1,319px) and mobile (390px) show the new label without document overflow. Selecting Full dolls preserves material=silicone and sort=latest and submits the existing productForm=full-doll value. Mobile Filter & sort opens, its options remain unchanged, Escape dismisses the menu, and Reset returns to the collection URL. Canonical remains https://dollwow.com/shop/silicone.

Initial-HTML contract checks returned 200 for the silicone collection, Irontech brand and material comparison guide. Relevant label/hidden input, native details and title suffix are present before hydration. This is not a JavaScript-disabled browser pass: the available browser control does not expose JavaScript disabling. Full no-JS interaction verification remains a review qualification, not a claimed pass. The first probe incorrectly assumed a native select; the corrected receipt checks the existing custom control's hidden input and text contract instead.

Private receipts: data/exports/dol-246-2026-10-27/{initial-html.json,browser-qa.json,desktop.png,mobile.png}. Privacy-banner scope question020ab712 remains separate. No production deployment, merge, catalog write or consent configuration change.
