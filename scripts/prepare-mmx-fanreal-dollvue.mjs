import fs from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import assert from 'node:assert/strict';

const credentialFile=process.argv[2]; assert(credentialFile,'Supply existing catalog environment file');
Object.assign(process.env,parseEnv(await fs.readFile(credentialFile,'utf8')));
process.env.DOLLWOW_TEMPLATE_RELEASE='1';
const root='data/exports/dol312-both-brands-nov10'; await fs.mkdir(root,{recursive:true});
const server=await createServer({configFile:false,server:{middlewareMode:true},resolve:{alias:{'@':process.cwd()}},plugins:[{
 name:'offline-server-marker',resolveId(id){if(id==='server-only')return '\0offline-server-marker';},load(id){if(id==='\0offline-server-marker')return 'export {};';}
}]});
try {
 const {getProducts}=await server.ssrLoadModule('/lib/shopify/storefront.ts');
 const {getProductAdminMetafieldsByHandle,mergeProductAdminMetafields}=await server.ssrLoadModule('/lib/shopify/admin.ts');
 const {getCustomizationConfig}=await server.ssrLoadModule('/lib/customization/configs.ts');
 const {classifyAppearance}=await server.ssrLoadModule('/lib/dollvue/appearance.ts');
 const {dollVueReadinessFingerprint,evaluateDollVueReadiness}=await server.ssrLoadModule('/lib/dollvue/readiness.ts');
 const {assessExteriorOption}=await server.ssrLoadModule('/lib/dollvue/exteriorScope.ts');
 const {isDollVueGroupVisible}=await server.ssrLoadModule('/lib/dollvue/conditionalVisibility.ts');
 const {getCurrentDollVueHolds}=await server.ssrLoadModule('/lib/dollvue/currentHold.ts');
 const {productImageSources}=await server.ssrLoadModule('/lib/catalog/productImage.ts');
 const registry=JSON.parse(await fs.readFile('lib/dollvue/readiness-registry.json'));
 const rows=[],labels=new Map();
 for(const brand of ['MMX','Fanreal']) {
  const products=await getProducts({query:brand==='MMX'?'tag:mmx-dolls OR vendor:MMX':'tag:fanreal OR vendor:Fanreal',first:250,includeCustomizationGroups:true,imageFirst:8,cache:'no-store',strict:true});
  assert(products.length>0,'No actual published '+brand+' products');
  for(const base of products) {
   const admin=await getProductAdminMetafieldsByHandle(base.handle); assert(admin,'Missing current exact Admin identity');
   const product=mergeProductAdminMetafields(base,admin),config=getCustomizationConfig(product);
   const choices=config.groups.flatMap(group=>group.options.map(option=>({groupId:group.id,group:group.label,optionId:option.id,option:option.label,
    reference:option.swatch?.kind==='image'?option.swatch.value:null,visibleWhen:group.visibleWhen,decision:classifyAppearance(group,option),exterior:assessExteriorOption(group,option)})));
   const candidateGroups=new Set(choices.filter(c=>c.decision.status==='candidate').map(c=>c.groupId));
   for(const choice of choices){choice.conditionSupported=isDollVueGroupVisible(config,config.groups.find(g=>g.id===choice.groupId),candidateGroups);
    const key=JSON.stringify([brand,choice.group,choice.option,choice.decision]);if(!labels.has(key))labels.set(key,{brand,...choice,occurrences:0});labels.get(key).occurrences++;}
   const excluded=/torso|head.only|customization|charge/i.test(product.productType+' '+product.handle)||product.extended.stockStatus==='ready_to_ship';
   rows.push({brand,product,config,choices,photos:productImageSources(product).slice(0,8),fingerprint:dollVueReadinessFingerprint(product,config),excluded,
    current:evaluateDollVueReadiness(product,config,registry[product.id],{published:true,contentExcluded:excluded})});
   if(rows.length%10===0)console.log(JSON.stringify({captured:rows.length,brand}));
  }
 }
 const holds=await getCurrentDollVueHolds(rows.map(r=>r.product.id));
 for(const row of rows)row.hold=holds.get(row.product.id);
 const report={at:new Date().toISOString(),source:'Fresh strict published Storefront plus actual PDP Admin enrichment',products:rows,labels:[...labels.values()],productionWrites:0,
  counts:Object.fromEntries(['MMX','Fanreal'].map(brand=>[brand,{total:rows.filter(r=>r.brand===brand).length,fullFactory:rows.filter(r=>r.brand===brand&&!r.excluded).length,
   holdClear:rows.filter(r=>r.brand===brand&&r.hold==='clear').length,currentlyReady:rows.filter(r=>r.brand===brand&&r.current.ready).length}]))};
 await fs.writeFile(root+'/fresh-candidates.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report.counts));
}finally {await server.close();}
