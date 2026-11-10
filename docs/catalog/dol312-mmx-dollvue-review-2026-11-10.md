# MMX DollVue option review

10 November 2026. Classification only. No product, catalog, price, source menu,
readiness registry, live interface, cart, email or image-generation change.

Native review sheet:
https://docs.google.com/spreadsheets/d/1HsCMcdovaqRHhajtSHBhACm5Q7Jx1GPhEMZLU2389v4/edit

DOL-312 receipt: `9898f3be-2877-489e-9193-44bd9164748f`.
DOL-261 cross-reference: `2ba1af1a-d5ac-4722-bc00-994490b555a8`.

## Coverage and recommendation

The final MMX launch snapshot contains 63 public listings and 7,378 resolved
option occurrences. There are 20 option groups and 130 unique group/choice
labels. The two retired duplicate MengTing parents are not in this population.
These are listing counts, not unique physical product families.

Jev was called through the configured Typesafe connection in seven successful
batches. Requested `jev-latest`; returned `jev-1.14.0`. Usage: 51,813 input and
13,217 output tokens. The response did not report billed USD cost.

Recommended appearance groups for Martin's review:

| Group | Specific reference choices | Preparation needed |
| --- | ---: | --- |
| Skin Tone | 5 | Review skin-only samples and resolve DOL-311 before skin rollout. |
| Hairstyle | 25 | Verify exact supplier wig references and preserve the original face/outfit. |
| Eye Color | 5 | Rebind iris references against current menus and source photographs. |
| Nail Color | 7 | Preserve original nail geometry; check French tips and color transfer. |
| Toe Nail Color | 3 | Use source photographs with visible feet and preserve toe/nail geometry. |

All 45 reference files decode and have SHA256 bindings. Codex reviewed their
contact sheets. The five skin references contain nude torsos, so reviewed
skin-only references should be prepared for the non-explicit appearance path.
This review does not establish supplier-reference equivalence or generated
output fidelity. No images were generated.

Functional upgrades, softness/construction, implanted-hair installation,
replacement/extra heads, accessories and intimate anatomy remain outside the
current preview scope. Jev suggested appearance categories for `As shown`;
the deterministic no-change rule overrides those suggestions. Head-code
uncertainty does not authorize replacing the doll's identity.

## Readiness is separate

Evaluating the final launch snapshots with the current code finds:

- 11 old records with stale review fingerprints;
- 49 products without a review record;
- 3 excluded torsos;
- 0 passing current readiness records.

Do not overwrite old fingerprints to bypass review. Suitable source photographs,
current hold checks, exact option references, compatibility, byte bindings and
representative generated-output review still need verification. DollVue
readiness does not add a sales hold to the completed MMX launch.

DOL-312 requires Martin to review the classification sheet before building.
After classification approval, prepare the supported private scope, show an
actual preview, and obtain exact preview approval before public release. This
also respects Martin's standing instruction against unapproved visual changes.

## Private reproducibility

The isolated worktree is `DollWOW-dol312-mmx-dollvue`. Private inputs and outputs
are under `data/exports/dol312-mmx-nov10/`:

- `option-inventory.json`: every occurrence and deduplicated semantic case;
- `resolved-production-menus.json`: actual resolved menu and readiness result;
- `jev-option-classification.json`: actual model responses and usage;
- `reference-byte-check.json`: reference dimensions, bytes and SHA256 values;
- `review-summary.json`: reviewed recommendation and product-level coverage.

`scripts/audit-mmx-dollvue-options.mjs` consumes the final Storefront snapshot
and imports the actual configuration/readiness implementation. The Jev runner
accepts an existing credential-file path as an argument, does not print keys,
and resumes completed cases from its saved report. `check-mmx-dollvue-references`
only decodes/hashes existing local assets and builds private contact sheets.
`prepare-mmx-dollvue-review` assembles the reviewed classification evidence.

The native sheet was imported from an Artifact Tool workbook and all four tabs
were visually verified in Google Sheets. Native table ranges, filters, frozen
headers and dropdown column metadata were independently read back. No settings
or permissions were changed for the existing website or live catalog.
