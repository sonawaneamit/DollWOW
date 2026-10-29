import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import snapshots from '@/data/draft-previews/se-elf-pdps.json';

it.skipIf(process.env.DOL275_PUBLIC_ASSETS !== '1')('verifies the exact twelve live supplier bytes before importing', async () => {
  const checks = [];
  for (const product of snapshots) for (const image of product.images) {
    expect(image.url).toMatch(/^\/images\/products\/se-elf-2026\/SED\d+-[123]\.jpg$/);
    const original = await readFile(`public${image.url}`);
    const response = await fetch(`https://dollwow.com${image.url}`, {redirect: 'error', signal: AbortSignal.timeout(20_000)});
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('image/jpeg');
    const bytes = Buffer.from(await response.arrayBuffer());
    const digest = (input: Buffer) => createHash('sha256').update(input).digest('hex');
    expect(digest(bytes)).toBe(digest(original));
    checks.push({path: image.url, bytes: bytes.length, sha256: digest(bytes)});
  }
  await writeFile('data/exports/dol-275-2026-10-29/public-assets-proof.json', JSON.stringify({at: new Date().toISOString(), checks}, null, 2));
  expect(checks).toHaveLength(12);
}, 120_000);
