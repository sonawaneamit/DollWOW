import { mkdir, open, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseEnv } from 'node:util';
import { expect, it } from 'vitest';
import type { Product } from '@/types/product';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';

const enabled = process.env.DOLLVUE_RELEASE_SMOKE === '1';
const output = '/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/release-smoke.json';
const origin = 'https://dollwow.com';
const cases = [
  { handle: 'wm-audrey-166cm-c-cup-tpe-companion-doll-187yz', optionId: 'no-2' },
  { handle: 'sedoll-lita-b-163cm-c-cup-silicone-companion-doll-1fl7h', optionId: 'handmade-01' },
];

// Opt-in only: real read APIs and the local cart-payload handler, never checkout,
// generation, mail, publication or mutations. The shared setup handles server-only.
it.skipIf(!enabled)('checks the current DollVue release with real reads and no catalog writes', async () => {
  const checks: Array<{ name: string; status: 'PASS' | 'FAIL'; elapsedMs: number; details: Record<string, unknown>; error?: string }> = [];
  async function check(name: string, action: (details: Record<string, unknown>) => Promise<void>) {
    const started = Date.now();
    const details: Record<string, unknown> = {};
    try {
      await action(details);
      checks.push({ name, status: 'PASS', elapsedMs: Date.now() - started, details });
    } catch (error) {
      checks.push({ name, status: 'FAIL', elapsedMs: Date.now() - started, details,
        error: error instanceof Error ? `${error.name}: ${error.message}` : String(error) });
    }
  }
  const startedAt = new Date().toISOString();
  try {
    Object.assign(process.env, parseEnv(await readFile('.env.local', 'utf8')));
    const { getProductByHandle } = await import('@/lib/shopify/storefront');
    const { adminFetch } = await import('@/lib/shopify/admin');
    const { getCurrentDollVueHold } = await import('@/lib/dollvue/currentHold');
    const { resolveDollVueEligibility, resolveCurrentDollVueEligibility } = await import('@/lib/dollvue/eligibility');
    const { normalizeReviewedImage } = await import('@/lib/dollvue/reviewedImages');
    const { productImageSources } = await import('@/lib/catalog/productImage');
    const { getDefaultSelections, resolveCustomization } = await import('@/lib/customization/resolve');
    const { promotionPricingForSelections } = await import('@/lib/promotions/optionPricing');
    const { POST } = await import('@/app/dollvue/cart/route');
    const registry = (await import('@/lib/dollvue/readiness-registry.json')).default as Record<string, DollVueReadinessRecord>;

    for (const item of cases) {
      let product: Product | null = null;
      await check(`${item.handle}: strict Storefront and current readiness`, async details => {
        product = await getProductByHandle(item.handle, { strict: true, cache: 'no-store' });
        expect(product, 'Published strict Storefront product').not.toBeNull();
        details.productId = product!.id;
        details.registryStatus = registry[product!.id]?.status;
        expect(registry[product!.id]?.status).toBe('ready');
        const eligibility = await resolveCurrentDollVueEligibility(product!);
        details.available = eligibility.available;
        details.sourcePositions = eligibility.sourcePositions;
        details.revision = eligibility.revision;
        expect(eligibility.available).toBe(true);
        expect(eligibility.sourcePositions).toContain(0);
        expect(eligibility.config.groups.find(group => group.id === 'eye-color')?.options
          .find(option => option.id === item.optionId)?.dollVueEnabled).toBe(true);
      });

      await check(`${item.handle}: current private hold`, async details => {
        expect(product).not.toBeNull();
        details.hold = await getCurrentDollVueHold(product!.id);
        expect(details.hold).toBe('clear');
      });

      for (const kind of ['source', 'reference'] as const) {
        await check(`${item.handle}: ${kind} image digest`, async details => {
          expect(product).not.toBeNull();
          const record = registry[product!.id];
          expect(record?.status).toBe('ready');
          const choice = record.choices.find(choice => choice.groupId === 'eye-color' && choice.optionId === item.optionId);
          expect(choice).toBeDefined();
          const url = kind === 'source' ? productImageSources(product!)[0]?.url : choice!.reference;
          expect(url).toBeTruthy();
          const sha256 = record.imageDigests?.[url!];
          expect(sha256).toMatch(/^[a-f0-9]{64}$/);
          details.url = url;
          details.expectedSha256 = sha256;
          const normalized = await normalizeReviewedImage({ url: url!, sha256: sha256!, origin, optionReference: kind === 'reference' });
          expect(normalized).toMatch(/^data:image\/(jpeg|png|webp|gif);base64,/);
          expect(Buffer.from(normalized.split(',')[1], 'base64').length).toBeGreaterThan(0);
          details.originalDigestVerified = true;
          details.normalizedBytes = Buffer.from(normalized.split(',')[1], 'base64').length;
        });
      }

      await check(`${item.handle}: real cart payload route`, async details => {
        const response = await POST(new Request(`${origin}/dollvue/cart`, {
          method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
          body: JSON.stringify({ productHandle: item.handle, selections: [{ groupId: 'eye-color', optionId: item.optionId }] }),
        }));
        const payload = await response.json();
        details.status = response.status;
        details.payload = payload;
        expect(response.status, JSON.stringify(payload)).toBe(200);
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(product).not.toBeNull();
        const variant = product!.variants.find(variant => variant.availableForSale);
        expect(variant).toBeDefined();
        const config = resolveDollVueEligibility(product!).config;
        const now = new Date();
        const initialConfig = promotionPricingForSelections(product!, config, {}, now).config;
        const selections = { ...getDefaultSelections(initialConfig), 'eye-color': item.optionId };
        const pricedConfig = promotionPricingForSelections(product!, config, selections, now).config;
        const basePrice = Number(variant!.price.amount);
        const expected = resolveCustomization(pricedConfig, selections, basePrice);
        expect(expected.issues).toEqual([]);
        expect(expected.requiresPriceConfirmation).toBe(false);
        expect(payload.item).toMatchObject({ merchandiseId: variant!.id, productHandle: item.handle,
          currencyCode: variant!.price.currencyCode, readyToShip: false, selections: expected.selections });
        expect(payload.item.selections['eye-color']).toBe(item.optionId);
        expect(Number.isFinite(payload.item.unitPrice)).toBe(true);
        expect(payload.item.unitPrice).toBeGreaterThan(0);
        expect(payload.item.unitPrice).toBeCloseTo(basePrice + expected.optionPriceDelta, 2);
        expect(payload.item.unitPrice).toBeCloseTo(expected.totalPrice, 2);
        expect(payload.item.attributes).toEqual(expect.arrayContaining(expected.cartAttributes));
        if (expected.optionPriceDelta > 0) {
          expect(payload.item.customizationCharge.amount).toBeCloseTo(expected.optionPriceDelta, 2);
          expect(payload.item.customizationCharge.currencyCode).toBe(variant!.price.currencyCode);
          expect(payload.item.customizationCharge.items).toEqual(expected.selectedOptions.filter(option => option.priceDelta > 0)
            .map(option => ({ group: option.groupLabel, label: option.optionLabel, amount: option.priceDelta })));
        } else {
          expect(payload.item.customizationCharge).toBeUndefined();
        }
        details.basePrice = basePrice;
        details.optionPriceDelta = expected.optionPriceDelta;
      });
    }

    const draftHandle = 'jk-dolls-janice-malachi-165cm-g-cup-tpe-companion-doll-14soz';
    await check('JK control remains an Admin draft', async details => {
      const data = await adminFetch<{ productByHandle: { id: string; status: string } | null }>(
        'query ReleaseSmokeDraft($handle: String!) { productByHandle(handle: $handle) { id status } }', { handle: draftHandle });
      details.handle = draftHandle;
      details.product = data.productByHandle;
      expect(data.productByHandle?.status).toBe('DRAFT');
    });
    for (const handle of [draftHandle, 'dollvue-release-smoke-nonexistent-20261007-control']) {
      await check(`${handle}: strict lookup returns null`, async details => {
        const product = await getProductByHandle(handle, { strict: true, cache: 'no-store' });
        details.result = product === null ? null : { id: product.id, handle: product.handle };
        expect(product).toBeNull();
      });
    }
  } catch (error) {
    checks.push({ name: 'Smoke setup', status: 'FAIL', elapsedMs: 0, details: {},
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error) });
  } finally {
    await mkdir(path.dirname(output), { recursive: true, mode: 0o700 });
    const file = await open(output, 'w', 0o600);
    try {
      await file.chmod(0o600);
      await file.writeFile(JSON.stringify({ startedAt, completedAt: new Date().toISOString(),
        status: checks.some(check => check.status === 'FAIL') ? 'FAIL' : 'PASS',
        environment: '.env.local', origin, generationCalled: false, customerMailSent: false,
        shopifyWrites: false, publicationChanged: false, checks }, null, 2));
    } finally { await file.close(); }
  }
  const failures = checks.filter(check => check.status === 'FAIL');
  console.log(JSON.stringify({ output, checks: checks.length, failures: failures.map(({ name, error }) => ({ name, error })) }));
  expect(failures, `Private report: ${output}`).toEqual([]);
  expect(checks).toHaveLength(13);
}, 240_000);
