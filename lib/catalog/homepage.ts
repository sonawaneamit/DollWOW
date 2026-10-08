import { productBodyType } from "@/lib/catalog/bodyType";
import { storefrontFeatureProducts } from "@/lib/catalog/featured";
import type { Product } from "@/types/product";
import { brandHubHref, getCatalogBrand, normalizeBrandText } from './brands';

// Homepage visual selection only. Directory membership is not a seller endorsement.
const HOMEPAGE_VISUAL_BRANDS = new Set([
  'wm', 'angelkiss', 'irontech', 'fanreal', 'starpery', 'avant', 'sy', 'yl',
  'erovenus', 'sedoll', 'dolls-castle', 'jarliet', 'hr'
]);

// Exact directory identities, whether registered in the catalog or not. Never
// infer a parent brand or collapse arbitrary words into a guessed identifier.
const HOMEPAGE_DIRECTORY_NAMES = new Set([
  'Lusandy', 'Lusandy Doll', 'Airislove Doll', 'AIBEI Doll', 'DollCabin',
  'Elsa Babe', 'EXdoll', 'Evasdoll', 'FUNWEST DOLL', 'FU Doll', 'Firefly Doll',
  'GYNOID TECH. LTD', 'Haptelle', 'IDODOLL', 'Jiusheng Doll (JSD)', 'JK Dolls',
  'Lilydoll', 'LORIBEAR', 'MissterVerse', 'MD Doll', 'MMX DOLL', 'MRLDOLL',
  'MRLSEXDoll', 'Sanhui Doll', 'SexDollTorso', 'Sineem Doll', 'Sino-doll',
  'SM Doll', 'TOP-CYDOLL', 'TAYU Doll', 'Top Fire Doll', 'Yeloly', 'XT Doll',
  'XY Doll', 'XYcolo', 'Yue Doll', 'ORdoll', 'TiddyShop'
].map(normalizeBrandText));

// Use the same exact identity resolution as products when directory brands gain
// catalog entries. Eligibility does not depend on having a staged logo.
const HOMEPAGE_ELIGIBLE_BRAND_KEYS = new Set([
  ...HOMEPAGE_VISUAL_BRANDS,
  ...Array.from(HOMEPAGE_DIRECTORY_NAMES, name => getCatalogBrand(name)?.value ?? name)
]);

export function homepageBrandKey(product: Product) {
  const name = product.extended.brand?.trim() || product.vendor;
  const canonical = getCatalogBrand(name);
  return canonical?.value ?? (HOMEPAGE_DIRECTORY_NAMES.has(normalizeBrandText(name)) ? normalizeBrandText(name) : '');
}

export function homepageFeatureProducts(products: Product[]) {
  return storefrontFeatureProducts(products).filter(product => {
    const key = homepageBrandKey(product);
    return HOMEPAGE_ELIGIBLE_BRAND_KEYS.has(key);
  });
}

export const HOMEPAGE_FEED_SIZE = 8;

export function homepageBestSellers(products: Product[]) {
  return uniqueHomepageModels(homepageFeatureProducts(products)).slice(0, HOMEPAGE_FEED_SIZE);
}

export const homepageBrandLogos = [
  {brand:'wm', file:'wm.webp', width:200, height:80},
  {brand:'irontech', file:'irontech.png', width:150, height:56, dark:true},
  {brand:'starpery', file:'starpery.webp', width:300, height:50},
  {brand:'angelkiss', file:'angelkiss.jpg', width:1218, height:312},
  {brand:'sedoll', file:'sedoll.png', width:180, height:50},
  {brand:'sy', file:'sy.png', width:300, height:300},
  {brand:'yl', file:'yl.png', width:192, height:26, dark:true},
  {brand:'hr', file:'hr.png', width:300, height:185},
  {brand:'fanreal', file:'fanreal.webp', width:400, height:86},
  {brand:'erovenus', file:'erovenus.png', width:527, height:87, dark:true},
  {brand:'dolls-castle', file:'dolls-castle.png', width:128, height:128},
  {brand:'jarliet', file:'jarliet.png', width:542, height:243}
].map(logo => ({...logo, src:`/images/home-brands/${logo.file}`, label:getCatalogBrand(logo.brand)!.label, href:brandHubHref(logo.brand)}));

export function homepageBrands(products: Product[]) {
  const present = new Set(homepageFeatureProducts(products).map(homepageBrandKey));
  return homepageBrandLogos.filter(logo => present.has(logo.brand));
}

export function isHomepageMaleProduct(product: Product) {
  return productBodyType(product) === "male";
}

export function homepageNewArrivals(products: Product[], catalog: Product[] = []) {
  // Prefer the original model entry, not a newly imported warehouse copy.
  // Preserve CREATED_AT order among the remaining candidates.
  const customModels = new Set(homepageFeatureProducts([...catalog, ...products])
    .filter(product => product.extended.stockStatus === 'custom')
    .map(homepageModelKey));
  const candidates = homepageFeatureProducts(products).filter(product =>
    product.extended.stockStatus !== 'ready_to_ship' || !customModels.has(homepageModelKey(product)));
  // In the newest-first feed, the last warehouse copy is the earliest listing.
  return uniqueHomepageModels([...candidates].reverse()).reverse().slice(0, HOMEPAGE_FEED_SIZE);
}

export function homepageModelKey(product: Product) {
  const title = product.title.toLowerCase()
    .replace(/\b(?:ready[\s-]*to[\s-]*ship|in[\s-]*stock|rts|customizable|custom[\s-]*order)\b/g, ' ')
    .replace(/\b(?:us|usa|uk|eu|ca|au|united states|canada|australia|europe)\b/g, ' ')
    .replace(/\b(?:companion|sex|dolls?|custom)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  return `${homepageBrandKey(product)}:${title}`;
}

export function uniqueHomepageModels(products: Product[]) {
  const seen = new Set<string>();

  return products.filter((product) => {
    const key = homepageModelKey(product);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Discovery feeds prefer less-exposed models, then balance brands and looks.
// Sparse categories may repeat across feeds, but never repeat a model inside one.
export function selectHomepageDiscovery(products: Product[], exposure: Map<string, number>) {
  const remaining = uniqueHomepageModels(homepageFeatureProducts(products));
  const selected: Product[] = [];
  const brands = new Map<string, number>();
  const looks = new Map<string, number>();
  const lookKey = (product: Product) => [product.extended.material ?? '', ...(product.extended.lookTags ?? []).slice().sort()].join(':');
  while (remaining.length && selected.length < HOMEPAGE_FEED_SIZE) {
    const score = (product: Product) => [exposure.get(homepageModelKey(product)) ?? 0,
      brands.get(homepageBrandKey(product)) ?? 0, looks.get(lookKey(product)) ?? 0];
    let best = 0;
    for (let index = 1; index < remaining.length; index++) {
      const a = score(remaining[index]);
      const b = score(remaining[best]);
      const difference = a.findIndex((value, position) => value !== b[position]);
      if (difference >= 0 && a[difference] < b[difference]) best = index;
    }
    const [product] = remaining.splice(best, 1);
    selected.push(product);
    const brand = homepageBrandKey(product);
    brands.set(brand, (brands.get(brand) ?? 0) + 1);
    const look = lookKey(product);
    looks.set(look, (looks.get(look) ?? 0) + 1);
  }
  for (const product of selected) {
    const key = homepageModelKey(product);
    exposure.set(key, (exposure.get(key) ?? 0) + 1);
  }
  return selected;
}
