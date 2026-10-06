import {test} from 'vitest';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { parseCsv, collectSources, neutralFilename, reviewHold, download, decodeImage, ingest, runtimeManifest, discoverSources, hash } from '../scripts/ingest-option-assets.mjs';
import { optionAssetKey } from '../lib/assets/option-assets.mjs';

test('CSV preserves raw URLs, commas, quoted newlines, BOM and escaped quotes', () => {
  const rows = parseCsv('\uFEFFasset_url,label\r\n"https://example.com/a,b.png?q=1","two\n""lines"""\r\n');
  assert.deepEqual(rows, [{ asset_url: 'https://example.com/a,b.png?q=1', label: 'two\n"lines"' }]);
  assert.equal(collectSources([...rows, ...rows]).size, 1);
  for (const bad of ['asset_url,label\na', 'asset_url\n"unfinished', 'asset_url\n"a"x', 'asset_url,asset_url\na,b']) assert.throws(() => parseCsv(bad));
});

test('only explicit neutral filenames are removed; labels do not decide', () => {
  for (const name of ['default-300x300.jpg', '123_No%20Thanks.jpg', 'As%20In%20Image.png', 'No-Change.png']) assert.equal(neutralFilename(`https://example.com/${name}`), true);
  for (const name of ['defaultskin.jpg', 'head.png?label=No-Thanks', 'nodefault.png']) assert.equal(neutralFilename(`https://example.com/${name}`), false);
  assert.equal(reviewHold([{ label: 'schoolgirl' }]), true);
  assert.equal(reviewHold([{ label: 'Rosemary exclusive' }]), true);
});

test('runtime keys and aliases have no raw URLs and collision failures are explicit', () => {
  const raw = 'https://www.rosemarydoll.com/wp-content/uploads/2021/05/a.png';
  const mapping = runtimeManifest({ [raw]: '/option-assets/a.webp', [`${raw}?width=30`]: '/option-assets/b.webp' });
  assert.equal(mapping[optionAssetKey(raw)], '/option-assets/a.webp');
  assert.equal(mapping[optionAssetKey('r:2021/05/a.png')], '/option-assets/a.webp');
  assert.equal(mapping[optionAssetKey(`${raw}?width=30`)], '/option-assets/b.webp');
  assert.equal(JSON.stringify(mapping).includes('https:'), false);
  assert.throws(() => runtimeManifest({ [raw]: null }, () => 'collision'), /collision/);
  for (const [host, alias] of [['cdn.myrobotdoll.com', 'm:2021/05/a.png'], ['www.sedoll.com', 's:/wp-content/uploads/2021/05/a.png'], ['www.real-lady.com', 'l:/wp-content/uploads/2021/05/a.png']]) {
    assert.equal(runtimeManifest({ [`https://${host}/wp-content/uploads/2021/05/a.png`]: null })[optionAssetKey(alias)], null);
  }
});

test('403 stops with no spoofing; redirects, MIME and byte bounds enforced', async () => {
  const hosts = new Set(['example.com']);
  let calls = 0;
  await assert.rejects(download('https://example.com/a', hosts, async (_url, options) => {
    calls++; assert.equal(options.headers, undefined); assert.equal(options.redirect, 'manual');
    return new Response('denied', { status: 403 });
  }), /HTTP 403/);
  assert.equal(calls, 1);
  await assert.rejects(download('https://example.com/a', hosts, async () => new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/a' } })), /Unapproved/);
  await assert.rejects(download('https://example.com/a', hosts, async () => new Response('html', { headers: { 'content-type': 'text/html' } })), /MIME/);
  await assert.rejects(download('https://example.com/a', hosts, async () => new Response('abcdef', { headers: { 'content-type': 'image/png' } }), 3), /byte limit/);
});

test('actual decode rejects corrupt images and MIME mismatch, strips metadata', async () => {
  const input = await sharp({ create: { width: 3, height: 2, channels: 3, background: '#ff0000' } }).png().withMetadata().toBuffer();
  await assert.rejects(decodeImage(input, 'image/jpeg'), /mismatch/);
  await assert.rejects(decodeImage(Buffer.from('not an image'), 'image/png'));
  const result = await decodeImage(input, 'image/png');
  const meta = await sharp(result.output).metadata();
  assert.equal(meta.exif, undefined); assert.equal(meta.width, 3); assert.equal(meta.height, 2);
  assert.deepEqual(await sharp(input).raw().toBuffer(), await sharp(result.output).raw().toBuffer());
});

test('animated GIF retains exact bytes, format, frame count and timing', async () => {
  const frames = await Promise.all(['#ff0000', '#0000ff'].map((background) => sharp({ create: { width: 2, height: 2, channels: 3, background } }).png().toBuffer()));
  const bytes = await sharp(frames, { join: { animated: true } }).gif({ delay: [100, 200], loop: 2 }).toBuffer();
  const result = await decodeImage(bytes, 'image/gif');
  assert.equal(result.extension, 'gif'); assert.equal(result.format, 'gif'); assert.equal(result.frames, 2);
  assert.deepEqual(result.output, bytes);
  const metadata = await sharp(result.output, { animated: true }).metadata();
  assert.deepEqual(metadata.delay, [100, 200]); assert.equal(metadata.loop, 2);
});

test('ingestion dedupes, saves original bytes, resumes, and omits failures from runtime', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'option-ingest-'));
  try {
    const csv = path.join(root, 'input.csv'), evidence = path.join(root, 'evidence');
    await writeFile(csv, 'asset_url,label\nhttps://example.com/a.png,A\nhttps://example.com/a.png,A2\nhttps://example.com/b.png,B\nhttps://example.com/default.jpg,Default\nhttps://example.com/blocked.png,Blocked\nhttps://www.rosemarydoll.com/wp-content/uploads/2021/03/Dark-Green-finger-nail-1.jpg,Dark green\n');
    const bytes = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#00aa99' } }).png().toBuffer();
    let calls = 0;
    const settings = { csv, root, evidence, allowedHosts: new Set(['example.com']), fetchImpl: async (url) => {
      calls++;
      return url.pathname.includes('blocked') ? new Response('', { status: 403 }) : new Response(bytes, { headers: { 'content-type': 'image/png' } });
    } };
    const result = await ingest(settings);
    assert.deepEqual(result, { total: 5, mapped: 2, neutral_removed: 1, text_only: 1, missing: 1, held: 0, uniqueAssets: 1, failed: 1 });
    assert.equal(calls, 3);
    assert.deepEqual(await readFile(path.join(evidence, 'originals', `${hash(bytes)}.bin`)), bytes);
    const mapping = JSON.parse(await readFile(path.join(evidence, 'option-asset-map.json')));
    assert.equal(mapping['https://example.com/default.jpg'], null);
    assert.equal(mapping['https://www.rosemarydoll.com/wp-content/uploads/2021/03/Dark-Green-finger-nail-1.jpg'], null);
    assert.equal(Object.hasOwn(mapping, 'https://example.com/blocked.png'), false);
    await assert.rejects(readFile(path.join(root, 'data/option-asset-map.json')), { code: 'ENOENT' });
    const runtime = await readFile(path.join(root, 'data/owned-option-assets.json'), 'utf8');
    assert.equal(runtime.includes('example.com'), false);
    await ingest(settings); assert.equal(calls, 3);
    await ingest({ ...settings, retryFailed: true }); assert.equal(calls, 4);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('six-worker limit holds and corrupt resumed assets are repaired', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'option-ingest-'));
  try {
    const csv = path.join(root, 'input.csv'), evidence = path.join(root, 'evidence');
    await writeFile(csv, 'asset_url\n' + Array.from({ length: 12 }, (_, i) => `https://example.com/${i}.png`).join('\n'));
    const bytes = await sharp({ create: { width: 1, height: 1, channels: 3, background: '#123456' } }).png().toBuffer();
    let active = 0, peak = 0, calls = 0;
    const settings = { csv, root, evidence, allowedHosts: new Set(['example.com']), fetchImpl: async () => {
      calls++; active++; peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active--;
      return new Response(bytes, { headers: { 'content-type': 'image/png' } });
    } };
    await ingest(settings);
    assert.equal(peak, 6); assert.equal(calls, 12);
    const mapping = JSON.parse(await readFile(path.join(evidence, 'option-asset-map.json')));
    await writeFile(path.join(root, 'public', Object.values(mapping)[0]), 'corrupt');
    await ingest(settings);
    assert.ok(calls > 12);
    await sharp(await readFile(path.join(root, 'public', Object.values(mapping)[0]))).raw().toBuffer();
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('source discovery expands namespace builders and preserves original snapshots', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'option-discovery-'));
  try {
    const files = {
      'data/starpery-heads.json': JSON.stringify([{ imagePath: '2021/03/A.jpg' }]),
      'data/promotions/se-silicone-head-library.json': JSON.stringify({ heads: [{ image: 'https://www.sedoll.com/wp-content/uploads/B.jpg' }] }),
      'lib/customization/wm-heads.ts': 'const heads = [["1", "2021/05/1.png"]];',
      'lib/customization/starpery.ts': 'const a = imageOption("x", "X", "2021/03/C.jpg");',
      'lib/customization/irontech.ts': 'const IRONTECH_STANDARD_TPE_HEADS = [88, 89].map(head => catalogOptionAsset("r", `${head}`));',
      'lib/customization/dealer-brands.ts': 'const ANGELKISS_STANDARD_HEADS = [["x", "X", "LS1"]] as const; const ANGELKISS_ROS_HEADS = [["y", "Y", "SS1"]] as const;',
      'lib/customization/configs.ts': 'const a = catalogOptionAsset("l", "/wp-content/uploads/D.jpg");',
    };
    for (const [file, text] of Object.entries(files)) { await mkdir(path.dirname(path.join(root, file)), { recursive: true }); await writeFile(path.join(root, file), text); }
    const evidence = path.join(root, 'evidence');
    const rows = await discoverSources(root, evidence);
    const urls = rows.map((row) => row.asset_url);
    assert.equal(new Set(urls).size, 9);
    assert.ok(urls.includes('https://www.rosemarydoll.com/wp-content/uploads/2021/05/88.png'));
    assert.ok(urls.includes('https://www.rosemarydoll.com/wp-content/uploads/2021/11/89.jpg'));
    assert.ok(urls.includes('https://cdn.myrobotdoll.com/wp-content/uploads/2025/03/WM-SSSeries-Facemovablejaw-SS1.webp'));
    assert.ok(urls.includes('https://www.real-lady.com/wp-content/uploads/D.jpg'));
    await writeFile(path.join(root, 'data/starpery-heads.json'), '[]');
    assert.deepEqual(await discoverSources(root, evidence), rows);
    const snapshots = JSON.parse(await readFile(path.join(evidence, 'source-snapshots.json')));
    assert.ok(snapshots.every((entry) => entry.snapshot.endsWith('.source.txt')));
    for (const entry of snapshots) assert.equal(hash(await readFile(entry.snapshot)), entry.sha256);
  } finally { await rm(root, { recursive: true, force: true }); }
});
