import fs from 'node:fs/promises';
const root='data/exports/dol312-mmx-nov10';
const original=JSON.parse(await fs.readFile(`${root}/review-summary.json`));
// Separate observable appearance from today's intentionally narrow software policy.
// None of these semantic judgments establishes generation fidelity or purchasability.
const broad={
 'Skin Tone':['Yes','Retained color choices; exact per-PDP scope applies.','Color rendition needs reference and lighting review.'],
 'Hairstyle':['Yes','Retained 25 wig-look references; exact per-PDP scope applies.','Preserve head identity and transfer only selected visible hair.'],
 'Eye Color':['Yes','Retained five iris references; custom resin eyes separate.','Small irises need a sufficiently close source image.'],
 'Nail Color':['Yes','Retained seven hand-nail references.','Preserve geometry unless factory option explicitly changes it. French tips need pattern fidelity.'],
 'Toe Nail Color':['Yes','Retained three toe-nail references on applicable products.','Feet must be visible and large enough; preserve toe and nail geometry.'],
 'Head':['Yes, different sculpt','Named replacement heads present with product conditions.','An identity change needs a dedicated exact-head workflow; general edits do not prove sculpt accuracy.'],
 'Head Type':['Partly','Hard silicone / ROS choices are model- and head-dependent.','A visible mouth opening can be illustrated. A still image cannot verify ROS motion or material feel.'],
 'Hair finish':['Partly, hairline','Factory wig / implanted service depends on series and model.','A visible hairline or rooting can differ. A normal portrait does not prove construction or human/synthetic material.'],
 'Breast Options':['No reliable still difference','Gel / solid choices are in retained configuration.','Touch and compressibility are not an appearance claim. Do not invent a changed shape.'],
 'Nipple Color':['Yes, intimate appearance','Retained appearance choices under exact product scope.','Outside the current non-explicit preview scope; not a claim of model incapability.'],
 'Areola Size':['Yes, intimate appearance','Retained size choices under exact product scope.','Anatomical sizing is outside this non-explicit preview; exact size cannot be proven from arbitrary perspective.'],
 'Vagina Hair Type':['Yes, intimate appearance','Retained intimate hair choices under exact product scope.','Outside this non-explicit preview scope; not an AI-model limitation claim.'],
 'Vagina Color':['Yes, intimate appearance','Retained intimate color choices under exact product scope.','Outside this non-explicit preview scope; not an AI-model limitation claim.'],
 'Vagina':['Possibly, join/seam','Fixed / removable selection is retained.','A visible insert join may differ, but mechanism and internal construction are not verified by an edit.'],
 'Vaginal Texture':['No, internal','Canal-texture choices; factory mold restrictions remain.','Internal texture is not an externally visible cosmetic edit. Use factual diagrams separately.'],
 'Anal Texture':['No, internal','Canal-texture choices; factory mold restrictions remain.','Internal texture is not an externally visible cosmetic edit. Use factual diagrams separately.'],
 'Standing Add-On':['Partly, exposed hardware','Non-standing / standing / bolt-free choices retained where supported.','Exposed soles/bolts can be shown if actually visible. An image cannot prove standing ability.'],
 'Skeleton Type Add-On':['No direct surface change','EVO / regular structural choices retained where supported.','A still image cannot verify internal skeleton, strength or range of motion.'],
 'Premium Head & Body Options (Multiple)':['Mixed: brows / lashes visible','Included implanted brows/lashes; other choices are joint/softness/weight features.','Specific brow/lash looks are cosmetic candidates. Joints, softness and weight are not appearance claims.'],
 'Accessories':['No change to parent appearance','Current group retains an extra insert purchase.','A separate accessory can be photographed separately. Do not invent a change to the parent doll.']
};
if(Object.keys(broad).length!==20)throw Error('The 20-group reconciliation must remain complete');
const groups=original.groups.map(g=>({...g,visibleInPrinciple:broad[g.group][0],factoryScope:broad[g.group][1],accuracyLimit:broad[g.group][2],
 next:g.canShow==='Yes'?g.next:g.group==='Head'?'Prepare exact compatible-head evidence and a dedicated identity-preserving private workflow.':
 g.group==='Hair finish'?'Review visible hairline/rooting references; do not claim an image proves implantation.':
 g.group==='Standing Add-On'?'Review exposed soles/bolts only when present in an appropriate source; do not simulate standing capability.':
 g.group==='Premium Head & Body Options (Multiple)'?'Preserve included brows/lashes. Source real cosmetic alternatives before adding a new choice.':
 /Nipple|Areola|Vagina Hair|Vagina Color/.test(g.group)?'Record as externally visible metadata, separate from this non-explicit generation scope.':
 g.group==='Head Type'?'Separate visible mouth presentation from ROS motion and material feel; no unverified effect.':
 'Preserve factual configurator choice; do not invent an external cosmetic effect.',
 currentSoftwareCandidate:g.canShow,
 currentReason:g.canShow==='Yes'?'Allowed semantic category under appearance-v1. Product readiness still does not pass.':
   'Not supported by the current appearance-v1 policy. This does not establish an image-model limitation.'}));
const expansion=[
 ['Custom facial makeup','Quoted option','Kelly:74EXW /100MAP','Yes','No current selectable styles bound','Verify customer/supplier reference, approved retail and exact named charge.','Do not invent lipstick or makeup styles from a generic quote.'],
 ['Implanted eyebrows and eyelashes','Retained Premium group and factory inclusion','Standard and Ultra configuration','Yes','Current classifier excludes this mixed group','Show exact supplied finish; add a change choice only if a real factory alternative exists.','Included feature is not permission to add a remove-brows toggle.'],
 ['Head / body paint and visible veins','Stored singleton Makeup Options plus factory inclusion','Standard body/head makeup; Ultra veins','Yes','Included feature, not a retained selectable alternative','Preserve actual finish. Seek exact reference for a genuine supported alternate cosmetic finish.','Do not invent optional painting levels.'],
 ['Realistic skin texture','Factory fixed specification','Full or partial by mold; quote says NOT customizable','Yes, in close-up','No supported customer texture choice','Show actual model texture with real photos; no invented texture selector.','Small pores/texture are particularly hard to reproduce accurately.'],
 ['Handmade resin eye designs','Quoted option; inherited choices hidden','Kelly:44EXW /56MAP','Yes','Custom #1–7 not bound to exact quoted eye variants','Map each actual design to supplier identity, reviewed image, retail and named charge.','Not every inherited custom-eye picture is proven factory supported.'],
 ['Male chest hair','Quoted male option','Kelly:44EXW /56MAP','Yes, when exposed','Not in current retained selectable menu','Prepare exact male-product compatibility and non-sexual reference before adding.','Do not apply to all products or infer density/pattern from a generic label.'],
 ['Armpit hair','Quoted option','Kelly specifies glued-on;44EXW /56MAP','Yes, when exposed','Not in current retained selectable menu','Verify supported products, exact reference, retail and fulfillment.','A source with covered armpits cannot show the effect.'],
 ['Moles and freckles','Inherited choice hidden','No confirmed cost/minimum in reviewed quote','Yes','Not purchasable under present source evidence','Keep purchase hold; confirm exact factory offering, location/style, cost and reference.','Do not relabel an unquoted inherited choice as an approved option.'],
 ['Belly piercing','Inherited accessory hidden','No MMX-specific sourcing/fulfillment/cost match','Yes','Not purchasable under present source evidence','Keep purchase hold; verify real accessory and placement.','Styling-only preview, if later offered, must not claim it is included.'],
 ['Clothing / lingerie','Inherited retail extras hidden','No MMX-specific sourcing/fulfillment/cost match','Yes','Not an approved MMX purchase add-on','Use only sourced orderable outfits or explicitly labeled styling-only looks.','Outfit fit and body proportions must be preserved; no clothing inclusion claim.'],
 ['Lip color / eyeliner / facial styles','Broader cosmetic category','Custom makeup quoted, specific palette not established','Yes','No exact current MMX choice list','Source exact factory styles under custom makeup rather than inventing a palette.','Model ability to draw a style does not mean the factory sells it.'],
 ['Jewelry and external accessories','Broader category','Beyond held belly piercing, no exact MMX offering established','Yes','No exact current MMX purchase choices','Validate each real option or clearly label styling-only treatment.','Do not convert decor into a purchased product promise.'],
 ['Skeleton Tightness','Stored singleton group','Regular only in final raw menu','No direct surface effect','No alternate retained selection','Keep in factual specifications, not cosmetic preview.','A pose does not prove joint tension.']
];
const details=original.details.map(r=>({...r,visibleInPrinciple:/^As shown$|^None$|^No extra insert$|^No additional body upgrade$/.test(r.option)?'No edit requested':
 r.option==='Implanted Eyebrows & Eyelashes (FREE)'?'Yes, external cosmetic finish':
 r.group==='Premium Head & Body Options (Multiple)'?'No direct cosmetic change':broad[r.group][0],
 distinction:r.canShow==='Yes'?'Current software candidate; exact source/readiness not approved.':
 r.option==='Implanted Eyebrows & Eyelashes (FREE)'?'External cosmetic feature missed by the initial mixed-group policy. Included finish is not an alternate selectable look.':broad[r.group][2]}));
const result={at:new Date().toISOString(),supersedes:'Five-group-only interpretation of initial review',
 standingRule:'Assess all externally visible cosmetic factory options for DollVue across brands. Model ability, software support, actual per-SKU offering and fidelity are separate checks. MMX first. No live visual change before exact preview approval.',
 groups,details,expansion,
 sourceCounts:{resolvedGroups:20,uniqueRetainedLabels:130,rawStoredGroups:22,extraStoredSingletonGroups:['Makeup Options','Skeleton Tightness'],
  source:'Final 63-product launch snapshots and Kelly quotation saved in quote-pages5-7.txt'},
 modelEvidence:{configuredPrimary:'seedream-v5-pro-edit',fallbacks:['seedream-v5-lite-edit','qwen-edit-uncensored'],
  endpoint:'https://docs.venice.ai/api-reference/endpoint/image/multi-edit',
  conclusion:'Multi-image prompt-based editing is not documented as limited to the five DollVue categories. Per-option accuracy still needs actual tests.',
  generatedTests:0},productionWrites:0};
await fs.writeFile(`${root}/broad-taxonomy.json`,JSON.stringify(result,null,2));
console.log(JSON.stringify({groups:groups.length,labels:details.length,expansionRows:expansion.length}));
