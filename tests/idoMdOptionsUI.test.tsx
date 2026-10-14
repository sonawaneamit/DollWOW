import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OptionTile } from '@/components/ProductOptions';
import { sampleProducts } from '@/lib/data/sample-products';
import { MD_MENU_TAG } from '@/lib/customization/ido-md';
import type { BrandCustomizationConfig, CustomizationGroup } from '@/types/customization';

const product = { ...sampleProducts[0], tags: [MD_MENU_TAG], extended: { ...sampleProducts[0].extended, brand: 'MD Doll', stockStatus: 'custom' as const, material: 'Silicone' } };
const group: CustomizationGroup = { id: 'premium-head-body-options-multiple', label: 'Body', display: 'compact', options: [] };
const config: BrandCustomizationConfig = { id: MD_MENU_TAG.slice(8), brandLabel: 'MD Doll', leadTimeNote: '', groups: [group], rules: [] };

describe('IDO/MD option presentation', () => {
  it('renders fixed inclusions as selected, disabled, included without a warning', () => {
    const option = { id: 'hard-hand', label: 'Hard Hands', priceDelta: 0, priceVerified: true };
    const html = renderToStaticMarkup(<OptionTile product={product} group={group} option={option} catalogOption={option}
      selected fixedIncluded disabled={false} notice={null} currencyCode="USD" promotionNow={new Date('2026-10-14T12:00:00Z')}
      promotionContext={{ config }} allowPromotions={false} onClick={() => { throw new Error('Fixed inclusion must not be interactive'); }} />);
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('Hard Hands: included as standard');
    expect(html).toContain('Included');
    expect(html).not.toContain('lucide-triangle-alert');
  });
  it('renders scheduled bionic price consistently even for conditional menus', () => {
    const option = { id: 'bionic-skin-softer-skin', label: 'Bionic Skin', priceDelta: 299, priceVerified: true };
    const render = (date: string) => renderToStaticMarkup(<OptionTile product={product} group={group} option={option} catalogOption={option}
      selected={false} disabled={false} notice={null} currencyCode="USD" promotionNow={new Date(date)}
      promotionContext={{ config }} allowPromotions={false} onClick={() => {}} />);
    expect(render('2026-10-14T12:00:00Z')).toContain('MD October Offer');
    expect(render('2026-11-01T12:00:00Z')).not.toContain('MD October Offer');
    expect(render('2026-11-01T12:00:00Z')).toContain('299');
  });
});
