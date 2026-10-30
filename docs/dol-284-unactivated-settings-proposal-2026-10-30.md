# DOL-284 Unactivated Settings Proposal

Prepared 30 October 2026. Nothing below has been activated. The five category
corrections and Casey's earlier country-cart test are separate completed work;
they are not repeated here. Construction is approved; final activation approval
is still required after the final checks.

## Current Decision: Five Markets

Martin's 16:30 decision (`995e1420-48df-4e6e-b498-3706a40635c4`) approves
construction of this five-market setup, USD-only/local currencies off, no VAT
registrations and the proposed included-shipping/duties/taxes wording. Finish
Gynoid DOL273 first. This is not activation authority: do not switch markets on
or turn Managed Markets off until rates/checkout are tested, existing managed
orders reviewed, final screenshots posted and Martin gives the final preview yes.
No settings or copy have been activated by this checkpoint correction.

## Latest Unactivated Construction

### Saved Dormant Shipping Profile

At18:58:37 UTC a single custom shipping profile was created and read back:
**138016915640**, `DOL284 UNASSIGNED PREVIEW - NOT LIVE`. It has zero product
variants (EXACT), zero profile items, zero selling-plan groups and zero active
methods. Five explicit zones contain34 distinct countries: US, Canada, UK,
EU27 and previously covered RoW AU/NZ/CH/NO. All five saved methods are inactive
and priced0USD. This provides no live shipping or new checkout availability.
The existing General profile's observed fields, first item/count, complete
zones/provinces/methods/rate amounts and location membership compare exactly
equal before/after. No product was moved; no existing method was enabled or
disabled. Four market drafts and active market/Managed Markets settings were not
mutated by the shipping script. No cart/order/payment/email operation occurred.

Immutable `shipping-execute-1900/response.json` records the one successful
creation with no API errors; `after.json` is the actual readback. **Do not rerun
creation.** The initial local post-write assertion incorrectly expected
`zoneCountryCount:34`. The actual inactive profile reports that aggregate as0,
while all34 countries are explicitly present in its five zones. The verifier
now separately asserts the observed aggregate0, exact country membership per
named zone, inactive methods, empty associations and unchanged General fields.
`--verify-saved` reconciled the already-saved receipt without another API call
or mutation; `verified.json` records that result. No rate was activated to make
a count pass. `locationsWithoutRatesCount:1` is likewise retained, not hidden.
Folder1900 is a label, not the actual request time.

Seven local saved-receipt tests pass, including rejection of General changes,
associated variants/selling plans, active rates, a missing EU country and nonzero
prices. These tests skip explicitly when private receipts are absent; no remote
CI/app-build claim. An initial test path URL-encoding issue was fixed before
the clean seven-test run. `node --check` and diff-check pass.

**Still unfinished:** actual draft-checkout preview is unavailable in the
inspected native flow, zero-adjustment quote evidence and final screenshots are
not complete, and dormant methods do not fix the EU draft's live-rate warning.
Product assignment/rate enablement, market activation and Managed Markets-off
remain prohibited before Martin's final approval. This is not the final check
or a request to activate. The preceding local-candidate-only milestone below
is historical for this shipping profile, not authority to recreate it.

### Shipping Candidate And Preview Feasibility Follow-Up

The next read-only native check used Graph view -> View as -> Canada. It
resolved to the existing active **Non-US** market with local currencies and
collecting duties/import tax, not the Canada DRAFT. Exiting View as restored the
EU Draft selection. Its product panel shows inherited store-default products in
USD; that is not an independently verified zero-adjustment product quote.
No Add products/checkout preview control was available in this inspected view.
Shopify's [checkout-preview documentation](https://help.shopify.com/en/manual/markets/getting-started/cart-preview)
currently explicitly labels that capability **Coming soon**. Do not mistake the
active-country graph context for draft checkout acceptance or activate a market
to manufacture a preview pass. No cart or order was created in this check.

`scripts/dol284-prepare-shipping-plan.mjs` now produces the immutable local
`unassigned-shipping-candidate.json` from the retained actual shipping read.
It has no network or execute mode: five separate zones,34 unique country codes,
all27 EU countries, preserving every previously covered destination. RoW rate
scope is only AU/NZ/CH/NO, not all207 market members. The candidate adds the ten
missing EU countries, associates no variants or selling-plan groups, and marks
every proposed0USD method inactive. It has **not** been saved to Shopify and
does not provide rates to existing products. Country/province and inactive-rate
fields were checked against current2026-04 documentation; actual API acceptance
and a fresh unchanged-General guard remain required before any save. It is not
supplier delivery confirmation or checkout QA. Node syntax, local generation
assertions and diff-check pass; no app build or remote test claim.

References: [delivery profile input](https://shopify.dev/docs/api/admin-graphql/2026-04/input-objects/DeliveryProfileInput),
[country input](https://shopify.dev/docs/api/admin-graphql/2026-04/input-objects/DeliveryCountryInput),
[inactive method semantics](https://shopify.dev/docs/api/admin-graphql/2026-04/input-objects/DeliveryMethodDefinitionInput).
Final screenshots, actual draft-checkout feasibility, zero adjustment, a safely
saved unassigned candidate and final activation approval remain unfinished.
Existing active settings and all four completed market drafts are untouched.

30 October18:33:49 UTC: four new markets are saved **DRAFT**. The existing
United States market is reused unchanged; no duplicate US market was created.
Existing active United States/Non-US records compare equal before and after every
successful creation, including their regions, currencies, price inclusions and
catalog assignments. Managed Markets remains ON for active Non-US; its local FX
and rounding remain ON. No global tax, shipping, returns, privacy or payment
setting was changed and no copy was released.

| Market | Shopify Market ID | Status | Country Scope |
| --- | --- | --- | --- |
| United States |98723266744| Existing ACTIVE, unchanged | US |
| Canada |102364119224| DRAFT | CA |
| UK |102364151992| DRAFT | GB |
| EU |102364184760| DRAFT | All27 requested EU countries |
| Rest of the World |102364315832| DRAFT |207 explicit supported remaining country/region codes, including AU/NZ/CH/NO |

All four drafts explicitly use USD, local currencies OFF and rounding OFF. Their
price-inclusion strategies are included taxes/duties; this is draft pricing
configuration, not a new tax registration, collection switch or legal assurance.
Native Canada/EU pages show Draft, US Dollar, Not collecting and DollWOW as the
draft merchant of record. Their Managed Markets checkbox is unchecked; the
existing active Non-US Managed Markets setting is untouched.

Shopify rejected a region wildcard with `WILDCARD_NOT_SUPPORTED`, so RoW uses
explicit supported codes, not a workaround through another market. The first
explicit request rejected seven codes as `UNSUPPORTED_COUNTRY_REGION`:
**BV, CU, HM, IR, KP, AN, SY**. Each response says the code is not supported.
Only those exact rejected codes were excluded from the successful draft; these
are platform responses, not independent legal classifications. Unknown ZZ is
not a real destination. No EU country was rejected; all27 are saved in the draft.
Market membership does not establish product/payment/shipping eligibility.

Execution evidence is immutable under `data/exports/dol-284-2026-10-30/`:
`draft-markets-execute-1834/` owns the three completed Canada/UK/EU creations;
`row-supported-execute-1838/` owns the one RoW creation and final six-market
readback. Do not rerun completed writes. Earlier `draft-markets-execute-1831`
was rejected during oneOf variable validation before any creation; the corrected
input contains only `regions`, not both `regions` and `applicationLevel`.
`row-execute-1836` records the explicit unsupported-country responses, zero new
markets. The guarded resume read the three successful receipts instead of
recreating them. Folder labels are not asserted request timestamps.

### Existing Orders And Rates

The existing app has `read_all_orders`. A complete accessible ten-order read,
without customer/contact/address/payment details, finds one Managed Markets
order: PAID, FULFILLED, not cancelled, already not merchant-editable. No outstanding
managed fulfillment appears in this read. No order was edited, replayed, paid,
refunded or emailed; future returns/refund obligations are not declared absent.

Fresh `shipping-rate-read-1836.json` confirms one General profile, the same24
countries, one location group and an active `DeliveryRateDefinition` priced
0.00USD, not merely a free-sounding method name. This is a current manual static
rate, not post-deactivation carrier or delivery acceptance. Native EU draft
explicitly warns that10 regions lack rates and cannot check out;17 are covered.
RoW's draft207 countries likewise do not imply207-country shipping coverage.
No shipping zone/profile/rate was changed in this construction milestone.

**Unfinished:** prepare safe unassigned shipping configuration/actual preview
where supported, verify inherited prices/zero adjustment and checkout feasibility,
deliver final screenshots and obtain Martin's final preview yes before activation
or Managed Markets-off. Native EU screenshot inspected inline; no saved/uploaded
image or completed screenshot package is claimed. No post-switch checkout, Tom
draft, payment/refund or global included-price copy release occurred.

Primary platform guidance: [creating draft markets](https://help.shopify.com/en/manual/markets/getting-started/set-up-markets),
[MarketCreateInput](https://shopify.dev/docs/api/admin-graphql/2026-04/input-objects/MarketCreateInput).

Martin's 12:12 decision (`43333027-9ce6-4486-a548-050a60dd95b2`) and 12:13
EU instruction (`b47a1a8f-cc88-4709-a022-73c8a1f7d25c`) supersede the original
three-market proposal below. The plain-list preview is explicitly accepted as
the delivery format; screenshots are no longer a blocker to submitting it.
Updated preview posted at14:38 as `5f03f25a-0dd7-4cc2-93c0-0ea64c3d2527`.

| Proposed Market | Countries | Proposed Common Settings |
| --- | --- | --- |
| US | United States | USD-only display/checkout; local currencies off; rounding off; zero price adjustment |
| Canada | Canada | Same |
| UK | United Kingdom | Same |
| EU | Austria, Belgium, Bulgaria, Croatia, Cyprus, Czechia, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Ireland, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Romania, Slovakia, Slovenia, Spain, Sweden | Same; include all27 in proposed free-shipping coverage |
| Rest of the World | Remaining destinations outside those four markets, including previously covered AU/NZ/CH/NO | Same; actual country/product/shipping eligibility still applies |

EU exclusions established: **none**. BG/HR/CY/CZ/HU/LV/LT/RO/SK/SI are saved
in the new EU DRAFT, not excluded merely because absent from the old shipping
zone. Their replacement shipping rates have not been saved/tested.
Any actual Admin/provider rejection must be named with its reason, not bypassed.
No universal worldwide delivery or product clearance is inferred.

No new VAT registrations, no standalone duty/import-tax collection, proposed
included-shipping/duty/tax copy not released. Managed Markets remains on until
final preview yes and the required checks/order review. No activation, category
replay, cart, draft, order, payment or refund in this update.

The remainder records the original10:58 proposal and its evidence. Its
three-market structure and screenshot-delivery gate are historical, not current
instructions. Existing-order, currency, rate and approval cautions still apply.

## Proposed Configuration

| Setting | Current verified baseline | Proposed, not saved |
| --- | --- | --- |
| Markets | US and Non-US, both active | US / Europe / Rest of world |
| Europe | 17 EU countries plus UK, CH, NO within Non-US | EU27 plus UK, CH, NO: 30 countries, subject to shipping coverage below |
| Currency | USD base; Non-US local currencies and rounding on | USD display and checkout for every market; local currencies off, rounding off |
| Price adjustment | Not independently established in baseline | Explicitly zero; verify actual product quotes after approval |
| Managed Markets | On for Non-US, 3.5% transaction fee | Off, only after preview approval and existing-order review |
| VAT registrations | US/EU/UK UI says Not collecting | Do not add registrations; this is Martin's instruction, not a tax-liability determination |
| Duties/import tax | Standalone UI says Set up; managed pricing has duties/tax strategies | No standalone checkout duty/import-tax collection; managed treatment ends when deactivated |
| Shipping | One All zone, 24 countries, named free express method | Preserve covered destinations; inspect replacement rate amounts before enabling checkout |
| Proposed copy | No release in this work | "Includes shipping, duties and taxes" only for destinations/products whose fulfillment supports it |

USD checkout is the explicitly permitted simpler option. Shopify's native market
currency is both display and transaction currency: leaving Local currencies on
is not display-only FX. Optional EUR/GBP estimates would be separate storefront
work, clearly marked as estimates, and are not implemented or needed for this
USD-only proposal. Customer-bank conversion fees can still occur.

## Coverage Before Activation

The verified current shipping zone contains US, AT, AU, BE, CA, CH, DE, DK, EE,
ES, FI, FR, GB, GR, IE, IT, LU, MT, NL, NO, NZ, PL, PT, SE. It is not a verified
worldwide shipping zone.

Europe's requested full scope is AT, BE, BG, HR, CY, CZ, DK, EE, FI, FR, DE, GR,
HU, IE, IT, LV, LT, LU, MT, NL, PL, PT, RO, SK, SI, ES, SE, GB, CH, NO.
Ten requested EU destinations are absent from current shipping coverage:
BG, HR, CY, CZ, HU, LV, LT, RO, SK, SI. Do not silently enable them or promise
included delivery before rates and fulfillment are verified. Rest of world's
currently represented destinations are AU, CA and NZ; all other countries remain
outside verified coverage. A market name alone does not create shipping coverage.

## What Changes And What Does Not

Shopify's current deactivation documentation says Managed Markets stops acting as
merchant of record and stops its duty/import-tax calculation. Merchant tax and
regulatory responsibilities are no longer handled by that service. This describes
Shopify's service boundary, not an independent ruling on Martin's factory/agent
contract. No accountant prerequisite is reintroduced and no supplier contact is
authorized. Do not claim that "Not collecting" proves no tax liability.

Existing Managed Markets orders become uneditable after deactivation and must
still be fulfilled through Managed Markets. Review outstanding operational needs
with the owner before the approved switch; do not modify or replay orders.
Managed shipping rates disappear, and Shopify may automatically add carrier
rates if no alternatives exist. Therefore the existing free-method label is not
proof that free shipping survives the switch. Inspect actual replacement rates.

Removing Managed Markets is not a guarantee that all products become eligible:
payment-provider, country and legal restrictions still apply. Casey's five-head
category correction already restored observed country availability without this
switch. Firefly charge eligibility is a separate unresolved gate. Do not use a
benign category or another market to evade restrictions.

The intended new non-managed German draft should allow the requested custom
item and price edit, but no actual post-switch draft has been tested. Existing
managed orders do not gain editability retroactively. Payments, payout currency,
FX fees, refunds and returns handling remain to verify; no zero-fee or universal
DDP promise is made. Preserve existing returns terms pending explicit changes.

## Approval And Verification

STOP for Martin's exact preview yes covering USD-only checkout, the three-market
structure, no new VAT registrations, duty collection off and destination-qualified
included-price copy. Missing shipping destinations must not be treated as covered
by a generic yes. Do not save settings or publish copy during preparation.

After approval: inspect actual unsaved controls and any new provider/legal prompt,
apply only approved scope, verify DE Casey + Flora and GB/FR/US quotes and final
shipping/tax lines, then the specifically authorized Tom draft workflow. One real
payment/refund and payout/FX check requires the appropriate financial UI handoff.
No checkout, order, email, refund or payment was performed in this proposal run.

Actual native Managed Markets status/fee excerpt was captured and visually
inspected: On, Non-US, 3.5%. It is baseline evidence, not a picture of proposed
settings. Linear's browser remained Offline after one refresh, so screenshot
attachment delivery is unfinished; no file or attachment is claimed. The text
proposal can be reviewed, but the requested screenshot package is still owed.

## Primary Sources Read 30 October

- [Shopify deactivation](https://help.shopify.com/en/manual/international/managed-markets/deactivation): service changes, existing-order and shipping-rate effects.
- [Shopify market currencies](https://help.shopify.com/en/manual/international/payments): currency is display and transaction currency; local-currency and rounding controls.
- [EU countries](https://european-union.europa.eu/principles-countries-history/eu-countries_en) and [remaining countries](https://european-union.europa.eu/principles-countries-history/eu-countries_en?page=1): EU27 membership, not shipping or tax clearance.
