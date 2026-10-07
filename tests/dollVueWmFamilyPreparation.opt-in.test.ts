import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { expect, it, vi } from 'vitest';
import type { Product } from '@/types/product';
import { adminFetch } from '@/lib/shopify/admin';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { dollVueConfigForProduct } from '@/lib/dollvue/config';
import { classifyAppearance } from '@/lib/dollvue/appearance';
import { productImageSources } from '@/lib/catalog/productImage';
import { dollVueReadinessFingerprint } from '@/lib/dollvue/readiness';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';
import { env, hasShopifyStorefrontEnv } from '@/lib/utils/env';
import { storefrontAuthHeaders } from '@/lib/shopify/auth';
import { isCustomerVisibleProduct } from '@/lib/shopify/storefront';
import { getCurrentDollVueHolds } from '@/lib/dollvue/currentHold';
import { normalizeReviewedImage } from '@/lib/dollvue/reviewedImages';
import { DOLLVUE_APPEARANCE_POLICY } from '@/lib/dollvue/appearance';
import { evaluateDollVueReadiness, type DollVueReadinessRecord } from '@/lib/dollvue/readiness';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';

const root = '/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';
const output = path.join(root, 'wm-family-preparation-20');
const exportRoot = path.dirname(root);
const enabled = process.env.DOLLVUE_WM_FAMILY_PREPARATION === '1';
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const read = async <T,>(file: string): Promise<T> => JSON.parse(await fs.readFile(file, 'utf8')) as T;
type Choice = { groupId: string; optionId: string; reference: string };
type MappedNode = Parameters<typeof mapShopifyProduct>[0];
type Node = Omit<MappedNode, 'variants' | 'priceRange'> & {
  status: string; updatedAt?: string; publishedAt: string | null; hold?: { value: string } | null;
  resourcePublications: { nodes: Array<{ isPublished: boolean; publication: { name: string } }>; pageInfo: { hasNextPage: boolean } };
  variants: { edges: Array<{ node: Omit<Product['variants'][number], 'price'> & { price: string } }> };
};
type Hold = { id: string; handle: string; status: string; tags: string[]; hold: { value: string } | null };
type Prior = { handle: string; sourceHandle?: string; sourceUrl?: string; status?: string; reason?: string };
const hasHold = (node: Pick<Node, 'tags' | 'hold'>) => Boolean(node.hold?.value?.trim()) || node.tags.some(tag => /hold|not-for-launch|excluded/i.test(tag));
function map(node: Node): Product {
  const price = { amount: node.variants.edges[0]?.node.price || '0', currencyCode: 'USD' };
  return mapShopifyProduct({ ...node, priceRange: { minVariantPrice: price, maxVariantPrice: price },
    variants: { edges: node.variants.edges.map(({ node: variant }) => ({ node: {
      ...variant, price: { amount: variant.price, currencyCode: 'USD' },
    } })) } });
}
function inScope(node: Pick<Node, 'status' | 'tags' | 'hold'>, product: Product) {
  return node.status === 'ACTIVE' && product.extended.brand === 'WM Dolls' && product.extended.stockStatus === 'custom' &&
    /^custom\b.*\bdoll\b/i.test(product.productType) &&
    !/head[ -]?only|torso|accessor|upgrade|customization|charge|system/i.test(product.productType) &&
    !node.tags.some(tag => /ready.to.ship|head[ -]?only|torso|accessor|system/i.test(tag)) && !hasHold(node);
}
function eyes(product: Product): Choice[] {
  const config = dollVueConfigForProduct(product, getCustomizationConfig(product));
  const group = config.groups.find(group => group.id === 'eye-color');
  if (!group || group.visibleWhen?.length) return [];
  return group.options.filter(option => /^no-\d+$/.test(option.id) && classifyAppearance(group, option).status === 'candidate' &&
    option.swatch?.kind === 'image' && isOwnedOptionAsset(option.swatch.value))
    .map(option => ({ groupId: group.id, optionId: option.id, reference: option.swatch!.value }))
    .sort((a, b) => Number(a.optionId.slice(3)) - Number(b.optionId.slice(3)));
}
const save = (name: string, value: unknown) => fs.writeFile(path.join(output, name), JSON.stringify(value, null, 2), { mode: 0o600 });

it.skipIf(process.env.DOLLVUE_WM_FAMILY_PREPARATION !== 'verify-registry')('matches the integrated WM batch to the private reviewed proposal without network access', async () => {
  vi.stubGlobal('fetch', () => { throw new Error('Registry verification must remain local'); });
  try {
    const registry = await read<Record<string,DollVueReadinessRecord>>('lib/dollvue/readiness-registry.json');
    const proposal = await read<{ records: Record<string,DollVueReadinessRecord>;
      sourceExclusions: Array<{id:string}>; verification: Array<{id:string;sourceUrl:string;sourceSha256:string;
        runtimeFingerprint:string;currentHold:string;localDefaultValidation:{passed:boolean}}>;
    }>(path.join(output,'reviewed-wm-16-record-proposal.json'));
    expect(Object.keys(proposal.records)).toHaveLength(16);
    expect(proposal.verification).toHaveLength(16);
    for (const [id,record] of Object.entries(proposal.records)) {
      expect(registry[id]).toEqual(record);
      expect(record.status).toBe('ready');
      expect(record.sourcePositions).toEqual([0]);
      expect(record.choices.map(choice => choice.optionId)).toEqual([1,2,3,4,5,6,7,8,9,14,15,16,17,18].map(n => `no-${n}`));
      const evidence = proposal.verification.find(row => row.id === id)!;
      expect(evidence.currentHold).toBe('clear');
      expect(evidence.localDefaultValidation.passed).toBe(true);
      expect(record.fingerprint).toBe(evidence.runtimeFingerprint);
      expect(record.imageDigests?.[evidence.sourceUrl]).toBe(evidence.sourceSha256);
      for (const choice of record.choices) expect(record.imageDigests?.[choice.reference]).toMatch(/^[a-f0-9]{64}$/);
    }
    expect(proposal.sourceExclusions).toHaveLength(4);
    for (const excluded of proposal.sourceExclusions) expect(registry[excluded.id]).toBeUndefined();
  } finally { vi.unstubAllGlobals(); }
});

it.skipIf(process.env.DOLLVUE_WM_FAMILY_PREPARATION !== 'propose')('proposes only the sixteen assistant-reviewed WM sources using strict bulk live reads', async () => {
  type Row = { contactSheetIndex: number; id: string; handle: string; displayName: string; status: string;
    sourcePosition: number; sourceUrl: string; sourceFile: string; sourceSha256: string; sourceBytes: number;
    decoded: { width: number; height: number }; exactEyeChoices: Choice[]; fingerprint: string };
  const manifestPath = path.join(output, 'candidate-manifest.json');
  const manifestBytes = await fs.readFile(manifestPath);
  const manifest = JSON.parse(manifestBytes.toString()) as { rows: Row[]; eyeEvidence: Array<Choice & { sha256: string }> };
  const approvedIndices = [1,2,3,4,5,6,10,11,12,13,15,16,17,18,19,20];
  const rows = manifest.rows.filter(row => approvedIndices.includes(row.contactSheetIndex));
  expect(rows.map(row => row.contactSheetIndex)).toEqual(approvedIndices);
  const ids = rows.map(row => row.id);
  expect(new Set(ids).size).toBe(16);
  const registryBytes = await fs.readFile('lib/dollvue/readiness-registry.json');
  const registry = JSON.parse(registryBytes.toString()) as Record<string, DollVueReadinessRecord>;
  const choices = manifest.rows[0].exactEyeChoices.filter(choice => !['no-10','no-11','no-12','no-13'].includes(choice.optionId));
  expect(choices).toHaveLength(14);
  const pilot = registry['gid://shopify/Product/10431698337976'];
  expect(pilot.status).toBe('ready');
  expect(choices).toEqual(pilot.choices.filter(choice => choice.groupId === 'eye-color'));
  expect(hasShopifyStorefrontEnv()).toBe(true);
  const fields: Record<string, string> = {
    catalogIdentityKey:'catalog_identity_key', catalogBodyIdentityKey:'catalog_body_identity_key', headModel:'head_model',
    displayName:'display_name', bodyType:'body_type', lookTags:'look_tags', brand:'brand', sourceTitle:'source_title',
    sourceHandle:'source_handle', sourceReleaseRank:'source_release_rank', material:'material', heightCm:'height_cm',
    weightLb:'weight_lb', cupSize:'cup_size', measurements:'measurements', warehouseCountry:'warehouse_country',
    warehouseRegions:'warehouse_regions', stockStatus:'stock_status', deliveryEstimate:'delivery_estimate',
    stockLastCheckedAt:'stock_last_checked_at', customAvailable:'custom_available', penisAddOnAvailable:'has_insertable_penis_add_on',
    irontechUlwEligibility:'irontech_ulw_eligibility', qcNote:'qc_note', customizationGroups:'customization_groups',
  };
  const nativeFetch = globalThis.fetch;
  const counts = { storefrontBulkReads:0, currentHoldBulkReads:0, imageReads:0, generationCalls:0, remoteWrites:0 };
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = init?.method || (input instanceof Request ? input.method : 'GET');
    if (url.pathname.endsWith('/graphql.json')) {
      const body = JSON.parse(String(init?.body));
      expect(body.query.trim().startsWith('query ')).toBe(true);
      expect(body.query).not.toMatch(/\bmutation\b/);
      expect(body.variables.ids).toEqual(ids);
      if (url.pathname.includes('/admin/')) expect(++counts.currentHoldBulkReads).toBe(1);
      else expect(++counts.storefrontBulkReads).toBe(1);
    } else if (url.pathname.endsWith('/admin/oauth/access_token')) {
      expect(url.hostname).toBe(env.SHOPIFY_STORE_DOMAIN);
    } else {
      expect(method).toBe('GET');
      expect(isOwnedOptionAsset(url.href)).toBe(true);
      counts.imageReads++;
    }
    return nativeFetch(input, init);
  });
  try {
    const response = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`, {
      method:'POST', cache:'no-store', signal:AbortSignal.timeout(60000),
      headers:{'Content-Type':'application/json', ...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},
      body:JSON.stringify({ variables:{ids}, query:`query WmReviewedSources($ids:[ID!]!){nodes(ids:$ids){... on Product{
        id handle title description seo{title description} vendor productType tags
        featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}}
        priceRange{minVariantPrice{amount currencyCode} maxVariantPrice{amount currencyCode}}
        variants(first:30){edges{node{id title availableForSale price{amount currencyCode} selectedOptions{name value}}}}
        media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}}
          ... on Video{previewImage{url altText width height} sources{url mimeType}}}}}
        ${Object.entries(fields).map(([alias,key]) => `${alias}:metafield(namespace:"custom",key:"${key}"){value}`).join('\n')}
      }}}` }),
    });
    expect(response.ok).toBe(true);
    const body = await response.json() as {errors?:unknown[]; data?:{nodes:Array<MappedNode | null>}};
    expect(body.errors).toBeUndefined();
    expect(body.data?.nodes).toHaveLength(16);
    const holds = await getCurrentDollVueHolds(ids);
    expect(ids.map(id => holds.get(id))).toEqual(ids.map(() => 'clear'));
    const imageDigests: Record<string,string> = {};
    for (const choice of choices) {
      const evidence = manifest.eyeEvidence.find(item => item.optionId === choice.optionId && item.reference === choice.reference)!;
      expect(evidence.sha256).toBe(pilot.imageDigests?.[choice.reference]);
      await normalizeReviewedImage({url:choice.reference, sha256:evidence.sha256, origin:'https://www.dollwow.com', optionReference:true});
      imageDigests[choice.reference] = evidence.sha256;
    }
    const records: Record<string,DollVueReadinessRecord> = {};
    const verification = [];
    for (const [index,row] of rows.entries()) {
      const node = body.data!.nodes[index]!;
      expect(node?.id).toBe(row.id);
      expect(node.handle).toBe(row.handle);
      const product = mapShopifyProduct(node);
      expect(isCustomerVisibleProduct(product)).toBe(true);
      expect(inScope({...node,status:row.status,hold:null},product)).toBe(true);
      expect(eyes(product)).toEqual(row.exactEyeChoices);
      const source = productImageSources(product)[0];
      expect(row.sourcePosition).toBe(0);
      expect(source.url).toBe(row.sourceUrl);
      expect([source.width,source.height]).toEqual([row.decoded.width,row.decoded.height]);
      const localBytes = await fs.readFile(row.sourceFile);
      expect(digest(localBytes)).toBe(row.sourceSha256);
      expect(localBytes.length).toBe(row.sourceBytes);
      await normalizeReviewedImage({url:source.url,sha256:row.sourceSha256,origin:'https://www.dollwow.com'});
      const menu = getCustomizationConfig(product);
      const config = dollVueConfigForProduct(product,menu);
      const defaults = getDefaultSelections(menu);
      const resolved = resolveCustomization(menu,defaults,0);
      expect(resolveCustomization(menu,defaults,0)).toEqual(resolved);
      expect(resolved.issues).toEqual([]);
      expect(resolved.requiresPriceConfirmation).toBe(false);
      expect(Number.isFinite(resolved.totalPrice)).toBe(true);
      const record: DollVueReadinessRecord = {productId:row.id,policy:DOLLVUE_APPEARANCE_POLICY,
        fingerprint:dollVueReadinessFingerprint(product,config),status:'ready',sourcePositions:[0],
        imageDigests:{...imageDigests,[source.url]:row.sourceSha256},choices};
      expect(evaluateDollVueReadiness(product,config,record,{published:true,contentExcluded:false}).ready).toBe(true);
      records[row.id] = record;
      verification.push({contactSheetIndex:row.contactSheetIndex,id:row.id,handle:row.handle,name:row.displayName,
        sourcePosition:0,sourceUrl:source.url,sourceFile:row.sourceFile,sourceSha256:row.sourceSha256,sourceBytes:row.sourceBytes,
        currentHold:holds.get(row.id),strictStorefrontIdentity:true,currentSourceBytesMatch:true,
        runtimeFingerprint:record.fingerprint,previousFingerprint:row.fingerprint,
        assistantVisualReview:'Assistant approved non-explicit preview source0 after contact-sheet inspection; no human source-image review claimed',
        localDefaultValidation:{passed:true,selections:defaults,optionPriceDelta:resolved.optionPriceDelta,
          issues:resolved.issues,requiresPriceConfirmation:resolved.requiresPriceConfirmation,cartAttributes:resolved.cartAttributes}});
    }
    expect(await fs.readFile('lib/dollvue/readiness-registry.json')).toEqual(registryBytes);
    const reasons: Record<number,string> = {7:'Lawan: clearer age-presentation evidence/source required',
      8:'Stacy: explicit genitals',9:'Barbara: explicit/school presentation',14:'May Aly: clearer age-presentation evidence/source required'};
    await save('reviewed-wm-16-record-proposal.json',{checkedAt:new Date().toISOString(),privateProposalOnly:true,
      summary:{readyRecords:16,eyesPerRecord:14,eyeBindings:224,sourceExclusions:4,localDefaultChecks:16,...counts},
      reviewDecision:{reviewer:'assistant',approvedIndices,sourcePosition:0,scope:'NON-EXPLICIT DollVue preview sources only'},
      ownerAcceptance:{scope:'Minor visual variation and reuse of the exact reviewed eye family; not individual source-image review'},
      evidence:{manifestPath,manifestSha256:digest(manifestBytes),pilotProductId:pilot.productId,registrySha256:digest(registryBytes)},
      excludedEyeIds:['no-10','no-11','no-12','no-13'],
      sourceExclusions:manifest.rows.filter(row => reasons[row.contactSheetIndex]).map(row => ({id:row.id,
        contactSheetIndex:row.contactSheetIndex,sourcePosition:0,reason:reasons[row.contactSheetIndex],scope:'DollVue source only; no catalog/tag change'})),
      records,verification});
    console.info(JSON.stringify({ready:16,eyes:14,...counts,output:path.join(output,'reviewed-wm-16-record-proposal.json')}));
  } finally { vi.unstubAllGlobals(); }
}, 240000);

it.skipIf(!enabled)('prepares at most twenty exact-eye-family WM lead photos, without generation or readiness approval', async () => {
  await fs.mkdir(output, { recursive: true, mode: 0o700 });
  const registryBytes = await fs.readFile('lib/dollvue/readiness-registry.json');
  const registry = JSON.parse(registryBytes.toString()) as Record<string, unknown>;
  const inputPaths = ['shopify-snapshot.json', 'current-holds.json', 'jk-private-preparation.json'].map(file => path.join(root, file));
  const inputs = [];
  for (const file of inputPaths) inputs.push({ file, sha256: digest(await fs.readFile(file)) });
  const snapshot = await read<{ capturedAt: string; nodes: Node[] }>(inputPaths[0]);
  const historicalHolds = await read<{ checkedAt: string; rows: Hold[] }>(inputPaths[1]);
  const preparation = await read<{ records: Array<{ choices: Choice[] }> }>(inputPaths[2]);
  const reviewedEyes = preparation.records[0].choices.filter(choice => choice.groupId === 'eye-color');
  expect(reviewedEyes.map(choice => choice.optionId)).toEqual(Array.from({ length: 18 }, (_, n) => `no-${n + 1}`));
  const audrey = snapshot.nodes.find(node => node.id === 'gid://shopify/Product/10431698337976')!;
  expect(eyes(map(audrey))).toEqual(reviewedEyes);
  const sharedFamilyKey = digest(Buffer.from(JSON.stringify(reviewedEyes)));
  const priorFiles = ['rosemary-wm-review-batch-review-report.json', 'dollwow-wm-current-2026-08-13-review-report.json',
    'wm-missing-draft-review.json', 'wm-aisu-live-audit-review-report.json'];
  const priorByHandle = new Map<string, Array<{ file: string; entry: Prior; scope: string }>>();
  for (const name of priorFiles) {
    const file = path.join(exportRoot, name);
    const bytes = await fs.readFile(file);
    inputs.push({ file, sha256: digest(bytes) });
    const data = JSON.parse(bytes.toString()) as { rewrittenProducts?: Prior[]; decisions?: Prior[] };
    for (const entry of data.rewrittenProducts || data.decisions || []) {
      const rows = priorByHandle.get(entry.handle) || [];
      rows.push({ file, entry, scope: 'Source/import provenance only; NOT individual adult-photo or DollVue approval.' });
      priorByHandle.set(entry.handle, rows);
    }
  }
  const eligible: Array<{ node: Node; product: Product }> = [];
  for (const node of snapshot.nodes) {
    if (node.status !== 'ACTIVE' || registry[node.id] || node.id === audrey.id || node.brand?.value !== 'WM Dolls') continue;
    const previous = historicalHolds.rows.find(row => row.id === node.id);
    if (!previous || previous.handle !== node.handle || hasHold(previous)) continue;
    const product = map(node);
    if (inScope(node, product) && JSON.stringify(eyes(product)) === JSON.stringify(reviewedEyes) &&
      isOwnedOptionAsset(productImageSources(product)[0]?.url)) eligible.push({ node, product });
  }
  // Existing source provenance receives priority without being promoted to visual approval.
  eligible.sort((a, b) => Number(priorByHandle.has(b.node.handle)) - Number(priorByHandle.has(a.node.handle)) ||
    a.node.id.localeCompare(b.node.id));
  const selected = eligible.slice(0, 20);
  expect(selected.length).toBeGreaterThan(0);
  const nativeFetch = globalThis.fetch;
  let adminQueries = 0, imageRequests = 0;
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (/venice|openai|higgsfield/i.test(url.hostname)) throw new Error('Generation forbidden in source preparation');
    const method = init?.method || (input instanceof Request ? input.method : 'GET');
    if (url.pathname.endsWith('/graphql.json')) {
      const body = JSON.parse(String(init?.body));
      if (!/^query\b/.test(body.query.trim()) || /\bmutation\b/.test(body.query)) throw new Error('Shopify writes forbidden');
      adminQueries++;
      if (adminQueries > 2) throw new Error('Bulk read bound exceeded');
    } else if (method !== 'GET' && method !== 'HEAD' && !url.pathname.endsWith('/admin/oauth/access_token')) {
      throw new Error('Unexpected non-read request');
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
    const fresh = await adminFetch<{ nodes: Array<Node | null> }>(`query WmFamilyReadOnly($ids:[ID!]!){nodes(ids:$ids){... on Product{
      id handle title description vendor productType tags status updatedAt publishedAt
      hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value}
      resourcePublications(first:30){nodes{isPublished publication{name}} pageInfo{hasNextPage}}
      featuredImage{url altText width height} images(first:8){edges{node{url altText width height}}}
      variants(first:1){edges{node{id title price availableForSale selectedOptions{name value}}}}
      ${Object.entries(fields).map(([alias,key]) => `${alias}:metafield(namespace:"custom",key:"${key}"){value}`).join('\n')}
    }}}`, { ids: selected.map(item => item.node.id) });
    expect(fresh.nodes).toHaveLength(selected.length);
    const checkedAt = new Date().toISOString();
    await save('current-state-and-holds.json', { checkedAt, nodes: fresh.nodes, snapshotCapturedAt: snapshot.capturedAt,
      historicalHoldAuditAt: historicalHolds.checkedAt, publicationChanged: false });
    async function imageBytes(reference: string, expectedHash?: string) {
      if (!isOwnedOptionAsset(reference)) throw new Error('Unowned image');
      imageRequests++;
      if (imageRequests > 38) throw new Error('18 shared references plus 20 lead images maximum');
      const url = new URL(reference, 'https://www.dollwow.com').href;
      const response = await fetch(url, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(20_000) });
      if (!response.ok || response.redirected || response.url !== url || !response.headers.get('content-type')?.startsWith('image/')) {
        void response.body?.cancel();
        throw new Error(`Image unavailable: ${response.status}`);
      }
      const max = 20 * 1024 * 1024;
      if (Number(response.headers.get('content-length')) > max || !response.body) throw new Error('Invalid image size/body');
      const reader = response.body.getReader(), chunks: Buffer[] = [];
      let length = 0;
      try {
        while (true) {
          const item = await reader.read();
          if (item.done) break;
          length += item.value.byteLength;
          if (length > max) throw new Error('Image too large');
          chunks.push(Buffer.from(item.value));
        }
      } finally { void reader.cancel().catch(() => {}); }
      const bytes = Buffer.concat(chunks), sha256 = digest(bytes);
      if (expectedHash && expectedHash !== sha256) throw new Error('Reviewed reference digest mismatch');
      const decoder = sharp(bytes, { limitInputPixels: 25_000_000, failOn: 'warning', animated: true });
      const metadata = await decoder.metadata();
      if ((metadata.pages || 1) !== 1) throw new Error('Animated image requires separate review');
      await decoder.clone().raw().toBuffer();
      return { bytes, sha256, width: metadata.width!, height: metadata.height!, format: metadata.format!, fetchedUrl: url };
    }
    const eyeEvidence = [];
    for (const choice of reviewedEyes) {
      const expected = path.basename(choice.reference, '.webp');
      expect(digest(await fs.readFile(path.join(process.cwd(), 'public', choice.reference)))).toBe(expected);
      const image = await imageBytes(choice.reference, expected);
      eyeEvidence.push({ ...choice, sha256: image.sha256, bytes: image.bytes.length, width: image.width, height: image.height,
        reviewedForMatchingOnly: true, excludedFromLaterPreviewChoices: /^no-(10|11|12|13)$/.test(choice.optionId) });
    }
    const rows = [], excluded = [], tiles: Buffer[] = [];
    const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    for (const [index, node] of fresh.nodes.entries()) {
      const selectedNode = selected[index].node;
      if (!node || node.id !== selectedNode.id || node.handle !== selectedNode.handle) {
        excluded.push({ id: selectedNode.id, reason: 'Current identity missing/mismatched' }); continue;
      }
      const product = map(node);
      if (!inScope(node, product) || JSON.stringify(eyes(product)) !== JSON.stringify(reviewedEyes)) {
        excluded.push({ id: node.id, handle: node.handle, reason: 'Current scope, hold or exact 18-eye family mismatch' }); continue;
      }
      const photo = productImageSources(product)[0];
      try {
        const image = await imageBytes(photo.url);
        const sourceFile = path.join(output, `source-${node.id.split('/').at(-1)}.${image.format === 'jpeg' ? 'jpg' : image.format}`);
        await fs.writeFile(sourceFile, image.bytes, { mode: 0o600 });
        const number: number = rows.length + 1;
        const displayName = product.extended.displayName || product.title;
        const thumb = await sharp(image.bytes).autoOrient().resize(360, 440, { fit: 'contain', background: '#eeeeee' }).png().toBuffer();
        const footer = Buffer.from(`<svg width="360" height="80"><rect width="360" height="80" fill="white"/><g font-family="Arial" font-size="14" fill="#111"><text x="8" y="19">${number}. ${escape(displayName.slice(0, 38))}</text><text x="8" y="39">${node.id.split('/').at(-1)} | photo 0</text><text x="8" y="59">ACTIVE / custom | NOT VISUALLY APPROVED</text></g></svg>`);
        tiles.push(await sharp({ create: { width: 360, height: 520, channels: 3, background: '#fff' } })
          .composite([{ input: thumb, top: 0, left: 0 }, { input: footer, top: 440, left: 0 }]).png().toBuffer());
        rows.push({ contactSheetIndex: number, id: node.id, handle: node.handle, displayName, status: node.status,
          productType: product.productType, brand: product.extended.brand, stockStatus: product.extended.stockStatus,
          material: product.extended.material, heightCm: product.extended.heightCm, tags: node.tags,
          fullBodyEvidence: 'Custom doll product type; no head-only/torso/accessory/RTS tags or types. Visual suitability remains unreviewed.',
          currentHold: 'clear', currentCheckedAt: checkedAt, publications: node.resourcePublications,
          sourcePosition: 0, sourceUrl: photo.url, sourceFile, sourceSha256: image.sha256, sourceBytes: image.bytes.length,
          decoded: { width: image.width, height: image.height, format: image.format },
          snapshotLeadUrl: productImageSources(selected[index].product)[0]?.url,
          sharedEyeFamilyKey: sharedFamilyKey, exactEyeChoices: reviewedEyes,
          fingerprint: dollVueReadinessFingerprint(product, dollVueConfigForProduct(product, getCustomizationConfig(product))),
          disposition: 'AWAITING_SOURCE_PHOTO_INSPECTION', sourceVisualReview: 'NOT_REVIEWED', ready: false,
          priorEvidence: priorByHandle.get(node.handle) || [], priorAdultPhotoApproval: null });
      } catch (error) {
        excluded.push({ id: node.id, handle: node.handle, reason: error instanceof Error ? error.message : 'Image failure' });
      }
    }
    async function sheet(name: string, images: Buffer[], columns: number) {
      if (!images.length) return;
      await sharp({ create: { width: columns * 360, height: Math.ceil(images.length / columns) * 520, channels: 3, background: '#fff' } })
        .composite(images.map((input, index) => ({ input, left: index % columns * 360, top: Math.floor(index / columns) * 520 })))
        .png().toFile(path.join(output, name));
    }
    await sheet('contact-sheet-all.png', tiles, 4);
    await sheet('contact-sheet-01-10.png', tiles.slice(0, 10), 5);
    await sheet('contact-sheet-11-20.png', tiles.slice(10), 5);
    await save('candidate-manifest.json', { checkedAt, snapshotCapturedAt: snapshot.capturedAt, inputs,
      summary: { snapshotEligible: eligible.length, boundedSelected: selected.length, prepared: rows.length, excluded: excluded.length,
        adminQueries, imageRequests, generationCalls: 0, ready: 0, exactSharedReferences: eyeEvidence.length },
      sharedEyeFamilyKey: sharedFamilyKey, eyeEvidence, rows, excluded,
      reviewEvidenceSearch: { files: priorFiles, finding: 'Inspected WM reports establish imports/source identity, not explicit image-level adult approval. No such prior approval found in these reports; not an exhaustive archive-wide claim.' },
      candidateOnly: true, registryChanged: false, shopifyWrites: false, publicationChanged: false,
      note: 'Original owned bytes preserved. Contact sheets are fit-contained review derivatives, not replacement product images. ACTIVE is not proof of current headless publication. All source photos await visual review. Shape-ambiguous eyes no-10 through no-13 remain excluded from any later preview choices.' });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(20);
    expect(rows.every(row => !row.ready && row.exactEyeChoices.length === 18)).toBe(true);
    expect(digest(await fs.readFile('lib/dollvue/readiness-registry.json'))).toBe(digest(registryBytes));
    console.log(JSON.stringify({ prepared: rows.length, excluded: excluded.length, snapshotEligible: eligible.length,
      adminQueries, imageRequests, generationCalls: 0, manifest: path.join(output, 'candidate-manifest.json') }));
  } finally { vi.unstubAllGlobals(); }
}, 300_000);

it.skipIf(process.env.DOLLVUE_WM_FAMILY_PREPARATION !== 'census')('counts the complete additional exact-eye WM family using bulk read-only current metadata', async () => {
  await fs.mkdir(output, { recursive: true, mode: 0o700 });
  const registryBytes = await fs.readFile('lib/dollvue/readiness-registry.json');
  const registry = JSON.parse(registryBytes.toString()) as Record<string, unknown>;
  const snapshotFile = path.join(root, 'shopify-snapshot.json');
  const snapshotBytes = await fs.readFile(snapshotFile);
  const snapshot = JSON.parse(snapshotBytes.toString()) as { capturedAt: string; nodes: Node[] };
  const historic = await read<{ checkedAt: string; rows: Hold[] }>(path.join(root, 'current-holds.json'));
  const prep = await read<{ records: Array<{ choices: Choice[] }> }>(path.join(root, 'jk-private-preparation.json'));
  const reviewedEyes = prep.records[0].choices.filter(choice => choice.groupId === 'eye-color');
  const batch = await read<{ rows: Array<{ id: string }> }>(path.join(output, 'candidate-manifest.json'));
  const preparedIds = new Set(batch.rows.map(row => row.id));
  const snapshotExcluded = [], candidates: Node[] = [];
  for (const node of snapshot.nodes) {
    if (node.brand?.value !== 'WM Dolls' || node.status !== 'ACTIVE') continue;
    const oldHold = historic.rows.find(row => row.id === node.id);
    let reason: string | null = null;
    if (registry[node.id] || node.id === 'gid://shopify/Product/10431698337976') reason = 'already-in-registry-or-Audrey';
    else if (!oldHold || oldHold.handle !== node.handle || hasHold(oldHold)) reason = 'historic-hold-or-missing-identity-evidence';
    else {
      const product = map(node);
      if (!inScope(node, product)) reason = 'outside-active-custom-full-body-scope';
      else if (JSON.stringify(eyes(product)) !== JSON.stringify(reviewedEyes)) reason = 'not-exact-reviewed-18-eye-family';
    }
    if (reason) snapshotExcluded.push({ id: node.id, handle: node.handle, reason });
    else candidates.push(node);
  }
  const nativeFetch = globalThis.fetch;
  let bulkQueries = 0;
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname.endsWith('/graphql.json')) {
      const body = JSON.parse(String(init?.body));
      if (!/^query\b/.test(body.query.trim()) || /\bmutation\b/.test(body.query)) throw new Error('Read-only census');
      bulkQueries++;
      if (bulkQueries > 20) throw new Error('Bounded bulk census maximum exceeded');
    } else if (!url.pathname.endsWith('/admin/oauth/access_token')) throw new Error('Census permits only Admin reads and token renewal');
    return nativeFetch(input, init);
  });
  try {
    const fields: Record<string, string> = {
      catalogIdentityKey: 'catalog_identity_key', catalogBodyIdentityKey: 'catalog_body_identity_key', headModel: 'head_model',
      displayName: 'display_name', bodyType: 'body_type', brand: 'brand', material: 'material', heightCm: 'height_cm',
      weightLb: 'weight_lb', cupSize: 'cup_size', measurements: 'measurements', stockStatus: 'stock_status',
      customAvailable: 'custom_available', irontechUlwEligibility: 'irontech_ulw_eligibility', customizationGroups: 'customization_groups',
    };
    const rows = [], currentExcluded = [];
    for (let offset = 0; offset < candidates.length; offset += 50) {
      const chunk = candidates.slice(offset, offset + 50);
      const data = await adminFetch<{ nodes: Array<Node | null> }>(`query WmFamilyCensus($ids:[ID!]!){nodes(ids:$ids){... on Product{
        id handle title description vendor productType tags status updatedAt publishedAt
        hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value}
        resourcePublications(first:30){nodes{isPublished publication{name}} pageInfo{hasNextPage}}
        featuredImage{url altText width height} images(first:8){edges{node{url altText width height}}}
        variants(first:1){edges{node{id title price availableForSale selectedOptions{name value}}}}
        ${Object.entries(fields).map(([alias,key]) => `${alias}:metafield(namespace:"custom",key:"${key}"){value}`).join('\n')}
      }}}`, { ids: chunk.map(node => node.id) });
      expect(data.nodes).toHaveLength(chunk.length);
      const checkedAt = new Date().toISOString();
      for (const [index, node] of data.nodes.entries()) {
        if (!node || node.id !== chunk[index].id || node.handle !== chunk[index].handle) {
          currentExcluded.push({ id: chunk[index].id, reason: 'missing-or-mismatched-current-identity' }); continue;
        }
        const product = map(node);
        if (!inScope(node, product)) {
          currentExcluded.push({ id: node.id, handle: node.handle, reason: 'current-hold-or-scope-exclusion', status: node.status, tags: node.tags, hold: node.hold }); continue;
        }
        if (JSON.stringify(eyes(product)) !== JSON.stringify(reviewedEyes)) {
          currentExcluded.push({ id: node.id, handle: node.handle, reason: 'current-eye-family-changed' }); continue;
        }
        const lead = productImageSources(product)[0];
        if (!lead || !isOwnedOptionAsset(lead.url)) {
          currentExcluded.push({ id: node.id, handle: node.handle, reason: 'no-owned-current-lead' }); continue;
        }
        rows.push({ id: node.id, handle: node.handle, displayName: product.extended.displayName, checkedAt,
          status: node.status, stockStatus: product.extended.stockStatus, productType: product.productType,
          brand: product.extended.brand, material: product.extended.material, heightCm: product.extended.heightCm,
          currentHold: 'clear', hold: node.hold, tags: node.tags, publications: node.resourcePublications,
          exactReviewedEyeChoices: 18, sourcePosition: 0, sourceUrl: lead.url,
          fingerprint: dollVueReadinessFingerprint(product, dollVueConfigForProduct(product, getCustomizationConfig(product))),
          currentBatchPhotoPinned: preparedIds.has(node.id),
          disposition: 'INDIVIDUAL_SOURCE_REVIEW_REQUIRED', ready: false });
      }
      await save('family-census.json', { checkedAt, complete: offset + chunk.length === candidates.length,
        snapshotCapturedAt: snapshot.capturedAt, snapshotSha256: digest(snapshotBytes), historicalHoldAuditAt: historic.checkedAt,
        summary: { snapshotAdditionalExactFamily: candidates.length, currentAdditionalExactFamily: rows.length,
          checked: Math.min(offset + chunk.length, candidates.length), currentExcluded: currentExcluded.length,
          preparedInFirstBatch: rows.filter(row => row.currentBatchPhotoPinned).length,
          remainingSourcePreparation: rows.filter(row => !row.currentBatchPhotoPinned).length, bulkQueries, generationCalls: 0, ready: 0 },
        exactEyeReferences: reviewedEyes, rows, snapshotExcluded, currentExcluded,
        note: 'Current census of the existing snapshot scope only; products created after that snapshot are not included. ACTIVE does not prove headless-channel publication. No new generation needed for these same references under owner family-sampling acceptance; every individual source still needs identity/content review and image pins. no-10..no-13 remain excluded from future preview choices.',
        registryChanged: false, shopifyWrites: false, publicationChanged: false });
      console.log(JSON.stringify({ checked: offset + chunk.length, total: candidates.length, currentMatches: rows.length, bulkQueries }));
    }
    expect(digest(await fs.readFile('lib/dollvue/readiness-registry.json'))).toBe(digest(registryBytes));
  } finally { vi.unstubAllGlobals(); }
}, 300_000);
