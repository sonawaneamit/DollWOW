import samplePaths from '@/data/internal-link-sample.json';
import { catalogBrands, getCatalogBrand, isHiddenCatalogBrand } from './brands';
import { collectionPresets, filterProducts, isStandaloneHeadCatalogProduct } from './filters';
import { getLearningArticle } from '@/lib/learn/content';
import type { Product } from '@/types/product';

export type ContextualLink = { href: string; label: string; kind: 'brand' | 'collection' | 'guide' };

/** Preview-only sample. Production expansion requires the DOL-225 review decision. */
export function contextualLinkSampleEnabled(path: string, environment: Record<string, string | undefined> = process.env) {
  return environment.VERCEL_ENV === 'preview' && samplePaths.includes(path);
}

function eligible(product: Product) {
  return !isHiddenCatalogBrand(product.extended.brand ?? product.vendor) && !product.tags.some(tag =>
    isHiddenCatalogBrand(tag) || /^(?:dollwow-test|dollwow-system|custom-option-charge)$/i.test(tag) || /(?:^|[-_:])hold(?:$|[-_:])/i.test(tag));
}

function uniqueLinks(path: string, links: ContextualLink[]) {
  const seen = new Set([path]);
  return links.filter(link => {
    if (!/^\/(?:brands|shop|learn)\/[a-z0-9-]+$/.test(link.href) || seen.has(link.href)) return false;
    seen.add(link.href); return true;
  });
}

function collectionLink(handle: string): ContextualLink {
  return { href: `/shop/${handle}`, label: `Compare ${collectionPresets[handle].title.toLowerCase()}`, kind: 'collection' };
}

export function productContextualLinks(product: Product): ContextualLink[] {
  if (!eligible(product)) return [];
  const links: ContextualLink[] = [], brand = getCatalogBrand(product.extended.brand ?? product.vendor);
  if (brand) links.push({ href: `/brands/${brand.collectionHandle}`, label: `More from ${brand.label}`, kind: 'brand' });
  // A torso is not a full doll; a silicone-head hybrid is not full silicone.
  const parent = isStandaloneHeadCatalogProduct(product) ? undefined :
    ['torsos', 'hips', 'male-dolls', 'hybrid', 'tpe', 'silicone'].find(handle => filterProducts([product], collectionPresets[handle].filters).length);
  if (parent) links.push(collectionLink(parent));
  const guide = parent === 'male-dolls' ? 'male-sex-doll-buying-guide' : 'tpe-vs-silicone-sex-dolls';
  const article = getLearningArticle(guide);
  if (article) links.push({ href: `/learn/${article.slug}`, label: parent === 'male-dolls' ? 'Male doll buying guide' : 'Compare TPE and silicone', kind: 'guide' });
  const sizeGuide = !isStandaloneHeadCatalogProduct(product) && getLearningArticle('sex-doll-size-weight-guide');
  if (sizeGuide) links.push({ href: `/learn/${sizeGuide.slug}`, label: 'Size, weight and handling', kind: 'guide' });
  return uniqueLinks(`/products/${product.handle}`, links).slice(0, 4);
}

export function catalogContextualLinks(path: string, products: Product[]): ContextualLink[] {
  const visible = products.filter(eligible);
  if (!visible.length) return [];
  const links: ContextualLink[] = [collectionLink('sex-dolls')];
  if (path.startsWith('/brands/')) {
    const materials = ['tpe', 'silicone', 'hybrid'].map(handle => ({ handle,
      count: filterProducts(visible, collectionPresets[handle].filters).length
    })).filter(item => item.count > 0).sort((a, b) => b.count - a.count || a.handle.localeCompare(b.handle));
    links.push(...materials.slice(0, 2).map(item => collectionLink(item.handle)));
  } else {
    const brands = catalogBrands.map(brand => ({ brand, count: filterProducts(visible, { brand: brand.value }).length }))
      .filter(item => item.count > 0).sort((a, b) => b.count - a.count || a.brand.value.localeCompare(b.brand.value));
    links.push(...brands.slice(0, 2).map(({ brand }) => ({ href: `/brands/${brand.collectionHandle}`, label: `Explore ${brand.label}`, kind: 'brand' as const })));
  }
  return uniqueLinks(path, links);
}
