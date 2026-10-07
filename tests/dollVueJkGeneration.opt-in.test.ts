import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import type { Product } from '@/types/product';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';

const state = vi.hoisted(() => ({
  products: new Map<string, Product>(), clearIds: new Set<string>(),
  registry: {} as Record<string, DollVueReadinessRecord>,
}));
vi.mock('@/lib/shopify/storefront', () => ({
  getProductByHandle: async (handle: string, options: { strict?: boolean }) => {
    if (!options.strict) throw new Error('Private fixture requires strict lookup');
    return state.products.get(handle) ?? null;
  },
}));
vi.mock('@/lib/dollvue/readiness-registry.json', () => ({ default: state.registry }));
vi.mock('@/lib/dollvue/currentHold', () => ({
  getCurrentDollVueHold: async (id: string) => state.clearIds.has(id) ? 'clear' : 'unavailable',
}));
vi.mock('@/lib/dollvue/session', () => ({ readDollVueSession: () => ({ email: 'qa@example.invalid' }) }));
vi.mock('@/lib/dollvue/accountUsage', () => ({
  dollVueUsageForEmail: async () => ({ available: true, remaining: 5 }),
  recordDollVuePreview: async () => true,
}));
vi.mock('@/lib/dollvue/email', () => ({
  sendDollVueLookEmail: async () => ({ delivered: false, provider: 'qa-no-mail' }),
}));

import { adminFetch } from '@/lib/shopify/admin';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { dollVueConfigForProduct } from '@/lib/dollvue/config';
import { productImageSources } from '@/lib/catalog/productImage';
import { dollVueReadinessFingerprint, evaluateDollVueReadiness } from '@/lib/dollvue/readiness';
import { normalizeReviewedImage } from '@/lib/dollvue/reviewedImages';
import { POST } from '@/app/dollvue/generate/route';

const root = '/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';
const output = path.join(root, 'jk-generation');
const mode = process.env.DOLLVUE_JK_GENERATION;
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const id = (suffix: string) => `gid://shopify/Product/${suffix}`;
const targets = [
  { id: id('10633051209912'), position: 1, sample: id('10633198731448') },
  { id: id('10633198731448'), position: 0, sample: id('10633198731448') },
  { id: id('10633198764216'), position: 0, sample: id('10633198731448') },
  { id: id('10633458745528'), position: 0, sample: id('10633458745528') },
  { id: id('10633458876600'), position: 0, sample: id('10633458745528') },
  { id: id('10633459007672'), position: 0, sample: id('10633458745528') },
  { id: id('10634073243832'), position: 0, sample: id('10634073243832') },
];
const sampleIds = [id('10633198731448'), id('10633458745528'), id('10634073243832')];
const eyeIds = [1,2,3,4,5,6,7,8,9,14,15,16,17,18].map(n => `no-${n}`);
type MappedNode = Parameters<typeof mapShopifyProduct>[0];
type SnapshotNode = Omit<MappedNode, 'variants' | 'priceRange'> & {
  status: string; updatedAt: string; publishedAt: string | null;
  hold: { value: string } | null;
  resourcePublications: { nodes: Array<{ isPublished: boolean }>; pageInfo: { hasNextPage: boolean } };
  variants: { edges: Array<{ node: Omit<Product['variants'][number], 'price'> & { price: string } }> };
};
type Preparation = {
  inputs: Array<{ file: string; sha256: string }>;
  records: DollVueReadinessRecord[];
  rows: Array<{ productId: string; handle: string; photos: Array<{
    sourcePosition: number; reference: string; sha256: string; selectable: boolean;
    technicalBindingProven: boolean; reviews: Array<{ file: string; sha256: string; status: string }>;
  }>; optionChecks: Array<{ groupId: string; optionId: string; reference: string; sha256: string;
    technicalBindingProven: boolean; review: { status: string }; transformProof: { matched: boolean } }> }>;
};
type Result = { productId: string; handle: string; status: number; output: string | null;
  outputSha256?: string; sourceDigest: string; referenceDigest: string; providerCalls: number; error?: string };
const read = async <T,>(name: string): Promise<T> => JSON.parse(await fs.readFile(name, 'utf8')) as T;
const save = (name: string, value: unknown) => fs.writeFile(path.join(output, name), JSON.stringify(value, null, 2), { mode: 0o600 });

// No generation, source-image helper, eligibility or image bytes are mocked.
// Only private draft lookup, identity/session, usage and email are test doubles.
it.skipIf(mode !== 'generate' && mode !== 'finalize')('samples three private JK families and binds seven private candidates', async () => {
  await fs.mkdir(output, { recursive: true, mode: 0o700 });
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dollwow.com').origin;
  expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);
  const prepFile = path.join(root, 'jk-private-preparation.json');
  const prep = await read<Preparation>(prepFile);
  const snapshotFile = path.join(root, 'shopify-snapshot.json');
  const snapshotBytes = await fs.readFile(snapshotFile);
  expect(hash(snapshotBytes)).toBe(prep.inputs.find(input => input.file === snapshotFile)?.sha256);
  const snapshot = JSON.parse(snapshotBytes.toString()) as { nodes: SnapshotNode[] };
  expect(prep.records).toHaveLength(9);
  const initialRegistry = hash(await fs.readFile('lib/dollvue/readiness-registry.json'));

  const nativeFetch = globalThis.fetch;
  let activeSample = '';
  const attempts: Array<{ productId: string; modelId: string; attemptedAt: string }> = [];
  // Reserve each real request durably before dispatch. Never retry a spent sample.
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = init?.method || (input instanceof Request ? input.method : 'GET');
    if (url.href === 'https://api.venice.ai/api/v1/image/multi-edit') {
      if (mode !== 'generate' || !activeSample || attempts.length >= 3 || attempts.some(a => a.productId === activeSample)) {
        throw new Error('Three-call budget or one-call-per-sample guard: no fallback/retry dispatched');
      }
      const body = JSON.parse(String(init?.body));
      expect(body.images).toHaveLength(2);
      expect(body.images.every((image: string) => image.startsWith('data:image/'))).toBe(true);
      attempts.push({ productId: activeSample, modelId: body.modelId, attemptedAt: new Date().toISOString() });
      await save('provider-budget.json', { maxCalls: 3, attempts });
    } else if (method !== 'GET' && method !== 'HEAD') {
      if (url.pathname.endsWith('/graphql.json')) {
        const body = JSON.parse(String(init?.body));
        if (!/^query\b/.test(body.query.trim()) || /\bmutation\b/.test(body.query)) throw new Error('Shopify writes prohibited');
      } else if (!url.pathname.endsWith('/admin/oauth/access_token')) throw new Error('Unexpected non-read request');
    }
    return nativeFetch(input, init);
  });

  try {
    const fields: Record<string, string> = {
      catalogIdentityKey: 'catalog_identity_key', catalogBodyIdentityKey: 'catalog_body_identity_key', headModel: 'head_model',
      displayName: 'display_name', bodyType: 'body_type', brand: 'brand', material: 'material', heightCm: 'height_cm',
      weightLb: 'weight_lb', cupSize: 'cup_size', measurements: 'measurements', stockStatus: 'stock_status',
      customAvailable: 'custom_available', irontechUlwEligibility: 'irontech_ulw_eligibility', customizationGroups: 'customization_groups',
    };
    const fresh = await adminFetch<{ nodes: SnapshotNode[] }>(`query JkPrivateReadOnly($ids:[ID!]!){nodes(ids:$ids){... on Product{
      id handle title description vendor productType tags status updatedAt publishedAt
      hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value}
      resourcePublications(first:30){nodes{isPublished} pageInfo{hasNextPage}}
      featuredImage{url altText width height} images(first:8){edges{node{url altText width height}}}
      variants(first:1){edges{node{id title price availableForSale selectedOptions{name value}}}}
      ${Object.entries(fields).map(([alias,key]) => `${alias}:metafield(namespace:"custom",key:"${key}"){value}`).join('\n')}
    }}}`, { ids: prep.records.map(record => record.productId) });
    expect(fresh.nodes).toHaveLength(9);
    const held = fresh.nodes.filter(node => !node || node.hold?.value?.trim() || node.tags.some(tag =>
      /age.*hold|safety.*hold|content.*hold|catalog-image-review-hold|not-for-launch-review/i.test(tag)));
    await save(`current-hold-audit-${mode}.json`, { checkedAt: new Date().toISOString(), count: fresh.nodes.length, held, rows: fresh.nodes.map(node => ({
      id: node?.id, handle: node?.handle, status: node?.status, updatedAt: node?.updatedAt, hold: node?.hold, tags: node?.tags,
    })), publicationChanged: false });
    expect(held, 'All nine JK drafts must have a fresh clear audit').toEqual([]);
    await save(`fresh-snapshot-${mode}.json`, { capturedAt: new Date().toISOString(), nodes: fresh.nodes });
    for (const node of fresh.nodes) {
      const prior = snapshot.nodes.find(item => item.id === node.id);
      expect(prior?.handle).toBe(node.handle);
      expect(node.status).toBe('DRAFT');
      expect(node.publishedAt).toBeNull();
      expect(node.resourcePublications.pageInfo.hasNextPage).toBe(false);
      expect(node.resourcePublications.nodes.every(p => !p.isPublished)).toBe(true);
      state.clearIds.add(node.id);
    }
    const records: Record<string, DollVueReadinessRecord> = {};
    for (const target of targets) {
      const node = fresh.nodes.find(item => item.id === target.id)!;
      const price = { amount: node.variants.edges[0]?.node.price || '0', currencyCode: 'USD' };
      const product = mapShopifyProduct({ ...node, priceRange: { minVariantPrice: price, maxVariantPrice: price },
        variants: { edges: node.variants.edges.map(({ node: variant }) => ({ node: {
          ...variant, price: { amount: variant.price, currencyCode: 'USD' },
        } })) } });
      const config = dollVueConfigForProduct(product, getCustomizationConfig(product));
      const prepared = prep.records.find(record => record.productId === target.id)!;
      expect(dollVueReadinessFingerprint(product, config), product.handle).toBe(prepared.fingerprint);
      const row = prep.rows.find(item => item.productId === target.id)!;
      const proof = row.photos.find(photo => photo.sourcePosition === target.position)!;
      expect(proof.selectable && proof.technicalBindingProven).toBe(true);
      expect(proof.reviews.some(review => review.status === 'PASS_VISUAL')).toBe(true);
      const source = productImageSources(product)[target.position];
      expect(source.url).toBe(proof.reference);
      const normalized = await normalizeReviewedImage({ url: source.url, sha256: proof.sha256, origin });
      const sourceBytes = Buffer.from(normalized.split(',')[1], 'base64');
      expect(hash(sourceBytes)).toBe(proof.sha256);
      await fs.writeFile(path.join(output, `source-${target.id.split('/').at(-1)}.image`), sourceBytes, { mode: 0o600 });
      const choices = prepared.choices.filter(choice => choice.groupId === 'eye-color' && eyeIds.includes(choice.optionId));
      expect(choices.map(choice => choice.optionId)).toEqual(eyeIds);
      const imageDigests: Record<string, string> = { [source.url]: proof.sha256 };
      for (const choice of choices) {
        const evidence = row.optionChecks.find(check => check.groupId === choice.groupId && check.optionId === choice.optionId)!;
        expect(evidence.reference).toBe(choice.reference);
        expect(evidence.technicalBindingProven && evidence.transformProof.matched).toBe(true);
        expect(evidence.review.status).toBe('PASS_THUMBNAIL_REVIEW');
        const bytes = await fs.readFile(path.join(process.cwd(), 'public', choice.reference));
        expect(hash(bytes)).toBe(evidence.sha256);
        imageDigests[choice.reference] = evidence.sha256;
      }
      records[target.id] = { ...prepared, status: 'needs-review', sourcePositions: [target.position], choices, imageDigests };
      expect(evaluateDollVueReadiness(product, config, { ...records[target.id], status: 'ready' },
        { published: false, privateReview: true, contentExcluded: false })).toMatchObject({ ready: true, publiclyAvailable: false, privatelyAvailable: true });
      state.products.set(product.handle, product);
    }
    const sharedEyes = records[targets[0].id].choices;
    expect(targets.every(target => JSON.stringify(records[target.id].choices) === JSON.stringify(sharedEyes))).toBe(true);
    for (const choice of sharedEyes) {
      await normalizeReviewedImage({ url: choice.reference, sha256: records[targets[0].id].imageDigests![choice.reference], origin, optionReference: true });
    }
    await save('prepared-record-candidates.json', { checkedAt: new Date().toISOString(), records, publicationAllowed: false,
      activationAllowed: false, sourcePreparationSha256: hash(await fs.readFile(prepFile)), sampleAssignment: targets });

    if (mode === 'generate') {
      // Existing reservation deliberately blocks accidental reruns, including after interruption.
      await fs.writeFile(path.join(output, 'generation-reservation.json'), JSON.stringify({ createdAt: new Date().toISOString(), maxCalls: 3 }), { flag: 'wx', mode: 0o600 });
      const results: Result[] = [];
      for (const productId of sampleIds) {
        const product = [...state.products.values()].find(product => product.id === productId)!;
        const record = records[productId];
        state.registry[productId] = { ...record, status: 'ready' };
        activeSample = productId;
        const before = attempts.length;
        let result: Result = { productId, handle: product.handle, status: 0, output: null,
          sourceDigest: record.imageDigests![productImageSources(product)[0].url],
          referenceDigest: record.imageDigests![record.choices.find(choice => choice.optionId === 'no-2')!.reference], providerCalls: 0 };
        try {
          const response = await POST(new Request(`${origin}/dollvue/generate`, { method: 'POST',
            headers: { origin, 'Content-Type': 'application/json', 'x-vercel-ip-country': 'US' },
            body: JSON.stringify({ productHandle: product.handle, sourcePosition: 0, selections: [{ groupId: 'eye-color', optionId: 'no-2' }] }),
          }));
          const payload = await response.json();
          result.status = response.status;
          result.error = payload.error;
          if (payload.previewDataUrl) {
            const bytes = Buffer.from(payload.previewDataUrl.split(',')[1], 'base64');
            result.output = path.join(output, `generated-${productId.split('/').at(-1)}.webp`);
            result.outputSha256 = hash(bytes);
            await fs.writeFile(result.output, bytes, { flag: 'wx', mode: 0o600 });
          }
          expect(payload.emailDelivered).toBe(false);
        } catch (error) { result.error = error instanceof Error ? error.message : 'Generation failed'; }
        result.providerCalls = attempts.length - before;
        results.push(result);
        await save('generation-results.json', { checkedAt: new Date().toISOString(), results, attempts,
          visualReview: 'pending', publicationChanged: false, customerMailSent: false, privateFixtures: true });
        console.log(JSON.stringify({ productId, status: result.status, providerCalls: result.providerCalls, output: result.output }));
      }
      expect(attempts.length).toBeLessThanOrEqual(3);
      expect(results.every(result => result.status === 200 && result.output && result.providerCalls === 1)).toBe(true);
    } else {
      const generated = await read<{ results: Result[] }>(path.join(output, 'generation-results.json'));
      const review = await read<{ accepted: boolean;
        sources: Array<{ productId: string; sourcePosition: number; sha256: string; verdict: string }>;
        samples: Array<{ productId: string; outputSha256: string; verdict: string }> }>(path.join(output, 'visual-review.json'));
      expect(review.accepted).toBe(true);
      const budget = await read<{ maxCalls: number; attempts: Array<{ productId: string }> }>(path.join(output, 'provider-budget.json'));
      expect(budget.maxCalls).toBe(3);
      expect(budget.attempts.map(attempt => attempt.productId)).toEqual(sampleIds);
      expect(review.sources).toHaveLength(7);
      for (const target of targets) {
        const sourceReview = review.sources.find(source => source.productId === target.id)!;
        const product = [...state.products.values()].find(product => product.id === target.id)!;
        expect(sourceReview.verdict).toBe('PASS_ADULT_NON_EXPLICIT_SOURCE');
        expect(sourceReview.sourcePosition).toBe(target.position);
        expect(sourceReview.sha256).toBe(records[target.id].imageDigests![productImageSources(product)[target.position].url]);
      }
      expect(generated.results.map(result => result.productId)).toEqual(sampleIds);
      for (const result of generated.results) {
        expect(result.status).toBe(200);
        expect(result.providerCalls).toBe(1);
        const verdict = review.samples.find(sample => sample.productId === result.productId)!;
        expect(verdict.verdict).toBe('PASS_MINOR_VARIATION_ACCEPTED');
        expect(hash(await fs.readFile(result.output!))).toBe(verdict.outputSha256);
        expect(result.outputSha256).toBe(verdict.outputSha256);
        const record = records[result.productId];
        const product = [...state.products.values()].find(product => product.id === result.productId)!;
        expect(record.imageDigests![productImageSources(product)[0].url]).toBe(result.sourceDigest);
        expect(record.imageDigests![record.choices.find(choice => choice.optionId === 'no-2')!.reference]).toBe(result.referenceDigest);
      }
      for (const record of Object.values(records)) record.status = 'ready';
      await save('reviewed-jk-record-candidates.json', { checkedAt: new Date().toISOString(), records,
        scope: 'Seven private draft candidates, 14 eye choices each; three actual family samples, not 98 individual generations.',
        visualReviewFile: path.join(output, 'visual-review.json'), sampleAssignment: targets,
        publicationAllowed: false, activationAllowed: false, registryChanged: false, retainedCatalogReviewHolds: true });
      expect(Object.values(records)).toHaveLength(7);
      expect(Object.values(records).every(record => record.choices.length === 14)).toBe(true);
      expect(attempts).toHaveLength(0);
    }
    expect(hash(await fs.readFile('lib/dollvue/readiness-registry.json'))).toBe(initialRegistry);
  } finally {
    vi.unstubAllGlobals();
    state.clearIds.clear();
    state.products.clear();
    for (const key of Object.keys(state.registry)) delete state.registry[key];
  }
}, 600_000);
