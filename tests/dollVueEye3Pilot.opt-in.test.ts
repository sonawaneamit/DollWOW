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

import { POST } from '@/app/dollvue/generate/route';
import { getProductByHandle } from '@/lib/shopify/storefront';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { dollVueReadinessFingerprint } from '@/lib/dollvue/readiness';
import { productImageSources } from '@/lib/catalog/productImage';
import { getCurrentDollVueHolds } from '@/lib/dollvue/currentHold';
import { normalizeReviewedImage } from '@/lib/dollvue/reviewedImages';
import { env } from '@/lib/utils/env';

const root = '/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/6ye-hr-eye3-preparation';
const blueHash = '5d0d14251992d753a5f73b4cdee66b12c07bad149ab935490d84bcaf5c4e6bb0';
const choice = { groupId: 'eye-color', optionId: 'blue', reference: `/option-assets/${blueHash}.webp` };
const candidates = {
  '6YE': { family: '6YE_EYE3', brand: '6YE Dolls', id: 'gid://shopify/Product/10434001010872',
    handle: '6ye-remmel-165cm-i-cup-tpe-companion-doll-161kz', review: 'source-review-1-80.json',
    sourceSha256: '43922172c20ac6cec2e9629d1bace3644073e2f16db7117c810db53ec1310365' },
  HR: { family: 'HR_EYE3', brand: 'HR Dolls', id: 'gid://shopify/Product/10517660401848',
    handle: 'hr-dolls-allen-167cm-tpe-companion-doll-1uego', review: 'source-review-161-227.json',
    sourceSha256: 'ed039b1be2743d7b6507090e784689705a00ccb3c8f964c843fe0375b2cce842' },
} as const;
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
type Pin = { file: string; sha256: string };
type Approval = {
  reviewer: string; ownerReviewed: boolean; approved: boolean; brand: string;
  productId: string; sourcePosition: number; sourceSha256: string;
  proposalSha256: string; reviewSha256: string; referenceSha256: string;
  optionId: string; maxProviderCalls: number; fullyClothedAdultNonExplicit: boolean;
};
function assertApproval(a: Approval, brand: keyof typeof candidates, proposalHash: string, reviewHash: string) {
  expect(a).toMatchObject({ reviewer: 'parent-assistant', ownerReviewed: false, approved: true,
    brand, productId: candidates[brand].id, sourcePosition: 0, sourceSha256: candidates[brand].sourceSha256,
    proposalSha256: proposalHash, reviewSha256: reviewHash, referenceSha256: blueHash,
    optionId: 'blue', maxProviderCalls: 1, fullyClothedAdultNonExplicit: true });
}

it('requires exact parent-approved pilot pins, not general source approval', () => {
  const a: Approval = { reviewer: 'parent-assistant', ownerReviewed: false, approved: true,
    brand: '6YE', productId: candidates['6YE'].id, sourcePosition: 0,
    sourceSha256: candidates['6YE'].sourceSha256, proposalSha256: 'proposal', reviewSha256: 'review',
    referenceSha256: blueHash, optionId: 'blue', maxProviderCalls: 1, fullyClothedAdultNonExplicit: true };
  assertApproval(a, '6YE', 'proposal', 'review');
  for (const change of [{ approved: false }, { ownerReviewed: true }, { reviewer: 'assistant' },
    { maxProviderCalls: 2 }, { optionId: 'brown' }, { proposalSha256: 'stale' },
    { sourceSha256: 'changed' }, { fullyClothedAdultNonExplicit: false }]) {
    expect(() => assertApproval({ ...a, ...change }, '6YE', 'proposal', 'review')).toThrow();
  }
});

// DOLLVUE_EYE3_PILOT=6YE|HR, DOLLVUE_EYE3_PILOT_PROPOSAL=<private proposal>,
// DOLLVUE_EYE3_PILOT_APPROVAL=<parent-authored Approval JSON>. No approval is fabricated here.
// Fixed per-brand reservation paths deliberately cannot be overridden or reset by this harness.
it.skipIf(!process.env.DOLLVUE_EYE3_PILOT)('runs one approved Blue iris pilot with real current gates', async () => {
  const brand = process.env.DOLLVUE_EYE3_PILOT;
  expect(['6YE', 'HR']).toContain(brand);
  const key = brand as keyof typeof candidates;
  const candidate = candidates[key];
  const pins: Pin[] = [];
  async function read<T>(file: string): Promise<T> {
    expect(path.resolve(file).startsWith(`${root}/`)).toBe(true);
    const bytes = await fs.readFile(file);
    pins.push({ file, sha256: sha(bytes) });
    return JSON.parse(bytes.toString()) as T;
  }
  const proposal = await read<{ privateProposalOnly: boolean; records: Record<string, DollVueReadinessRecord>;
    summary: { family: string }; evidence: { inputs: Pin[] } }>(process.env.DOLLVUE_EYE3_PILOT_PROPOSAL!);
  const proposalHash = pins[0].sha256;
  const review = await read<{ frozen: boolean; reviewer: string; ownerReviewed: boolean;
    rows: Array<{ id: string; handle: string; sourcePosition: number; sourceUrl: string;
      sourceSha256: string; reviewer: string; ownerReviewed: boolean; decision: string }> }>(path.join(root, candidate.review));
  const reviewHash = pins[1].sha256;
  const approval = await read<Approval>(process.env.DOLLVUE_EYE3_PILOT_APPROVAL!);
  assertApproval(approval, key, proposalHash, reviewHash);
  expect(proposal.privateProposalOnly).toBe(true);
  expect(proposal.summary.family).toBe(candidate.family);
  expect(proposal.evidence.inputs).toContainEqual({ file: path.join(root, candidate.review), sha256: reviewHash });
  for (const pin of proposal.evidence.inputs) {
    expect(path.resolve(pin.file).startsWith(`${root}/`)).toBe(true);
    expect(sha(await fs.readFile(pin.file))).toBe(pin.sha256);
    pins.push(pin);
  }
  expect(review).toMatchObject({ frozen: true, reviewer: 'assistant', ownerReviewed: false });
  const rows = review.rows.filter(r => r.id === candidate.id);
  expect(rows).toHaveLength(1);
  const source = rows[0];
  expect(source).toMatchObject({ handle: candidate.handle, sourcePosition: 0,
    sourceSha256: candidate.sourceSha256, reviewer: 'assistant', ownerReviewed: false, decision: 'approve' });
  expect(sha(await fs.readFile(path.join(root, `source-${candidate.id.split('/').pop()}.jpg`)))).toBe(candidate.sourceSha256);
  const record = proposal.records[candidate.id];
  expect(record).toMatchObject({ productId: candidate.id, status: 'ready', sourcePositions: [0] });
  expect(record.choices).toHaveLength(3);
  expect(record.choices.every(c => c.groupId === 'eye-color')).toBe(true);
  expect(record.choices.map(c => c.optionId).sort()).toEqual(['blue', 'brown', 'green']);
  expect(record.choices).toContainEqual(choice);
  expect(record.imageDigests?.[source.sourceUrl]).toBe(candidate.sourceSha256);
  expect(record.imageDigests?.[choice.reference]).toBe(blueHash);

  const output = path.join(root, `pilot-${key.toLowerCase()}`);
  await fs.mkdir(output, { recursive: true, mode: 0o700 });
  const save = (name: string, data: unknown) => fs.writeFile(path.join(output, name), JSON.stringify(data, null, 2), { flag: 'wx', mode: 0o600 });
  const origin = new URL(env.NEXT_PUBLIC_SITE_URL).origin;
  expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);
  const registryFile = 'lib/dollvue/readiness-registry.json';
  const before = sha(await fs.readFile(registryFile));
  const nativeFetch = globalThis.fetch;
  let calls = 0;
  let armed = false;
  let normalizedBlueHash = '';
  const result: Record<string, unknown> = { brand: key, productId: candidate.id, sourcePosition: 0,
    sourceSha256: candidate.sourceSha256, proposalHash, reviewHash, ownerReviewed: false,
    visualInspection: 'pending', registryWrittenByHarness: false, customerMailSent: false };
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (url.href === 'https://api.venice.ai/api/v1/image/multi-edit') {
      expect(armed).toBe(true);
      expect(calls, 'No retry or refusal fallback permitted').toBe(0);
      expect(method).toBe('POST');
      const body = JSON.parse(String(init?.body));
      expect(body.modelId).toBe('seedream-v5-pro-edit');
      expect(body.images).toHaveLength(2);
      const imageHashes = body.images.map((image: string) => {
        expect(image).toMatch(/^data:image\//);
        return sha(Buffer.from(image.split(',')[1], 'base64'));
      });
      expect(imageHashes).toEqual([candidate.sourceSha256, normalizedBlueHash]);
      for (const pin of pins) expect(sha(await fs.readFile(pin.file))).toBe(pin.sha256);
      // A durable exclusive reservation is consumed even on network failure or refusal.
      await save('reservation.json', { brand: key, productId: candidate.id, maxProviderCalls: 1,
        attemptedAt: new Date().toISOString(), proposalHash, reviewHash, imageHashes });
      calls++;
      await save('request.json', { ...body, images: undefined, imageHashes, sourceUrl: source.sourceUrl });
      const response = await nativeFetch(input, { ...init, redirect: 'error' });
      result.providerStatus = response.status;
      return response;
    }
    const shop = env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (url.protocol === 'https:' && url.hostname === shop && method === 'POST') {
      if (url.pathname.endsWith('/graphql.json')) {
        const body = JSON.parse(String(init?.body));
        expect(body.query.trim()).toMatch(/^query\b/);
        expect(body.query).not.toMatch(/\bmutation\b/);
      } else expect(url.pathname).toBe('/admin/oauth/access_token');
    } else {
      expect(method).toBe('GET');
      expect([source.sourceUrl, new URL(choice.reference, origin).href]).toContain(url.href);
    }
    return nativeFetch(input, { ...init, redirect: 'error' });
  });
  try {
    const product = await getProductByHandle(candidate.handle, { cache: 'no-store', strict: true });
    expect(product?.id).toBe(candidate.id);
    expect(product?.extended.brand).toBe(candidate.brand);
    expect(productImageSources(product!)[0].url).toBe(source.sourceUrl);
    const menu = getCustomizationConfig(product!);
    expect(dollVueReadinessFingerprint(product!, menu)).toBe(record.fingerprint);
    expect(menu.groups.find(g => g.id === 'eye-color')?.options.find(o => o.id === 'blue')?.swatch?.value).toBe(choice.reference);
    const holds = await getCurrentDollVueHolds([candidate.id]);
    expect(holds.get(candidate.id)).toBe('clear');
    result.holdCheckedAt = new Date().toISOString();
    await normalizeReviewedImage({ url: source.sourceUrl, sha256: candidate.sourceSha256, origin });
    const blue = await normalizeReviewedImage({ url: choice.reference, sha256: blueHash, origin, optionReference: true });
    normalizedBlueHash = sha(Buffer.from(blue.split(',')[1], 'base64'));
    state.registry[candidate.id] = { ...record, choices: [choice] };
    armed = true;
    const response = await POST(new Request(`${origin}/dollvue/generate`, { method: 'POST',
      headers: { origin, 'Content-Type': 'application/json', 'x-vercel-ip-country': 'US' },
      body: JSON.stringify({ productHandle: candidate.handle, sourcePosition: 0,
        selections: [{ groupId: 'eye-color', optionId: 'blue' }] }) }));
    const payload = await response.json();
    Object.assign(result, { status: response.status, error: payload.error });
    if (payload.previewDataUrl) {
      const bytes = Buffer.from(payload.previewDataUrl.split(',')[1], 'base64');
      await fs.writeFile(path.join(output, 'blue.webp'), bytes, { flag: 'wx', mode: 0o600 });
      result.outputSha256 = sha(bytes);
    }
    expect(response.status, String(payload.error)).toBe(200);
    expect(payload.emailDelivered).toBe(false);
    expect(calls).toBe(1);
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    armed = false;
    vi.unstubAllGlobals();
    delete state.registry[candidate.id];
    Object.assign(result, { providerCalls: calls, checkedAt: new Date().toISOString(),
      registryBeforeSha256: before, registryAfterSha256: sha(await fs.readFile(registryFile)) });
    await save(`result-${Date.now()}.json`, result);
  }
}, 240_000);
