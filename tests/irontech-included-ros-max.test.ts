import { describe, expect, it } from 'vitest';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections } from '@/lib/customization/resolve';
import products from '@/data/draft-previews/scarlett-nov18.json';
import type { Product } from '@/types/product';

describe('explicit Irontech ROS MAX base inclusion', () => {
  it('keeps the quoted construction selected without adding another head charge', () => {
    const config = getCustomizationConfig(products[0] as unknown as Product);
    expect(getDefaultSelections(config)['head-type']).toBe('ros-max-upgrade-free');
    expect(config.groups.find(group => group.id === 'head-type')?.options.find(option => option.id === 'ros-max-upgrade-free')?.priceDelta).toBe(0);
  });
  it('preserves the established upgrade price for builds without the inclusion tag', () => {
    const product = structuredClone(products[0]) as unknown as Product;
    product.tags = product.tags.filter(tag => tag !== 'irontech-ros-max-included');
    const config = getCustomizationConfig(product);
    expect(config.groups.find(group => group.id === 'head-type')?.options.find(option => option.id === 'ros-max-upgrade-free')?.priceDelta).toBe(180);
  });
});
