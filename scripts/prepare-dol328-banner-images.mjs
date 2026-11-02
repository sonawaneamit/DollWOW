import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';

const directory = new URL('../public/images/dollvue/home/', import.meta.url);
const sources = [
  { variant: 'desktop', sha: 'ed89281aaeeb00e18017b2d30ebfc4d13720f3179dba3fc0fc2b398f12a6b79e', widths: [640, 1280, 1774] },
  { variant: 'mobile', sha: '652466afddcda4023239d586f665c828a3ea2a72054b48f2f396652a4938a52f', widths: [480, 960, 1440] }
];
for (const { variant, sha, widths } of sources) {
  const original = await fs.readFile(new URL(`dollvue-skin-tone-strip-${variant}.png`, directory));
  if (crypto.createHash('sha256').update(original).digest('hex') !== sha) throw new Error(`Original ${variant} banner changed; review first`);
  for (const width of widths) {
    const filename = `dollvue-skin-tone-strip-${variant}-${width}.webp`;
    // Width-only resize retains the complete original frame; no crop or retouch.
    const bytes = await sharp(original).resize({ width, withoutEnlargement: true }).webp({ quality: 84, effort: 6 }).toBuffer();
    await fs.writeFile(new URL(filename, directory), bytes);
    console.log(JSON.stringify({ filename, bytes: bytes.length, originalBytes: original.length }));
  }
}
