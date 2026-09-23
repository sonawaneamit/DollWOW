import {describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import fixtures from './fixtures/castle183Release.json';
import type {Product} from '../types/product';
import registry from '../lib/customization/evidence/template-release.json';
import {getCustomizationConfig} from '../lib/customization/configs';
import {createReleasedTemplateSelector} from '../lib/customization/template-release-registry';
import {templateConfigurationPresets} from '../lib/customization/template-presets';
import {getDefaultSelections,resolveCustomization} from '../lib/customization/resolve';
import {loadReleasedNamedUpgradeBindings} from '../lib/cart/named-upgrade-release';
const select=createReleasedTemplateSelector(registry);
describe('Dolls Castle 183cm release',()=>{
 it.each(fixtures as Product[])('$handle inherits exact shared presets and checkout records',product=>{
  const config=getCustomizationConfig(product);const recipe=select(product,config);expect(recipe).not.toBeNull();
  const presets=templateConfigurationPresets(recipe,config,config,1999,getDefaultSelections(config));
  expect(presets.map(p=>p.totalPrice)).toEqual([1999,2286,2455]);
  const bindings=loadReleasedNamedUpgradeBindings([product.variants[0].id]);expect(bindings).toHaveLength(5);
  for(const preset of presets){const result=resolveCustomization(config,preset.selections,1999);expect(result.issues).toEqual([]);
   for(const o of result.selectedOptions.filter(o=>o.priceDelta>0))expect(bindings.filter(b=>b.group===o.groupLabel&&b.label===o.optionLabel&&b.unitAmount===o.priceDelta)).toHaveLength(1);
  }
 });
 it('removable construction clears suction and its charge but keeps all tiers available',()=>{
  const product=fixtures[0] as Product;const config=getCustomizationConfig(product);const recipe=select(product,config);
  const current={...getDefaultSelections(config),vagina:'removable','skin-tone':'natural','suction-function':'suction-function'};
  const resolved=resolveCustomization(config,current,1999);
  expect(resolved.selections).not.toHaveProperty('suction-function');expect(resolved.optionPriceDelta).toBe(0);
  const presets=templateConfigurationPresets(recipe,config,config,1999,resolved.selections);expect(presets).toHaveLength(3);
  for(const p of presets){expect(p.selections.vagina).toBe('removable');expect(p.selections['skin-tone']).toBe('natural');}
 });
 it('all three parents reuse the same five checkout products',()=>{
  const ids=fixtures.map(p=>loadReleasedNamedUpgradeBindings([p.variants[0].id]).map(b=>b.merchandiseId));expect(ids[0]).toEqual(ids[1]);expect(ids[1]).toEqual(ids[2]);
 });
});
