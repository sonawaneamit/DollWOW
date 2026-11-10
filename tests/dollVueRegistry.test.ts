import { describe, expect, it } from 'vitest';
import registryData from '@/lib/dollvue/readiness-registry.json';
import liveIrisData from '@/lib/dollvue/live-iris-sources.json';
import { DOLLVUE_APPEARANCE_POLICY } from '@/lib/dollvue/appearance';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';

const registry = registryData as Record<string, DollVueReadinessRecord>;
const liveIris = liveIrisData as Record<string, {portrait:{position:number};fullSources:Record<string, {sha256:string}>;pigments:Record<string, {referenceSHA256:string}>}>;

describe('deployed DollVue review records', () => {
  for (const [id, record] of Object.entries(registry)) {
    it(`${id} contains only bound, owned review data`, () => {
      expect(record.productId).toBe(id);
      expect(record.policy).toBe(DOLLVUE_APPEARANCE_POLICY);
      expect(Object.keys(record).sort()).toEqual([
        'choices', 'fingerprint', ...(record.imageDigests ? ['imageDigests'] : []),
        'policy', 'productId', 'sourcePositions', 'status', ...(record.renderer ? ['renderer'] : []),
      ].sort());
      if (record.status !== 'ready') {
        expect(record.choices).toEqual([]);
        expect(record.sourcePositions).toEqual([]);
        return;
      }
      expect(record.fingerprint).toMatch(/^[a-f0-9]{64}$/);
      expect(record.sourcePositions.length).toBeGreaterThan(0);
      expect(new Set(record.sourcePositions).size).toBe(record.sourcePositions.length);
      for (const position of record.sourcePositions) {
        expect(Number.isInteger(position) && position >= 0 && position < 8).toBe(true);
      }
      expect(record.choices.length).toBeGreaterThan(0);
      if(record.renderer) {
        expect(record.renderer).toBe('protected-iris');
        const sources=liveIris[id];
        expect(sources).toBeDefined();
        expect(new Set(record.sourcePositions)).toEqual(new Set([sources.portrait.position, ...Object.keys(sources.fullSources).map(Number)]));
        for(const source of Object.values(sources.fullSources))expect(Object.values(record.imageDigests || {})).toContain(source.sha256);
        for(const choice of record.choices)expect(sources.pigments[choice.reference].referenceSHA256).toBe(record.imageDigests?.[choice.reference]);
      }
      expect(new Set(record.choices.map(choice => `${choice.groupId}\u0000${choice.optionId}`)).size)
        .toBe(record.choices.length);
      for (const choice of record.choices) {
        expect(Object.keys(choice).sort()).toEqual(['groupId', 'optionId', 'reference']);
        expect(isOwnedOptionAsset(choice.reference)).toBe(true);
        expect(record.imageDigests?.[choice.reference]).toMatch(/^[a-f0-9]{64}$/);
      }
      for (const [url, digest] of Object.entries(record.imageDigests || {})) {
        expect(isOwnedOptionAsset(url)).toBe(true);
        expect(digest).toMatch(/^[a-f0-9]{64}$/);
      }
    });
  }
});
