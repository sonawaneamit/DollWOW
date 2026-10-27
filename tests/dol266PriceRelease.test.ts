import { describe, expect, it } from 'vitest';
import delta from '@/data/pricing/dol266-approved-price-delta.json';
import registry from '@/lib/customization/evidence/template-release.json';
import { templateReleaseIssues } from '@/lib/customization/template-release-registry';

describe('DOL-266 exact approved repricing registry',()=>{
 it('retains a fully hash-bound approved registry and exactly four intended new bindings',()=>{
  expect(templateReleaseIssues(registry)).toEqual([]);
  expect(delta).toHaveLength(4);
  expect(delta.map(r=>r.after)).toEqual([2499,2499,2499,1799]);
  for(const row of delta){
   expect(registry.payload.entries.find(e=>e.productId===row.id)).toMatchObject({handle:row.handle,runtimeHash:row.candidateHash});
   expect(row.actualBeforeHash).toBe(row.oldExpectedHash);
   expect(row.recipeAvailable).toBe(true);expect(row.missingNamed).toEqual([]);expect(row.dollVueFingerprintUnchanged).toBe(true);
   expect(row.afterPresets.map((value,i)=>value-row.beforePresets[i])).toEqual([row.after-row.before,row.after-row.before,row.after-row.before]);
  }
  expect(delta.some(r=>/freya|tantaly/i.test(r.handle))).toBe(false);
 });
});
