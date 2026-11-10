# MMX and Fanreal: private DollVue eye-color review

This checkpoint follows Martin's instruction to prepare both brands, with all
externally visible cosmetic options in scope. It is an initial eye-color batch,
not a claim that the full cosmetic rollout is ready. The existing product pages,
sales availability and public DollVue registry are unchanged. DOL-312 and DOL-50
retain exact visual-preview approval before production activation.

## What is ready to review

- Fresh strict Storefront and Admin reads cover 63 MMX and 82 Fanreal products.
  This includes all 137 factory full dolls and eight torsos or ready-to-ship
  listings outside the current preview scope. All 145 current image holds were
  clear. Existing eligibility records did not pass for this exact current cohort.
- 57 MMX and 71 Fanreal original portrait crops have reviewed iris regions.
  The first 118 passed offline. Ten selected alternatives replaced unsuitable
  cover photos. The final 128 all pass lossless outside-region equality. Full
  source photos, raw model results and landmark contacts remain in ignored
  `data/exports/dol312-both-brands-nov10`, never in the hosted payload.
- 18 exact supplier swatch palettes were sampled from owned assets. The preview
  simulates pigment under the original lighting, not glass material, texture
  or multicolor pattern. Fanreal E11, E12 and E13 remain out of this color-only
  batch. Seven full dolls lack a supported, pinned iris option; two need a better
  source photo. Eight torso/RTS exclusions are separate and remain excluded.
- Raw iris-only Seedream tests on clothed Monica and Kelly both altered unselected
  details. Do not publish either raw output or replay those API calls. The new
  protected renderer uses actual reviewed portrait pixels and supplier pigment;
  it does not call a generation provider or redraw any part of the face.

## Shared work and remaining scope

- The DollVue routes use the same Admin identity enrichment as the product page
  for MMX and Fanreal. A strict Storefront lookup still comes first. Fanreal's
  `Eyes`, `Skin` and `Nail` labels now classify correctly. Default wig style
  visibility only accepts the existing `wig-cover` branch; it never silently
  selects a paid implant option.
- The external option inventory is wider than the current runtime. Hair styles,
  skin, nails, makeup, visible finishes, brows/lashes, head sculpts, piercings and
  sourced accessories need their own reference and fidelity checks. Internal
  functions are not visual options. Visible intimate features are tracked apart
  from this non-explicit preview. No held or unpriced option was turned into an
  orderable choice. DOL-311's live skin-reference issue remains separate.
- `/review/dollvue` and its renderer require both the preview environment and
  `DOLLWOW_DOL312_PREVIEW=1`. They use the existing DollVue design, with a private
  test state. Exact menu fingerprints and current image holds are checked before
  each render. No usage, email, analytics or cart actions run from this review.
  The standard public route and readiness registry are not enabled by it.

The build and browser review evidence is stored alongside the source audit. Do
not promote a private candidate by copying its fingerprint into public readiness.
Use the approved subset and verified source/renderer binding at each point of use.
