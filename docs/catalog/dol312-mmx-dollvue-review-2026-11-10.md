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

The initial five groups below describe the existing software allowlist, not an
image-model capability limit. Martin subsequently authorized broader private
preparation of every externally visible cosmetic option, MMX first. The native
sheet now separately records external visibility, software support, actual
factory/SKU offering and fidelity limits for all 20 resolved groups and all 130
labels. It also covers the two extra raw singleton groups (included body paint
and skeleton tightness) and 13 expansion/baseline categories.

Existing software appearance groups:

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

Other visible features include implanted brows/lashes, head/body makeup,
visible-vein paint, close-up skin texture, hairlines and exposed foot hardware.
An exact head sculpt is visible but changes identity and needs a dedicated
compatible-head workflow. Visibly distinct intimate attributes are recorded as
visible metadata, separately from this non-explicit generation scope. Internal
texture, softness, weight, skeletons and motion cannot be verified by a still
appearance edit. Jev suggested appearance categories for `As shown`;
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

Kelly's quote expressly lists Custom Makeup, Handmade Resin Eyes, male chest
hair and glued armpit hair. Exact styles, references, per-SKU compatibility,
retail and checkout bindings are not yet established for those extensions. None
of the current 63 snapshots is a male listing, so the male chest-hair extension
has zero demonstrated applicability to this cohort. Included brows/lashes,
factory makeup and body paint must not become invented paid or removal toggles.
The quote says full/partial realistic skin texture is mold-specific and not
customizable. Moles/freckles, belly piercing, inherited lingerie and unbound
custom-eye choices retain their sourcing/cost/mapping holds.

Martin's later explicit instruction authorizes broader private preparation;
do not repeat the old five-group approval question. Obtain exact approval of
the actual completed private preview before public release or a live visual
change. The public rendering/runtime registry remains untouched.

The configured DollVue route uses `seedream-v5-pro-edit`, then
`seedream-v5-lite-edit` and `qwen-edit-uncensored` fallbacks. Venice's
[multi-edit documentation](https://docs.venice.ai/api-reference/endpoint/image/multi-edit)
describes layered prompt-based image editing, not a five-category limit. That
does not prove any specific cosmetic edit's fidelity; no new generation was run.

## Private reproducibility

The isolated worktree is `DollWOW-dol312-mmx-dollvue`. Private inputs and outputs
are under `data/exports/dol312-mmx-nov10/`:

- `option-inventory.json`: every occurrence and deduplicated semantic case;
- `resolved-production-menus.json`: actual resolved menu and readiness result;
- `jev-option-classification.json`: actual model responses and usage;
- `reference-byte-check.json`: reference dimensions, bytes and SHA256 values;
- `review-summary.json`: reviewed recommendation and product-level coverage.
- `broad-taxonomy.json`: superseding external-visibility/software/source matrix.
- `private-cosmetic-preview-preparation.json`: exact per-product candidate
  choice/reference/SHA preparation for 60 full-doll records; it is not a generated
  or approval-ready preview and does not grant public availability.

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

## Private clothed fidelity pilot, 10 November

One actual request to the configured primary `seedream-v5-pro-edit` model edited the original clothed Monica163A photograph with exact MMX Hairstyle #12 and Regular #1 eye references. The API succeeded, but the image FAILED same-doll fidelity: unselected facial geometry/retouching drift and possible hand/body changes. It is not approval-ready and cannot support a general readiness claim. The failed output remains internal; no retry or fallback model was invoked.

The provider's published edit schemas do not expose a pixel-protection mask parameter. A bounded local mitigation instead discarded the hair edit, transferred only generated iris pigment inside manually reviewed iris masks, and retained every other decoded source pixel. The exact source and generated bytes are SHA-pinned before those source-specific coordinates can run. The lossless PNG proof records 64 changed pixels inside the iris masks and zero outside; the existing branded footer is appended beyond the original photograph. This is one working private iris-only locality probe, not an automatic masking pipeline or approval for hairstyle, makeup, head swaps, skin, or all SKUs. Factory eye-reference fidelity still requires close-up comparison; pixel preservation alone does not prove exact manufactured appearance.

The official factory eye chart and Regular #1 source were fetched and visually reviewed. The chart confirms blue Regular #1 and lists Custom #1–7; it contains no material or price text proving that Custom is the quoted handmade-resin SKU. No custom-eye price/menu change follows from finding those images.

Private evidence directory: `data/exports/dol312-mmx-nov10/pilot-monica/`. Key files: `generation-journal.json` (API success + visual FAIL), `protected-iris-locality-proof.json`, `factory-eye-reference-proof.json`, `output-iris-protected-branded.png`, and `protected-iris-face-comparison.png`. Scripts: `run-mmx-dollvue-private-pilot.mjs` journals submissions to prevent repeated billing; `protect-mmx-dollvue-iris-pilot.mjs` verifies protected pixels across the entire photograph. No production catalog, readiness registry, UI, customer usage, email, cart, or order writes were made. No public change is authorized by this internal probe.
