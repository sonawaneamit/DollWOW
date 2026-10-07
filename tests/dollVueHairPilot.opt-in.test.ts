import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';

const state = vi.hoisted(() => ({ registry: {} as Record<string, DollVueReadinessRecord> }));
vi.mock('@/lib/dollvue/readiness-registry.json', () => ({ default: state.registry }));
vi.mock('@/lib/dollvue/session', () => ({ readDollVueSession: () => ({ email: 'qa@example.invalid' }) }));
vi.mock('@/lib/dollvue/accountUsage', () => ({
  dollVueUsageForEmail: async () => ({ available: true, remaining: 5 }),
  recordDollVuePreview: async () => true,
}));
vi.mock('@/lib/dollvue/email', () => ({
  sendDollVueLookEmail: async () => ({ delivered: false, provider: 'qa-no-mail' }),
}));

import { getProductByHandle } from '@/lib/shopify/storefront';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { dollVueReadinessFingerprint } from '@/lib/dollvue/readiness';
import { productImageSources } from '@/lib/catalog/productImage';
import { POST } from '@/app/dollvue/generate/route';
import type { Product } from '@/types/product';
import { adminFetch } from '@/lib/shopify/admin';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { storefrontAuthHeaders } from '@/lib/shopify/auth';
import { isCustomerVisibleProduct } from '@/lib/shopify/storefront';
import { env } from '@/lib/utils/env';
import { getCurrentDollVueHolds } from '@/lib/dollvue/currentHold';
import { normalizeReviewedImage } from '@/lib/dollvue/reviewedImages';
import { classifyAppearance } from '@/lib/dollvue/appearance';
import { evaluateDollVueReadiness, reviewedDollVueConfig } from '@/lib/dollvue/readiness';
import { areDollVueSelectionsValid } from '@/lib/dollvue/config';
import { isDollVueExcluded } from '@/lib/dollvue/eligibility';
import { getDefaultSelections, resolveCustomization, isOptionAvailableForCheckout, nextMultipleSelection } from '@/lib/customization/resolve';
import { promotionPricingForSelections } from '@/lib/promotions/optionPricing';

const root = '/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';
const output = path.join(root, 'wm-audrey-hair-pilot');
const handle = 'wm-audrey-166cm-c-cup-tpe-companion-doll-187yz';
const productId = 'gid://shopify/Product/10431698337976';
const sourceHash = 'fb52b2be0d88ab369a8a5064e1da44e972c29051911a05cf6ae8d50abf7b8358';
const hairHash = '3d86fb81a7d856217b1951296fa364ceefe4e7739622a79191bd0d2349b64429';
const eyeHash = '98017f1c3632c2eee1c15b711aa5ed71cdbcb0e66be61bbd8f7b28addcd512e8';
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const mode = process.env.DOLLVUE_HAIR_PILOT;
const read = async <T,>(file: string): Promise<T> => JSON.parse(await fs.readFile(file, 'utf8')) as T;
const save = (name: string, value: unknown) => fs.writeFile(path.join(output, name), JSON.stringify(value, null, 2), { mode: 0o600 });

// One real request per stage, at most two across invocations. Only private
// readiness, session, allowance and email are fixtures; product/holds/bytes are real.
it.skipIf(mode !== 'hair' && mode !== 'combined')('samples Audrey hair without remote writes or provider fallback', async () => {
  await fs.mkdir(output, { recursive: true, mode: 0o700 });
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dollwow.com').origin;
  expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);
  const registryFile = 'lib/dollvue/readiness-registry.json';
  const registryBytes = await fs.readFile(registryFile);
  const original = (JSON.parse(registryBytes.toString()) as Record<string, DollVueReadinessRecord>)[productId];
  expect(original.status).toBe('ready');
  expect(original.sourcePositions).toContain(0);
  expect(digest(await fs.readFile(path.join(root, `pilot-${handle}.jpg`)))).toBe(sourceHash);
  if (mode === 'combined') {
    const first = await read<{ status: number; outputSha256: string; providerCalls: number }>(path.join(output, 'hair-result.json'));
    const review = await read<{ reviewer: string; reasonable: boolean; outputSha256: string }>(path.join(output, 'hair-assistant-review.json'));
    expect(first.status).toBe(200);
    expect(first.providerCalls).toBe(1);
    expect(review.reviewer).toBe('assistant');
    expect(review.reasonable).toBe(true);
    expect(review.outputSha256).toBe(first.outputSha256);
    expect(digest(await fs.readFile(path.join(output, 'hair.webp')))).toBe(first.outputSha256);
  }

  const nativeFetch = globalThis.fetch;
  let calls = 0;
  let expectedSourceUrl = '';
  const providerResponses: Array<{ status: number; model: string }> = [];
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (url.href === 'https://api.venice.ai/api/v1/image/multi-edit') {
      if (calls !== 0) throw new Error('Provider retry/fallback prohibited, including after refusals');
      const body = JSON.parse(String(init?.body));
      expect(body.modelId).toBe('seedream-v5-pro-edit');
      expect(body.images).toHaveLength(mode === 'hair' ? 2 : 3);
      expect(body.images.every((image: string) => image.startsWith('data:image/'))).toBe(true);
      expect(digest(Buffer.from(body.images[0].split(',')[1], 'base64'))).toBe(sourceHash);
      // Exclusive durable reservation prevents repeat calls after crash or rerun.
      await fs.writeFile(path.join(output, `${mode}-reservation.json`), JSON.stringify({
        stage: mode, maxCallsTotal: 2, model: body.modelId, attemptedAt: new Date().toISOString(),
      }), { flag: 'wx', mode: 0o600 });
      calls++;
      await save(`${mode}-request.json`, { model: body.modelId, prompt: body.prompt,
        sourceUrl: expectedSourceUrl, sourceSha256: sourceHash,
        imageDataDigests: body.images.map((image: string) => digest(Buffer.from(image.split(',')[1], 'base64'))),
        aspectRatio: body.aspect_ratio, resolution: body.resolution, referenceCount: body.images.length - 1 });
      const response = await nativeFetch(input, init);
      providerResponses.push({ status: response.status, model: body.modelId });
      await save(`${mode}-provider.json`, providerResponses);
      return response;
    }
    if (method !== 'GET' && method !== 'HEAD') {
      const shop = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (url.hostname !== shop) throw new Error('Unexpected remote write blocked');
      if (url.pathname.endsWith('/graphql.json')) {
        const body = JSON.parse(String(init?.body));
        if (!/^query\b/.test(body.query.trim()) || /\bmutation\b/.test(body.query)) throw new Error('Shopify mutation prohibited');
      } else if (!url.pathname.endsWith('/admin/oauth/access_token')) throw new Error('Unexpected Shopify write blocked');
    }
    return nativeFetch(input, init);
  });

  const result: Record<string, unknown> = { stage: mode, reviewer: 'assistant', visualReview: 'pending',
    userApproval: false, registryChanged: false, publicationChanged: false, customerMailSent: false };
  try {
    const product = await getProductByHandle(handle, { cache: 'no-store', strict: true });
    expect(product?.id).toBe(productId);
    const config = getCustomizationConfig(product!);
    expect(dollVueReadinessFingerprint(product!, config)).toBe(original.fingerprint);
    expectedSourceUrl = productImageSources(product!)[0].url;
    expect(original.imageDigests?.[expectedSourceUrl]).toBe(sourceHash);
    const choices = [{ groupId: 'hairstyle', optionId: 'no-8', reference: `/option-assets/${hairHash}.webp` }];
    if (mode === 'combined') choices.push({ groupId: 'eye-color', optionId: 'no-2', reference: `/option-assets/${eyeHash}.webp` });
    expect(original.choices).toContainEqual({ groupId: 'eye-color', optionId: 'no-2', reference: `/option-assets/${eyeHash}.webp` });
    const imageDigests: Record<string, string> = { [expectedSourceUrl]: sourceHash };
    for (const choice of choices) {
      const group = config.groups.find(g => g.id === choice.groupId)!;
      expect(group.visibleWhen?.length || 0).toBe(0);
      expect(group.options.find(o => o.id === choice.optionId)?.swatch?.value).toBe(choice.reference);
      const sha = path.basename(choice.reference, '.webp');
      expect(digest(await fs.readFile(path.join(process.cwd(), 'public', choice.reference)))).toBe(sha);
      imageDigests[choice.reference] = sha;
    }
    state.registry[productId] = { ...original, sourcePositions: [0], choices, imageDigests };
    await save(`${mode}-binding.json`, { fingerprint: original.fingerprint, sourcePosition: 0, choices, imageDigests,
      privateTestFixtureOnly: true, readinessApproval: false, sourceReview: 'assistant: adult, clothed, non-explicit' });
    const started = Date.now();
    const response = await POST(new Request(`${origin}/dollvue/generate`, { method: 'POST',
      headers: { origin, 'Content-Type': 'application/json', 'x-vercel-ip-country': 'US' },
      body: JSON.stringify({ productHandle: handle, sourcePosition: 0,
        selections: choices.map(({ groupId, optionId }) => ({ groupId, optionId })) }),
    }));
    const payload = await response.json();
    Object.assign(result, { status: response.status, error: payload.error, elapsedMs: Date.now() - started });
    if (payload.previewDataUrl) {
      const bytes = Buffer.from(payload.previewDataUrl.split(',')[1], 'base64');
      const file = path.join(output, `${mode}.webp`);
      await fs.writeFile(file, bytes, { flag: 'wx', mode: 0o600 });
      Object.assign(result, { output: file, outputSha256: digest(bytes) });
    }
    expect(response.status, String(payload.error)).toBe(200);
    expect(payload.emailDelivered).toBe(false);
    expect(calls).toBe(1);
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    Object.assign(result, { providerCalls: calls, providerResponses, checkedAt: new Date().toISOString() });
    await save(`${mode}-result.json`, result);
    vi.unstubAllGlobals();
    delete state.registry[productId];
    const finalRegistryBytes = await fs.readFile(registryFile);
    await save(`${mode}-registry-observation.json`, {
      beforeSha256: digest(registryBytes), afterSha256: digest(finalRegistryBytes),
      concurrentFileChangeObserved: digest(finalRegistryBytes) !== digest(registryBytes),
      registryWrittenByHarness: false,
    });
    expect((JSON.parse(finalRegistryBytes.toString()) as Record<string, DollVueReadinessRecord>)[productId]).toEqual(original);
  }
}, 180_000);

it.skipIf(mode !== 'propose')('privately proposes reviewed hair only on exact-family existing ready records', async () => {
  type Node = Parameters<typeof mapShopifyProduct>[0];
  type DraftNode = Omit<Node, 'variants' | 'priceRange'> & {
    status: string; publishedAt: string | null; hold: { value: string } | null;
    resourcePublications: { nodes: Array<{ isPublished: boolean }>; pageInfo: { hasNextPage: boolean } };
    variants: { edges: Array<{ node: Omit<Product['variants'][number], 'price'> & { price: string } }> };
  };
  await fs.mkdir(output, { recursive: true, mode: 0o700 });
  const registryFile = 'lib/dollvue/readiness-registry.json';
  const before = await fs.readFile(registryFile);
  const registry = JSON.parse(before.toString()) as Record<string, DollVueReadinessRecord>;
  const ready = Object.values(registry).filter(r => r.status === 'ready');
  expect(ready).toHaveLength(47);
  const snapshot = await read<{ nodes: Array<{ id: string; status: string; handle: string }> }>(path.join(root, 'shopify-snapshot.json'));
  const activeIds = ready.filter(r => snapshot.nodes.find(n => n.id === r.productId)?.status === 'ACTIVE').map(r => r.productId);
  const draftIds = ready.filter(r => snapshot.nodes.find(n => n.id === r.productId)?.status === 'DRAFT').map(r => r.productId);
  expect(activeIds).toHaveLength(40);
  expect(draftIds).toHaveLength(7);
  const prep = await read<{ rows: Array<{ optionChecks: Array<{ groupId: string; optionId: string; reference: string;
    sha256: string; technicalBindingProven: boolean; transformProof: { matched: boolean }; review: { status: string } }> }> }>(path.join(root, 'jk-private-preparation.json'));
  const evidence = prep.rows[0].optionChecks.filter(c => c.groupId === 'hairstyle');
  expect(evidence.map(c => c.optionId)).toEqual(Array.from({ length: 15 }, (_, i) => `no-${i + 1}`));
  const hair = evidence.map(({ groupId, optionId, reference }) => ({ groupId, optionId, reference }));
  for (const stage of ['hair', 'combined']) {
    const review = await read<{ reviewer: string; verdict: string; userApproval: boolean; outputSha256: string }>(path.join(output, `${stage}-assistant-review.json`));
    expect(review.reviewer).toBe('assistant');
    expect(review.userApproval).toBe(false);
    expect(review.verdict).toBe('PASS_MINOR_VARIATION_ACCEPTED');
    expect(review.outputSha256).toBe(digest(await fs.readFile(path.join(output, `${stage}.webp`))));
  }
  const fields: Record<string, string> = {
    catalogIdentityKey:'catalog_identity_key', catalogBodyIdentityKey:'catalog_body_identity_key', headModel:'head_model',
    displayName:'display_name', bodyType:'body_type', lookTags:'look_tags', brand:'brand', sourceTitle:'source_title',
    sourceHandle:'source_handle', sourceReleaseRank:'source_release_rank', material:'material', heightCm:'height_cm',
    weightLb:'weight_lb', cupSize:'cup_size', measurements:'measurements', warehouseCountry:'warehouse_country',
    warehouseRegions:'warehouse_regions', stockStatus:'stock_status', deliveryEstimate:'delivery_estimate',
    stockLastCheckedAt:'stock_last_checked_at', customAvailable:'custom_available', penisAddOnAvailable:'has_insertable_penis_add_on',
    irontechUlwEligibility:'irontech_ulw_eligibility', qcNote:'qc_note', customizationGroups:'customization_groups',
  };
  const meta = Object.entries(fields).map(([alias,key]) => `${alias}:metafield(namespace:"custom",key:"${key}"){value}`).join('\n');
  const common = `id handle title description vendor productType tags featuredImage{url altText width height}
    images(first:50){edges{node{url altText width height}}} ${meta}`;
  const counts = { storefrontBulkReads: 0, adminBulkReads: 0, imageReads: 0, generationCalls: 0, remoteWrites: 0 };
  const nativeFetch = globalThis.fetch;
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (/venice|openai|higgsfield/i.test(url.hostname)) throw new Error('No more generation permitted');
    if (url.pathname.endsWith('/graphql.json')) {
      expect(url.hostname).toBe(env.SHOPIFY_STORE_DOMAIN);
      const body = JSON.parse(String(init?.body));
      expect(body.query.trim()).toMatch(/^query\b/);
      expect(body.query).not.toMatch(/\bmutation\b/);
      expect(body.variables.ids.every((id: string) => ready.some(r => r.productId === id))).toBe(true);
      if (url.pathname.includes('/admin/')) expect(++counts.adminBulkReads).toBeLessThanOrEqual(2);
      else expect(++counts.storefrontBulkReads).toBe(1);
    } else if (url.pathname.endsWith('/admin/oauth/access_token')) expect(url.hostname).toBe(env.SHOPIFY_STORE_DOMAIN);
    else { expect(method).toBe('GET'); counts.imageReads++; }
    return nativeFetch(input, init);
  });
  try {
    const response = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`, {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(60000),
      headers: { 'Content-Type':'application/json', ...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!) },
      body: JSON.stringify({ variables: { ids: activeIds }, query: `query HairExistingReady($ids:[ID!]!){nodes(ids:$ids){... on Product{
        ${common} seo{title description} priceRange{minVariantPrice{amount currencyCode} maxVariantPrice{amount currencyCode}}
        variants(first:30){edges{node{id title availableForSale price{amount currencyCode} selectedOptions{name value}}}}
        media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}}
        ... on Video{previewImage{url altText width height} sources{url mimeType}}}}}
      }}}` }),
    });
    expect(response.ok).toBe(true);
    const body = await response.json() as { errors?: unknown[]; data: { nodes: Node[] } };
    expect(body.errors).toBeUndefined();
    expect(body.data.nodes.map(n => n?.id)).toEqual(activeIds);
    const holds = await getCurrentDollVueHolds(activeIds);
    expect(activeIds.map(id => holds.get(id))).toEqual(activeIds.map(() => 'clear'));
    const drafts = await adminFetch<{ nodes: DraftNode[] }>(`query HairPrivateDrafts($ids:[ID!]!){nodes(ids:$ids){... on Product{
      ${common} status publishedAt hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value}
      resourcePublications(first:30){nodes{isPublished} pageInfo{hasNextPage}}
      variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}}
    }}}`, { ids: draftIds });
    expect(drafts.nodes.map(n => n?.id)).toEqual(draftIds);
    const products: Array<{ product: Product; draft: boolean }> = body.data.nodes.map(node => ({ product: mapShopifyProduct(node), draft: false }));
    for (const node of drafts.nodes) {
      expect(node.status).toBe('DRAFT');
      expect(node.publishedAt).toBeNull();
      expect(node.hold?.value?.trim() || '').toBe('');
      expect(node.tags.some(t => /age.*hold|safety.*hold|content.*hold|catalog-image-review-hold|not-for-launch-review/i.test(t))).toBe(false);
      expect(node.resourcePublications.pageInfo.hasNextPage).toBe(false);
      expect(node.resourcePublications.nodes.every(p => !p.isPublished)).toBe(true);
      const price = { amount: node.variants.edges[0].node.price, currencyCode: 'USD' };
      products.push({ draft: true, product: mapShopifyProduct({ ...node,
        priceRange: { minVariantPrice: price, maxVariantPrice: price }, variants: { edges: node.variants.edges.map(({node:v}) =>
          ({ node: { ...v, price: { amount:v.price, currencyCode:'USD' } } })) } }) });
    }
    await save('hair-proposal-fresh-reads.json', { checkedAt: new Date().toISOString(), active: body.data.nodes,
      activeHolds: Object.fromEntries(holds), privateDrafts: drafts.nodes });
    const hairPins: Record<string,string> = {};
    const verified = new Map<string,string>();
    async function verify(url: string, sha256: string, optionReference = false) {
      if (verified.has(url)) { expect(verified.get(url)).toBe(sha256); return; }
      await normalizeReviewedImage({ url, sha256, origin: 'https://dollwow.com', optionReference });
      verified.set(url, sha256);
    }
    for (const ref of evidence) {
      expect(ref.technicalBindingProven && ref.transformProof.matched).toBe(true);
      expect(ref.review.status).toBe('PASS_THUMBNAIL_REVIEW');
      expect(digest(await fs.readFile(path.join(process.cwd(), 'public', ref.reference)))).toBe(ref.sha256);
      await verify(ref.reference, ref.sha256, true);
      hairPins[ref.reference] = ref.sha256;
    }
    const records: Record<string,DollVueReadinessRecord> = {};
    const verification = [], excluded = [];
    const selections = [{ groupId:'hairstyle', optionId:'no-8' }, { groupId:'eye-color', optionId:'no-2' }];
    for (const { product, draft } of products) {
      const previous = registry[product.id];
      const menu = getCustomizationConfig(product);
      expect(dollVueReadinessFingerprint(product, menu), product.handle).toBe(previous.fingerprint);
      if (!draft) expect(isCustomerVisibleProduct(product)).toBe(true);
      expect(isDollVueExcluded(product)).toBe(false);
      const group = menu.groups.find(g => g.id === 'hairstyle');
      const actual = group?.options.filter(o => classifyAppearance(group, o).status === 'candidate')
        .map(o => ({ groupId:group.id, optionId:o.id, reference:o.swatch?.value }));
      if (!group || group.visibleWhen?.length || JSON.stringify(actual) !== JSON.stringify(hair)) {
        excluded.push({ id:product.id, handle:product.handle, reason:'No exact unconditional reviewed main-head 15-hairstyle family', unchanged:true });
        continue;
      }
      expect(['WM Dolls','WM Doll','JK Dolls']).toContain(product.extended.brand);
      expect(previous.choices.every(c => c.groupId === 'eye-color')).toBe(true);
      expect(previous.choices).toHaveLength(14);
      for (const position of previous.sourcePositions) {
        const url = productImageSources(product)[position].url;
        await verify(url, previous.imageDigests![url]);
      }
      for (const c of previous.choices) await verify(c.reference, previous.imageDigests![c.reference], true);
      const proposed = { ...previous, choices:[...previous.choices, ...hair], imageDigests:{...previous.imageDigests, ...hairPins} };
      const context = { published:!draft, privateReview:draft, contentExcluded:false };
      const readiness = evaluateDollVueReadiness(product, menu, proposed, context);
      expect(readiness.ready).toBe(true);
      expect(readiness.publiclyAvailable).toBe(!draft);
      const catalog = reviewedDollVueConfig(menu, readiness, draft ? 'private' : 'public');
      const now = new Date();
      const config = promotionPricingForSelections(product, catalog, {}, now).config;
      expect(areDollVueSelectionsValid(config, selections)).toBe(true);
      const defaults = getDefaultSelections(config);
      const variant = product.variants.find(v => v.availableForSale) ?? product.variants[0];
      expect(variant?.id).toBeTruthy();
      if (!draft) expect(variant.availableForSale).toBe(true);
      const price = Number(variant.price.amount);
      const baseline = resolveCustomization(config, defaults, price);
      expect(baseline.issues).toEqual([]);
      expect(baseline.requiresPriceConfirmation).toBe(false);
      const selected = { ...defaults };
      for (const choice of selections) {
        expect(isOptionAvailableForCheckout(config, choice.groupId, choice.optionId)).toBe(true);
        const g = config.groups.find(g => g.id === choice.groupId)!;
        selected[g.id] = g.selectionMode === 'multiple' ? nextMultipleSelection(g.options, selected[g.id], choice.optionId) : choice.optionId;
      }
      const priced = promotionPricingForSelections(product, catalog, selected, now).config;
      const resolved = resolveCustomization(priced, selected, price);
      expect(resolved.issues).toEqual([]);
      expect(resolved.requiresPriceConfirmation).toBe(false);
      expect(Number.isFinite(resolved.totalPrice)).toBe(true);
      expect(resolved.selections.hairstyle).toBe('no-8');
      expect(resolved.selections['eye-color']).toBe('no-2');
      expect(resolved.cartAttributes).toContainEqual({ key:'DollWow Hairstyle', value:'No.8' });
      expect(resolved.cartAttributes).toContainEqual({ key:'DollWow Eye Color', value:'No.2' });
      const unchangedDefaultConfig = promotionPricingForSelections(product, menu, {}, now).config;
      expect(defaults).toEqual(getDefaultSelections(unchangedDefaultConfig));
      expect(baseline).toEqual(resolveCustomization(unchangedDefaultConfig, getDefaultSelections(unchangedDefaultConfig), price));
      records[product.id] = proposed;
      verification.push({ id:product.id, handle:product.handle, brand:product.extended.brand, draft,
        hold:'clear', fingerprintPreserved:true, sourcePositions:previous.sourcePositions, existingEyesPreserved:14,
        addedHairChoices:15, assistantVisualPass:true, userApproval:false, defaults,
        baselineCartAttributes:baseline.cartAttributes, combinedSelections:resolved.selections,
        combinedCartAttributes:resolved.cartAttributes, totalPrice:resolved.totalPrice, optionPriceDelta:resolved.optionPriceDelta,
        merchandiseId:variant.id, currencyCode:variant.price.currencyCode,
        publicCartAllowed:!draft, validationScope:draft ? 'Private local compatibility only; draft remains publicly blocked' : 'Local payload-field validation; no cart mutation' });
    }
    expect(Object.keys(records)).toHaveLength(46);
    expect(verification.filter(v => v.draft)).toHaveLength(7);
    expect(excluded.map(e => e.id)).toEqual(['gid://shopify/Product/10433981612216']);
    // Compare the full input before publishing a proposal; never overwrite concurrent work.
    expect(await fs.readFile(registryFile)).toEqual(before);
    await save('reviewed-hair-46-record-proposal.json', { checkedAt:new Date().toISOString(), privateProposalOnly:true,
      activationAllowed:false, registryChanged:false, trackerChanged:false, publicationChanged:false,
      registryInputSha256:digest(before), records, excluded, verification, referenceEvidence:evidence,
      review:{reviewer:'assistant',userApproval:false,verdict:'PASS_MINOR_VARIATION_ACCEPTED',
        scope:'15 references visually inspected; two actual Audrey generations only (hair8 and hair8+eye2), not all combinations'},
      summary:{existingReady:47,proposed:46,activeWM:39,privateJKDrafts:7,excludedSE:1,
        addedHairBindings:690,preservedEyeBindings:644,totalProposedChoices:1334,uniqueHairReferences:15,
        verifiedUniqueImages:verified.size,compatibilityAndDefaultChecks:verification.length,...counts} });
    console.info(JSON.stringify({ proposed:46, addedHairBindings:690, ...counts }));
  } finally { vi.unstubAllGlobals(); }
}, 300_000);
