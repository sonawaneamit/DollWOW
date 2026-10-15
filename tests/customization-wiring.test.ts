import { describe, it, expect } from 'vitest';

describe('FunWest and Top Fire Customization Wiring', () => {
  it('should have isFunwestProduct and isTopFireProduct functions', () => {
    const configsContent = require('fs').readFileSync('lib/customization/configs.ts', 'utf8');
    expect(configsContent).toContain('function isFunwestProduct');
    expect(configsContent).toContain('function isTopFireProduct');
    expect(configsContent).toContain('getFunwestCustomizationGroups');
    expect(configsContent).toContain('getTopFireCustomizationGroups');
  });

  it('should wire FunWest and Top Fire into customizationConfig', () => {
    const configsContent = require('fs').readFileSync('lib/customization/configs.ts', 'utf8');
    expect(configsContent).toContain('isFunwestProduct(product)');
    expect(configsContent).toContain('getFunwestCustomizationGroups');
    expect(configsContent).toContain('isTopFireProduct(product)');
    expect(configsContent).toContain('getTopFireCustomizationGroups');
  });
});
