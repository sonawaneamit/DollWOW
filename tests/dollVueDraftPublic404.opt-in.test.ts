import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import Page from '@/app/dollvue/[handle]/page';
import { POST as cart } from '@/app/dollvue/cart/route';
import { adminFetch } from '@/lib/shopify/admin';
import { getCurrentDollVueHolds } from '@/lib/dollvue/currentHold';
import { env } from '@/lib/utils/env';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';

const root = '/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';
const dir = path.join(root, 'evas-topfire-draft-expansion');
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
type Node = { id: string; status: string; publishedAt: string | null; tags: string[];
  resourcePublications: { nodes: { isPublished: boolean }[]; pageInfo: { hasNextPage: boolean } } };
const query = `query DraftPublic404($ids:[ID!]!){nodes(ids:$ids){... on Product{
  id status publishedAt tags resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}}
}}}`;

it.skipIf(process.env.DOLLVUE_DRAFT_PUBLIC_404 !== '1')('audits exact 410 integration and actual public viewer/cart rejection for 32 drafts', async () => {
  const proposalFile = path.join(dir, 'source-reference-preparation/reviewed-draft-expansion-32-release-subset-proposal.json');
  const proposalBytes = await fs.readFile(proposalFile);
  expect(sha(proposalBytes)).toBe('3b14b64ff5696d9843912098c6b9454b5b3441bfcc5c27b07809ec06ba3d7a70');
  const proposal = JSON.parse(proposalBytes.toString());
  for (const pin of proposal.evidence.inputs) expect(sha(await fs.readFile(pin.file))).toBe(pin.sha256);
  const registryFile = 'lib/dollvue/readiness-registry.json';
  const registryBytes = await fs.readFile(registryFile);
  const registry = JSON.parse(registryBytes.toString()) as Record<string, DollVueReadinessRecord>;
  expect(Object.keys(registry)).toHaveLength(410);
  const additionFiles = [proposalFile,
    path.join(root, 'se-alternative-gallery-batch1/reviewed-se-alternative-2-record-proposal.json'),
    path.join(root, 'se-alternative-gallery-batch2/reviewed-se-alternative-1-record-proposal.json')];
  const added = new Set<string>(), assets = new Map<string, string>();
  const additionPins = [];
  for (const file of additionFiles) {
    const bytes = await fs.readFile(file), addition = JSON.parse(bytes.toString());
    additionPins.push({ file, sha256: sha(bytes) });
    for (const [id, raw] of Object.entries(addition.records)) {
      const record = raw as DollVueReadinessRecord;
      expect(added.has(id)).toBe(false); added.add(id);
      expect(registry[id]).toEqual(record);
      for (const choice of record.choices) {
        expect(choice.reference).toMatch(/^\/option-assets\/[a-f0-9]{64}\.webp$/);
        const digest = record.imageDigests?.[choice.reference]; expect(digest).toMatch(/^[a-f0-9]{64}$/);
        if (assets.has(choice.reference)) expect(assets.get(choice.reference)).toBe(digest);
        assets.set(choice.reference, digest!);
      }
    }
  }
  expect(added.size).toBe(35);
  const prior = Object.fromEntries(Object.entries(registry).filter(([id]) => !added.has(id)));
  expect(Object.keys(prior)).toHaveLength(375);
  const encoded = JSON.stringify(prior, null, 2);
  expect([sha(encoded), sha(encoded + '\n')]).toContain(proposal.evidence.registryInputSha256);
  for (const [url, digest] of assets) expect(sha(await fs.readFile(path.join(process.cwd(), 'public', url)))).toBe(digest);

  const ids = Object.keys(proposal.records);
  expect(ids).toHaveLength(32);
  const rows: Array<{ id: string; handle: string; viewerStatus: number; cartStatus: number }> = [];
  const counts = { adminReads: 0, storefrontReads: 0, mutations: 0, generation: 0, mail: 0 };
  const report: Record<string, unknown> = { additionPins, registryCount: 410, previousRecordsUnchanged: 375,
    exactAddedRecords: 35, ownedReferencesVerified: assets.size, rows, counts };
  const nativeFetch = globalThis.fetch;
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = init?.method || (input instanceof Request ? input.method : 'GET');
    expect(url.protocol).toBe('https:'); expect(url.hostname).toBe(env.SHOPIFY_STORE_DOMAIN);
    expect(method).toBe('POST');
    if (url.pathname.endsWith('/graphql.json')) {
      const body = JSON.parse(String(init?.body));
      expect(body.query.trim()).toMatch(/^query\b/); expect(body.query).not.toMatch(/\bmutation\b/);
      if (body.variables?.ids) expect(body.variables.ids.every((id: string) => ids.includes(id))).toBe(true);
      if (url.pathname.includes('/admin/')) counts.adminReads++; else counts.storefrontReads++;
    } else expect(url.pathname).toBe('/admin/oauth/access_token');
    return nativeFetch(input, { ...init, redirect: 'error' });
  });
  async function draftCheck() {
    const response = await adminFetch<{ nodes: Node[] }>(query, { ids });
    expect(response.nodes).toHaveLength(32);
    const holds = await getCurrentDollVueHolds(ids);
    for (const node of response.nodes) {
      expect(ids).toContain(node.id); expect(node.status).toBe('DRAFT'); expect(node.publishedAt).toBeNull();
      expect(node.resourcePublications.pageInfo.hasNextPage).toBe(false);
      expect(node.resourcePublications.nodes.every(n => !n.isPublished)).toBe(true);
      expect(holds.get(node.id)).toBe('clear');
      const evidence = proposal.verification.find((r: { id: string }) => r.id === node.id);
      expect(node.tags.filter(t => /hold/i.test(t))).toEqual(evidence.retainedHoldTags);
    }
    return response.nodes;
  }
  try {
    const before = await draftCheck(); report.firstHoldCheckedAt = new Date().toISOString();
    for (const row of proposal.verification) {
      await expect(Page({ params: Promise.resolve({ handle: row.handle }) })).rejects.toMatchObject({
        digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
      });
      const origin = new URL(env.NEXT_PUBLIC_SITE_URL).origin;
      const choices = proposal.records[row.id].choices;
      const selected = ['eye-color', 'hairstyle'].flatMap(groupId => {
        const c = choices.find((c: { groupId: string }) => c.groupId === groupId);
        return c ? [{ groupId: c.groupId, optionId: c.optionId }] : [];
      });
      const response = await cart(new Request(`${origin}/dollvue/cart`, { method: 'POST',
        headers: { origin, 'Content-Type': 'application/json' },
        body: JSON.stringify({ productHandle: row.handle, selections: selected }) }));
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'This doll is not currently available in DollVue™.' });
      rows.push({ id: row.id, handle: row.handle, viewerStatus: 404, cartStatus: 404 });
      if (rows.length % 8 === 0) console.info(`Draft public rejection: ${rows.length}/32`);
    }
    expect(await draftCheck()).toEqual(before); report.lastHoldCheckedAt = new Date().toISOString();
    expect(await fs.readFile(registryFile)).toEqual(registryBytes);
    report.passed = true;
  } catch (error) {
    report.passed = false; report.error = error instanceof Error ? error.message : String(error); throw error;
  } finally {
    vi.unstubAllGlobals();
    Object.assign(report, { checkedAt: new Date().toISOString(), registrySha256: sha(registryBytes),
      registryAfterSha256: sha(await fs.readFile(registryFile)) });
    const output = path.join(dir, `public-draft-404-audit-${Date.now()}.json`);
    await fs.writeFile(output, JSON.stringify(report, null, 2), { flag: 'wx', mode: 0o600 });
    console.info(JSON.stringify({ output, passed: report.passed, checked: rows.length, counts }));
  }
}, 300_000);
