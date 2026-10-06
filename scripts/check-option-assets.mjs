import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {isOwnedOptionAsset, optionAssetViolations} from '../lib/assets/option-assets.mjs';
import {verifyLocalOptionAssets} from './lib/verify-local-option-assets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const value = flag => args[args.indexOf(flag) + 1];
const errors = [];
const manifest = JSON.parse(await fs.readFile(path.join(root, 'data/owned-option-assets.json'), 'utf8'));
const assets = [...new Set(Object.values(manifest).filter(Boolean))];
if (!assets.length) errors.push('Owned option asset manifest is empty.');
for (const asset of assets) {
  if (!isOwnedOptionAsset(asset)) { errors.push(`Unowned manifest asset: ${asset}`); continue; }
  if (asset.startsWith('/')) {
    try {
      const bytes = await fs.readFile(path.join(root, 'public', asset));
      const metadata = await sharp(bytes, {limitInputPixels:25_000_000}).metadata();
      if (!metadata.width || !metadata.height) throw new Error('Missing dimensions');
      await sharp(bytes, {limitInputPixels:25_000_000}).raw().toBuffer();
    } catch (error) { errors.push(`Invalid local image ${asset}: ${error.message}`); }
  }
}
if (args.includes('--input')) {
  const products = JSON.parse(await fs.readFile(value('--input'), 'utf8'));
  try { await verifyLocalOptionAssets(Array.isArray(products) ? products : [products], path.join(root, 'public')); }
  catch (error) { errors.push(error.message); }
  for (const product of Array.isArray(products) ? products : [products]) {
    for (const issue of optionAssetViolations(product.extended?.customizationGroups ?? product.groups)) {
      errors.push(`${product.handle ?? 'template'}: ${issue.groupId}/${issue.optionId}: unresolved ${issue.source}`);
    }
  }
}
if (args.includes('--build')) {
  async function scan(dir) {
    for (const entry of await fs.readdir(dir, {withFileTypes:true})) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { await scan(file); continue; }
      if (!/\.(js|json|html)$/.test(entry.name)) continue;
      const text = (await fs.readFile(file, 'utf8')).replaceAll('\\/', '/');
      const urls = text.match(/https?:\/\/[^\s"'<>`\\)]+/g) ?? [];
      for (const url of urls) {
        if (/\.(?:png|jpe?g|webp|gif|avif)(?:[?#]|$)/i.test(url) && !isOwnedOptionAsset(url)) {
          errors.push(`${path.relative(root, file)}: external image ${url}`);
        }
      }
    }
  }
  await scan(path.resolve(value('--build')));
}
console.log(JSON.stringify({checkedOwnedAssets: assets.length, failures:errors.length, errors}, null, 2));
if (errors.length) process.exitCode = 1;
