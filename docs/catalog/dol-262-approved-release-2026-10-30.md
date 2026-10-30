# Firefly Approved Release: QA Gates Open

Martin approved the exact private preview `doll-89fbcui4c` in Linear comment
`0ab96642-8c91-4afe-a6c6-5cd843bccda5` at 09:48 UTC on 30 October 2026.
Publication is authorized, but is **not complete**. No runtime merge or deployment
has taken place in this release attempt. Original PR225 remains private proof.

## Approved Corrections

- 164 Normal: 30 kg, 66.14 lb and USD 2,600.
- 165 MAX: 34 kg, 74.96 lb and 65B.
- June prices remain the authority until the expected 10 November update.
- No authorized-dealer wording or certificate claim is added by this release.

Corrections were applied to the existing records and read back. Existing product
and variant identities, menus and media were preserved except the explicitly
corrected body/cup identity fields and weight tags. No new products or uploads.

## Current-Main Preparation

Worktree: `/Volumes/Extreme Pro/Projects/DollWOW-dol262-firefly`.
Branch: `codex/dol262-approved-release`, based on freshly fetched
`7a2073aa8ea7fa092ffa8b1119901d75a907d264`.
The original preview branch at `78011f30` is preserved. Local main was untouched.
The implementation adds only the Firefly brand registry entry and exact-four-ID
historical loose-joint/standing compatibility rules. Production template and named
charge registries are **not changed**; generated candidates remain unsigned.

## Actual Diagnostics

The four parents were temporarily ACTIVE with `dollwow-test` exclusion. The 27
required existing Firefly charge products were temporarily activated; two shared
active charges were unchanged and five unused charge products remained draft.

The market query checked all 33 required variants in US, DE, GB and FR contexts.
US: all 33 available in USD. DE, GB and FR: 26 charge variants unavailable in each;
remaining localized merchandise uses EUR or GBP. The underlying restriction cause
was not established. No Markets, category, currency, duties or tax settings changed.

59 configuration cases were tested: four defaults, twelve presets, and 43 paid
choices across conditional branches on the representative 160 MAX. Actual Shopify
merchandise and nested cart lines were checked using the existing shared executor.
The server parent lookup used the corrected intended runtime snapshot, because
normal production lookup deliberately excludes staged test products. This is not
a deployed-server or browser checkout acceptance claim.

51 cases passed; eight failed closed before cart creation because the existing
server does not support removal semantics for dependent paid options. These cover
implanted hair and paid extra-head branches. Do not bypass the guard, silently
remove menu choices, or sign release approvals to conceal this gap.

The four default prices are USD 2,850 / 2,600 / 2,950 / 2,950; all three presets on
each product passed, adding USD 0 / 150 / 300. No purchase, payment, order, email,
customer/supplier contact or shipping-rate assertion was made. Shipping remains
unverified; 21-30 business days is production time, not US transit proof.

## Evidence And Next Work

Private evidence is under `data/exports/dol-262-2026-10-30/`: immutable before
snapshots, corrected readback, market preflight, incremental cart diagnostics and
staging restore receipts. Do not repeat staging/carts simply to refresh a receipt.
Restoring the exact staging scope to draft preserves the approved corrections.

Resolve dependent paid-option removal with focused tests, then verify the exact
supported-market eligibility through the separately gated DOL284 work. Do not
activate its settings plan without the requested preview yes. Only after the real
gates pass should registries be signed and a scoped current-main release deployed.
Preserve all 97 source holds. Do not merge the old preview stack.

Initial diagnostic query used the wrong binding ID field and failed before cart
creation; it was corrected before the recorded 59-case run. Full TSC currently
fails for missing qrcode/fontkit/jsqr dependencies in the reused local runtime;
no repository-wide compiler-green or configured-build claim is made here.
