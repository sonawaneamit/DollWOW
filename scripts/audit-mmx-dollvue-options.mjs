import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';

const cwd = process.cwd();
const root = path.join(cwd, 'data/exports/dol312-mmx-nov10');
const source = process.argv[2];
if (!source) throw Error('Supply the final MMX Storefront snapshot path');
const server = await createServer({configFile:false,server:{middlewareMode:true},resolve:{alias:{'@':cwd}}});
const { getCustomizationConfig } = await server.ssrLoadModule('/lib/customization/configs.ts');
const { classifyAppearance } = await server.ssrLoadModule('/lib/dollvue/appearance.ts');
const { isOwnedOptionAsset } = await server.ssrLoadModule('/lib/assets/option-assets.mjs');
const { dollVueReadinessFingerprint, evaluateDollVueReadiness } = await server.ssrLoadModule('/lib/dollvue/readiness.ts');
const registry = JSON.parse(await fs.readFile(path.join(cwd, 'lib/dollvue/readiness-registry.json')));
const products = JSON.parse(await fs.readFile(source));
const rows = [], resolved = [];
for (const product of products) {
  const config = getCustomizationConfig(product);
  resolved.push({ productId: product.id, handle: product.handle, title: product.title,
    fingerprint: dollVueReadinessFingerprint(product, config), config,
    existingRegistryStatus: registry[product.id]?.status ?? null,
    snapshotReadiness: evaluateDollVueReadiness(product, config, registry[product.id], {published:true,contentExcluded:/torso/i.test(product.productType)}) });
  for (const group of config.groups) for (const option of group.options) {
    rows.push({ productId: product.id, handle: product.handle, title: product.title,
      groupId: group.id, group: group.label, optionId: option.id, option: option.label,
      visibleWhen: group.visibleWhen ?? null, displayable: option.displayable !== false,
      factoryExists: option.factoryExists !== false, enabledFlag: option.dollVueEnabled === true,
      reference: option.swatch?.kind === 'image' ? option.swatch.value : null,
      ownedImage: option.swatch?.kind === 'image' && isOwnedOptionAsset(option.swatch.value),
      decision: classifyAppearance(group, option) });
  }
}
const unique = new Map();
for (const row of rows) {
  const key = createHash('sha256').update(JSON.stringify([row.group, row.option, row.displayable, row.factoryExists])).digest('hex');
  if (!unique.has(key)) unique.set(key, {key, state: {brand:'MMX Dolls', group:row.group, option:row.option,
    displayable:row.displayable, factoryExists:row.factoryExists}, occurrences:[], localDecision:row.decision});
  unique.get(key).occurrences.push({productId:row.productId,groupId:row.groupId,optionId:row.optionId});
}
await fs.mkdir(root, {recursive:true});
await fs.writeFile(path.join(root,'resolved-production-menus.json'), JSON.stringify(resolved,null,2));
await fs.writeFile(path.join(root,'option-inventory.json'),JSON.stringify({at:new Date().toISOString(),source,productCount:products.length,
  optionOccurrences:rows.length,uniqueCases:unique.size,rows,cases:[...unique.values()],productionWrites:0,automaticApproval:false},null,2));
console.log(JSON.stringify({products:products.length,optionOccurrences:rows.length,uniqueCases:unique.size,
  localDecisions:rows.reduce((a,r)=>(a[r.decision.status]=(a[r.decision.status]||0)+1,a),{}),
  registryRecords:resolved.filter(p=>p.existingRegistryStatus).length}));
await server.close();
