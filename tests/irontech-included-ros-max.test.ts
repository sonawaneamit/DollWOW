import { describe, expect, it } from 'vitest';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections } from '@/lib/customization/resolve';
import readback from './fixtures/dol381-382-admin-readback-2026-11-19.json';
import type { Product } from '@/types/product';

const scarlett = readback.find(row => row.product.id === 'gid://shopify/Product/10742348513464')!.product as unknown as Product;

describe('explicit Irontech ROS MAX base inclusion', () => {
  it('keeps the quoted construction selected without adding another head charge', () => {
    const config = getCustomizationConfig(scarlett);
    expect(getDefaultSelections(config)['head-type']).toBe('ros-max-upgrade-free');
    expect(config.groups.find(group => group.id === 'head-type')?.options.find(option => option.id === 'ros-max-upgrade-free')?.priceDelta).toBe(0);
  });
  it('preserves the established upgrade price for builds without the inclusion tag', () => {
    const product = structuredClone(scarlett);
    product.tags = product.tags.filter(tag => tag !== 'irontech-ros-max-included');
    const config = getCustomizationConfig(product);
    expect(config.groups.find(group => group.id === 'head-type')?.options.find(option => option.id === 'ros-max-upgrade-free')?.priceDelta).toBe(180);
  });
});
