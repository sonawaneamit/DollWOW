import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse } from 'node-html-parser';
import { describe, expect, it, vi, afterAll } from 'vitest';
import type { Product } from '@/types/product';
import { ProductOptions } from '@/components/ProductOptions';
import { CurrencyProvider } from '@/components/CurrencyProvider';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.stubGlobal('React', React);
afterAll(() => vi.unstubAllGlobals());

function fixture(): Product {
  const price = { amount: '2000', currencyCode: 'USD' };
  return {
    id: 'fixture', handle: 'irontech-local-conditional-fixture', title: 'Irontech Fixture',
    vendor: 'Irontech', productType: 'Doll', description: '', tags: [], images: [], featuredImage: null,
    variants: [{ id: 'fixture-variant', title: 'Default', availableForSale: true, price, selectedOptions: [] }],
    priceRange: { minVariantPrice: price, maxVariantPrice: price },
    extended: { brand: 'Irontech', stockStatus: 'custom', customAvailable: true, customizationGroups: [
      { id: 'main', label: 'Main head', required: true, display: 'compact', options: [
        { id: 'shown', label: 'As shown', priceDelta: 0, priceVerified: true, purchasable: true },
        { id: 'other', label: 'Other head', priceDelta: 100, priceVerified: true, purchasable: true }
      ] },
      { id: 'other-hair', label: 'Other head hair', required: true, display: 'compact',
        visibleWhen: [[{ groupId: 'main', optionId: 'other' }]], options: [
          { id: 'wig', label: 'Wig', priceDelta: 0, priceVerified: true, purchasable: true }
        ] }
    ] }
  };
}

describe('conditional configurator rendering', () => {
  it('omits inactive steps and keeps purchase outside the collapsed review', () => {
    const html = parse(renderToStaticMarkup(createElement(CurrencyProvider, { children: createElement(ProductOptions, { product: fixture(), templateRecipe: null }) })));
    expect(html.querySelector('#custom-step-main')).not.toBeNull();
    expect(html.querySelector('#custom-step-other-hair')).toBeNull();
    expect(html.text).toContain('Step 1 of 1');
    const purchase = html.querySelector('[data-configuration-purchase]');
    expect(purchase).not.toBeNull();
    expect(html.querySelector('#custom-step-review [data-configuration-purchase]')).toBeNull();
    const atc = purchase!.querySelectorAll('button').find(button => button.text.trim() === 'Add to Cart');
    expect(atc).toBeDefined();
    expect(atc!.hasAttribute('disabled')).toBe(false);
  });
  it('disables purchase when the initial conditional price is not verified', () => {
    const product = fixture();
    product.extended.customizationGroups![0].options[0].priceVerified = false;
    const html = parse(renderToStaticMarkup(createElement(CurrencyProvider, { children: createElement(ProductOptions, { product, templateRecipe: null }) })));
    const atc = html.querySelector('[data-configuration-purchase]')!.querySelectorAll('button').find(button => button.text.trim() === 'Add to Cart');
    expect(atc!.hasAttribute('disabled')).toBe(true);
  });
});
