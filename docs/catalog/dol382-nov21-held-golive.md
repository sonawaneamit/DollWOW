# DOL-382: held items go-live (21 Nov 2026, second release)

Approval: after the first release (PR #281), the owner confirmed that Martin's approval covers all of the Nov 19
previews and all of the FU dolls, and that his standing rule is not to wait on small blockers. Wording on FU pages
stays "approved, certificate pending".

## Luo Chengchuan: 9-ending tiers

The male Starter recipe drops the $25 Reusable Drying Rod (no combination of Luo's option prices gives a 9-ending
Starter while the rod stays in). Starter is now "Body painting and articulated fingers." Enthusiast and Collector
are unchanged.

| Product | Base | Before | After |
|---|---|---|---|
| FU Doll Luo Chengchuan 176cm male (10745005801656) | $2,299 | $2,324 / $2,424 / $2,624 | $2,299 / $2,399 / $2,599 |

## Older FU drafts brought up to the White Peach standard

Same FU options menu (`options:fu-silicone-body-mvp-v1`, the White Peach menu; Tifa and Ziqing had an older menu,
replaced with the standard one and backed up off-repo), same three-tier recipe and charge family
(`fudoll-female-silicone-044e91b62c4d`, `fudoll-silicone-nov21`), hand-written editorial, full photo sets.

| Product | Shopify ID | Base | Starter / Enthusiast / Collector | FU sheet cost (incl. US freight) | Margin on base | Photos |
|---|---|---|---|---|---|---|
| FU Doll Anna 162cm F | 10638363754680 | $2,099 | $2,159 / $2,259 / $2,459 | $1,352 | 35.6% | 27 |
| FU Doll Tifa 162cm F | 10638363852984 | $2,099 | $2,159 / $2,259 / $2,459 | $1,352 | 35.6% | 26 |
| FU Doll Lisa 157cm G, skin texture | 10638363951288 | $2,199 | $2,259 / $2,359 / $2,559 | $1,444 | 34.3% | 27 |
| FU Doll Ziqing 165cm F | 10638364049592 | $2,099 | $2,159 / $2,259 / $2,459 | $1,338 | 36.3% | 27 |

- Lisa 157 is confirmed RST ("Realistic Skin Texture Upgraded") on fu-doll.com. The FU sheet has no 157-only row; it
  is priced from the 152-157 RST row. Competitor check: YourDoll about $2,599, Rosemary about $2,391, fu-doll.com
  retail $2,299.
- Photos: Lisa uses FU's official set from fu-doll.com. Anna, Tifa and Ziqing are not listed on fu-doll.com, so their
  sets come from the FU distributor gallery (Rosemary), deduplicated by perceptual hash. Three Tifa prop photos were
  left out.

## Climax ULW torsos and Si60 X mini

Built like the live Renata torsos: fixed configuration (`options:climax-ulw885-torso-v1` style, no tiers), editorial
section, full photo sets. Not in the template registry (same as Renata). Prices follow the Renata rule (MAP / 0.85,
rounded to 9, never under MAP), landed cost uses Climax sheet cost plus estimated US freight at $13.6/kg gross.

| Product | Shopify ID | Price | MAP | Est. landed cost | Margin |
|---|---|---|---|---|---|
| Climax Mabel + Head 103cm I (ULW 886) | 10745003245752 | $1,179 | $999 | ~$776 | ~34.2% |
| Climax Mabel 83cm I torso without head | 10745004032184 | $1,059 | $899 | ~$674 | ~36.4% |
| Climax Midori + Head 94cm I (ULW 774) | 10745004392632 | $1,999 | $1,699 | ~$1,314 | ~34.3% |
| Climax Midori 74cm I torso without head | 10745004818616 | $1,879 | $1,599 | ~$1,212 | ~35.5% |
| Climax Horty 60cm Si60 X mini | 10745004949688 | $459 | $455 | ~$240 | ~47.7% |

Horty is priced from the Climax sheet row labelled "Hani" (Si60cm X, 1.9 kg, 7.9 cm upper arm), which matches her
specs and photos; Climax's BFCM PDF names the same doll "Si60 X Horty".

## Repo changes

- `data/draft-previews/dol382-new-dolls-recipes-nov19.json`: male Starter recipe change; the four FU drafts added
  to the female recipe.
- `scripts/register-dol382-nov21-golive.mts`: four FU products added, recipe changes logged instead of rejected,
  new release ids `template-release-2026-11-21b-dol382-held-golive` / `named-upgrades-2026-11-21b-dol382-held-golive`.
- Registry, named charges and fixtures regenerated from the Admin readback; `tests/dol382-nov21-golive.test.ts`
  covers all nine registered products.
- `data/draft-previews/dol382-new-dolls-nov19.json`: preview snapshot refreshed for the nine held drafts.
