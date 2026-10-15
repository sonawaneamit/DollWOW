#!/usr/bin/env node
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { getFactoryCustomizationConfig } from '../lib/customization/configs.ts';
import { getDefaultSelections } from '../lib/customization/resolve.ts';
import { templateConfigSignature } from '../lib/customization/template-config-signature.ts';
import { shopifyStorefrontClient } from '../lib/shopify/storefront.ts';

const REGISTRY_PATH = 'lib/customization/evidence/template-release.json';

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).filter(([, item]) => item !== undefined)
        .sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])
    );
  }
  return value;
}

function digest(value) {
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

function templateRuntimeHash(product, config) {
  const { catalogIdentityKey, catalogBodyIdentityKey, brand, bodyType, material, heightCm, cupSize, bodyCode,
    headModel, stockStatus, customAvailable, irontechUlwEligibility } = product.extended;
  return digest({
    id: product.id, handle: product.handle, vendor: product.vendor, productType: product.productType,
    tags: [...product.tags].sort(),
    identity: { catalogIdentityKey, catalogBodyIdentityKey, brand, bodyType, material, heightCm, cupSize, bodyCode,
      headModel, stockStatus, customAvailable, irontechUlwEligibility },
    variants: product.variants, priceRange: product.priceRange,
    configId: config.id, menuSignature: templateConfigSignature(config), defaults: getDefaultSelections(config),
    labels: config.groups.map(group => ({ id: group.id, label: group.label, sourceLabel: group.sourceLabel,
      options: group.options.map(option => ({ id: option.id, label: option.label, sourceLabel: option.sourceLabel,
        priceLabel: option.priceLabel, productionNote: option.productionNote })) }))
  });
}

async function fetchProducts(tags) {
  const query = `tag:${tags.join(' OR tag:')}`;
  const products = await shopifyStorefrontClient.products({ query, first: 250 });
  return products.filter(p => tags.some(tag => p.tags.includes(tag)));
}

async function main() {
  console.log('Loading registry...');
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  console.log('Fetching FunWest and Top Fire products...');
  const products = await fetchProducts(['options:funwest-tpe-full-body-v1', 'options:top-fire-full-body-v1']);
  console.log(`Found ${products.length} products`);
  const updates = [];
  const existing = new Map(registry.payload.entries.map(e => [e.productId, e]));
  for (const product of products) {
    const entry = existing.get(product.id);
    if (!entry) continue;
    const config = getFactoryCustomizationConfig(product);
    const newHash = templateRuntimeHash(product, config);
    if (entry.runtimeHash !== newHash) {
      entry.runtimeHash = newHash;
      entry.handle = product.handle;
      updates.push({ handle: product.handle });
    }
  }
  if (updates.length === 0) {
    console.log('✓ No updates needed');
    return;
  }
  console.log(`Updating ${updates.length} entries`);
  const now = new Date().toISOString();
  const payloadHash = digest(registry.payload);
  registry.approvals.catalogCompatibility = {
    reviewedBy: 'Automated relink after Shopify data updates',
    reviewedAt: now,
    evidenceRef: `FunWest/Top Fire data refresh, ${updates.length} hashes relinked, ${now.split('T')[0]}`,
    payloadHash
  };
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n');
  console.log(`✓ Registry updated: ${updates.length} hashes relinked`);
}

main().catch(error => { console.error('Error:', error); process.exit(1); });
