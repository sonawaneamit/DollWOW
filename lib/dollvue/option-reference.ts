import sharp from 'sharp';
import {isOwnedOptionAsset} from '@/lib/assets/option-assets.mjs';

/** Resolve local swatches against this deployment before sending them to Venice. */
export async function normalizeOwnedOptionReference(value: string, origin: string, fetchImage: typeof fetch = fetch) {
  if (!isOwnedOptionAsset(value)) return '';
  try {
    const url = value.startsWith('/') ? new URL(value, origin).href : value;
    const response = await fetchImage(url, {redirect:'error', cache:'force-cache'});
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) return '';
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 20 * 1024 * 1024) return '';
    const image = sharp(bytes, {limitInputPixels:25_000_000});
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) return '';
    if (metadata.width >= 256 && metadata.height >= 256 && !value.startsWith('/')) return url;
    const normalized = await (metadata.width < 256 || metadata.height < 256
      ? image.resize(512, 512, {fit:'contain',background:{r:255,g:255,b:255,alpha:1}}) : image)
      .webp({quality:92}).toBuffer();
    return `data:image/webp;base64,${normalized.toString('base64')}`;
  } catch { return ''; }
}
