import { describe, expect, it } from 'vitest';
import release from '@/lib/customization/evidence/template-release.json';
import { templateReleaseIssues } from '@/lib/customization/template-release-registry';

describe('DOL-266 approved four-price release', () => {
  it('keeps the current complete release internally signed', () => {
    expect(templateReleaseIssues(release)).toEqual([]);
  });
  it('binds exactly the four approved runtime snapshots when this delta is current', () => {
    if (release.payload.releaseId !== 'presets-2026-10-28-dol266-price-only') return;
    const expected = [
      ['10518019244216', '92947dde3f28c04453417e71acab4f678ef33eccbda7c63f603c4e2215722aa9'],
      ['10518020423864', '253dcf89ef9dc7bccbb636c5e19357d0db7a9eb4b96e327ca975df7f89abacbe'],
      ['10518020489400', '50bd5a2d95f493e617f3304347e02991b1afa4d8cd7c0e9ac029d1d17c5596f8'],
      ['10517656699064', '17e2e8b024b65703b5ea22746f2f1e4d18b9de2825b889105e3f102781fa6ff0']
    ];
    for (const [id, hash] of expected) {
      const rows = release.payload.entries.filter(entry => entry.productId === `gid://shopify/Product/${id}`);
      expect(rows).toHaveLength(1);
      expect(rows[0].runtimeHash).toBe(hash);
    }
    expect(release.approvals.coordinatedRelease.reviewedBy).toContain('Freya excluded');
  });
});
