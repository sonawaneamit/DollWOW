import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';

const enabled = process.env.DOLLVUE_GENERATION_PILOT === '1';
const output = process.env.DOLLVUE_GENERATION_PILOT_OUTPUT;
const mocks = vi.hoisted(() => ({ registry: {} as Record<string, DollVueReadinessRecord> }));
vi.mock('@/lib/dollvue/readiness-registry.json', () => ({ default: mocks.registry }));
vi.mock('@/lib/dollvue/session', () => ({ readDollVueSession: () => ({ email: 'qa@example.invalid' }) }));
vi.mock('@/lib/dollvue/accountUsage', () => ({
  dollVueUsageForEmail: async () => ({ available: true, remaining: 5 }), recordDollVuePreview: async () => true,
}));
vi.mock('@/lib/dollvue/email', () => ({ sendDollVueLookEmail: async () => ({ delivered: false, provider: 'qa-no-mail' }) }));

import { getProductByHandle } from '@/lib/shopify/storefront';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { dollVueReadinessFingerprint } from '@/lib/dollvue/readiness';
import { DOLLVUE_APPEARANCE_POLICY } from '@/lib/dollvue/appearance';
import { productImageSources } from '@/lib/catalog/productImage';
import { POST } from '@/app/dollvue/generate/route';

// Explicit opt-in performs at most two real image generations. Auth/usage/mail are
// test doubles only; product publication, references and the generator are real.
it.skipIf(!enabled)('generates inspected non-explicit WM/SE samples without customer mail or catalog writes', async () => {
  expect(output).toBeTruthy();
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dollwow.com').origin;
  const cases = [
    { handle: 'wm-audrey-166cm-c-cup-tpe-companion-doll-187yz', groupId: 'eye-color', optionId: 'no-2' },
    { handle: 'sedoll-lita-b-163cm-c-cup-silicone-companion-doll-1fl7h', groupId: 'eye-color', optionId: 'handmade-01' },
  ];
  await fs.mkdir(output!, { recursive: true });
  const results = [];
  for (const item of cases) {
    const product = await getProductByHandle(item.handle, { cache: 'no-store', strict: true });
    expect(product).not.toBeNull();
    const config = getCustomizationConfig(product!);
    const option = config.groups.find(group => group.id === item.groupId)?.options.find(option => option.id === item.optionId);
    expect(option?.swatch?.kind).toBe('image');
    // Bind this run to the exact first-photo bytes inspected before this test.
    const sourceBytes = Buffer.from(await (await fetch(productImageSources(product!)[0].url)).arrayBuffer());
    const inspectedBytes = await fs.readFile(path.join(output!, `pilot-${item.handle}.jpg`));
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(createHash('sha256').update(inspectedBytes).digest('hex'));
    const record: DollVueReadinessRecord = { productId: product!.id, policy: DOLLVUE_APPEARANCE_POLICY,
      fingerprint: dollVueReadinessFingerprint(product!, config), status: 'ready', sourcePositions: [0],
      choices: [{ groupId: item.groupId, optionId: item.optionId, reference: option!.swatch!.value }],
      imageDigests: {
        [productImageSources(product!)[0].url]: createHash('sha256').update(sourceBytes).digest('hex'),
        [option!.swatch!.value]: createHash('sha256').update(await fs.readFile(path.join(process.cwd(), 'public', option!.swatch!.value))).digest('hex'),
      },
    };
    mocks.registry[product!.id] = record;
    const started = Date.now();
    const response = await POST(new Request(`${origin}/dollvue/generate`, {
      method: 'POST', headers: { origin, 'Content-Type': 'application/json', 'x-vercel-ip-country': 'US' },
      body: JSON.stringify({ productHandle: item.handle, sourcePosition: 0,
        selections: [{ groupId: item.groupId, optionId: item.optionId }] }),
    }));
    const payload = await response.json();
    const file = path.join(output!, `generated-${item.handle}.webp`);
    if (payload.previewDataUrl) await fs.writeFile(file, Buffer.from(payload.previewDataUrl.split(',')[1], 'base64'));
    results.push({ handle: item.handle, status: response.status, error: payload.error,
      elapsedMs: Date.now() - started, output: payload.previewDataUrl ? file : null,
      proposedRecord: record, visualReview: 'pending', publicationChanged: false, customerMailSent: false });
    await fs.writeFile(path.join(output!, 'live-generation-pilot.json'), JSON.stringify(results, null, 2));
    expect(response.status, JSON.stringify(payload.error)).toBe(200);
  }
}, 300_000);

// Prepare only the exact source photos and eye-reference families already reviewed.
// This writes private evidence, never the deployed registry or Shopify products.
it.skipIf(process.env.DOLLVUE_PREPARE_PILOTS !== '1')('binds accepted pilot families to current image bytes', async () => {
  expect(output).toBeTruthy();
  const cases = [
    { handle: 'wm-audrey-166cm-c-cup-tpe-companion-doll-187yz', options: [1,2,3,4,5,6,7,8,9,14,15,16,17,18].map(n => `no-${n}`) },
    { handle: 'sedoll-lita-b-163cm-c-cup-silicone-companion-doll-1fl7h', options: ['handmade-01','handmade-02','handmade-03','handmade-04'] },
  ];
  const records: Record<string, DollVueReadinessRecord> = {};
  for (const item of cases) {
    const product = await getProductByHandle(item.handle, { cache: 'no-store', strict: true });
    expect(product).not.toBeNull();
    const config = getCustomizationConfig(product!);
    const photo = productImageSources(product!)[0];
    const bytes = Buffer.from(await (await fetch(photo.url, { cache: 'no-store', redirect: 'error' })).arrayBuffer());
    const digest = (value: Buffer) => createHash('sha256').update(value).digest('hex');
    expect(digest(bytes)).toBe(digest(await fs.readFile(path.join(output!, `pilot-${item.handle}.jpg`))));
    const imageDigests: Record<string, string> = { [photo.url]: digest(bytes) };
    const choices = item.options.map(optionId => {
      const option = config.groups.find(group => group.id === 'eye-color')?.options.find(option => option.id === optionId);
      expect(option?.swatch?.kind).toBe('image');
      return { groupId: 'eye-color', optionId, reference: option!.swatch!.value };
    });
    for (const choice of choices) {
      expect(choice.reference).toMatch(/^\/option-assets\/[a-f0-9]{64}\.webp$/);
      const hash = digest(await fs.readFile(path.join(process.cwd(), 'public', choice.reference)));
      expect(path.basename(choice.reference, '.webp')).toBe(hash);
      imageDigests[choice.reference] = hash;
    }
    records[product!.id] = { productId: product!.id, policy: DOLLVUE_APPEARANCE_POLICY,
      fingerprint: dollVueReadinessFingerprint(product!, config), status: 'ready', sourcePositions: [0], choices, imageDigests };
  }
  await fs.writeFile(path.join(output!, 'reviewed-pilot-records.json'), JSON.stringify(records, null, 2));
  expect(Object.keys(records)).toHaveLength(2);
}, 120_000);
