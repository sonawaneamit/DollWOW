# DOL-257 Seven Retail Prices Live

## Approval And Deployment

Martin's 28 October12:45 approval310e895d covers the exact PR193 price list.
Production binding PR204 source `820761811a9889954144365a68f87ab50ae01f8d`
merged as `fbdae7053f08a1df03107cc8b9f8a0f1e99d26d7`.
Production `dpl_GRMbTXdss5MuL4S1jdjNgRhL9HvC` was READY15:31:38UTC;
the custom domain was independently confirmed on that exact deployment.
The old read-only price overlay was not promoted.

The seven-price batch completed **28 October2026 15:36:21.365UTC**.

| Listing | Variant suffix | Before USD | Live USD |
| --- | --- | ---: | ---: |
| US165C body | 54335385534648 | 1653 | 2065 |
| US170H body | 54335377080504 | 1686 | 2065 |
| US170H body with hip rotation | 54335377408184 | 1808 | 2399 |
| US176D body with hip rotation | 54335385600184 | 1926 | 2399 |
| Amelia102F torso | 54355750355128 | 1045 | 1299 |
| Isabella106J torso | 54355748683960 | 1045 | 1299 |
| Megan106I torso | 54355748225208 | 1045 | 1299 |

## Safety And Verification

Global and immediate per-product Admin preflights verified exact IDs/SKUs,
single variants, ACTIVE status and before-prices. Only ID/retail price entered
mutations; all compare-at values remain null. Independent Admin comparison
also verifies unchanged cost fields, tags, vendor and status on these
seven records. No made-to-order, option, promotion, publication or cost write.

Four existing preset runtime approvals are preserved through an exact
before/after hash bridge; three absent torso recipes stay absent. No approval
payload re-stamp, display price override or blanket menu exception. Actual
runtime positives, money-format equivalents and identity/tag/variant/currency/
menu negatives pass.62 focused tests across7 files, full local typecheck,
scoped lint/diff and clean hosted build/4950-asset gates pass.

An initial execute attempt and subsequent dry-run stopped on non-JSON HTML
from the configured API alias, before any write journal/mutation. An OAuth
read also demonstrated intermittent responses; no permanent API outage or
security-challenge diagnosis is inferred. The already authenticated permanent
shop hostname passed exact7 read-only preflight. A per-process host selection
then used normal existing authentication, not a store/project/credential setting
change. One successful exclusive journal acknowledges7 writes; no partial or
uncertain mutation was retried. The premature first post-readback test failed
only because the absent write journal correctly prevented verification.

Independent post-write Admin and Storefront reads pass all7 exact prices and
four recipes/three absences. Fourteen live browser cases cover each PDP at
1319px desktop and390px mobile, no document overflow. Seven live source reads
verify HTTP200, self-canonical/current price and no noindex. Screenshots of
every live PDP and a separate head-total proof are retained privately.
Required US head choice remains separately charged459USD:165C2065 plus
T72Storm459 equals2524. Cart becomes available only after selecting the head;
no cart/order was created and no checkout delivery claim is made.

All7 genuine current product notification fingerprints/canonical URLs are
submitted, independently read at15:36:42.170UTC. Upstream acceptance is200/202,
not indexing proof; individual status bodies were not retained. No extra
operator IndexNow batch, Google request, purchase replay or test order.

## Measurement And Remaining Work

Seven append-only events take DOL224's ledger4196 to4203 with all prior bytes/
values preserved. Baseline explicitly reuses the13:43 capture before release,
29 September-26 October28complete final dates: one returned GSC page row and
two GA4 production landing rows. Missing rows are unknown, not zero; GSC
Pacific and GA4 NewYork dates, consent and overlapping releases limit inference.
No ranking, causal revenue, profit or historical paid-order reconciliation claim.
Reviews25November/23December/20January15:36:21.365UTC; nextMonday2November.

**Whole DOL257 is not resolved:** Greenback's new accessible v3 sheet retains
the seven approved retail values but its additional raises are proposal only.
Four US body-only shipping-inclusive costs are reconciled and await the exact
Martin cost-update decision posted on Linear. Three torso costs still assume
shipping and remain held for a real quote from Greenback/Dolly. The old913-row
cost sheet is inaccessible; no bulk cost load is inferred or performed.

Private evidence: `/Volumes/Extreme Pro/Projects/DollWOW-dol257-topfire-prices/data/exports/dol-257-2026-10-28/`.
Current journal and checkpoint are authoritative before any future retry.
Retail release handed to Dolly for independent visual review; never self-closed.
