import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {ownedOptionGroups} from '../../lib/assets/option-assets.mjs';

export async function verifyLocalOptionAssets(products, publicDir) {
  const paths = new Set(products.flatMap(product => (ownedOptionGroups(product.extended?.customizationGroups ?? product.groups) ?? [])
    .flatMap(group => group.options.flatMap(option => option.swatch?.kind === 'image' && option.swatch.value.startsWith('/') ? [option.swatch.value] : []))));
  for (const asset of paths) {
    const file = path.resolve(publicDir, `.${decodeURIComponent(asset)}`);
    if (!file.startsWith(`${path.resolve(publicDir)}${path.sep}`)) throw new Error(`Unsafe option asset path: ${asset}`);
    try {
      const bytes = await fs.readFile(file);
      const metadata = await sharp(bytes, {limitInputPixels:25_000_000}).metadata();
      if (!metadata.width || !metadata.height) throw new Error('Missing dimensions');
      await sharp(bytes, {limitInputPixels:25_000_000}).raw().toBuffer();
    } catch (error) { throw new Error(`Option asset is missing or invalid: ${asset}: ${error.message}`); }
  }
  return paths.size;
}
