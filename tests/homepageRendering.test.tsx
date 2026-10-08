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
  it('reserves truthful ranked feeds and fills discovery with other models when available', () => {
    const pool = Array.from({length:48}, (_,index)=>({...products[0],id:`variety-${index}`,handle:`variety-${index}`,title:`Unique ${index}`,extended:{brand:'WM Dolls',stockStatus:'ready_to_ship' as const}}));
    const rails = buildRails(pool, pool.slice(0,8), pool.slice(0,8));
    expect(rails.find(r=>r.key==='new')!.products.map(p=>p.id)).toEqual(pool.slice(0,8).map(p=>p.id));
    expect(rails.find(r=>r.key==='bestsellers')!.products.map(p=>p.id)).toEqual(pool.slice(0,8).map(p=>p.id));
    const ready = rails.find(r=>r.key==='ready')!.products;
    const female = rails.find(r=>r.key==='female')!.products;
    expect(new Set([...pool.slice(0,8),...ready,...female].map(p=>p.id)).size).toBe(24);
  });
  it('does not classify ordinary tall or special-offer listings as rare', () => {
    const ordinary = {...products[0],title:'Ordinary special offer',extended:{brand:'WM Dolls',heightCm:170}};
    expect(buildRails([ordinary]).find(r=>r.key==='rare')).toBeUndefined();
    const specialty = {...ordinary,id:'specialty',title:'Elf model'};
    expect(buildRails([ordinary,specialty]).find(r=>r.key==='rare')!.products.map(p=>p.id)).toEqual(['specialty']);
  });
  it('uses eligible curated portraits with short captions instead of arbitrary cropped products', () => {
    const freya = {...products[0],id:'freya',handle:'starpery-freya-165cm-g-cup-silicone-head-companion-doll-46ftg',vendor:'Starpery',extended:{brand:'Starpery'}};
    const html = renderToStaticMarkup(<HomeAlive products={[freya,...products]} customerReviews={getHomepageReviews()} />);
    expect(html).toContain('home-preview__portrait');
    expect(html).toContain('Find your look');
    expect(html).toContain('by Starpery');
    expect(html).not.toContain('home-preview__tile--wide');
    expect(html).not.toContain('Get to know the details');
  });
});
