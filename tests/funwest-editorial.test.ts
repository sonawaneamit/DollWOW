import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';

describe('FunWest Editorial Loading', () => {
  it('should have FunWest editorial data file', () => {
    expect(existsSync('data/funwest/preview-editorial-intros.json')).toBe(true);
  });

  it('should import FunWest editorial in previewEditorialFixture', () => {
    const content = require('fs').readFileSync('lib/catalog/previewEditorialFixture.ts', 'utf8');
    expect(content).toContain('funwestEditorialIntros');
    expect(content).toContain('@/data/funwest/preview-editorial-intros.json');
  });
});
