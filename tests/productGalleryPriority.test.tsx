import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse } from 'node-html-parser';
import { ProductGallery } from '@/components/ProductGallery';
import { sampleProducts } from '@/lib/data/sample-products';
import { withProtectedProductImages } from '@/lib/catalog/productImage';
import type { Product } from '@/types/product';

const image = { url: '/images/brand/dollwow-black-gold.png', altText: 'Fixture logo' };
const secondImage = { url: '/images/brand/dollwow-black-gold-lockup.png', altText: 'Second fixture logo' };

describe('active PDP image priority', () => {
  it('hints the active image and its existing preload without prioritizing lazy thumbnails', () => {
    const product = withProtectedProductImages({ ...sampleProducts[0], featuredImage: image, images: [image, secondImage], media: undefined });
    const before = structuredClone(product);
    const dom = parse(renderToStaticMarkup(<ProductGallery product={product} />));
    const active = dom.querySelector('button[aria-label="Open product image preview"] img');
    expect(active?.getAttribute('fetchpriority')).toBe('high');
    expect(active?.getAttribute('loading')).toBe('eager');
    expect(dom.querySelector('link[rel="preload"][as="image"]')?.getAttribute('fetchpriority')).toBe('high');
    const thumbnails = dom.querySelectorAll('button[aria-label^="View image"] img');
    expect(thumbnails.length).toBeGreaterThan(0);
    for (const thumbnail of thumbnails) {
      expect(thumbnail.getAttribute('loading')).toBe('lazy');
      expect(thumbnail.getAttribute('fetchpriority')).not.toBe('high');
    }
    expect(product).toEqual(before);
  });

  it('does not preload an absent gallery image', () => {
    const product = { ...sampleProducts[0], featuredImage: null, images: [], media: [] };
    const dom = parse(renderToStaticMarkup(<ProductGallery product={product} />));
    expect(dom.querySelector('link[rel="preload"][as="image"]')).toBeNull();
    expect(dom.querySelector('img[fetchpriority="high"]')).toBeNull();
    expect(dom.textContent).toContain('A product image is not available yet');
  });

  it('retains metadata-only video loading when the active gallery item is a video', () => {
    const product: Product = { ...sampleProducts[0], media: [{ type: 'video', url: '/fixture.mp4', previewImage: null, altText: null }] };
    const dom = parse(renderToStaticMarkup(<ProductGallery product={product} />));
    expect(dom.querySelector('video')?.getAttribute('preload')).toBe('metadata');
    expect(dom.querySelector('link[rel="preload"][as="image"]')).toBeNull();
    expect(dom.querySelector('img[fetchpriority="high"]')).toBeNull();
  });
});
