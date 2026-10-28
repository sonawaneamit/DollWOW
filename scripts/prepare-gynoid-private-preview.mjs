import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { ownedOptionGroups } from '../lib/assets/option-assets.mjs';

const [sourceDirectory, readbackFile] = process.argv.slice(2);
assert(sourceDirectory && readbackFile, 'Provide retained source directory and fresh Admin readback');
const batch = JSON.parse(await fs.readFile(path.join(sourceDirectory, 'gynoid-local-preview-batch.json')));
const readback = JSON.parse(await fs.readFile(readbackFile));
assert.equal(readback.products.pageInfo.hasNextPage, false);
assert.equal(batch.drafts.length, 11);
const recipes = {};
const rules = {};
const products = batch.drafts.map(({ product: previous, templateRecipe }) => {
  const saved = readback.products.nodes.find(p => p.handle === previous.handle);
  assert(saved && saved.status === 'DRAFT');
  assert(saved.resourcePublications.nodes.every(p => !p.isPublished));
  assert.equal(saved.media.pageInfo.hasNextPage, false);
  const meta = Object.fromEntries(saved.metafields.nodes.filter(m => m.namespace === 'custom').map(m => [m.key, m.value]));
  const groups = ownedOptionGroups(JSON.parse(meta.customization_groups));
  assert.deepEqual(groups, ownedOptionGroups(previous.extended.customizationGroups));
  const images = saved.media.nodes.map(m => {
    assert.equal(m.status, 'READY');
    assert.equal(new URL(m.image.url).hostname, 'cdn.shopify.com');
    return { url: m.image.url, altText: m.alt || saved.title, width: m.image.width, height: m.image.height };
  });
  const amount = saved.variants.nodes[0].price;
  assert.equal(Number(amount), Number(previous.priceRange.minVariantPrice.amount));
  const id = `preview:gynoid:${saved.id.split('/').pop()}`;
  const money = { amount, currencyCode: 'USD' };
  const extended = Object.fromEntries(['brand', 'displayName', 'headModel', 'bodyType', 'bodyCode', 'material', 'heightCm', 'cupSize', 'weightLb', 'measurements', 'stockStatus', 'warehouseCountry', 'customAvailable', 'editorialIntro'].filter(k => previous.extended[k] !== undefined).map(k => [k, previous.extended[k]]));
  recipes[previous.handle] = { tag: templateRecipe.tag, tiers: templateRecipe.tiers };
  rules[id] = previous.extended.previewCustomizationRules ?? [];
  return {
    id, handle: saved.handle, title: saved.title, description: previous.description,
    vendor: 'Gynoid', productType: previous.productType,
    tags: [...new Set([...saved.tags, 'dollwow-test'])],
    featuredImage: images[0], images,
    variants: [{ id: `preview:variant:gynoid:${saved.variants.nodes[0].id.split('/').pop()}`, title: 'Base custom build', availableForSale: false, price: money, selectedOptions: saved.variants.nodes[0].selectedOptions }],
    priceRange: { minVariantPrice: money, maxVariantPrice: money }, seo: saved.seo,
    extended: { ...extended, brand: 'Gynoid', customizationGroups: groups, previewCustomizationFixture: true }
  };
});
assert.equal(products.reduce((n, p) => n + p.images.length, 0), 94);
await fs.mkdir('data/draft-previews', { recursive: true });
for (const [name, value] of Object.entries({ 'gynoid-oct28': products, 'gynoid-oct28-recipes': recipes, 'gynoid-oct28-rules': rules })) {
  await fs.writeFile(`data/draft-previews/${name}.json`, JSON.stringify(value, null, 2) + '\n');
}
console.log(JSON.stringify({ products: products.length, images: 94, shopifyWrites: 0 }));
