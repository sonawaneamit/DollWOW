# Top Fire silicone dolls: named checkout charges (2026-11-19)

**Status:** PREVIEW ONLY. Martin must approve the preview before this merges.

## Problem
Live Top Fire silicone dolls (`options:top-fire-silicone-manual-v1`) use the legacy denomination charge path.
Probed on live on 19 Nov: any paid item priced **$19** fails at `/api/cart/create` with "Custom option charge denominations do not cover this option total".
The $19 items include all vagina textures, Glued-On Pubic Hair, Extra Vagina Insert and Skin Color Sample Blocks.
Every Starter / Enthusiast / Collector preset includes Extra Vagina Insert ($19), so every tier fails.
"Buy as shown" (no charge) works.

## Fix
Register the 72 remaining live dolls of that menu as parents of the reviewed Top Fire named charge family already live for Grace 160F (`top-fire-grace-160f-nov6`).
- No new Shopify products or variants, and no environment change.
- Coverage was checked against live Storefront data: every paid option of all 73 dolls (incl. Grace) binds to exactly one released charge at the same price.

Not included (they do not use this menu and have no $19 options):
- 49 Top Fire dolls on the `generic` menu.
- 4 Top Fire headless bodies (`top-fire-headless-body-v1`).

## Parents added
| Handle | Variant |
|---|---|
| top-fire-doll-ada-158cm-d-cup-silicone-companion-doll | `54355751141560` |
| top-fire-doll-amelia-102cm-f-cup-silicone-torso | `54355750355128` |
| top-fire-doll-ann-158cm-d-cup-silicone-companion-doll | `54355751796920` |
| top-fire-doll-aria-160cm-f-cup-silicone-companion-doll | `54246480969912` |
| top-fire-doll-bella-174cm-g-cup-silicone-companion-doll | `54246479888568` |
| top-fire-doll-bess-169cm-f-cup-silicone-companion-doll | `54355749863608` |
| top-fire-doll-bid-158cm-d-cup-silicone-companion-doll | `54355751731384` |
| top-fire-doll-camille-170cm-h-cup-silicone-companion-doll | `54246484508856` |
| top-fire-doll-caroline-170cm-e-cup-silicone-companion-doll | `54246665715896` |
| top-fire-doll-casey-158cm-d-cup-silicone-companion-doll | `54246483230904` |
| top-fire-doll-chloe-170cm-e-cup-silicone-companion-doll | `54355755040952` |
| top-fire-doll-clara-170cm-e-cup-silicone-companion-doll | `54851422355640` |
| top-fire-doll-darcy-163cm-g-cup-silicone-companion-doll | `54246481035448` |
| top-fire-doll-doris-158cm-d-cup-silicone-companion-doll | `54246484443320` |
| top-fire-doll-echo-165cm-c-cup-silicone-companion-doll | `54246482280632` |
| top-fire-doll-edma-165cm-c-cup-silicone-companion-doll | `54246483001528` |
| top-fire-doll-eleanor-158cm-d-cup-silicone-companion-doll | `54246483296440` |
| top-fire-doll-esther-158cm-d-cup-silicone-companion-doll | `54355756351672` |
| top-fire-doll-eva-170cm-e-cup-silicone-companion-doll | `54246479790264` |
| top-fire-doll-fay-163cm-g-cup-silicone-companion-doll | `54246481756344` |
| top-fire-doll-felix-170cm-h-cup-silicone-companion-doll | `54246479200440` |
| top-fire-doll-finn-165cm-c-cup-silicone-companion-doll | `54246480642232` |
| top-fire-doll-flora-158cm-d-cup-silicone-companion-doll | `54355758579896` |
| top-fire-doll-geles-163cm-g-cup-silicone-companion-doll | `54246482116792` |
| top-fire-doll-grace-162cm-i-cup-silicone-companion-doll | `54355760119992` |
| top-fire-doll-hailey-170cm-e-cup-silicone-companion-doll | `54246479528120` |
| top-fire-doll-hannah-158cm-d-cup-silicone-companion-doll | `54355755106488` |
| top-fire-doll-hazel-170cm-e-cup-silicone-companion-doll | `54246479593656` |
| top-fire-doll-hedy-163cm-g-cup-silicone-companion-doll | `54246481789112` |
| top-fire-doll-ingrid-170cm-e-cup-silicone-companion-doll | `54246479626424` |
| top-fire-doll-isabella-106cm-j-cup-silicone-torso | `54355748683960` |
| top-fire-doll-isis-163cm-g-cup-silicone-companion-doll | `54246665748664` |
| top-fire-doll-ivory-165cm-c-cup-silicone-companion-doll | `54246483067064` |
| top-fire-doll-ivy-170cm-e-cup-silicone-companion-doll | `54246479134904` |
| top-fire-doll-jasmine-158cm-d-cup-silicone-companion-doll | `54246483525816` |
| top-fire-doll-jill-155cm-g-cup-silicone-companion-doll | `54246483198136` |
| top-fire-doll-jing-170cm-e-cup-silicone-companion-doll | `54246479659192` |
| top-fire-doll-kaia-163cm-g-cup-silicone-companion-doll | `54246480740536` |
| top-fire-doll-kali-164cm-b-cup-silicone-companion-doll | `54355757826232` |
| top-fire-doll-kama-163cm-g-cup-silicone-companion-doll | `54246482051256` |
| top-fire-doll-laionni-163cm-g-cup-silicone-companion-doll | `54246481821880` |
| top-fire-doll-lin-164cm-b-cup-silicone-companion-doll | `54246482182328` |
| top-fire-doll-lorna-165cm-c-cup-silicone-companion-doll | `54246480806072` |
| top-fire-doll-lucy-170cm-e-cup-silicone-companion-doll | `54246479691960` |
| top-fire-doll-lydia-158cm-d-cup-silicone-companion-doll | `54246484213944` |
| top-fire-doll-mae-170cm-e-cup-silicone-companion-doll | `54355754483896` |
| top-fire-doll-margaret-170cm-e-cup-silicone-companion-doll | `54246479757496` |
| top-fire-doll-marjorie-158cm-d-cup-silicone-companion-doll | `54355757236408` |
| top-fire-doll-max-173cm-silicone-male-companion-doll | `54251839127736` |
| top-fire-doll-megan-106cm-i-cup-silicone-torso | `54355748225208` |
| top-fire-doll-mika-165cm-c-cup-silicone-companion-doll | `54246483099832` |
| top-fire-doll-mollie-165cm-c-cup-silicone-companion-doll | `54246480707768` |
| top-fire-doll-nata-174cm-g-cup-silicone-companion-doll | `54246480609464` |
| top-fire-doll-nicole-162cm-i-cup-silicone-companion-doll | `54246484312248` |
| top-fire-doll-nina-158cm-d-cup-silicone-companion-doll | `54246483329208` |
| top-fire-doll-nova-164cm-b-cup-silicone-companion-doll | `54355758055608` |
| top-fire-doll-orion-173cm-silicone-male-companion-doll | `54251839291576` |
| top-fire-doll-phoenix-176cm-d-cup-silicone-companion-doll | `54246479823032` |
| top-fire-doll-rose-158cm-d-cup-silicone-companion-doll | `54355757138104` |
| top-fire-doll-selena-170cm-h-cup-silicone-companion-doll | `54246484574392` |
| top-fire-doll-selina-174cm-g-cup-silicone-companion-doll | `54246484607160` |
| top-fire-doll-sharon-158cm-d-cup-silicone-companion-doll | `54355755860152` |
| top-fire-doll-storm-158cm-d-cup-silicone-companion-doll | `54246483427512` |
| top-fire-doll-susan-170cm-e-cup-silicone-companion-doll | `54246479069368` |
| top-fire-doll-tessa-160cm-f-cup-silicone-companion-doll | `54851422388408` |
| top-fire-doll-venus-170cm-e-cup-silicone-companion-doll | `54246479036600` |
| top-fire-doll-victoria-164cm-b-cup-silicone-companion-doll | `54246482215096` |
| top-fire-doll-violet-174cm-g-cup-silicone-companion-doll | `54246480871608` |
| top-fire-doll-wendy-170cm-h-cup-silicone-companion-doll | `54355759268024` |
| top-fire-doll-willa-176cm-d-cup-silicone-companion-doll | `54246480904376` |
| top-fire-doll-yilia-162cm-i-cup-silicone-companion-doll | `54246484410552` |
| top-fire-doll-yuki-163cm-g-cup-silicone-companion-doll | `54355759169720` |
