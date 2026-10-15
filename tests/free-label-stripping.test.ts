import { describe, it, expect } from 'vitest';

describe('(FREE) Label Stripping', () => {
  it('should have stripFreeLabel function in ProductOptions', () => {
    const content = require('fs').readFileSync('components/ProductOptions.tsx', 'utf8');
    expect(content).toContain('function stripFreeLabel');
    expect(content).toContain('funwest|top[- ]?fire');
  });

  it('stripFreeLabel should strip (FREE) for FunWest and Top Fire', () => {
    const stripFreeLabel = (label: string, brand?: string): string => {
      if (brand && /funwest|top[- ]?fire/i.test(brand)) {
        return label.replace(/\s*\(FREE\)\s*/gi, '').trim();
      }
      return label;
    };

    expect(stripFreeLabel('Brown Eyes (FREE)', 'FunWest')).toBe('Brown Eyes');
    expect(stripFreeLabel('Blue Eyes (FREE)', 'Top Fire')).toBe('Blue Eyes');
    expect(stripFreeLabel('Grey Eyes (FREE)', 'Irontech')).toBe('Grey Eyes (FREE)');
  });
});
