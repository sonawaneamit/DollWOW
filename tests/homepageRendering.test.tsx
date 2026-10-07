import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {HomeAlive, buildRails} from '@/components/HomeAlive';
import {sampleProducts} from '@/lib/data/sample-products';
import {homepageBrandLogos} from '@/lib/catalog/homepage';
import {getHomepageReviews} from '@/lib/reviews/reviews';

const products = Array.from({length:12}, (_,index) => ({...sampleProducts[0], id:`home-${index}`,handle:`home-${index}`, vendor:'WM Dolls',title:`Example ${index}`, extended:{brand:'WM Dolls', stockStatus:'ready_to_ship' as const}}));

describe('homepage rendering', () => {
  it('never replaces absent new arrivals or bestsellers with curated products', () => {
    expect(buildRails(products).map(rail=>rail.key)).not.toContain('new');
    expect(buildRails(products).map(rail=>rail.key)).not.toContain('bestsellers');
  });
  it('caps all populated rails at eight and excludes disallowed brands', () => {
    const denied = {...products[0], id:'denied',vendor:'Real Lady',extended:{brand:'Real Lady'}};
    for (const rail of buildRails([denied,...products], [denied,...products], [denied,...products])) {
      expect(rail.products).toHaveLength(8);
      expect(rail.products.some(product=>product.id==='denied')).toBe(false);
    }
  });
  it('server-renders links and preserves the existing photo confidence sections', () => {
    const html = renderToStaticMarkup(<HomeAlive products={products} recentlyAddedProducts={products} bestSellingProducts={products} customerReviews={getHomepageReviews()} brands={homepageBrandLogos.slice(0,1)} />);
    expect(html).toContain('href="/products/home-0"');
    expect(html).toContain('href="/brands/wm-dolls"');
    expect(html).toContain('doll-wow-customer-photos37.jpg');
    expect(html).toContain('factory-approval-001.webp');
    expect(html).toContain('not to choose a current SKU');
    expect(html.indexOf('data-home-feed="new"')).toBeLessThan(html.indexOf('home-reviews-title'));
    expect(html.indexOf('home-reviews-title')).toBeLessThan(html.indexOf('data-home-feed="female"'));
    expect(html.indexOf('data-home-feed="female"')).toBeLessThan(html.indexOf('factory-approval-home-title'));
    expect(html).toContain('Coming soon');
    expect(html).not.toContain('Loved right now');
    expect(html).not.toContain('most browsed');
    expect(html).not.toContain('home-rail-peek');
  });
});
