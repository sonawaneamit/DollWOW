import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { expect, it } from 'vitest';
import sharp from 'sharp';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { productImageSources } from '@/lib/catalog/productImage';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';
import { classifyAppearance, DOLLVUE_APPEARANCE_POLICY } from '@/lib/dollvue/appearance';
import { dollVueConfigForProduct } from '@/lib/dollvue/config';
import {
  dollVueReadinessFingerprint, evaluateDollVueReadiness, reviewedDollVueConfig,
  type DollVueReadinessRecord,
} from '@/lib/dollvue/readiness';
import type { Product } from '@/types/product';

// DOLLVUE_JK_PREPARATION=1 npm test -- tests/dollVueJkPreparation.opt-in.test.ts
// Fixed SSD inputs/output: no Shopify API, generation, registry writes or publication.
const exportsRoot = '/Volumes/Extreme Pro/Projects/DollWOW/data/exports';
const reviewRoot = path.join(exportsRoot, 'tdf-expansion-2026-10-03');
const snapshotRoot = path.join(exportsRoot, 'dollvue-readiness-2026-10-07');
const output = path.join(snapshotRoot, 'jk-private-preparation.json');
const repairRoot = '/Volumes/Extreme Pro/Projects/DollWOW-october-supplier-updates/data/exports/hotlink-repair-2026-10-06';
const enabled = process.env.DOLLVUE_JK_PREPARATION === '1';
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const expectedSourceHandles = new Set([
  '165cm-5ft5-g-cup-tpe-sex-doll-janice-malachi',
  '165cm-5ft5-g-cup-tpe-sex-doll-chue',
  '165cm-5ft5-g-cup-tpe-sex-doll-ruth-reed',
  '160cm-5ft3-c-cup-tpe-sex-doll-nicole-ivan',
  '160cm-5ft3-b-cup-tpe-sex-doll-maud-beck',
  '160cm-5ft3-e-cup-tpe-sex-doll-enid-billy',
  '160cm-5ft3-e-cup-tpe-sex-doll-malthus',
  '160cm-5ft3-b-cup-silicone-head-sex-doll-ina-simpson',
  '160cm-5ft3-b-cup-silicone-head-sex-doll-tina-veblen',
]);

type GalleryReview = {
  handle: string; index: number; file: string; sha256: string;
  status: string; method: string; findings: string; note?: string | null;
};
type OptionReview = {
  index: number; url: string; sha256: string; status: string; method: string; note: string;
};
type Gate = { gate: string; status: string; evidence: string };
type LedgerRow = {
  handle: string; status: string; publicationAllowed: boolean; gates: Gate[];
  shopify: { id: string; handle: string; status: string; publishedAt: string | null };
};
type PreviewProduct = Product & { sourceHandle: string; excludedFromDollWow: boolean };
type MappedNode = Parameters<typeof mapShopifyProduct>[0];
type SnapshotNode = Omit<MappedNode, 'variants' | 'priceRange'> & {
  status: string; publishedAt: string | null;
  resourcePublications: { nodes: unknown[]; pageInfo: { hasNextPage: boolean } };
  variants: { edges: Array<{ node: Omit<Product['variants'][number], 'price'> & { price: string } }> };
};
type ByteCheck = { sha256: string; bytes: number; checkedAt: string } | { error: string };
type GalleryManifest = { handle: string; images: Array<{
  index: number; sourceUrl: string; file: string; sha256: string;
}> };
type IngestionRecord = {
  sourceUrl: string; status: string; originalSha256: string; originalPath: string;
  assetSha256: string; assetPath: string; mime: string; aliasOf?: string;
};
type OptionFile = { url: string; file: string; sha256: string; index: number };
type ImportResult = { handle: string; status: string; productId: string };
type Pixels = { data: Buffer; width: number; height: number; channels: number };
const pixelPolicy = { maxRmse: 0.5, maxChannelDifference: 8, maxTileRmse: 1, tileSize: 32 };

// Actual side-by-side inspections on 2026-10-07, pinned to both input hashes.
// Reduced-resolution technical spot checks, not full-resolution/content approvals.
const visualSamples = [
  {
    "handle": "jk-dolls-janice-malachi-165cm-g-cup-tpe-companion-doll-14soz",
    "position": 1,
    "reviewIndex": 1,
    "sourceSha256": "1b1ef0997cb76d4a18cabf8096d01e46e1a3a75ca812a96dbaa4504d275b8da5",
    "ownedSha256": "6eadd461794617ea6271c8c424f7132cfa92992bf5eb21c9e57e8c58cfc89d48",
    "kind": "gallery"
  },
  {
    "handle": "jk-dolls-ina-simpson-160cm-b-cup-hybrid-companion-doll-kburx",
    "position": 3,
    "reviewIndex": 6,
    "sourceSha256": "dea30aac43761ef7f8620ee61b2827e01308d51d8a4cc10927eb3d9807800715",
    "ownedSha256": "5facbac1d4556346ac2bee860fd43722ac96a785f0b6a28a581d720c80722133",
    "kind": "gallery"
  },
  {
    "group": "skin-tone",
    "optionId": "white-skin",
    "sourceSha256": "35e8f03a2961ccdd3155f1b28f9d46e25d7fddc5f4057699d7dbc8aaf5f6885c",
    "ownedSha256": "577b9ffd6de5a9a9bd5895d6a655b00f9ed7151464b084ad5869bbe2cfffaf5d",
    "kind": "option"
  },
  {
    "group": "hairstyle",
    "optionId": "no-1",
    "sourceSha256": "ba833a9b6b1a1f8c88ce79ca94e1240ebadceca176435de000200ca456afaacd",
    "ownedSha256": "96c7325314f2bf566f5431795d959fed33f89f5452470b0c5fcde28b373e4b6e",
    "kind": "option"
  },
  {
    "group": "eye-color",
    "optionId": "no-1",
    "sourceSha256": "c1024e22f235598c9d3428b4fe8dc382bd113cdc91b23d5bcaa69f758c267845",
    "ownedSha256": "26b79427241b923ba66d850f17ed48dad045a762e11a6615f0c6237ff96a319c",
    "kind": "option"
  },
  {
    "group": "nail-color",
    "optionId": "pink",
    "sourceSha256": "fc931b72673ae133cec21ce5fa0b2f8f05119d9f23185e48410f9f061995733c",
    "ownedSha256": "9dc132b49b0433efd7ecfc21a5be7096a483784a682839dd32d3e205dd7a1ad1",
    "kind": "option"
  },
  {
    "group": "toe-nail-color",
    "optionId": "no-3",
    "sourceSha256": "0b392b37ee8e87b84dd872fe6afedbef18cfa7885c8f64447968babf25a64d97",
    "ownedSha256": "bb3e66d3637632ef62862ec790a75560594a493a3084c5d17d8fd970acced1b9",
    "kind": "option"
  }
];

async function pixels(input: Buffer): Promise<Pixels> {
  const { data, info } = await sharp(input, { limitInputPixels: 25_000_000, failOn: 'warning' })
    .autoOrient().toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

function comparePixels(left: Pixels, right: Pixels) {
  if (left.width !== right.width || left.height !== right.height || left.channels !== right.channels) {
    return { matched: false, reason: 'dimension-mismatch' } as const;
  }
  if (left.data.equals(right.data)) {
    return { matched: true, width: left.width, height: left.height, channels: left.channels,
      rmse: 0, normalizedRmse: 0, maxChannelDifference: 0, maxTileRmse: 0,
      sourcePixelSha256: sha256(left.data), ownedPixelSha256: sha256(right.data) };
  }
  let squared = 0, maximum = 0, worstTile = 0;
  const tilesWide = Math.ceil(left.width / pixelPolicy.tileSize);
  const tiles = new Float64Array(tilesWide * Math.ceil(left.height / pixelPolicy.tileSize));
  const counts = new Uint32Array(tiles.length);
  for (let index = 0; index < left.data.length; index++) {
    const difference = Math.abs(left.data[index] - right.data[index]);
    if (difference > pixelPolicy.maxChannelDifference) {
      return { matched: false, reason: 'channel-difference-limit', firstRejectedChannel: index, difference } as const;
    }
    squared += difference ** 2;
    maximum = Math.max(maximum, difference);
    const pixel = Math.floor(index / left.channels);
    const tile = Math.floor(Math.floor(pixel / left.width) / pixelPolicy.tileSize) * tilesWide +
      Math.floor((pixel % left.width) / pixelPolicy.tileSize);
    tiles[tile] += difference ** 2;
    counts[tile]++;
  }
  for (let index = 0; index < tiles.length; index++) worstTile = Math.max(worstTile, Math.sqrt(tiles[index] / counts[index]));
  const rmse = Math.sqrt(squared / left.data.length);
  return { matched: rmse <= pixelPolicy.maxRmse && maximum <= pixelPolicy.maxChannelDifference && worstTile <= pixelPolicy.maxTileRmse,
    width: left.width, height: left.height, channels: left.channels, rmse, normalizedRmse: rmse / 255,
    maxChannelDifference: maximum, maxTileRmse: worstTile,
    sourcePixelSha256: sha256(left.data), ownedPixelSha256: sha256(right.data) };
}

function galleryMatches(reviews: GalleryReview[], digest: string) {
  return reviews.filter(review => review.sha256 === digest);
}

function held(tags: string[], status: string) {
  // All nine drafts retain this general release hold; it is NOT cleared here.
  return tags.some(tag => tag !== 'catalog-review-hold' && /hold|held|excluded|blocked/i.test(tag)) ||
    /hold|held|excluded|blocked|fail|reject/i.test(status);
}

function heldGate(gate: Gate) {
  // This ledger state blocks production registration, not private evidence preparation.
  return gate.status !== 'PREPARED_BLOCKED' && held([], gate.status);
}

it('uses hashes, not original review indices, to identify reordered photos', () => {
  const reviews = [{ index: 11, sha256: 'a' }, { index: 2, sha256: 'b' }] as GalleryReview[];
  expect(['b', 'a', 'missing'].map(hash => galleryMatches(reviews, hash).map(r => r.index)))
    .toEqual([[2], [11], []]);
  expect(held(['catalog-review-hold'], 'DRAFT_CONTENT_PREPARED_RELEASE_GATES_OPEN')).toBe(false);
  expect(held(['catalog-review-hold', 'age-safety-hold'], 'DRAFT')).toBe(true);
  expect(held([], 'HOLD_UNSUITABLE_PRESENTATION')).toBe(true);
  expect(heldGate({ gate: 'Runtime registration', status: 'PREPARED_BLOCKED', evidence: '' })).toBe(false);
  const image = (url: string) => ({ url, width: 100, height: 100 });
  const sources = productImageSources({ featuredImage: image('featured'),
    images: [image('featured'), ...Array.from({ length: 9 }, (_, index) => image(`gallery-${index}`))],
  } as Product).slice(0, 8);
  expect(sources.map(source => source.url)).toEqual(['featured', ...Array.from({ length: 7 }, (_, index) => `gallery-${index}`)]);
});

it('rejects dimension changes, localized edits and unrelated pixels', () => {
  const sample: Pixels = { width: 64, height: 64, channels: 4, data: Buffer.alloc(64 * 64 * 4, 128) };
  expect(comparePixels(sample, sample).matched).toBe(true);
  expect(comparePixels(sample, { ...sample, width: 32, height: 128 }).matched).toBe(false);
  const changed = Buffer.from(sample.data);
  changed[0] = 255;
  expect(comparePixels(sample, { ...sample, data: changed }).matched).toBe(false);
  expect(comparePixels(sample, { ...sample, data: Buffer.alloc(changed.length, 120) }).matched).toBe(false);
});

it.skipIf(!enabled)('prepares exactly nine private JK records without approving or exposing them', async () => {
  const { decodeImage } = await import(pathToFileURL(path.resolve('scripts/ingest-option-assets.mjs')).href) as {
    decodeImage(bytes: Buffer, mime: string): Promise<{ output: Buffer }>;
  };
  const inputs: Array<{ file: string; sha256: string }> = [];
  async function read<T>(file: string): Promise<T> {
    const bytes = await fs.readFile(file);
    inputs.push({ file, sha256: sha256(bytes) });
    return JSON.parse(bytes.toString('utf8')) as T;
  }
  const snapshot = await read<{ capturedAt: string; nodes: SnapshotNode[] }>(path.join(snapshotRoot, 'shopify-snapshot.json'));
  const tpe = await read<{ records: GalleryReview[] }>(path.join(reviewRoot, 'jk-tpe-full-image-review.json'));
  const hybrid = await read<{ records: GalleryReview[] }>(path.join(reviewRoot, 'jk-hybrid-full-image-review.json'));
  const preview = await read<{ drafts: Array<{ status: string; product: PreviewProduct }> }>(path.join(reviewRoot, 'jk-local-preview-batch.json'));
  const ledger = await read<{ rows: LedgerRow[] }>(path.join(reviewRoot, 'jk-current-review-ledger.json'));
  const options = await read<{ records: OptionReview[]; coverage: Array<{ handle: string; missing: unknown[] }> }>(path.join(reviewRoot, 'jk-option-visual-review.json'));
  const optionFiles = await read<{ rows: OptionFile[] }>(path.join(reviewRoot, 'jk-option-image-checks.json'));
  const ingestion = await read<{ conversion: string; records: Record<string, IngestionRecord> }>(path.join(repairRoot, 'ingestion-manifest.json'));
  const assetMap = await read<Record<string, string | null>>(path.join(repairRoot, 'option-asset-map.json'));
  const readback = await read<{ results: Array<{ id: string; handle: string; status: string; mediaReady: boolean; media: number }> }>(path.join(reviewRoot, 'jk-complete-draft-readback.json'));
  const uploads = [];
  for (const prefix of ['jk-first', 'jk-next-four', 'catalog-next-four', 'jk-hybrid']) {
    const inputFile = path.join(reviewRoot, `${prefix}-shopify-draft-input.json`);
    const resultFile = path.join(reviewRoot, `${prefix}-shopify-draft-result.json`);
    uploads.push({ inputFile, resultFile, products: await read<PreviewProduct[]>(inputFile),
      results: (await read<{ results: ImportResult[] }>(resultFile)).results });
  }
  for (const file of ['scripts/ingest-option-assets.mjs', 'scripts/import-shopify-drafts.mjs', 'data/owned-option-assets.json',
    path.resolve(repairRoot, '../../../scripts/ingest-option-assets.mjs')]) {
    inputs.push({ file: path.resolve(file), sha256: sha256(await fs.readFile(file)) });
  }
  const reviews = [...tpe.records, ...hybrid.records];
  expect(preview.drafts).toHaveLength(10);
  expect(new Set(preview.drafts.map(draft => draft.product.handle)).size).toBe(10);
  const cache = new Map<string, ByteCheck>();
  const bodies = new Map<string, Buffer>();
  const maxBytes = 20 * 1024 * 1024;

  async function ownedBytes(reference: string): Promise<ByteCheck> {
    const cached = cache.get(reference);
    if (cached) return cached;
    let result: ByteCheck;
    try {
      if (!isOwnedOptionAsset(reference)) throw new Error('Not a recognized DollWOW-owned asset');
      if (cache.size >= 400) throw new Error('Bounded preparation request limit exceeded');
      const url = new URL(reference, 'https://www.dollwow.com');
      // No redirects or image transformations: hash the exact runtime reference bytes.
      const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20_000) });
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
        await response.body?.cancel();
        throw new Error(`Expected image response, received ${response.status}`);
      }
      if (Number(response.headers.get('content-length')) > maxBytes) {
        await response.body?.cancel();
        throw new Error('Image exceeds preparation byte limit');
      }
      if (!response.body) throw new Error('Missing response body');
      const reader = response.body.getReader();
      const chunks: Buffer[] = [];
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > maxBytes) throw new Error('Image exceeds preparation byte limit');
          chunks.push(Buffer.from(value));
        }
      } finally {
        await reader.cancel();
      }
      if (!size) throw new Error('Empty image');
      const body = Buffer.concat(chunks);
      bodies.set(reference, body);
      result = { sha256: sha256(body), bytes: size, checkedAt: new Date().toISOString() };
    } catch (error) {
      result = { error: error instanceof Error ? error.message : String(error) };
    }
    cache.set(reference, result);
    return result;
  }

  const records: DollVueReadinessRecord[] = [];
  const rows = [];
  const excluded = [];
  const failures: string[] = [];
  const optionBindings = new Map<string, {
    matched: boolean; method?: string; error?: string; sourceSha256?: string; ingestionOriginalSha256?: string;
    reproducedSha256?: string; ownedSha256?: string; ingestionReproducedSha256?: string;
    sourceFile?: string; originalPath?: string; localAssetPath?: string;
  }>();
  async function bindOption(review: OptionReview, reference: string, check: ByteCheck) {
    const key = `${review.sha256}:${reference}`;
    const cached = optionBindings.get(key);
    if (cached) return cached;
    let binding;
    try {
      if ('error' in check) throw new Error(check.error);
      const provenance = ingestion.records[review.url];
      if (!provenance || provenance.status !== 'mapped' || provenance.sourceUrl !== review.url ||
        provenance.assetPath !== reference || assetMap[review.url] !== reference) throw new Error('Missing exact ingestion mapping');
      const saved = optionFiles.rows.filter(item => item.url === review.url && item.sha256 === review.sha256);
      if (saved.length !== 1) throw new Error('Missing unique reviewed thumbnail file');
      if (!path.resolve(saved[0].file).startsWith(`${reviewRoot}/jk-option-image-review/`) ||
        !path.resolve(provenance.originalPath).startsWith(`${repairRoot}/originals/`)) throw new Error('Unexpected original path');
      const source = await fs.readFile(saved[0].file);
      const ingested = await fs.readFile(provenance.originalPath);
      if (sha256(source) !== review.sha256 || sha256(ingested) !== provenance.originalSha256) throw new Error('Original hash changed');
      if (!/^\/option-assets\/[a-f0-9]{64}\.webp$/.test(reference)) throw new Error('Unexpected owned option path');
      const localAssetPath = path.resolve('public', reference.slice(1));
      const local = await fs.readFile(localAssetPath);
      // Call only the pure exported decoder, never the ingestion/import entrypoints.
      const reproduced = await decodeImage(source, provenance.mime);
      const ingestionReproduced = await decodeImage(ingested, provenance.mime);
      const reproducedSha256 = sha256(reproduced.output);
      const ingestionReproducedSha256 = sha256(ingestionReproduced.output);
      const hashes = [reproducedSha256, ingestionReproducedSha256, sha256(local), check.sha256];
      if (!hashes.every(hash => hash === provenance.assetSha256)) throw new Error('Deterministic derivative hash mismatch');
      binding = { matched: true, method: 'reviewed-original-to-lossless-webp-reproduced',
        sourceSha256: review.sha256, ingestionOriginalSha256: provenance.originalSha256,
        reproducedSha256, ingestionReproducedSha256, ownedSha256: check.sha256,
        sourceFile: saved[0].file, originalPath: provenance.originalPath, localAssetPath };
    } catch (error) {
      binding = { matched: false, error: error instanceof Error ? error.message : String(error) };
    }
    optionBindings.set(key, binding);
    return binding;
  }
  for (const draft of preview.drafts) {
    const original = draft.product;
    const ledgerRows = ledger.rows.filter(row => row.handle === original.handle);
    expect(ledgerRows, `Unique ledger identity: ${original.handle}`).toHaveLength(1);
    const entry = ledgerRows[0];
    const nodes = snapshot.nodes.filter(node => node.id === entry.shopify.id && node.handle === original.handle);
    expect(nodes, `Unique snapshot identity: ${original.handle}`).toHaveLength(1);
    const node = nodes[0];
    const productReviews = reviews.filter(review => review.handle === original.sourceHandle);
    const reasons = [
      ...(/rupette/i.test(`${original.handle} ${original.sourceHandle}`) ? ['Rupette explicitly excluded'] : []),
      ...(!expectedSourceHandles.has(original.sourceHandle) ? ['Outside the nine-product preparation scope'] : []),
      ...(original.excludedFromDollWow ? ['Preview excludes product'] : []),
      ...(held([...original.tags, ...node.tags], entry.status) || entry.gates.some(heldGate) ||
        productReviews.some(review => held([], review.status)) ? ['Product or gallery held'] : []),
    ];
    if (reasons.length) {
      excluded.push({ handle: original.handle, productId: node.id, reasons });
      continue;
    }
    expect(draft.status).toBe('DRAFT');
    expect(node.status).toBe('DRAFT');
    expect(node.publishedAt).toBeNull();
    expect(node.resourcePublications.nodes).toEqual([]);
    expect(node.resourcePublications.pageInfo.hasNextPage).toBe(false);
    expect(entry.shopify.status).toBe('DRAFT');
    expect(entry.shopify.publishedAt).toBeNull();
    expect(entry.publicationAllowed).toBe(false);
    expect(node.brand?.value).toBe('JK Dolls');
    expect(productReviews).toHaveLength(12);
    expect(new Set(productReviews.map(review => review.index)).size).toBe(12);
    expect(productReviews.every(review => ['PASS_VISUAL', 'REVIEWED_WITH_EFFECTS_NOTE'].includes(review.status))).toBe(true);
    expect(options.coverage.filter(row => row.handle === original.handle && !row.missing.length)).toHaveLength(1);
    const uploadBatches = uploads.filter(batch => batch.results.some(result => result.handle === node.handle && result.productId === node.id && result.status === 'created_draft'));
    expect(uploadBatches).toHaveLength(1);
    const upload = uploadBatches[0];
    const uploadProducts = upload.products.filter(item => item.handle === node.handle && item.sourceHandle === original.sourceHandle);
    expect(uploadProducts).toHaveLength(1);
    expect(readback.results.filter(item => item.id === node.id && item.handle === node.handle && item.status === 'DRAFT' && item.mediaReady && item.media === 12)).toHaveLength(1);
    const manifestFile = path.join(reviewRoot, 'jk-gallery-review', original.sourceHandle, 'manifest.json');
    const galleryManifest = await read<GalleryManifest>(manifestFile);
    expect(galleryManifest.handle).toBe(original.sourceHandle);

    const price = { amount: node.variants.edges[0]?.node.price || '0', currencyCode: 'USD' };
    const product = mapShopifyProduct({ ...node, priceRange: { minVariantPrice: price, maxVariantPrice: price },
      variants: { edges: node.variants.edges.map(({ node: variant }) => ({ node: {
        ...variant, price: { amount: variant.price, currencyCode: 'USD' },
      } })) } });
    expect(product.extended.stockStatus).toBe('custom');
    const config = dollVueConfigForProduct(product, getCustomizationConfig(product));
    const before = JSON.stringify(config);
    const verifiedReviews: GalleryReview[] = [];
    const decodedOriginals = new Map<number, Pixels>();
    for (const review of productReviews) {
      expect(review.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(path.resolve(review.file).startsWith(`${reviewRoot}/jk-gallery-review/`)).toBe(true);
      try {
        const bytes = await fs.readFile(review.file);
        const actual = sha256(bytes);
        if (actual !== review.sha256) throw new Error('Original hash changed');
        decodedOriginals.set(review.index, await pixels(bytes));
        verifiedReviews.push(review);
      } catch (error) {
        failures.push(`${original.handle}: reviewed original ${review.index}: ${String(error)}`);
      }
    }

    const sourcePositions: number[] = [];
    const photos = [];
    // Runtime puts featuredImage first and deduplicates URLs; review.index is NOT this position.
    for (const [sourcePosition, photo] of productImageSources(product).slice(0, 8).entries()) {
      const check = await ownedBytes(photo.url);
      const exactMatches = 'sha256' in check ? galleryMatches(verifiedReviews, check.sha256) : [];
      const comparisons = [];
      let decodeError: string | undefined;
      if ('sha256' in check) {
        try {
          const currentPixels = await pixels(bodies.get(photo.url)!);
          for (const review of verifiedReviews) {
            comparisons.push({ reviewIndex: review.index, ...comparePixels(decodedOriginals.get(review.index)!, currentPixels) });
          }
        } catch (error) { decodeError = String(error); }
      }
      const pixelMatches = comparisons.filter(comparison => comparison.matched);
      const matchedReview = pixelMatches.length === 1 ? verifiedReviews.find(review => review.index === pixelMatches[0].reviewIndex) : undefined;
      const manifestImages = matchedReview ? galleryManifest.images.filter(item => item.index === matchedReview.index && item.sha256 === matchedReview.sha256 && item.file === matchedReview.file) : [];
      const sourceImage = manifestImages.length === 1 ? manifestImages[0] : undefined;
      const uploadPositions = sourceImage ? uploadProducts[0].images.flatMap((image, index) => image.url === sourceImage.sourceUrl ? [index] : []) : [];
      const bound = Boolean(matchedReview && sourceImage && uploadPositions.length === 1);
      const matches = bound ? [matchedReview!] : [];
      // Technical binding supplies candidate positions only, never a non-explicit-photo approval.
      const selectable = bound && matchedReview?.status === 'PASS_VISUAL';
      if (selectable) sourcePositions.push(sourcePosition);
      if (!bound) failures.push(`${original.handle}: source position ${sourcePosition} has no unique pixel-and-upload binding`);
      photos.push({ sourcePosition, reference: photo.url, ...check, exactReviewedByteMatch: exactMatches.length > 0,
        technicalBindingProven: bound,
        byteEvidence: 'error' in check ? 'fetch-failed' : bound ? exactMatches.length ? 'exact-match' : 'transformed-match' : 'unresolved',
        method: 'unique-full-resolution-normalized-pixels-plus-source-import-readback-chain',
        decodeError, comparisons, selectedPixelComparison: pixelMatches.length === 1 ? pixelMatches[0] : undefined,
        uploadProof: sourceImage ? { manifestFile, sourceUrl: sourceImage.sourceUrl, reviewedIndex: sourceImage.index,
          sourceSha256: sourceImage.sha256, inputFile: upload.inputFile, resultFile: upload.resultFile,
          productId: node.id, uploadPositions, ownedReference: photo.url } : undefined,
        selectable, selectionScope: 'technical-candidate-only', nonExplicitPhotoSelection: 'not-checked',
        reviews: matches, missingChecks: ['Non-explicit DollVue source-photo selection',
          ...(!bound ? ['Unique pixel-and-upload binding'] : []),
          ...(matchedReview?.status === 'REVIEWED_WITH_EFFECTS_NOTE' ? ['Effects-note source suitability/lead-image review'] : []),
        ] });
    }

    const choices: DollVueReadinessRecord['choices'] = [];
    const optionChecks = [];
    const excludedOptions = [];
    for (const group of config.groups) {
      for (const option of group.options) {
        const classification = classifyAppearance(group, option);
        if (group.visibleWhen?.length || classification.status !== 'candidate') {
          excludedOptions.push({ groupId: group.id, optionId: option.id,
            reason: group.visibleWhen?.length ? 'conditional-group' : classification.status === 'candidate' ? 'candidate' : classification.reason });
          continue;
        }
        const sourceGroup = original.extended.customizationGroups?.find(item => item.id === group.id);
        const sourceOption = sourceGroup?.options.find(item => item.id === option.id);
        const sourceReference = sourceOption?.swatch?.kind === 'image' ? sourceOption.swatch.value : undefined;
        const matchingReviews = options.records.filter(review => review.url === sourceReference);
        const reference = option.swatch?.kind === 'image' ? option.swatch.value : undefined;
        const review = matchingReviews.length === 1 ? matchingReviews[0] : undefined;
        if (review && review.status !== 'PASS_THUMBNAIL_REVIEW') {
          excludedOptions.push({ groupId: group.id, optionId: option.id, reason: review.status });
          continue;
        }
        const check: ByteCheck = reference ? await ownedBytes(reference) : { error: 'Missing runtime image swatch' };
        const exactMatch = Boolean(review && 'sha256' in check && check.sha256 === review.sha256);
        const binding = review && reference ? await bindOption(review, reference, check) : { matched: false, error: 'Missing reviewed reference' };
        const matches = binding.matched;
        if (matches && reference) choices.push({ groupId: group.id, optionId: option.id, reference });
        else failures.push(`${original.handle}: ${group.id}/${option.id} lacks a verified deterministic transform binding`);
        optionChecks.push({ groupId: group.id, groupLabel: group.label, optionId: option.id, optionLabel: option.label,
          reference, sourceReference, sourceGroupLabel: sourceGroup?.label, sourceOptionLabel: sourceOption?.label,
          classification, review, ...check, exactReviewedByteMatch: exactMatch, technicalBindingProven: matches, transformProof: binding,
          byteEvidence: !review ? 'missing-review' : 'error' in check ? 'fetch-failed' : matches ? exactMatch ? 'exact-match' : 'transformed-match' : 'unresolved',
          meaningReview: 'not-checked', fullResolutionReview: 'not-checked', generatedFidelity: 'not-checked' });
      }
    }
    const record: DollVueReadinessRecord = {
      productId: product.id, policy: DOLLVUE_APPEARANCE_POLICY,
      fingerprint: dollVueReadinessFingerprint(product, config), status: 'needs-review', sourcePositions, choices,
    };
    const readiness = evaluateDollVueReadiness(product, config, record, {
      published: false, privateReview: true, contentExcluded: false,
    });
    expect(readiness).toMatchObject({ ready: false, publiclyAvailable: false, privatelyAvailable: false, reason: 'needs-review' });
    for (const audience of ['public', 'private'] as const) {
      expect(reviewedDollVueConfig(config, readiness, audience).groups
        .every(group => group.options.every(option => option.dollVueEnabled === false))).toBe(true);
    }
    expect(JSON.stringify(config)).toBe(before);
    records.push(record);
    rows.push({ handle: product.handle, sourceHandle: original.sourceHandle, productId: product.id,
      status: node.status, publishedAt: node.publishedAt, retainedHoldTags: node.tags.filter(tag => /hold/i.test(tag)),
      verifiedOriginals: verifiedReviews.length, verifiedOriginalReviews: verifiedReviews, photos, optionChecks, excludedOptions, readiness,
      existingReleaseGates: entry.gates,
      missingChecks: [
        ...(photos.some(photo => !photo.technicalBindingProven) ? ['Current owned gallery binding to reviewed originals'] : []),
        ...(optionChecks.some(option => !option.technicalBindingProven) ? ['Owned option transform binding to reviewed thumbnails'] : []),
        'Non-explicit DollVue source-photo selection; prior catalog visual review is not this approval',
        'Non-explicit option-reference suitability; technical transforms do not certify presentation',
        'Per-choice meaning and factory compatibility review', 'Full-resolution option-reference review',
        'Generated-output fidelity against exact product/source/choice combinations',
        'Owner approval; all existing release gates remain in force',
        'Fresh Shopify state/publication check before any future activation'],
    });
  }
  const summary = {
    preparedRecords: records.length, excludedProducts: excluded.length,
    verifiedOriginals: rows.reduce((count, row) => count + row.verifiedOriginals, 0),
    galleryByteMatches: rows.reduce((count, row) => count + row.photos.filter(photo => photo.exactReviewedByteMatch).length, 0),
    galleryTransformedMatches: rows.reduce((count, row) => count + row.photos.filter(photo => photo.byteEvidence === 'transformed-match').length, 0),
    galleryReferencesChecked: rows.reduce((count, row) => count + row.photos.length, 0),
    preparedSourcePositions: records.reduce((count, record) => count + record.sourcePositions.length, 0),
    optionByteMatches: rows.reduce((count, row) => count + row.optionChecks.filter(option => option.exactReviewedByteMatch).length, 0),
    optionTransformedMatches: rows.reduce((count, row) => count + row.optionChecks.filter(option => option.byteEvidence === 'transformed-match').length, 0),
    optionReferencesChecked: rows.reduce((count, row) => count + row.optionChecks.length, 0),
    preparedChoices: records.reduce((count, record) => count + record.choices.length, 0),
    uniqueOwnedAssetsChecked: cache.size, failures: failures.length,
    uniqueOptionTransformsProven: [...optionBindings.values()].filter(binding => binding.matched).length,
    maxGalleryRmse: Math.max(...rows.flatMap(row => row.photos).map(photo => photo.selectedPixelComparison?.rmse ?? 0)),
  };
  const boundPhotoEvidence = rows.flatMap(row => row.photos);
  const visualSpotChecks = visualSamples.map(sample => {
    const evidence = sample.kind === 'gallery'
      ? boundPhotoEvidence.some(photo => photo.technicalBindingProven && 'sha256' in photo &&
        photo.sha256 === sample.ownedSha256 && photo.uploadProof?.sourceSha256 === sample.sourceSha256)
      : [...optionBindings.values()].some(binding => binding.matched && binding.sourceSha256 === sample.sourceSha256 && binding.ownedSha256 === sample.ownedSha256);
    return { ...sample, observedOn: '2026-10-07', evidenceStillBound: evidence,
      scope: 'Reduced-resolution side-by-side technical spot check; no full-resolution or non-explicit suitability pass.',
      observation: 'No visible framing, color, detail or overlay change observed in this pair at inspected scale.' };
  });
  const report = {
    checkedAt: new Date().toISOString(), snapshotCapturedAt: snapshot.capturedAt,
    scope: 'Private preparation only, using the supplied snapshot and current GET bytes at its owned image URLs. Not a fresh Shopify catalog read or generation/meaning/fidelity approval.',
    holdPolicy: 'Rupette and specific held/excluded products, galleries and options excluded. The general catalog-review-hold is retained on all prepared drafts, never cleared.',
    fingerprintPolicy: 'Existing readiness fingerprint used unchanged; price and private provenance are intentionally excluded.',
    transformPolicy: { optionConversion: ingestion.conversion, implementation: 'scripts/ingest-option-assets.mjs:decodeImage (pure function only)',
      sharpVersions: sharp.versions, galleryNormalization: 'EXIF auto-orientation, sRGB RGBA, original dimensions; no resizing, cropping or alignment search',
      pixelPolicy, pixelUnits: '8-bit channel values, 0-255; thresholds fixed before the full run',
      evidenceLimit: 'Pixel equivalence and upload provenance establish technical binding, not meaning, non-explicit suitability, generated fidelity or publication approval.' },
    visualSampleGuidance: 'Inspect source/owned pairs at full resolution, including the highest-RMSE gallery, reordered gallery positions, TPE and hybrid examples, and each option category. Check framing, face/body details, overlays, color and artifacts. This report does not infer a visual pass from metrics.',
    visualSpotChecks,
    publicationAllowed: false, activationAllowed: false, inputs, summary, records, rows, excluded, failures,
  };
  // Restrictive permissions, no directory creation, and no arbitrary output path override.
  await fs.writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  await fs.chmod(output, 0o600);
  console.log(JSON.stringify({ output, ...summary }));
  expect(records).toHaveLength(9);
  expect(new Set(records.map(record => record.productId)).size).toBe(9);
  expect(new Set(rows.map(row => row.sourceHandle))).toEqual(expectedSourceHandles);
  expect(visualSpotChecks.every(sample => sample.evidenceStillBound)).toBe(true);
  expect(failures.length, 'See private report for exact missing byte evidence').toBe(0);
  expect(records.every(record => record.status === 'needs-review' && record.sourcePositions.length > 0 && record.choices.length > 0)).toBe(true);
}, 900_000);
