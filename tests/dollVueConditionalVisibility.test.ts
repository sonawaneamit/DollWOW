import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import type { BrandCustomizationConfig } from '@/types/customization';
import { sampleProducts } from '@/lib/data/sample-products';
import { isDollVueGroupVisible } from '@/lib/dollvue/conditionalVisibility';
import { areDollVueSelectionsValid, dollVueGroups } from '@/lib/dollvue/config';
import { dollVueReadinessFingerprint, evaluateDollVueReadiness, reviewedDollVueConfig, type DollVueReadinessRecord } from '@/lib/dollvue/readiness';
import { DOLLVUE_APPEARANCE_POLICY } from '@/lib/dollvue/appearance';

const mocks = vi.hoisted(() => ({ product: vi.fn(), eligibility: vi.fn(), image: vi.fn(), mail: vi.fn(), usage: vi.fn(), record: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/shopify/storefront', () => ({ getProductByHandle: mocks.product }));
vi.mock('@/lib/dollvue/eligibility', () => ({ resolveCurrentDollVueEligibility: mocks.eligibility }));
vi.mock('@/lib/dollvue/reviewedImages', () => ({ normalizeReviewedImage: mocks.image }));
vi.mock('@/lib/dollvue/email', () => ({ sendDollVueLookEmail: mocks.mail }));
vi.mock('@/lib/dollvue/accountUsage', () => ({ dollVueUsageForEmail: mocks.usage, recordDollVuePreview: mocks.record }));
vi.mock('@/lib/dollvue/session', () => ({ readDollVueSession: () => ({ email: 'fixture@example.invalid' }) }));
vi.mock('@/lib/utils/env', () => ({ env: { NEXT_PUBLIC_SITE_URL: 'https://dollwow.com', VENICE_API_KEY: 'test-only', DOLLVUE_ENABLED: 'true', DOLLVUE_DAILY_LIMIT: '100' } }));
import { POST as generate } from '@/app/dollvue/generate/route';
import { POST as cart } from '@/app/dollvue/cart/route';

const source = '/product-media/conditional-fixture.webp';
const reference = '/option-assets/conditional-blue.webp';
const product = { ...sampleProducts[0], id: 'gid://shopify/Product/conditional', handle: 'gynoid-conditional-fixture',
  vendor: 'Gynoid', tags: [], images: [{ url: source, altText: 'Fixture' }], featuredImage: { url: source, altText: 'Fixture' },
  variants: [{ ...sampleProducts[0].variants[0], availableForSale: true, price: { amount: '2000', currencyCode: 'USD' } }],
  extended: { ...sampleProducts[0].extended, brand: 'Gynoid', stockStatus: 'custom' as const } };
const selections = [{ groupId: 'eye-color', optionId: 'blue' }];
function fixture(): BrandCustomizationConfig {
  const option = (id: string, label: string) => ({ id, label, priceDelta: 0, priceVerified: true, purchasable: true });
  return { id: 'conditional-fixture', brandLabel: 'Gynoid', leadTimeNote: '', rules: [], groups: [
    { id: 'head', label: 'Head', selectionMode: 'single', display: 'swatches', options: [
      option('no-change', 'As shown'), ...['elsa','gina','ji-xiang','joey','laura','li-hui','lisa','wan-ying','ji-xiang-eye-closed'].map(id => option(id, id))] },
    { id: 'eye-color', label: 'Eye Color', selectionMode: 'single', display: 'swatches',
      visibleWhen: ['no-change','elsa','gina','ji-xiang','joey','laura','li-hui','lisa','wan-ying'].map(optionId => [{ groupId: 'head', optionId }]),
      options: [option('no-change', 'As shown'), { ...option('blue', 'Blue'), dollVueEnabled: true, swatch: { kind: 'image', value: reference } }] }
  ] };
}
function record(config: BrandCustomizationConfig): DollVueReadinessRecord {
  return { productId: product.id, policy: DOLLVUE_APPEARANCE_POLICY, fingerprint: dollVueReadinessFingerprint(product, config),
    status: 'ready', sourcePositions: [0], choices: [{ ...selections[0], reference }], imageDigests: { [source]: 'a'.repeat(64), [reference]: 'b'.repeat(64) } };
}
function readiness(config: BrandCustomizationConfig) {
  return evaluateDollVueReadiness(product, config, record(config), { published: false, privateReview: true, contentExcluded: false });
}
let requestId = 0;
function request(route: string) {
  return new Request(`https://dollwow.com/dollvue/${route}`, { method: 'POST',
    headers: { origin: 'https://dollwow.com', 'content-type': 'application/json', 'x-forwarded-for': `192.0.2.${++requestId}` },
    body: JSON.stringify({ productHandle: product.handle, sourcePosition: 0, selections }) });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network call'); }));
  mocks.product.mockResolvedValue(product);
  mocks.image.mockResolvedValue('data:image/webp;base64,fixture');
  mocks.usage.mockResolvedValue({ available: true, remaining: 5 });
  mocks.record.mockResolvedValue(true);
  mocks.mail.mockResolvedValue({ delivered: false });
});
afterEach(() => vi.unstubAllGlobals());

it('allows only reviewed iris choices under the unchanged source head without mutating conditions or fingerprints', () => {
  const config = fixture(), before = structuredClone(config), fingerprint = dollVueReadinessFingerprint(product, config);
  expect(isDollVueGroupVisible(config, config.groups[1], new Set(['eye-color']))).toBe(true);
  expect(readiness(config)).toMatchObject({ ready: true, publiclyAvailable: false, privatelyAvailable: true });
  const reviewed = reviewedDollVueConfig(config, readiness(config), 'private');
  expect(areDollVueSelectionsValid(reviewed, selections)).toBe(true);
  expect(dollVueGroups(reviewed).map(group => group.id)).toEqual(['eye-color']);
  expect(config).toEqual(before);
  expect(dollVueReadinessFingerprint(product, reviewed)).toBe(fingerprint);
  expect(dollVueGroups(reviewedDollVueConfig(config, readiness(config), 'public'))).toEqual([]);
});

const negatives: Array<[string, (config: BrandCustomizationConfig) => void]> = [
  ['replacement default', c => c.groups[0].options.reverse()],
  ['visible named replacement default', c => { c.groups[0].options.unshift(c.groups[0].options.splice(1, 1)[0]); }],
  ['non-iris meaning with eye ID', c => { c.groups[1].label = 'Hairstyle'; }],
  ['missing head', c => c.groups.shift()],
  ['missing default', c => { c.groups[0].options = []; }],
  ['multiple head', c => { c.groups[0].selectionMode = 'multiple'; }],
  ['hidden iris', c => { c.groups[1].visibleWhen = [[{ groupId: 'head', optionId: 'elsa' }]]; }],
  ['nested dependency', c => { c.groups.push({ id: 'body', label: 'Body', display: 'cards', options: [{ id: 'default', label: 'Default' }] }); c.groups[0].visibleWhen = [[{ groupId: 'body', optionId: 'default' }]]; }],
  ['cycle', c => { c.groups[0].visibleWhen = [[{ groupId: 'eye-color', optionId: 'blue' }]]; }],
  ['empty conditions', c => { c.groups[1].visibleWhen = []; }],
  ['empty branch', c => { c.groups[1].visibleWhen = [[]]; }],
  ['invalid option', c => { c.groups[1].visibleWhen = [[{ groupId: 'head', optionId: 'missing' }]]; }],
  ['null conditions', c => { c.groups[1].visibleWhen = null as never; }],
  ['duplicate head', c => { c.groups.push(structuredClone(c.groups[0])); }],
  ['unavailable default', c => { c.groups[0].options[0].factoryExists = false; }],
];
it.each(negatives)('rejects %s in readiness and both real route validators', async (_name, change) => {
  const config = fixture(); change(config);
  expect(readiness(config).ready).toBe(false);
  expect(areDollVueSelectionsValid(config, selections)).toBe(false);
  // Deliberately bypass eligibility to prove each route independently enforces the guard.
  mocks.eligibility.mockResolvedValue({ available: true, config, sourcePositions: [0], imageDigests: record(config).imageDigests });
  expect((await generate(request('generate'))).status).toBe(400);
  expect((await cart(request('cart'))).status).toBe(409);
  expect(mocks.image).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});

it('rejects a selectable dependency even when not requested and keeps other conditional groups blocked', async () => {
  const config = fixture(); config.groups[0].options[0].dollVueEnabled = true;
  expect(isDollVueGroupVisible(config, config.groups[1], new Set(['eye-color', 'head']))).toBe(false);
  expect(areDollVueSelectionsValid(config, selections)).toBe(false);
  const reviewed = record(config); reviewed.choices.push({ groupId: 'head', optionId: 'no-change', reference });
  expect(evaluateDollVueReadiness(product, config, reviewed, { published: false, contentExcluded: false }).ready).toBe(false);
  mocks.eligibility.mockResolvedValue({ available: true, config, sourcePositions: [0] });
  expect((await generate(request('generate'))).status).toBe(400);
  expect((await cart(request('cart'))).status).toBe(409);
  config.groups[1].id = 'hairstyle';
  expect(isDollVueGroupVisible(config, config.groups[1], new Set(['hairstyle']))).toBe(false);
});

it('accepts the same safe iris selection through real generation/cart routes with all external effects mocked', async () => {
  const config = fixture();
  mocks.eligibility.mockResolvedValue({ available: true, config, sourcePositions: [0], imageDigests: record(config).imageDigests, revision: 'conditional-fixture' });
  const bytes = await sharp({ create: { width: 600, height: 800, channels: 3, background: '#aaaaaa' } }).webp().toBuffer();
  vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array(bytes))));
  const generated = await generate(request('generate'));
  expect(generated.status).toBe(200);
  expect((await generated.json()).selections).toMatchObject(selections);
  expect(fetch).toHaveBeenCalledTimes(1);
  const response = await cart(request('cart'));
  expect(response.status).toBe(200);
  const payload = await response.json();
  expect(payload.item.selections).toMatchObject({ head: 'no-change', 'eye-color': 'blue' });
  expect(payload.item.unitPrice).toBe(2000);
  expect(payload.item.attributes).toContainEqual({ key: 'DollWow Head', value: 'As shown' });
  expect(payload.item.attributes).toContainEqual({ key: 'DollWow Eye Color', value: 'Blue' });
});
