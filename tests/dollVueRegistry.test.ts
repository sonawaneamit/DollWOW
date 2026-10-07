import { describe, expect, it } from 'vitest';
import registryData from '@/lib/dollvue/readiness-registry.json';
import { DOLLVUE_APPEARANCE_POLICY } from '@/lib/dollvue/appearance';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';

const registry = registryData as Record<string, DollVueReadinessRecord>;

describe('deployed DollVue review records', () => {
  for (const [id, record] of Object.entries(registry)) {
    it(`${id} contains only bound, owned review data`, () => {
      expect(record.productId).toBe(id);
      expect(record.policy).toBe(DOLLVUE_APPEARANCE_POLICY);
      expect(Object.keys(record).sort()).toEqual([
        'choices', 'fingerprint', ...(record.imageDigests ? ['imageDigests'] : []),
        'policy', 'productId', 'sourcePositions', 'status',
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
