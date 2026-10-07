import { createHash } from 'node:crypto';
import { mkdir, open, readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, it, vi } from 'vitest';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { productImageSources } from '@/lib/catalog/productImage';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';
import { classifyAppearance } from '@/lib/dollvue/appearance';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';
import type { Product } from '@/types/product';

const root = '/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';
const output = path.join(root, 'shared-eye-family-inventory.json');
type MappedNode = Parameters<typeof mapShopifyProduct>[0];
type SnapshotNode = Omit<MappedNode, 'variants' | 'priceRange'> & {
  status: string; publishedAt: string | null;
  resourcePublications: { nodes: unknown[]; pageInfo: { hasNextPage: boolean } };
  variants: { edges: Array<{ node: Omit<Product['variants'][number], 'price'> & { price: string } }> };
};
type HoldRow = { id: string; status: string; tags: string[]; hold: { value: string } | null };

function exclusionReasons(product: Product, hold: HoldRow, record?: DollVueReadinessRecord) {
  const tags = [...product.tags, ...hold.tags];
  const reasons: string[] = [];
  if (product.extended.stockStatus === 'ready_to_ship' || tags.some(tag => /^ready[-_ ]to[-_ ]ship$/i.test(tag)) ||
    /ready[- ]to[- ]ship/i.test(product.productType)) reasons.push('ready-to-ship');
  const identity = `${product.productType} ${product.title} ${product.handle}`;
  if (/\btorso\b/i.test(identity) || tags.some(tag => /^torso$/i.test(tag)) ||
    String(product.extended.bodyType).toLowerCase() === 'torso') reasons.push('torso');
  if (/\b(head[- ]only|replacement[- ]head|standalone[- ]head|sex[- ]doll[- ]heads?)\b/i.test(identity) ||
    /^(head|heads|doll heads?|sex doll heads?)$/i.test(product.productType.trim()) ||
    tags.some(tag => /^(head|heads|head-only|head_only)$/i.test(tag))) reasons.push('head-only');
  if (hold.hold?.value.trim() || record?.status === 'excluded' || tags.some(tag =>
    tag !== 'catalog-review-hold' && /hold|held|excluded|blocked|not-for-launch/i.test(tag))) reasons.push('specific-hold');
  if (/^system\b|accessor|customization|charge|upgrade/i.test(product.productType) ||
    tags.some(tag => /^(dollwow-system|custom-option-charge|dollwow-test)$/i.test(tag))) reasons.push('non-catalog-product');
  return reasons;
}

it.skipIf(process.env.DOLLVUE_SHARED_EYE_INVENTORY !== '1')('inventories exact reviewed eye-reference families without any network or readiness promotion', async () => {
  const network = vi.fn(() => { throw new Error('Network forbidden in cached family inventory'); });
  vi.stubGlobal('fetch', network);
  try {
    const inputs: Array<{ file: string; sha256: string }> = [];
    async function read<T>(file: string): Promise<T> {
      const bytes = await readFile(file);
      inputs.push({ file, sha256: createHash('sha256').update(bytes).digest('hex') });
      return JSON.parse(bytes.toString('utf8')) as T;
    }
    const snapshot = await read<{ capturedAt: string; nodes: SnapshotNode[] }>(path.join(root, 'shopify-snapshot.json'));
    const holds = await read<{ checkedAt: string; rows: HoldRow[] }>(path.join(root, 'current-holds.json'));
    const privatePreparation = await read<{ excluded: Array<{ productId: string; reasons: string[] }> }>(path.join(root, 'jk-private-preparation.json'));
    const privateExclusions = new Map(privatePreparation.excluded.map(row => [row.productId, row.reasons]));
    const registry = await read<Record<string, DollVueReadinessRecord>>(path.resolve('lib/dollvue/readiness-registry.json'));
    const holdById = new Map(holds.rows.map(row => [row.id, row]));
    expect(new Set(snapshot.nodes.map(node => node.id)).size).toBe(snapshot.nodes.length);
    expect(holdById.size).toBe(holds.rows.length);
    expect(snapshot.nodes.every(node => holdById.has(node.id))).toBe(true);
    const families = [
      { name: 'WM14', seedProductId: 'gid://shopify/Product/10431698337976', expectedCount: 14 },
      { name: 'SE4', seedProductId: 'gid://shopify/Product/10433981612216', expectedCount: 4 },
    ].map(family => {
      const record = registry[family.seedProductId];
      expect(record?.status).toBe('ready');
      const references = [...new Set(record.choices.filter(choice => choice.groupId === 'eye-color').map(choice => choice.reference))];
      expect(references).toHaveLength(family.expectedCount);
      expect(references.every(isOwnedOptionAsset)).toBe(true);
      return { ...family, references, referenceSet: new Set(references) };
    });
    const rows = [];
    const excluded = [];
    const unmatched = [];
    const errors: Array<{ productId: string; handle: string; error: string }> = [];
    const statusCounts: Record<string, number> = {};
    for (const node of snapshot.nodes) {
      statusCounts[node.status] = (statusCounts[node.status] ?? 0) + 1;
      try {
        const price = { amount: node.variants.edges[0]?.node.price || '0', currencyCode: 'USD' };
        const product = mapShopifyProduct({ ...node, priceRange: { minVariantPrice: price, maxVariantPrice: price },
          variants: { edges: node.variants.edges.map(({ node: variant }) => ({ node: {
            ...variant, price: { amount: variant.price, currencyCode: 'USD' },
          } })) } });
        const identity = { productId: product.id, handle: product.handle,
          brand: product.extended.brand || product.vendor, status: node.status };
        const reasons = exclusionReasons(product, holdById.get(node.id)!, registry[node.id]);
        if (privateExclusions.has(node.id)) reasons.push('specific-private-exclusion');
        if (!['ACTIVE', 'DRAFT'].includes(node.status)) reasons.push('outside-active-draft');
        if (reasons.length) { excluded.push({ ...identity, reasons, privateReasons: privateExclusions.get(node.id) }); continue; }
        const config = getCustomizationConfig(product);
        const candidateEyes = config.groups.flatMap(group => group.options.flatMap(option => {
          const classification = classifyAppearance(group, option);
          if (classification.status !== 'candidate' || classification.attribute !== 'eye-color' || option.swatch?.kind !== 'image') return [];
          return [{ groupId: group.id, groupLabel: group.label, optionId: option.id, optionLabel: option.label,
            reference: option.swatch.value, conditional: Boolean(group.visibleWhen?.length),
            visibleWhen: group.visibleWhen, factoryExists: option.factoryExists, displayable: option.displayable }];
        }));
        const matches = families.flatMap(family => {
          const choices = candidateEyes.filter(choice => family.referenceSet.has(choice.reference));
          if (!choices.length) return [];
          const matched = new Set(choices.map(choice => choice.reference));
          return [{ family: family.name, coverage: matched.size === family.expectedCount ? 'full-reviewed-set' : 'partial-reviewed-set',
            matchedReferenceCount: matched.size, reviewedReferenceCount: family.expectedCount,
            missingReviewedReferences: family.references.filter(reference => !matched.has(reference)), candidateEyeChoices: choices }];
        });
        if (!matches.length) { unmatched.push({ ...identity, resolvedEyeChoices: candidateEyes.length }); continue; }
        const sources = productImageSources(product);
        const position = sources.findIndex(photo => isOwnedOptionAsset(photo.url));
        rows.push({ ...identity, evidence: 'family-match-only', configId: config.id, publishedAt: node.publishedAt,
          publicationCountInSnapshot: node.resourcePublications.nodes.length,
          publicationListTruncated: node.resourcePublications.pageInfo.hasNextPage,
          generalCatalogReviewHold: [...product.tags, ...holdById.get(node.id)!.tags].includes('catalog-review-hold'),
          firstOwnedSource: position < 0 ? null : { position, ...sources[position], withinFirstEight: position < 8 }, matches });
      } catch (error) {
        errors.push({ productId: node.id, handle: node.handle, error: error instanceof Error ? error.message : String(error) });
      }
    }
    const groups = new Map<string, { family: string; brand: string; status: string; products: number;
      fullReviewedSet: number; partialReviewedSet: number; candidateChoices: number; productIds: string[] }>();
    for (const row of rows) for (const match of row.matches) {
      const key = JSON.stringify([match.family, row.brand, row.status]);
      const group = groups.get(key) ?? { family: match.family, brand: row.brand, status: row.status,
        products: 0, fullReviewedSet: 0, partialReviewedSet: 0, candidateChoices: 0, productIds: [] };
      group.products++;
      if (match.coverage === 'full-reviewed-set') group.fullReviewedSet++; else group.partialReviewedSet++;
      group.candidateChoices += match.candidateEyeChoices.length;
      group.productIds.push(row.productId);
      groups.set(key, group);
    }
    const byFamilyBrandStatus = [...groups.values()].sort((a, b) =>
      a.family.localeCompare(b.family) || a.brand.localeCompare(b.brand) || a.status.localeCompare(b.status));
    const summary = { snapshotProducts: snapshot.nodes.length, statusCounts, excludedProducts: excluded.length,
      resolvedNonExcludedProducts: rows.length + unmatched.length, matchingProducts: rows.length,
      unmatchedProducts: unmatched.length, mappingOrResolutionErrors: errors.length,
      matchingProductsWithoutOwnedSource: rows.filter(row => !row.firstOwnedSource).length,
      byFamilyBrandStatus: byFamilyBrandStatus.map(group => ({ family: group.family, brand: group.brand, status: group.status,
        products: group.products, fullReviewedSet: group.fullReviewedSet, partialReviewedSet: group.partialReviewedSet,
        candidateChoices: group.candidateChoices })) };
    const report = { generatedAt: new Date().toISOString(), snapshotCapturedAt: snapshot.capturedAt,
      holdsCapturedAt: holds.checkedAt, evidence: 'family-match-only',
      scope: 'All ACTIVE/DRAFT records in the cached snapshot resolved with current getCustomizationConfig. Exact reference URL equality only; not readiness, per-product visual approval, fresh hold/publication proof, or asset byte verification.',
      matchingPolicy: 'Report any exact WM14/SE4 overlap and distinguish full from partial reviewed-set coverage. Option IDs and brands need not match. Conditional choices are flagged, not authorized.',
      exclusionPolicy: 'RTS, head-only, torso, specific cached/private or registry exclusions, and non-catalog products. A general catalog-review-hold alone is retained for private draft inventory.',
      sourcePolicy: 'First owned URL in current source order; no image fetched or inspected. First-eight position eligibility is indicated, not granted.',
      networkCalls: 0, generationCalls: 0, registryChanged: false, trackerChanged: false, publicationChanged: false,
      inputs, families: families.map(family => ({ name: family.name, seedProductId: family.seedProductId,
        expectedCount: family.expectedCount, references: family.references })), summary, byFamilyBrandStatus, rows, excluded, unmatched, errors };
    await mkdir(root, { recursive: true, mode: 0o700 });
    const file = await open(output, 'w', 0o600);
    try { await file.chmod(0o600); await file.writeFile(JSON.stringify(report, null, 2)); } finally { await file.close(); }
    console.log(JSON.stringify({ output, ...summary }));
    expect(errors).toEqual([]);
    expect(rows.length + excluded.length + unmatched.length + errors.length).toBe(snapshot.nodes.length);
    expect(rows.some(row => row.productId === families[0].seedProductId)).toBe(true);
    expect(rows.some(row => row.productId === families[1].seedProductId)).toBe(true);
    expect(network).not.toHaveBeenCalled();
  } finally { vi.unstubAllGlobals(); }
}, 120_000);
