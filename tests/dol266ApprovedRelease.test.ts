import { describe, expect, it } from 'vitest';
import release from '@/lib/customization/evidence/template-release.json';
import { templateReleaseIssues } from '@/lib/customization/template-release-registry';

describe('DOL-266 approved four-price release', () => {
  it('keeps the current complete release internally signed', () => {
    expect(templateReleaseIssues(release)).toEqual([]);
  });
  it('binds exactly the four approved runtime snapshots when this delta is current', () => {
    if (release.payload.releaseId !== 'presets-2026-10-28-dol266-shopify-money') return;
    const expected = [
      ['10518019244216', '05fc1d14227e70dcc2f7e22533f0c131f7152fc0368bb0ead906b5a796003eee'],
      ['10518020423864', '9e49ccc39f28bb7a6ead765f1716299ab402021a610f44dd571e3413b3d0d2e9'],
      ['10518020489400', 'c0ceb35cc515cd6cbec4b11162fde87eb478347db7995b0d9cd6e65dee7e132d'],
      ['10517656699064', '9096e0aa8e6bff9d22cc560f404ace989001dbd957c8d023b8a1f0cdf27a2938']
    ];
    for (const [id, hash] of expected) {
      const rows = release.payload.entries.filter(entry => entry.productId === `gid://shopify/Product/${id}`);
      expect(rows).toHaveLength(1);
      expect(rows[0].runtimeHash).toBe(hash);
    }
    expect(release.approvals.coordinatedRelease.reviewedBy).toContain('Freya excluded');
  });
});
