# DOL-306 Credit Pack Preparation

Partial preview, not a released or complete paid-credit system.

## Verified Cost

Authenticated read-only GET https://api.venice.ai/api/v1/models?type=inpaint
at2026-10-29T09:26:48.262Z returned200. Primary Seedream V5 Pro Edit2K USD0.11
plus USD0.00345 per input after the first. Current source plus one/two choice
references yields USD0.11345-0.11690 per successful primary attempt. Lite lists
USD0.05; Qwen USD0.04. No generation was placed.

| Proposal | Primary compute cost | Compute-only margin | All-three-attempt reserve |
| --- | ---: | ---: | ---: |
| $5 /5 | $0.5845 |88.31% | $1.0345 |
| $10 /12 | $1.4028 |85.97% | $2.4828 |
| $25 /30 | $3.5070 |85.97% | $6.2070 |

These are not net margins. Payment fees, email/hosting, taxes, refunds and retries
are excluded. The all-three reserve assumes all fallbacks bill, which is not
established. Do not replace actual2K pricing with the headline USD0.06 rate.
Primary reference: https://docs.venice.ai/api-reference/endpoint/models/list .

## Shopify Draft Receipt

Fresh duplicate search returned zero candidates. Only the explicitly requested
$5/5 draft was created29Oct09:31UTC and read back:

- Product10690909143224, variant54582404743352.
- Handle dollvue-extra-preview-pack-5; DRAFT, USD5.00, custom.dollvue_credits=5.
- requiresShipping=false, tracked=false, inventoryPolicy=CONTINUE.
- Taxable remains true/default; no tax-exemption decision made. No shipping item.
- Tags dollwow-system,dollwow-dollvue-credit-pack,draft-review.
- Resource publications empty; no Copilot/Meta/other channel publication.
- Exactly two draft mutations; zero publications, checkout or orders.

Zero current publications is not proof of a permanent channel-exclusion policy.
Martin's newest correction approves $10/12 and $25/30, superseding35. No35-credit
product was created. Preserve the existing5-pack draft; never repeat its creation.

The two additionally approved drafts were created/read back09:36UTC:
-12/$10: product10690930016440, variant54582430269624.
-30/$25: product10690930081976, variant54582430367928.
Both DRAFT, no shipping or inventory tracking, default taxabletrue retained and
resourcePublications empty. Four additional draft mutations, zero publications.

Server-only creditPacks.ts binds the three exact product/variant IDs to5,12,30.
Its paid-order parser rejects test/unpaid/cancelled orders, wrong currency,
identity/price mismatch, discounts pending commercial review, insufficient total,
duplicate line IDs and invalid quantities. Buyer-supplied credit properties are
ignored. This is an input validation foundation, NOT signature verification or
durable fulfilment by itself. No credits are issued by this module.

## Not Yet Delivered

Current allowance is five successful lifetime generations per email HMAC in
ai_usage_events, with separate process-local25/day global and6/10min IP controls.
Approved hello exemption is already live; paid credits are not yet consulted.

The existing order analytics webhook returns410 and must NOT be revived as an
analytics purchase emitter. Paid-credit fulfilment needs a separate signature-
verified subscription and product/variant allowlist, durable order-line unique
keys, payment/refund handling and atomic balance reservation/commit/release.
Browser flags, cart attributes and unsigned callbacks must never issue credits.
No webhook registration, database migration, credit write or purchase replay has
been performed. Refund/expiry commercial policies must not be silently invented.

The private review route /review/dollvue-credit-packs is a visual proposal of the
exhausted-allowance offer only. Checkout buttons are disabled, proposed quantities
are labelled, and production returns404/noindex. It is NOT wired into the live
gate, generation path, cart, payment or buyer-confirmation email.

Original DOL-306 stays open until all acceptance criteria are implemented and
verified. Never mark this partial draft In Review/Done as completed fulfilment.
