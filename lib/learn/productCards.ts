import exclusions from '@/data/contextual-link-exclusions.json';
import { productPublicTitle } from '@/lib/catalog/naming';
import { protectedProductImageUrlFor } from '@/lib/catalog/productImage';
import type { Product } from '@/types/product';
import type { CatalogListing } from '@/components/CatalogListingCard';

export function articleProductHandles(markdown: string) {
  const handles = [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].flatMap(match => {
    try {
      const url = new URL(match[1], 'https://dollwow.com');
      if (url.origin !== 'https://dollwow.com') return [];
      const handle = url.pathname.match(/^\/products\/([a-z0-9-]+)\/?$/)?.[1];
      return handle && !exclusions.includes(handle) ? [handle] : [];
    } catch { return []; }
  });
  return [...new Set(handles)];
}

export function articleProducts(handles: string[], products: Product[]) {
  const allowed = new Map(products.filter(product =>
    !exclusions.includes(product.handle) &&
    !product.tags.some(tag => /hold|dollwow-test|dollwow-system|custom-option-charge/i.test(tag))
  ).map(product => [product.handle, product]));
  return handles.flatMap(handle => allowed.has(handle) ? [allowed.get(handle)!] : []);
}

export function articleListing(product: Product): CatalogListing {
  const positive = (value: number | undefined) => Number.isFinite(value) && value! > 0 ? value! : null;
  const price = product.priceRange.minVariantPrice;
  return {
    handle: product.handle, title: productPublicTitle(product),
    image: protectedProductImageUrlFor(product, product.featuredImage ?? product.images[0], 'card') ?? null,
    heightCm: positive(product.extended.heightCm), weightLb: positive(product.extended.weightLb),
    price: positive(Number(price.amount)) === null ? null : price.amount, currency: price.currencyCode
  };
}

export function articleProductInsertionHeading(markdown: string) {
  const headings = markdown.split('\n').filter(line => line.startsWith('## ')).map(line => line.slice(3));
  return headings[Math.floor(headings.length / 2)];
}
