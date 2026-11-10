import fs from 'node:fs/promises';
const root='data/exports/dol312-mmx-nov10';
const inv=JSON.parse(await fs.readFile(`${root}/option-inventory.json`));
const broad=JSON.parse(await fs.readFile(`${root}/broad-taxonomy.json`));
const products=JSON.parse(await fs.readFile(`${root}/resolved-production-menus.json`));
const refs=JSON.parse(await fs.readFile(`${root}/reference-byte-check.json`));
const records=products.map(p=>{
 const rows=inv.rows.filter(r=>r.productId===p.productId);
 const torso=/torso/.test(p.handle);
 return {productId:p.productId,handle:p.handle,title:p.title,scope:torso?'excluded-torso':'private-cosmetic-preparation',
  currentReadiness:p.snapshotReadiness.reason,
  existingImageChoices:torso?[]:rows.filter(r=>r.decision.status==='candidate').map(r=>({groupId:r.groupId,optionId:r.optionId,
    group:r.group,label:r.option,reference:r.reference,sha256:refs.references.find(x=>x.reference===r.reference)?.sha256,
    status:'requires-exact-source-and-fidelity-review'})),
  includedBrowLashBaseline:rows.some(r=>/Implanted Eyebrows/.test(r.option)),
  additionalStyleControls:[],
  unresolved:['Suitable current single-subject non-explicit source photo','Current Admin content-hold readback',
    'Factory-equivalent references and compatibility','Current photo/menu fingerprint binding','Representative generated-output fidelity']};
});
const packet={at:new Date().toISOString(),status:'PRIVATE_PREPARATION_NOT_GENERATED_PREVIEW',
 ownerScope:'All externally visible cosmetics; MMX first. Existing design only, exact actual-preview approval before live changes.',
 source:'Final 63-product MMX launch snapshot and Kelly quote. No fresh catalog write.',
 model:{configuredPrimary:'seedream-v5-pro-edit',fallbacks:['seedream-v5-lite-edit','qwen-edit-uncensored'],
  resolution:'2K',maxCurrentSelections:2,apiCalls:0},
 existingSemanticGroups:5,referenceChoices:45,products:records,
 verifiedQuoteExtensions:[
  {feature:'Custom Makeup',exwUSD:74,mapUSD:100,currentBoundVariants:0,retailApproved:false,
   next:'Exact supported styles/customer reference process, compatibility, retail and named charge.'},
  {feature:'Handmade Resin Eyes',exwUSD:44,mapUSD:56,currentBoundVariants:0,retailApproved:false,
   next:'Bind exact supplier eye design; never equate inherited Custom#1–7 with quoted SKU by label alone.'},
  {feature:'Male Chest Hair',exwUSD:44,mapUSD:56,applicableCurrentMaleListings:0,currentBoundVariants:0,
   next:'No male listing in this63 population. Do not apply to female products.'},
  {feature:'Armpit Hair (glued on)',exwUSD:44,mapUSD:56,currentBoundVariants:0,retailApproved:false,
   next:'Exact supplier reference, supported products, fulfillment and retail.'}],
 includedAppearance:['Implanted brows/lashes','Exquisite head makeup','Standard body painting','Ultra visible-vein painting','Mold-specific realistic skin texture'],
 includedRule:'Preserve factual baseline. No invented alternatives/removal/paid toggles.',
 heldExternalConcepts:['Add Moles & Freckles','Belly Piercing','Inherited Lingerie Add-Ons'],
 holdsPreserved:true,broadGroupTaxonomy:broad.groups,
 previewUI:{reuseExistingDesign:true,newPublicRoute:false,generationEnabled:false,checkoutEnabled:false,
  next:'Use existing DollVue viewer only once source/reference records pass; retain preview-only and production-notFound gates.'},
 productionWrites:0,readinessRegistryWrites:0,generatedImages:0,emails:0,realCarts:0};
await fs.writeFile(`${root}/private-cosmetic-preview-preparation.json`,JSON.stringify(packet,null,2));
console.log(JSON.stringify({products:records.length,fullDolls:records.filter(r=>r.scope!=='excluded-torso').length,
  preparedChoiceBindings:records.reduce((n,r)=>n+r.existingImageChoices.length,0),sourceExtensions:4,
  maleExtensionCoverage:0,publicationAllowed:false}));
