# DOL-229: Private Batch D Buyer Pass

Whole229 In Progress, not live/full competitive acceptance. Existing PR162,
branch codex/dol-229-batch-d, explicit worktree
/Volumes/Extreme Pro/Projects/DollWOW-dol229-batch-d .
Rollback cbe26f8a80e455b5a9aeac946c63cba1d61ec130 preserved; no old-stack merge,
main reset, new PR or production release. Runtime dea6b4cd follows1b447941.

## Scope And Order

Current GitHub inventory confirmed159/160 MERGED23Oct; do not rerelease/remerge
them from stale queue notes.161/183 private milestones remain separate.162-169
are OPEN;177 remains outside this pass under151. Old staged stacks require fresh
production integration later, not blind merge approval.

This next tranche follows the recorded22Oct demand order, not invented fresh
GSC volume: Ready, Blonde, Mini, Tan, IL. Mini retains its original no-change
disposition: no new targeting, membership, facts or imagery clearance. Four new
private paths only: /shop/ready-to-ship, /shop/blonde-dolls,
/shop/tan-skin-dolls, /brands/il-doll. Activation requires exact flag
DOL229_BATCH_D_BUYER_SUMMARY=1 AND VERCEL_ENV=preview. No project/prod flag change.
No151held IDO/MD hubs or157/238held Top Fire records are edited or cleared.

## Implemented

- Reused pure selection summary: current visible-page starting prices only,
  existing checkout shipping/tax/options wording and policy link. Strict source
  reads; zero/missing/invalid/nonfinite/mixed-currency prices omit, never free.
- Private noindex/nofollow and exact visible-page ItemList identity/order/count;
  original production/default24-item schema behavior preserved.
- Shorter plain IL intro, buyer notes and FAQs; shorter Blonde/Tan intros retain
  pictured-vs-included hair, manufacturer shade and fixed-vs-custom distinctions.
  Ready/Mini copy unchanged. No price/filter/order/eligibility/options changes.
- Original IL PDF preview had broken glyphs. Read original PDF with pdftotext
  and faithfully rendered its first page using Poppler, without editing text,
  paper, logo, signature, seal or PDF. The original clearly names IL/DollWOW and
 30Jun2026-30Jun2028. Original PDF SHA256
 cf078fb1a9a345fc7ce11633bc846047af9fb7331deb0df01d4bccdc4344a82c unchanged.
 New PNG is used ONLY by the private IL brand card. Other brands, product cards,
 production and the original PDF link retain their previous behavior.
 No new certificate/authority invented. First pbe20 host precedes this preview
 correction and is not final certificate proof.
- No Shopify product/media mutation, order/cart/mail/model/settings or live
  publishing action. One new static PNG code asset is staged for private review.

## Competitor Evidence And Scorecard

Public search/read fallback is authorized; known DataForSEO40207/Treg-auth and
YourDoll403 holds not retried. No fresh provider/AI-GEO clearance claim.

| Page | Useful Improvement / Observed Rival Strength | Gap / Confidence |
| --- | --- | --- |
| Ready | Current page prices and region-aware existing browsing, explicit checkout qualification; Tangle Joy US-stock collection actually read | Catalog labels are not physical stock or delivery proof; no matched warehouse/landed-price comparison. Medium source, Low overall win |
| Blonde | Pictured wig may not be included, with model-specific choices; Tenderdolls has clear shade/material/body navigation | Do not copy its blanket removable-wig or care/performance claims; requested competitors incomplete. Medium source, Low overall win |
| Tan | Exact supplier shade/photo/fixed-build qualification rather than ethnicity; Tangle Joy has useful form/material filters | No universal shade or included-feature claim, no verified all-competitor superiority. Medium source, Low overall win |
| IL | Plain model facts/current prices, product-first layout and legible original-certificate preview | Neodoll mixes standalone heads/stock labels, not equivalent full dolls; Lucidtoys has clear issuer/recipient evidence but its certificate is not ours. Medium source, Low overall win |
| Mini | Existing no-change disposition retained | No new catalog/imagery/safety clearance |

Sources actually read:
- https://tanglejoy.com/collections/us-stock
- https://tanglejoy.com/collections/tan-sex-dolls
- https://tenderdolls.com/sex-dolls/blonde-sex-dolls/
- https://www.neodoll.com/collections/il-doll
- https://www.lucidtoys.com/pages/il-doll-certficate

Foreign retail prices/currencies, standalone heads, supplier-superlatives and
competitor included features do not become DollWOW prices/fit/entitlements.
No competitor galleries/media copied; no customer/supplier/TDF contact.

## Verification / Honest Typecheck Limit

45focused tests pass/1opt-in normally skipped; separate final BUILT source-HTML
test passes seven actual routes (four owners plus three collection page2 cases),
matching real linked image cards, private noindex, canonical owners, ItemList and
visible FAQ/schema. Source counts: IL19, other visible pages36, not full-catalog
counts or an eligibility audit. First-page starting prices: IL2249-2699USD,
Ready539-2659, Blonde1384-3199, Tan1200-2500; page2 ranges differ as expected.
Scoped lint/configured local build/two4950option-asset gates pass. New certificate
PNG is a separate faithful PDF preview, not a claim the option gate audits it.

Full npx tsc --noEmit is NOT green: unchanged privateDraftPreview.test.ts:18,
TS18048 optional priceDelta. Independently reproduced on the exact rollback via
in-memory Git-blob compiler-host overlay, with baseline tracked roots and same
framework declarations; no worktree reset. Both baseline/current have that one
diagnostic. Initial harness-only TS5074 was removed by disabling incremental in
the read-only harness; not a product bug. No unrelated fixture change/hiding.
Next configured application build passes separately. Initial new unit fixture
used nonexistent mini-dolls preset; corrected to actual mini-sex-dolls before
the final passing test run.

## Exact Hosted Milestone

Corrected READY private preview:
https://doll-lfprfihol-sonawaneamits-projects.vercel.app/brands/il-doll
Same host serves the three scoped collections. Deployment
dpl_AxnwESUy8Kros1kVUBvX2EsJCwjK, runtime dea6b4cd. First pbe20 is superseded,
not final certificate proof. No unchanged runtime redeployment is needed.

Actual authenticated native browser15cases: four owners at1319/390/320 plus the
three collection page2 cases at390.19IL/36other visible linked cards, exact
ItemList identity/count/order, no document overflow, explicit noindex/nofollow,
production canonical and current page-price summaries. Four representative first
images decoded: Ready/Tan/IL640x960, Blonde720x480, not all catalog photos reviewed.
Actual IL FAQ disclosure opens and matches visible/schema answers. Authorization
disclosure opens with faithful PNG827x1170 decoded and unchanged original PDF
link. Clean390certificate and320top-copy screenshots retained. Optional consent
was declined normally; old staged seasonal/consent UI is not current-production
parity or a production307 regression. No bypass/settings change.
All servers stopped, viewport reset and QA tab closed. Hosted browser DOM proof
is separate from local built HTML and external rich-results validation.
Remote configured build/two4950option-asset gates pass; full repository TSC still
has the one unchanged baseline error above, not counted passed. Specific remote
Node version and later documentation CI are not assumed.
Keep broader competitor/provider/release gates explicit; whole229 remains
In Progress with no blanket approval-ready or all-competitor win claim.
