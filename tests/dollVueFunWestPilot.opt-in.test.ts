import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { expect, it, vi } from 'vitest';
import type { Product } from '@/types/product';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';

const state = vi.hoisted(() => ({ armed: false, product: null as Product | null,
  registry: {} as Record<string, DollVueReadinessRecord> }));
vi.mock('@/lib/dollvue/readiness-registry.json', () => ({ default: state.registry }));
vi.mock('@/lib/shopify/storefront', async importOriginal => {
  const original = await importOriginal<typeof import('@/lib/shopify/storefront')>();
  return { ...original, getProductByHandle: (...args: Parameters<typeof original.getProductByHandle>) => {
    if (state.armed && args[0] === state.product?.handle) {
      expect(args[1]?.strict).toBe(true);
      return Promise.resolve(state.product);
    }
    return original.getProductByHandle(...args);
  } };
});
vi.mock('@/lib/dollvue/session', () => ({ readDollVueSession: () => ({ email: 'qa@example.invalid' }) }));
vi.mock('@/lib/dollvue/accountUsage', () => ({
  dollVueUsageForEmail: async () => ({ available: true, remaining: 5 }), recordDollVuePreview: async () => true,
}));
vi.mock('@/lib/dollvue/email', () => ({ sendDollVueLookEmail: async () => ({ delivered: false, provider: 'qa-no-mail' }) }));

import { POST as generate } from '@/app/dollvue/generate/route';
import { POST as cart } from '@/app/dollvue/cart/route';
import { getProductByHandle } from '@/lib/shopify/storefront';
import { adminFetch } from '@/lib/shopify/admin';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { getCurrentDollVueHolds } from '@/lib/dollvue/currentHold';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';
import { dollVueReadinessFingerprint, evaluateDollVueReadiness } from '@/lib/dollvue/readiness';
import { productImageSources } from '@/lib/catalog/productImage';
import { normalizeReviewedImage } from '@/lib/dollvue/reviewedImages';
import { env } from '@/lib/utils/env';
import { dollVueConfigForProduct } from '@/lib/dollvue/config';
import { isDollVueExcluded } from '@/lib/dollvue/eligibility';

const root = '/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/funwest-eye-family-preparation';
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const pinSchema = z.object({ file: z.string(), sha256: digest });
const choiceSchema = z.object({ groupId: z.enum(['eye-color', 'hairstyle']), optionId: z.string().min(1),
  reference: z.string().regex(/^\/option-assets\/[a-f0-9]{64}\.webp$/), sha256: digest });
const approvalSchema = z.object({ frozen: z.literal(true), reviewer: z.literal('parent-assistant'),
  ownerReviewed: z.literal(false), humanReviewed: z.literal(false), approved: z.literal(true),
  adultNonExplicit: z.literal(true), maxProviderCalls: z.literal(1), brand: z.enum(['FunWest', 'FunWestAqua']),
  productId: z.string(), sourcePosition: z.number().int(), sourceSha256: digest,
  proposal: pinSchema, sourceReview: pinSchema, referenceReview: pinSchema,
  choices: z.array(choiceSchema).length(1), requestSha256: digest, inputSheet: pinSchema,
});
const candidates = {
 FunWest: { id: 'gid://shopify/Product/10634264969400', brand: 'FunWest Dolls', position: 0,
 handle: 'funwest-dolls-candace-155cm-f-cup-tpe-companion-doll-1xxu4',
 sourceSha256: '23bf5288b0ad1195685a7b4653d4700e6eaf71b864974cecaf73785dfd783064',
 choices: [['eye-color','blue','0709bdb7fd60b3285fc05f60c09b30cd94d988e8c8cb2a4aede3762b7f7f9839']],
 requestSha256: '608f90ecc2edf698d3da5e3d1a20e6fd89001f8ac17e80e6e4247dc62f2405ec', outputFile: 'blue.webp' },
 FunWestAqua: { id: 'gid://shopify/Product/10634722443448', brand: 'FunWest Dolls', position: 0,
 handle: 'funwest-dolls-lexie-168cm-d-cup-silicone-companion-doll-qgq4t',
 sourceSha256: '293811998eee411ff757480da78375455fcc78df4a9e7bcaafd4cc70c3cd52fa',
 choices: [['eye-color','aqua','32ccf2d289be78dfcd7b8ea5304ce1a23d9f0c8242c20c06039f1df9ef87f73a']],
 requestSha256: 'ffbd9d21592bf37bad13f9138ff75fdcdaad9355340bfe4598e5da1aaeac7226', outputFile: 'aqua.webp' }
} as const;
function validateApproval(value: unknown) {
  const a = approvalSchema.parse(value), c = candidates[a.brand];
  expect([a.productId, a.sourcePosition, a.sourceSha256]).toEqual([c.id, c.position, c.sourceSha256]);
  expect(a.choices.map(choice => choice.groupId).sort()).toEqual(['eye-color']);
  expect(a.choices.map(choice => [choice.groupId, choice.optionId, choice.sha256])).toEqual(c.choices);
  for (const choice of a.choices) expect(choice.reference).toBe(`/option-assets/${choice.sha256}.webp`);
  expect(a.requestSha256).toBe(c.requestSha256);
  return a;
}
type MappedNode = Parameters<typeof mapShopifyProduct>[0];
type AdminNode = Omit<MappedNode, 'priceRange' | 'variants'> & {
  status: string; publishedAt: string | null; tags: string[];
  resourcePublications: { nodes: Array<{ isPublished: boolean }>; pageInfo: { hasNextPage: boolean } };
  variants: { edges: Array<{ node: Omit<MappedNode['variants']['edges'][number]['node'], 'price'> & { price: string } }> };
};
const fields: Record<string, string> = {
  catalogIdentityKey:'catalog_identity_key',catalogBodyIdentityKey:'catalog_body_identity_key',headModel:'head_model',
  displayName:'display_name',bodyType:'body_type',lookTags:'look_tags',brand:'brand',sourceTitle:'source_title',
  sourceHandle:'source_handle',sourceReleaseRank:'source_release_rank',material:'material',heightCm:'height_cm',
  weightLb:'weight_lb',cupSize:'cup_size',measurements:'measurements',warehouseCountry:'warehouse_country',
  warehouseRegions:'warehouse_regions',stockStatus:'stock_status',deliveryEstimate:'delivery_estimate',
  stockLastCheckedAt:'stock_last_checked_at',customAvailable:'custom_available',penisAddOnAvailable:'has_insertable_penis_add_on',
  irontechUlwEligibility:'irontech_ulw_eligibility',qcNote:'qc_note',customizationGroups:'customization_groups',
};
const query = `query DraftBrandPilot($ids:[ID!]!){nodes(ids:$ids){... on Product{
  id handle title description seo{title description} vendor productType tags status publishedAt
  resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}}
  featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}}
  variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}}
  media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}}
    ... on Video{preview{image{url altText width height}} sources{url mimeType}}}}}
  ${Object.entries(fields).map(([alias,key])=>`${alias}:metafield(namespace:"custom",key:"${key}"){value}`).join('\n')}
}} shop{currencyCode}}`;

it('requires frozen assistant pins, exact sources, and exactly one iris choice', () => {
  const p = { file: '/private/evidence.json', sha256: 'a'.repeat(64) };
  const a = { frozen: true, reviewer: 'parent-assistant', ownerReviewed: false, humanReviewed: false,
    approved: true, adultNonExplicit: true, maxProviderCalls: 1, brand: 'FunWest',
    productId: candidates.FunWest.id, sourcePosition: 0, sourceSha256: candidates.FunWest.sourceSha256,
    proposal: p, sourceReview: p, referenceReview: p, inputSheet: p, requestSha256: '608f90ecc2edf698d3da5e3d1a20e6fd89001f8ac17e80e6e4247dc62f2405ec', choices: candidates.FunWest.choices.map(([groupId, optionId, hash]) => ({
      groupId, optionId, reference: `/option-assets/${hash}.webp`, sha256: hash,
    })) };
  expect(() => validateApproval(a)).not.toThrow();
  for (const change of [{ frozen: false }, { ownerReviewed: true }, { humanReviewed: true },
    { reviewer: 'owner' }, { maxProviderCalls: 2 }, { sourcePosition: 3 }, { sourceSha256: p.sha256 },
    { choices: [a.choices[0], a.choices[0]] }, { choices: [] }, { requestSha256: p.sha256 }]) {
    expect(() => validateApproval({ ...a, ...change })).toThrow();
  }
});

// DOLLVUE_FUNWEST_PILOT=FunWest|FunWestAqua and DOLLVUE_FUNWEST_PILOT_APPROVAL=<frozen private JSON>.
// Approval binds the final proposal, source review, reference review and one selected reference.
// Reservations have fixed per-brand paths and survive every failure. Never retry by deleting them.
it.skipIf(!process.env.DOLLVUE_FUNWEST_PILOT)('runs one bounded private draft iris pilot', async () => {
  const pins: Array<z.infer<typeof pinSchema>> = [];
  async function bytes(file: string, hash?: string) {
    const real = await fs.realpath(file);
    expect(real.startsWith(`${await fs.realpath(root)}${path.sep}`)).toBe(true);
    const bytes = await fs.readFile(real), actual = sha(bytes);
    if (hash) expect(actual).toBe(hash);
    pins.push({ file: real, sha256: actual });
    return bytes;
  }
  async function read(file: string, hash?: string) { return JSON.parse((await bytes(file, hash)).toString()); }
  const approval = validateApproval(await read(process.env.DOLLVUE_FUNWEST_PILOT_APPROVAL || ''));
  expect(approval.brand).toBe(process.env.DOLLVUE_FUNWEST_PILOT);
  await bytes(approval.inputSheet.file, approval.inputSheet.sha256);
  const c = candidates[approval.brand];
  const proposal = await read(approval.proposal.file, approval.proposal.sha256);
  expect(proposal.privateProposalOnly).toBe(true);
  expect(proposal.published).toBe(false);
  expect(proposal.publicActivationAllowed).toBe(false);
  const inputs = z.array(pinSchema).min(2).parse(proposal.evidence.inputs);
  for (const pin of [approval.sourceReview, approval.referenceReview]) expect(inputs).toContainEqual(pin);
  for (const pin of inputs) await bytes(pin.file, pin.sha256);
  const sourceReview = await read(approval.sourceReview.file, approval.sourceReview.sha256);
  expect(sourceReview).toMatchObject({ frozen: true, reviewer: 'parent-assistant', ownerReviewed: false });
  expect(sourceReview.sourceApprovalIsProvisional).toBe(false);
  expect(sourceReview.activationApproved).toBe(false);
  // Final source acceptance is distinct from activation, which still awaits the pilot.
  const reviewedSources = z.array(z.object({ id: z.string(), sourcePosition: z.number(),
    sourceSha256: digest, sourceUrl: z.string(), sourceApproved: z.literal(true),
    parentDecision: z.literal('approve'), sourceReview: z.literal('parent-approved'),
    finalizationBlocked: z.literal(false), parentAssistantReviewed: z.literal(true),
    reviewer: z.literal('parent-assistant'), ownerReviewed: z.literal(false),
  }).passthrough()).parse(sourceReview.rows.filter((r: { id: string }) => r.id === c.id));
  expect(reviewedSources).toHaveLength(1);
  expect(reviewedSources[0]).toMatchObject({ sourcePosition: c.position, sourceSha256: c.sourceSha256 });
  const referenceReview = await read(approval.referenceReview.file, approval.referenceReview.sha256);
  expect(referenceReview).toMatchObject({ frozen: true, reviewer: 'parent-assistant', ownerReviewed: false,
    meaningApproved: true });
  const record: DollVueReadinessRecord = proposal.records[c.id];
  expect(record).toMatchObject({ productId: c.id, status: 'ready', sourcePositions: [c.position] });
  const manifestFile = path.join(root, 'candidate-manifest.json');
  const manifest = await read(manifestFile);
  expect(inputs).toContainEqual(pins[pins.length - 1]);
  const sources = manifest.rows.filter((r: { id: string; sourcePosition: number }) => r.id === c.id && r.sourcePosition === c.position);
  expect(sources).toHaveLength(1);
  const source = sources[0];
  expect(source).toMatchObject({ handle: c.handle, sourceSha256: c.sourceSha256 });
  expect(source.sourceUrl).toBe(reviewedSources[0].sourceUrl);
  expect(sha(await fs.readFile(source.sourceFile))).toBe(c.sourceSha256);
  expect(record.imageDigests?.[source.sourceUrl]).toBe(c.sourceSha256);
  const verified = proposal.verification.filter((r: { id: string }) => r.id === c.id);
  expect(verified).toHaveLength(1);
  expect(verified[0]).toMatchObject({ draft: true, published: false, publiclyAvailable: false,
    privatelyAvailable: true, currentHold: 'clear', strictStorefrontNull: true,
    currentSourceBytesMatch: true, sourcePosition: c.position, sourceUrl: source.sourceUrl,
    sourceSha256: c.sourceSha256, runtimeFingerprint: record.fingerprint });
  for (const { sha256, ...choice } of approval.choices) {
    expect(record.choices).toContainEqual(choice);
    expect(record.imageDigests?.[choice.reference]).toBe(sha256);
    const rows = referenceReview.rows.filter((r: { reference: string }) => r.reference === choice.reference);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sha256, meaningApproved: true,
      nonExplicit: true,
      transferOnly: choice.groupId === 'hairstyle' ? 'hair' : 'iris color' });
    expect(rows[0].occurrences).toEqual(expect.arrayContaining([expect.objectContaining({
      id: c.id, brand: c.brand, groupId: choice.groupId, optionId: choice.optionId,
    })]));
    await bytes(rows[0].sourceFile, sha256);
  }
  const output = path.join(root, `pilot-${approval.brand.toLowerCase()}`);
  await fs.mkdir(output, { recursive: true, mode: 0o700 });
  const save = (name: string, value: unknown) => fs.writeFile(path.join(output, name), JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 });
  expect(await fs.stat(path.join(output, 'reservation.json')).then(() => true, e => {
    if (e.code === 'ENOENT') return false; throw e;
  }), 'Existing reservation: never rerun this brand').toBe(false);
  const registryPath = 'lib/dollvue/readiness-registry.json';
  const registryBefore = sha(await fs.readFile(registryPath));
  const origin = new URL(env.NEXT_PUBLIC_SITE_URL).origin;
  expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);
  expect(env.DOLLVUE_ENABLED).toBe('true'); expect(env.VENICE_API_KEY).toBeTruthy();
  const selections = approval.choices.map(({ groupId, optionId }) => ({ groupId, optionId }));
  expect(sha(Buffer.from(JSON.stringify({ productHandle: c.handle, sourcePosition: c.position, selections })))).toBe(approval.requestSha256);
  const request = (route: string) => new Request(`${origin}/dollvue/${route}`, { method: 'POST',
    headers: { origin, 'Content-Type': 'application/json', 'x-vercel-ip-country': 'US' },
    body: JSON.stringify({ productHandle: c.handle, sourcePosition: c.position, selections }) });
  const result: Record<string, unknown> = { productId: c.id, brand: approval.brand, sourcePosition: c.position,
    sourceSha256: c.sourceSha256, routeRequestSha256: approval.requestSha256, proposalSha256: approval.proposal.sha256, ownerReviewed: false,
    humanReviewed: false, visualReview: 'pending', publicationChanged: false, customerMailSent: false };
  let calls = 0;
  let expectedImageHashes: string[] = [];
  const nativeFetch = globalThis.fetch;
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (url.href === 'https://api.venice.ai/api/v1/image/multi-edit') {
      expect(state.armed).toBe(true); expect(calls, 'No retry or refusal fallback').toBe(0);
      expect(method).toBe('POST');
      const body = JSON.parse(String(init?.body));
      expect(body.modelId).toBe('seedream-v5-pro-edit'); expect(body.images).toHaveLength(2);
      const hashes = body.images.map((image: string) => {
        expect(image).toMatch(/^data:image\//); return sha(Buffer.from(image.split(',')[1], 'base64'));
      });
      expect(hashes).toEqual(expectedImageHashes);
      for (const pin of pins) expect(sha(await fs.readFile(pin.file))).toBe(pin.sha256);
      expect((await getCurrentDollVueHolds([c.id])).get(c.id)).toBe('clear');
      await save('reservation.json', { attemptedAt: new Date().toISOString(), maxProviderCalls: 1, pins, hashes });
      calls++;
      const requestEvidence = { ...body, images: undefined, imageHashes: hashes };
      result.requestSha256 = sha(Buffer.from(JSON.stringify(requestEvidence, null, 2)));
      await save('request.json', requestEvidence);
      const response = await nativeFetch(input, { ...init, redirect: 'error' });
      result.providerStatus = response.status;
      if (!response.ok) await save('provider-failure.json', { status: response.status, body: await response.clone().text() });
      return response;
    }
    const shop = env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (url.protocol === 'https:' && url.hostname === shop && method === 'POST') {
      if (url.pathname.endsWith('/graphql.json')) {
        const body = JSON.parse(String(init?.body));
        expect(body.query.trim()).toMatch(/^query\b/); expect(body.query).not.toMatch(/\bmutation\b/);
      } else expect(url.pathname).toBe('/admin/oauth/access_token');
    } else {
      expect(method).toBe('GET');
      expect([source.sourceUrl, ...approval.choices.map(c => new URL(c.reference, origin).href)]).toContain(url.href);
    }
    return nativeFetch(input, { ...init, redirect: 'error' });
  });
  async function currentDraft() {
    const response = await adminFetch<{ nodes: Array<AdminNode | null>; shop: { currencyCode: string } }>(query, { ids: [c.id] });
    const node = response.nodes[0]; expect(node).toBeTruthy();
    expect(node!.id).toBe(c.id); expect(node!.handle).toBe(c.handle);
    expect(node!.status).toBe('DRAFT'); expect(node!.publishedAt).toBeNull();
    expect(node!.resourcePublications.pageInfo.hasNextPage).toBe(false);
    expect(node!.resourcePublications.nodes.every(p => !p.isPublished)).toBe(true);
    expect(node!.tags.filter(t => t !== 'catalog-review-hold').some(t => /hold|exclude|youth|minor|teen/i.test(t))).toBe(false);
    const variants = { edges: node!.variants.edges.map(({ node: v }) => ({ node: {
      ...v, price: { amount: v.price, currencyCode: response.shop.currencyCode },
    } })) };
    const product = mapShopifyProduct({ ...node!, variants, priceRange: {
      minVariantPrice: variants.edges[0].node.price, maxVariantPrice: variants.edges[0].node.price,
    } });
    expect(product.extended.brand).toBe(c.brand);
    expect(productImageSources(product)[c.position].url).toBe(source.sourceUrl);
    expect(dollVueReadinessFingerprint(product, dollVueConfigForProduct(product, getCustomizationConfig(product)))).toBe(record.fingerprint);
    expect(isDollVueExcluded(product)).toBe(false);
    expect((await getCurrentDollVueHolds([c.id])).get(c.id)).toBe('clear');
    return product;
  }
  async function publicRejection() {
    expect(state.armed).toBe(false);
    expect(await getProductByHandle(c.handle, { cache: 'no-store', strict: true })).toBeNull();
    expect((await generate(request('generate'))).status).toBe(404);
    expect((await cart(request('cart'))).status).toBe(404);
  }
  try {
    const product = await currentDraft();
    result.firstHoldCheckedAt = new Date().toISOString();
    result.retainedTags = product.tags;
    const menu = dollVueConfigForProduct(product, getCustomizationConfig(product));
    expect(evaluateDollVueReadiness(product, menu, record, { published: false, privateReview: true,
      contentExcluded: false })).toMatchObject({ ready: true, publiclyAvailable: false, privatelyAvailable: true });
    const requested = { ...getDefaultSelections(menu), ...Object.fromEntries(selections.map(s => [s.groupId, s.optionId])) };
    const resolved = resolveCustomization(menu, requested, Number(product.variants[0].price.amount));
    for (const choice of approval.choices) {
      expect(resolved.selections[choice.groupId]).toBe(choice.optionId);
      const option = resolved.selectedOptions.find(s => s.groupId === choice.groupId && s.optionId === choice.optionId);
      expect(option).toBeDefined();
      expect(resolved.cartAttributes).toContainEqual({ key: `DollWow ${option!.groupLabel}`,
        value: option!.optionLabel + (option!.priceDelta ? ` (+$${option!.priceDelta})` : '') });
      expect(menu.groups.find(g => g.id === choice.groupId)?.options.find(o => o.id === choice.optionId)?.swatch?.value).toBe(choice.reference);
    }
    await publicRejection();
    result.publicRejectionBefore = true;
    for (const image of [{ url: source.sourceUrl, sha256: c.sourceSha256, optionReference: false },
      ...approval.choices.map(c => ({ url: c.reference, sha256: c.sha256, optionReference: true }))]) {
      const data = await normalizeReviewedImage({ ...image, origin });
      expectedImageHashes.push(sha(Buffer.from(data.split(',')[1], 'base64')));
    }
    state.registry[c.id] = record; state.product = product; state.armed = true;
    const response = await generate(request('generate'));
    const payload = await response.json();
    Object.assign(result, { status: response.status, error: payload.error });
    if (payload.previewDataUrl) {
      const bytes = Buffer.from(payload.previewDataUrl.split(',')[1], 'base64');
      await fs.writeFile(path.join(output, c.outputFile), bytes, { flag: 'wx', mode: 0o600 });
      result.outputSha256 = sha(bytes);
    }
    expect(response.status, String(payload.error)).toBe(200);
    expect(payload.emailDelivered).toBe(false); expect(calls).toBe(1);
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error); throw error;
  } finally {
    state.armed = false; state.product = null; delete state.registry[c.id];
    try {
      await currentDraft(); await publicRejection();
      for (const image of [{ url: source.sourceUrl, sha256: c.sourceSha256, optionReference: false },
        ...approval.choices.map(c => ({ url: c.reference, sha256: c.sha256, optionReference: true }))]) {
        await normalizeReviewedImage({ ...image, origin });
      }
      for (const pin of pins) expect(sha(await fs.readFile(pin.file))).toBe(pin.sha256);
      result.finalSourceAndReferenceBytesMatch = true;
      result.finalHoldCheckedAt = new Date().toISOString(); result.publicRejectionAfter = true;
    } finally {
      vi.unstubAllGlobals();
      const after = sha(await fs.readFile(registryPath));
      Object.assign(result, { providerCalls: calls, pins, checkedAt: new Date().toISOString(),
        registryBeforeSha256: registryBefore, registryAfterSha256: after });
      await save(`result-${Date.now()}.json`, result);
      expect(after).toBe(registryBefore);
    }
  }
}, 240_000);
