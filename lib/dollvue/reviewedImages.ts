import 'server-only';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';

export type ReviewedImage = Readonly<{ url: string; sha256: string }>;
const REVIEWED_IMAGE_LIMITS = Object.freeze({
  imageBytes: 20 * 1024 * 1024,
  pixels: 25_000_000, timeoutMs: 20_000,
});
type ErrorCode = 'invalid-input' | 'unowned-image' | 'unavailable' | 'too-large' | 'digest-mismatch' | 'invalid-image' | 'aborted';
export class ReviewedImageError extends Error {
  constructor(public readonly code: ErrorCode) {
    super(`Reviewed image verification failed: ${code}`);
    this.name = 'ReviewedImageError';
  }
}
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const localAsset = /^\/option-assets\/[a-f0-9]{64}\.(?:webp|png|jpe?g|gif)$/;
const mimeTypes: Record<string, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

function validate(image: ReviewedImage): ReviewedImage {
  if (!image || typeof image.url !== 'string' || image.url.length > 2048 ||
    typeof image.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(image.sha256)) throw new ReviewedImageError('invalid-input');
  if (!isOwnedOptionAsset(image.url) || /[\\\s#]/.test(image.url)) throw new ReviewedImageError('unowned-image');
  if (image.url.startsWith('/')) {
    if (image.url.startsWith('/option-assets/') && !localAsset.test(image.url)) throw new ReviewedImageError('unowned-image');
  } else {
    const url = new URL(image.url);
    if (url.protocol !== 'https:' || url.hash || url.username || url.password || url.port ||
      /%(?:2e|2f|5c|00)/i.test(url.pathname)) throw new ReviewedImageError('unowned-image');
  }
  // Snapshot trusted inputs before the first await; callers cannot change the pin mid-fetch.
  return { url: image.url, sha256: image.sha256 };
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new ReviewedImageError('aborted'));
    signal.addEventListener('abort', abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
    if (signal.aborted) abort();
  });
}

async function remoteBytes(url: string, fetchImage: typeof fetch, signal: AbortSignal): Promise<Buffer> {
  const response = await abortable(fetchImage(url, { redirect: 'error', cache: 'no-store', signal }), signal);
  if (!response.ok || response.redirected || (response.url && response.url !== new URL(url).href) ||
    !response.headers.get('content-type')?.toLowerCase().startsWith('image/')) {
    void response.body?.cancel().catch(() => {});
    throw new ReviewedImageError('unavailable');
  }
  if (Number(response.headers.get('content-length')) > REVIEWED_IMAGE_LIMITS.imageBytes) {
    void response.body?.cancel().catch(() => {});
    throw new ReviewedImageError('too-large');
  }
  if (!response.body) throw new ReviewedImageError('invalid-image');
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await abortable(reader.read(), signal);
      if (done) break;
      size += value.byteLength;
      if (size > REVIEWED_IMAGE_LIMITS.imageBytes) throw new ReviewedImageError('too-large');
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks, size);
  } finally {
    // Cancellation must not keep an aborted request alive on an unresponsive stream.
    void reader.cancel().catch(() => {});
  }
}

/** Pins trusted registry imageDigests[url]; does not grant eligibility or perform visual QA.
 * Pass the returned data URI directly to the generator, including the pin in its cache key.
 * Never accept an expected digest from the customer or re-fetch after this verification.
 * Relative paths resolve against an owned HTTPS origin. Static assets are fetched,
 * never read from public/ or added to the serverless function bundle.
 */
export async function normalizeReviewedImage(
  input: ReviewedImage & { origin: string; optionReference?: boolean },
): Promise<string> {
  const request = validate(input);
  if (typeof input.origin !== 'string' || (input.optionReference !== undefined && typeof input.optionReference !== 'boolean')) {
    throw new ReviewedImageError('invalid-input');
  }
  const optionReference = input.optionReference === true;
  const signal = AbortSignal.timeout(REVIEWED_IMAGE_LIMITS.timeoutMs);
  try {
    if (signal.aborted) throw new ReviewedImageError('aborted');
    const url = new URL(request.url, input.origin).href;
    validate({ url, sha256: request.sha256 });
    const bytes = await remoteBytes(url, fetch, signal);
    if (!bytes.length) throw new ReviewedImageError('invalid-image');
    if (digest(bytes) !== request.sha256) throw new ReviewedImageError('digest-mismatch');
    let encoded: Buffer, mime: string;
    try {
      const image = sharp(bytes, { limitInputPixels: REVIEWED_IMAGE_LIMITS.pixels, failOn: 'warning', animated: true }).timeout({ seconds: 5 });
      const metadata = await abortable(image.metadata(), signal);
      mime = mimeTypes[metadata.format ?? ''];
      if (!mime || !metadata.width || !metadata.height || (metadata.pages ?? 1) !== 1) throw new Error('Unsupported image');
      await abortable(image.clone().raw().toBuffer(), signal);
      // Provider-size normalization is in-memory and only AFTER verifying the original pin.
      encoded = optionReference && (metadata.width < 256 || metadata.height < 256)
        ? await abortable(image.clone().autoOrient().resize(512, 512, { fit: 'contain', background: '#fff' }).webp({ quality: 92 }).toBuffer(), signal)
        : bytes;
      if (encoded !== bytes) mime = 'image/webp';
    } catch (error) {
      if (signal.aborted) throw new ReviewedImageError('aborted');
      if (error instanceof ReviewedImageError) throw error;
      throw new ReviewedImageError('invalid-image');
    }
    if (encoded.length > REVIEWED_IMAGE_LIMITS.imageBytes) throw new ReviewedImageError('too-large');
    if (signal.aborted) throw new ReviewedImageError('aborted');
    return `data:${mime};base64,${encoded.toString('base64')}`;
  } catch (error) {
    if (signal.aborted) throw new ReviewedImageError('aborted');
    if (error instanceof ReviewedImageError) throw error;
    throw new ReviewedImageError('unavailable');
  }
}
