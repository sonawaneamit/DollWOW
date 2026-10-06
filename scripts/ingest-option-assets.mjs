import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import ts from 'typescript';
import { optionAssetKey } from '../lib/assets/option-assets.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_PIXELS = 25_000_000;
const MIME = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'heif' };
const TEXT_ONLY = new Map([['https://www.rosemarydoll.com/wp-content/uploads/2021/03/Dark-Green-finger-nail-1.jpg', 'Repair decision under the hotlink-fix request: text-only Dark green choice for the broken supplier file (verified HTTP 404). Preserve ID and price; runtime disables DollVue for the absent reference. No replacement image or invented color.']]);
export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

// RFC 4180 fields, including embedded newlines and escaped quotes. Reject
// malformed records instead of silently associating an image with another row.
export function parseCsv(input) {
  input = input.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], field = '', quoted = false, closed = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === ',' || c === '\n' || c === '\r') {
      row.push(field); field = ''; closed = false;
      if (c !== ',') {
        if (c === '\r' && input[i + 1] === '\n') i++;
        if (row.some(Boolean)) rows.push(row);
        row = [];
      }
    } else if (c === '"' && field === '' && !closed) quoted = true;
    else {
      if (closed || c === '"') throw new Error('Malformed CSV quote');
      field += c;
    }
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (field || row.length || closed) { row.push(field); rows.push(row); }
  if (!rows.length) throw new Error('Empty CSV');
  const headers = rows.shift();
  if (new Set(headers).size !== headers.length || !headers.includes('asset_url')) throw new Error('Invalid CSV headers');
  return rows.map((values, i) => {
    if (values.length !== headers.length) throw new Error(`CSV record ${i + 2}: wrong field count`);
    return Object.fromEntries(headers.map((key, j) => [key, values[j]]));
  });
}

export function neutralFilename(raw) {
  try {
    const name = decodeURIComponent(new URL(raw).pathname.split('/').pop());
    return /(?:^|[\s_.-])(?:factory[\s_-]+default|default|no[\s_-]+thanks|no[\s_-]+change|as[\s_-]+in[\s_-]+image)(?=[\s_.-]|$)/i.test(name);
  } catch { return false; }
}

export function reviewHold(rows) {
  return rows.some((row) => /(?:exclusive|celebrity|likeness[ -]restricted|underage|schoolgirl|school[ -]uniform|\bloli\b|\bchild\b|\bminor\b)/i.test(Object.values(row).join(' ')));
}

export function collectSources(rows) {
  const sources = new Map();
  for (const row of rows) {
    if (!row.asset_url) continue;
    const refs = sources.get(row.asset_url) || [];
    refs.push(row);
    sources.set(row.asset_url, refs);
  }
  return sources;
}

export function runtimeManifest(mapping, keyFn = optionAssetKey) {
  const result = {}, identities = new Map();
  const add = (identity, value) => {
    const key = keyFn(identity);
    if (identities.has(key) && identities.get(key) !== identity) throw new Error(`Asset key collision: ${key}`);
    if (Object.hasOwn(result, key) && result[key] !== value) throw new Error(`Conflicting asset alias: ${identity}`);
    identities.set(key, identity); result[key] = value;
  };
  for (const [raw, value] of Object.entries(mapping)) {
    add(raw, value);
    let url;
    try { url = new URL(raw); } catch { continue; }
    const namespace = { 'www.rosemarydoll.com': 'r', 'rosemarydoll.com': 'r', 'cdn.myrobotdoll.com': 'm', 'www.sedoll.com': 's', 'www.real-lady.com': 'l' }[url.hostname];
    // Query-specific assets retain their exact raw key and must not replace the
    // queryless builder alias (which could point to different image bytes).
    if (namespace && !url.search) {
      const suffix = ['r', 'm'].includes(namespace) ? url.pathname.replace(/^\/wp-content\/uploads\//, '') : url.pathname;
      add(`${namespace}:${suffix}`, value);
      const decoded = decodeURIComponent(suffix);
      if (decoded !== suffix) add(`${namespace}:${decoded}`, value);
    }
  }
  return result;
}

export async function discoverSources(root, evidence) {
  const files = ['data/starpery-heads.json', 'data/promotions/se-silicone-head-library.json', ...['wm-heads', 'irontech', 'starpery', 'dealer-brands', 'configs'].map((name) => `lib/customization/${name}.ts`)];
  const rows = [], snapshots = [];
  const base = 'https://www.rosemarydoll.com/wp-content/uploads/';
  const add = (asset_url, source) => rows.push({ asset_url, source });
  const snapshotDir = path.join(evidence, 'source-snapshots');
  await mkdir(snapshotDir, { recursive: true });
  for (const file of files) {
    const saved = path.join(snapshotDir, `${path.basename(file)}.source.txt`);
    let bytes;
    try { bytes = await readFile(saved); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      bytes = await readFile(path.join(root, file));
      await writeFile(saved, bytes, { flag: 'wx' });
    }
    snapshots.push({ file, snapshot: saved, sha256: hash(bytes) });
    if (file.endsWith('.json')) {
      const parsed = JSON.parse(bytes.toString('utf8'));
      if (Array.isArray(parsed)) {
        for (const head of parsed) if (head.imagePath) add(base + head.imagePath, file);
      } else {
        for (const head of parsed.heads || []) if (/^https?:/.test(head.image || '')) add(head.image, file);
      }
      continue;
    }
    const ast = ts.createSourceFile(file, bytes.toString('utf8'), ts.ScriptTarget.Latest, true);
    const visit = (node) => {
      if (ts.isStringLiteral(node)) {
        if (/^https?:\/\/.+\.(?:jpe?g|png|webp|avif|gif)(?:\?.*)?$/i.test(node.text)) add(node.text, file);
        else if (/^\d{4}\/\d{2}\/.+\.(?:jpe?g|png|webp|avif|gif)$/i.test(node.text)) add(base + node.text, file);
        else if (file.endsWith('configs.ts') && /^\/wp-content\/uploads\/.+\.(?:jpe?g|png|webp)$/i.test(node.text)) add('https://www.real-lady.com' + node.text, file);
      }
      if (ts.isVariableDeclaration(node)) {
        const name = node.name.getText(ast);
        let initializer = node.initializer;
        if (initializer && ts.isAsExpression(initializer)) initializer = initializer.expression;
        if (name === 'IRONTECH_STANDARD_TPE_HEADS' && initializer && ts.isCallExpression(initializer) && ts.isPropertyAccessExpression(initializer.expression)) {
          const array = initializer.expression.expression;
          if (!ts.isArrayLiteralExpression(array)) throw new Error('Unexpected Irontech head source');
          for (const element of array.elements) {
            if (!ts.isNumericLiteral(element)) throw new Error('Unexpected Irontech head ID');
            const id = Number(element.text);
            add(`${base}${id <= 88 ? '2021/05' : '2021/11'}/${id}.${id <= 88 ? 'png' : 'jpg'}`, file);
          }
        }
        if (['ANGELKISS_STANDARD_HEADS', 'ANGELKISS_ROS_HEADS'].includes(name)) {
          if (!initializer || !ts.isArrayLiteralExpression(initializer)) throw new Error('Unexpected Angelkiss head source');
          for (const item of initializer.elements) {
            if (!ts.isArrayLiteralExpression(item) || !ts.isStringLiteral(item.elements[2])) throw new Error('Unexpected Angelkiss file');
            add(`https://cdn.myrobotdoll.com/wp-content/uploads/2025/03/${name === 'ANGELKISS_STANDARD_HEADS' ? 'WM-Silicone-Faces-' : 'WM-SSSeries-Facemovablejaw-'}${item.elements[2].text}.webp`, file);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  await atomicJson(path.join(evidence, 'source-snapshots.json'), snapshots);
  await atomicJson(path.join(evidence, 'expanded-sources.json'), [...new Set(rows.map((row) => row.asset_url))]);
  return rows;
}

export function validateUrl(raw, allowedHosts) {
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port || !allowedHosts.has(url.hostname)) {
    throw new Error(`Unapproved source or redirect: ${url.hostname}`);
  }
  return url;
}

export async function download(raw, allowedHosts, fetchImpl = fetch, maxBytes = MAX_BYTES) {
  const signal = AbortSignal.timeout(30_000);
  const redirects = [];
  let url = validateUrl(raw, allowedHosts);
  for (let hop = 0; hop <= 5; hop++) {
    const response = await fetchImpl(url, { redirect: 'manual', signal });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirect without location');
      redirects.push({ url: url.href, status: response.status, location });
      url = validateUrl(new URL(location, url).href, allowedHosts);
      continue;
    }
    const details = { httpStatus: response.status, finalUrl: url.href, redirects };
    if (!response.ok) {
      await response.body?.cancel();
      throw Object.assign(new Error(`HTTP ${response.status}`), details);
    }
    const mime = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!MIME[mime]) { await response.body?.cancel(); throw Object.assign(new Error(`Unsupported MIME: ${mime}`), details); }
    if (Number(response.headers.get('content-length')) > maxBytes) {
      await response.body?.cancel(); throw Object.assign(new Error('Image exceeds byte limit'), details);
    }
    const chunks = []; let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > maxBytes) throw Object.assign(new Error('Image exceeds byte limit'), details);
      chunks.push(chunk);
    }
    return { ...details, mime, bytes: Buffer.concat(chunks), etag: response.headers.get('etag'), lastModified: response.headers.get('last-modified') };
  }
  throw new Error('Too many redirects');
}

export async function decodeImage(bytes, mime) {
  const options = { limitInputPixels: MAX_PIXELS, failOn: 'warning', animated: true };
  const metadata = await sharp(bytes, options).metadata();
  if (!MIME[mime] || metadata.format !== MIME[mime]) throw new Error('MIME/decoded format mismatch');
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_PIXELS) throw new Error('Invalid dimensions or pixel limit exceeded');
  if ((metadata.pages || 1) > 200) throw new Error('Image exceeds 200-frame limit');
  await sharp(bytes, options).raw().toBuffer();
  // Animated GIFs retain timing, palette, looping, and exact source bytes.
  if (metadata.format === 'gif' && (metadata.pages || 1) > 1) {
    if (bytes.length > MAX_BYTES) throw new Error('Image exceeds byte limit');
    return { output: bytes, extension: 'gif', width: metadata.width, height: metadata.pageHeight || metadata.height, frames: metadata.pages, format: metadata.format };
  }
  if ((metadata.pages || 1) > 1) throw new Error('Unsupported animation format');
  // Lossless WebP retains visible pixels and watermarks; sharp strips metadata
  // unless explicitly asked to retain it. No resize, crop, or creative edits.
  const output = await sharp(bytes, options).autoOrient().webp({ lossless: true }).toBuffer();
  await sharp(output, options).raw().toBuffer();
  if (output.length > MAX_BYTES) throw new Error('Derivative exceeds byte limit');
  return { output, extension: 'webp', width: metadata.width, height: metadata.height, frames: 1, format: metadata.format };
}

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}

const writtenJson = new Map();
async function atomicJson(file, value) {
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  if (!writtenJson.has(file)) {
    try { writtenJson.set(file, await readFile(file, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (writtenJson.get(file) === serialized) return;
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  await writeFile(temp, serialized);
  await rename(temp, file);
  writtenJson.set(file, serialized);
}

export async function ingest({ csv, extra, discover = false, allowedHosts, root = ROOT, evidence = path.join(ROOT, 'data/exports/hotlink-repair-2026-10-06'), retryFailed = false, fetchImpl = fetch }) {
  const csvBytes = await readFile(csv);
  const rows = parseCsv(csvBytes.toString('utf8'));
  if (discover) rows.push(...await discoverSources(root, evidence));
  if (extra) {
    const urls = JSON.parse(await readFile(extra, 'utf8'));
    if (!Array.isArray(urls) || urls.some((url) => typeof url !== 'string')) throw new Error('Extra sources must be a JSON array of raw URLs');
    rows.push(...urls.map((asset_url) => ({ asset_url, source: extra })));
  }
  const sources = collectSources(rows);
  const assetDir = path.join(root, 'public/option-assets');
  const originalDir = path.join(evidence, 'originals');
  const mapPath = path.join(evidence, 'option-asset-map.json');
  const runtimePath = path.join(root, 'data/owned-option-assets.json');
  const manifestPath = path.join(evidence, 'ingestion-manifest.json');
  await mkdir(assetDir, { recursive: true });
  await mkdir(originalDir, { recursive: true });
  await writeFile(path.join(evidence, `${hash(csvBytes)}-audit.csv`), csvBytes);
  const mapping = await readJson(mapPath, {});
  // Include unresolved inputs in the collision gate: a failed source must
  // never accidentally resolve to another source's successful runtime entry.
  runtimeManifest({ ...mapping, ...Object.fromEntries([...sources.keys()].map((raw) => [raw, null])) });
  const manifest = await readJson(manifestPath, { version: 1, records: {} });
  manifest.inputs = { csv, csvSha256: hash(csvBytes), extra: extra || null, allowedHosts: [...allowedHosts] };
  manifest.publication = 'Local assets only; no publication or Shopify mutations. Review required before release.';
  manifest.conversion = 'Full decode; static images: lossless WebP, EXIF orientation applied, metadata stripped; animated GIFs: original bytes preserved (max 200 frames, 25 million decoded pixels); no resize/crop/watermark removal.';
  let checkpoint = Promise.resolve();
  const save = () => {
    checkpoint = checkpoint.then(async () => {
      await atomicJson(manifestPath, manifest);
      await atomicJson(mapPath, mapping);
      await atomicJson(runtimePath, runtimeManifest(mapping));
    });
    return checkpoint;
  };
  const queue = [...sources];
  let cursor = 0, completed = 0;
  async function worker() {
    while (cursor < queue.length) {
      const [raw, refs] = queue[cursor++];
      const previous = manifest.records[raw];
      const record = { sourceUrl: raw, references: refs, checkedAt: new Date().toISOString(), authorization: 'User-authorized audit/supplier migration; AGENTS restrictions apply; not publication approval.' };
      try {
        if (neutralFilename(raw)) {
          mapping[raw] = null;
          Object.assign(record, { status: 'neutral_removed', reason: 'Filename explicitly identifies default/no-thanks/no-change imagery; runtime must remove image only.' });
        } else if (TEXT_ONLY.has(raw)) {
          mapping[raw] = null;
          Object.assign(record, { status: 'text_only', reason: TEXT_ONLY.get(raw), httpStatus: previous?.httpStatus, priorFailure: previous?.status === 'missing' ? previous : previous?.priorFailure });
        } else if (reviewHold(refs)) {
          delete mapping[raw];
          Object.assign(record, { status: 'held', reason: 'Restricted identity/age/rights cue requires human review; not downloaded.' });
        } else {
          validateUrl(raw, allowedHosts);
          let reused = false;
          if (previous?.status === 'mapped' && /^\/option-assets\/[a-f0-9]{64}\.(?:webp|gif)$/.test(previous.assetPath)) {
            try {
              const local = await readFile(path.join(root, 'public', previous.assetPath));
              const original = await readFile(path.join(originalDir, `${previous.originalSha256}.bin`));
              if (hash(local) === previous.assetSha256 && hash(original) === previous.originalSha256) {
                await sharp(local, { limitInputPixels: MAX_PIXELS, failOn: 'warning', animated: true }).raw().toBuffer();
                Object.assign(record, previous, { references: refs, resumedAt: record.checkedAt });
                mapping[raw] = previous.assetPath; reused = true;
              }
            } catch { /* Missing/corrupt saved bytes must be fetched again. */ }
          }
          const savedAnimation = previous?.status === 'missing' && previous.reason === 'Animated image requires review' && previous.originalSha256;
          if (!reused && previous?.status === 'missing' && !retryFailed && !savedAnimation) {
            Object.assign(record, previous, { references: refs });
            delete mapping[raw]; reused = true;
          }
          if (!reused) {
            let downloaded;
            if (savedAnimation) {
              const bytes = await readFile(path.join(originalDir, `${previous.originalSha256}.bin`));
              if (hash(bytes) !== previous.originalSha256) throw new Error('Saved animation original hash mismatch');
              downloaded = { bytes, mime: previous.mime, httpStatus: previous.httpStatus, finalUrl: previous.finalUrl, redirects: previous.redirects, etag: previous.etag, lastModified: previous.lastModified };
            } else downloaded = await download(raw, allowedHosts, fetchImpl);
            const { bytes, ...provenance } = downloaded;
            const originalSha256 = hash(bytes);
            Object.assign(record, provenance, { originalSha256, originalBytes: bytes.length, originalPath: path.join(originalDir, `${originalSha256}.bin`) });
            await writeFile(record.originalPath, bytes);
            const decoded = await decodeImage(bytes, downloaded.mime);
            const assetSha256 = hash(decoded.output);
            const assetPath = `/option-assets/${assetSha256}.${decoded.extension}`;
            await writeFile(path.join(assetDir, `${assetSha256}.${decoded.extension}`), decoded.output);
            mapping[raw] = assetPath;
            Object.assign(record, { status: 'mapped', assetPath, assetSha256, assetBytes: decoded.output.length, width: decoded.width, height: decoded.height, frames: decoded.frames, format: decoded.format });
          }
        }
      } catch (error) {
        delete mapping[raw];
        Object.assign(record, { status: 'missing', reason: error.message, httpStatus: error.httpStatus ?? record.httpStatus, finalUrl: error.finalUrl ?? record.finalUrl, redirects: error.redirects ?? record.redirects });
      }
      manifest.records[raw] = record;
      completed++;
      const progress = completed;
      if (progress % 25 === 0) await save();
      if (progress % 50 === 0) console.log(`Processed ${progress}/${queue.length}`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  const counts = { total: sources.size, mapped: 0, neutral_removed: 0, text_only: 0, missing: 0, held: 0 };
  for (const raw of sources.keys()) counts[manifest.records[raw].status]++;
  manifest.summary = { ...counts, uniqueAssets: new Set([...sources.keys()].map((raw) => mapping[raw]).filter(Boolean)).size, failed: counts.missing + counts.held };
  manifest.completedAt = new Date().toISOString();
  await save();
  return manifest.summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { csv: { type: 'string' }, extra: { type: 'string' }, discover: { type: 'boolean', default: false }, 'allow-host': { type: 'string', multiple: true }, evidence: { type: 'string' }, 'retry-failed': { type: 'boolean', default: false }, inspect: { type: 'boolean', default: false } } });
  if (!values.csv) throw new Error('Usage: node scripts/ingest-option-assets.mjs --csv FILE --allow-host HOST [--discover] [--extra JSON] [--retry-failed] [--inspect]');
  if (values.inspect) {
    const sources = collectSources(parseCsv(await readFile(values.csv, 'utf8')));
    const hosts = {};
    for (const raw of sources.keys()) { const host = new URL(raw).hostname; hosts[host] = (hosts[host] || 0) + 1; }
    console.log(JSON.stringify({ total: sources.size, hosts }, null, 2));
  } else {
    if (!values['allow-host']?.length) throw new Error('Explicit approved --allow-host values are required');
    const summary = await ingest({ csv: values.csv, extra: values.extra, discover: values.discover, allowedHosts: new Set(values['allow-host']), evidence: values.evidence, retryFailed: values['retry-failed'] });
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = summary.failed ? 2 : 0;
  }
}
