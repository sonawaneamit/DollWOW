import fs from 'node:fs/promises';
const root='data/exports/dol312-mmx-nov10';
const inv=JSON.parse(await fs.readFile(`${root}/option-inventory.json`));
const jev=JSON.parse(await fs.readFile(`${root}/jev-option-classification.json`));
const products=JSON.parse(await fs.readFile(`${root}/resolved-production-menus.json`));
const refs=JSON.parse(await fs.readFile(`${root}/reference-byte-check.json`));
const approvedGroups={
  'Skin Tone':{why:'Skin color is visible. Use skin-only reference samples and keep the doll geometry unchanged.',effort:'Medium',next:'Review skin-only references. Resolve DOL-311 before skin rollout.'},
  'Hairstyle':{why:'25 supplied wig-style photos define a visible hairstyle. Hair installation is separate.',effort:'Medium',next:'Bind exact wig reference and test hair edits without changing face or outfit.'},
  'Eye Color':{why:'5 iris photos define visible eye color. Old iris review exists but current menus invalidate its fingerprint.',effort:'Low',next:'Rebind exact five iris references and current source/menu fingerprint. Sample output.'},
  'Nail Color':{why:'7 nail references show visible color or finish. Preserve original nail length and shape.',effort:'Medium',next:'Check polish transfer, especially French tips. Do not copy reference nail geometry.'},
  'Toe Nail Color':{why:'3 toe-nail references show visible polish color. Preserve original toes and nails.',effort:'Medium',next:'Choose source with visible feet and test polish-only transfer.'}
};
function excludedWhy(group){
 if(/Head$/i.test(group))return 'Changing the head changes product identity. The current appearance preview does not support head swaps.';
 if(/Hair finish/.test(group))return 'Wig versus implanted hair is a construction service. Use Hairstyle for a specific visible look.';
 if(/Anal|Vagina|Areola|Nipple/.test(group))return 'Intimate anatomy is outside the current non-explicit appearance preview.';
 if(/Accessories/.test(group))return 'An accessory purchase does not alter the doll appearance. Keep it in checkout only.';
 return 'Functional, structural or softness/construction choice. A still appearance preview cannot verify the selected feature.';
}
const order=[...Object.keys(approvedGroups),...new Set(inv.rows.map(r=>r.group).filter(g=>!approvedGroups[g]))];
const groups=order.map(group=>{
 const rows=inv.rows.filter(r=>r.group===group),candidates=rows.filter(r=>r.decision.status==='candidate'),cfg=approvedGroups[group];
 return {brand:'MMX Dolls',group,examples:[...new Set(rows.map(r=>r.option).filter(v=>v!=='As shown'))].slice(0,5).join(', '),
 canShow:cfg?'Yes':'No',why:cfg?.why??excludedWhy(group),effort:cfg?.effort??'No build',
 products:new Set(rows.map(r=>r.productId)).size,referenceCount:new Set(candidates.map(r=>r.reference).filter(Boolean)).size,
 next:cfg?.next??'Keep excluded from DollVue. Preserve the product configurator.',
 source:'https://linear.app/dollwow/issue/DOL-312'};
});
const details=jev.results.map(r=>({group:r.state.group,option:r.state.option,
 canShow:r.localDecision.status==='candidate'?'Yes':'No',
 why:r.localDecision.status==='candidate'?'Appearance candidate. Reference, source and fidelity review still required.':
   r.localDecision.reason==='no-specific-change'?'Keep the current appearance. No edit to generate.':excludedWhy(r.state.group),
 jev:r.answer.choice,policy:r.localDecision.status,products:new Set(r.occurrences.map(o=>o.productId)).size,
 referenceCount:new Set(inv.rows.filter(o=>o.group===r.state.group&&o.option===r.state.option).map(o=>o.reference).filter(Boolean)).size,
 reference:inv.rows.find(o=>o.group===r.state.group&&o.option===r.state.option)?.reference??''}));
const summary={at:new Date().toISOString(),products:63,fullDolls:60,excludedTorsos:3,optionOccurrences:inv.rows.length,uniqueLabels:inv.uniqueCases,
 appearanceGroups:5,appearanceReferences:refs.checked,returnedModel:'jev-1.14.0',apiBatches:7,
 usage:{inputTokens:jev.results.reduce((n,r)=>n+(r.usage?.input_tokens||0),0),outputTokens:jev.results.reduce((n,r)=>n+(r.usage?.output_tokens||0),0),costUSD:null},
 readiness:{ready:0,stale:11,missing:49,excluded:3},
 referenceReview:{reviewer:'Codex assistant',reviewed:45,decoded:45,skinFullTorsoReferences:5,
  notes:'Contact sheets reviewed. Skin references include nude torsos; prepare reviewed skin-only samples for a non-explicit preview. Hairstyle, iris, nail and toenail references are legible. No generated-output fidelity or supplier-reference equivalence is asserted.'},
 productionWrites:0,generatedImages:0,liveReadyProducts:0,groups,details,
 productsDetail:products.map(p=>({title:p.title,handle:p.handle,existingRecord:p.existingRegistryStatus??'None',
  currentResult:p.snapshotReadiness.reason,appearanceChoices:p.config.groups.flatMap(g=>g.options.map(o=>({g,o})))
    .filter(({g,o})=>inv.rows.some(r=>r.productId===p.productId&&r.groupId===g.id&&r.optionId===o.id&&r.decision.status==='candidate')).length,
  url:`https://dollwow.com/products/${p.handle}`})),
 nextSteps:['Martin reviews the classification sheet before building.',
 'Resolve the tracked DOL-311 skin-reference issue before skin rollout.',
 'Verify exact supplier/option-reference equivalence and choose a suitable non-explicit source for each full-size product.',
 'Bind source/reference bytes, conditional option rules and fresh menu fingerprints per product.',
 'Run representative visual-generation fidelity checks only under an approved scope, then show a private preview.',
 'Release only after exact preview approval; recheck PDP, card/filter, viewer and selection transport together.']};
await fs.writeFile(`${root}/review-summary.json`,JSON.stringify(summary,null,2));
console.log(JSON.stringify({groups:groups.length,uniqueLabels:details.length,ready:summary.readiness}));
