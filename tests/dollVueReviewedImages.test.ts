import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { normalizeReviewedImage } from '@/lib/dollvue/reviewedImages';

const origin = 'https://dollwow.com';
const sourceUrl = 'https://cdn.shopify.com/s/files/1/0960/7531/7432/files/reviewed.jpg?v=1';
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const fromDataUrl = (value: string) => Buffer.from(value.split(',')[1], 'base64');
const png = (width = 300, height = 300) => sharp({ create: { width, height, channels: 3, background: '#6495ed' } }).png().toBuffer();
const response = (bytes: Buffer, headers: Record<string, string> = {}) => new Response(new Uint8Array(bytes), {
  headers: { 'content-type': 'image/png', ...headers },
});

describe('reviewed image byte binding', () => {
  let fetchImage: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    fetchImage = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchImage);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns the exact pinned source bytes as a data URI without another fetch', async () => {
    const bytes = await png();
    fetchImage.mockResolvedValueOnce(response(bytes)).mockResolvedValue(response(await png(301)));
    const result = await normalizeReviewedImage({ url: sourceUrl, sha256: hash(bytes), origin });
    expect(result).toMatch(/^data:image\/png;base64,/);
    expect(fromDataUrl(result)).toEqual(bytes);
    expect(fetchImage).toHaveBeenCalledTimes(1);
    expect(fetchImage).toHaveBeenCalledWith(sourceUrl, expect.objectContaining({ cache: 'no-store', redirect: 'error', signal: expect.any(AbortSignal) }));
  });

  it('checks reference bytes and never returns their URL even for large remote references', async () => {
    const bytes = await png();
    fetchImage.mockResolvedValue(response(bytes));
    const result = await normalizeReviewedImage({ url: sourceUrl, sha256: hash(bytes), origin, optionReference: true });
    expect(fromDataUrl(result)).toEqual(bytes);
    expect(result.startsWith('data:')).toBe(true);
  });

  it('fetches local option paths from the owned deployment without a filesystem dependency', async () => {
    const bytes = await png();
    const url = `/option-assets/${hash(bytes)}.png`;
    fetchImage.mockResolvedValue(response(bytes));
    const result = await normalizeReviewedImage({ url, sha256: hash(bytes), origin, optionReference: true });
    expect(fromDataUrl(result)).toEqual(bytes);
    expect(fetchImage).toHaveBeenCalledWith(`${origin}${url}`, expect.objectContaining({ cache: 'no-store', redirect: 'error' }));
  });

  it('normalizes small verified references in memory, without a visual-drift gate', async () => {
    const bytes = await png(250, 180);
    const url = `/option-assets/${hash(bytes)}.png`;
    fetchImage.mockResolvedValue(response(bytes));
    const result = await normalizeReviewedImage({ url, sha256: hash(bytes), origin, optionReference: true });
    expect(result).toMatch(/^data:image\/webp;base64,/);
    expect(await sharp(fromDataUrl(result)).metadata()).toMatchObject({ width: 512, height: 512 });
    expect(hash(fromDataUrl(result))).not.toBe(hash(bytes));
    expect(fetchImage).toHaveBeenCalledTimes(1);
  });

  it('does not normalize small sources', async () => {
    const bytes = await png(32, 24);
    fetchImage.mockResolvedValue(response(bytes));
    expect(fromDataUrl(await normalizeReviewedImage({ url: sourceUrl, sha256: hash(bytes), origin }))).toEqual(bytes);
  });

  it.each([false, true])('rejects a changed source/reference digest before normalization (reference=%s)', async optionReference => {
    const bytes = await png(32);
    fetchImage.mockResolvedValue(response(bytes));
    await expect(normalizeReviewedImage({ url: sourceUrl, sha256: '0'.repeat(64), origin, optionReference })).rejects.toMatchObject({ code: 'digest-mismatch' });
  });

  it('checks served bytes rather than trusting their hash-shaped filename', async () => {
    const bytes = await png();
    const url = `/option-assets/${hash(bytes)}.png`;
    fetchImage.mockResolvedValue(response(await png(301)));
    await expect(normalizeReviewedImage({ url, sha256: hash(bytes), origin })).rejects.toMatchObject({ code: 'digest-mismatch' });
    expect(fetchImage).toHaveBeenCalledTimes(1);
  });

  it('snapshots the expected digest before asynchronous I/O', async () => {
    const bytes = await png();
    const input = { url: sourceUrl, sha256: '0'.repeat(64), origin };
    fetchImage.mockImplementation(async () => { input.sha256 = hash(bytes); return response(bytes); });
    await expect(normalizeReviewedImage(input)).rejects.toMatchObject({ code: 'digest-mismatch' });
  });

  it.each(['', 'abc', 'A'.repeat(64), 'a'.repeat(63)])('rejects malformed SHA256 pins: %s', async sha256 => {
    await expect(normalizeReviewedImage({ url: sourceUrl, sha256, origin })).rejects.toMatchObject({ code: 'invalid-input' });
    expect(fetchImage).not.toHaveBeenCalled();
  });

  it.each([
    'https://supplier.example/photo.jpg', 'http://dollwow.com/images/a.jpg',
    'https://cdn.shopify.com/s/files/1/9999/7531/7432/files/a.jpg',
    'https://dollwow.com@evil.example/images/a.jpg', 'https://dollwow.com:444/images/a.jpg',
    'https://dollwow.com/images/a.jpg#fragment', 'https://dollwow.com/images/%2fsecret.jpg',
    'https://cdn.shopify.com/s/files/1/0960/7531/7432/files/a.jpg?redirect=elsewhere',
    '//evil.example/image.png', 'file:///tmp/image.png', 'data:image/png;base64,AA==',
    '/option-assets/../secret.png', '/option-assets/%2e%2e/secret.png', '/option-assets/arbitrary.png',
  ])('rejects unowned or unbounded locations: %s', async url => {
    await expect(normalizeReviewedImage({ url, sha256: 'a'.repeat(64), origin })).rejects.toBeInstanceOf(Error);
    expect(fetchImage).not.toHaveBeenCalled();
  });

  it('resolves other owned relative paths only against an owned origin', async () => {
    const bytes = await png();
    fetchImage.mockResolvedValue(response(bytes));
    const url = '/product-media/v4/reviewed/0';
    await normalizeReviewedImage({ url, sha256: hash(bytes), origin });
    expect(fetchImage.mock.calls[0][0]).toBe(`${origin}${url}`);
    fetchImage.mockClear();
    await expect(normalizeReviewedImage({ url, sha256: hash(bytes), origin: 'http://127.0.0.1' })).rejects.toMatchObject({ code: 'unowned-image' });
    expect(fetchImage).not.toHaveBeenCalled();
  });

  it('never forwards credentials or uses an untrusted preview origin for static paths', async () => {
    const bytes = await png();
    const url = `/option-assets/${hash(bytes)}.webp`;
    for (const untrusted of ['https://preview.vercel.app', 'https://user:password@dollwow.com', 'http://localhost:3000']) {
      await expect(normalizeReviewedImage({ url, sha256: hash(bytes), origin: untrusted })).rejects.toMatchObject({ code: 'unowned-image' });
    }
    expect(fetchImage).not.toHaveBeenCalled();
  });

  it('rejects redirects and challenge pages', async () => {
    fetchImage.mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'https://supplier.example/a.jpg' } }));
    await expect(normalizeReviewedImage({ url: sourceUrl, sha256: 'a'.repeat(64), origin })).rejects.toMatchObject({ code: 'unavailable' });
    fetchImage.mockResolvedValueOnce(new Response('challenge', { headers: { 'content-type': 'text/html' } }));
    await expect(normalizeReviewedImage({ url: sourceUrl, sha256: 'a'.repeat(64), origin })).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('uses decoded MIME rather than trusting the filename or response MIME', async () => {
    const bytes = await sharp(await png()).jpeg().toBuffer();
    fetchImage.mockResolvedValue(response(bytes));
    expect(await normalizeReviewedImage({ url: sourceUrl, sha256: hash(bytes), origin })).toMatch(/^data:image\/jpeg;base64,/);
  });

  it.each(['garbage', '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>'])('rejects non-raster/invalid bodies even with a matching digest', async text => {
    const bytes = Buffer.from(text);
    fetchImage.mockResolvedValue(response(bytes));
    await expect(normalizeReviewedImage({ url: sourceUrl, sha256: hash(bytes), origin })).rejects.toMatchObject({ code: 'invalid-image' });
  });

  it('bounds declared and streamed byte sizes, including a lying Content-Length', async () => {
    const limit = 20 * 1024 * 1024;
    fetchImage.mockResolvedValueOnce(response(Buffer.from('x'), { 'content-length': String(limit + 1) }));
    await expect(normalizeReviewedImage({ url: sourceUrl, sha256: 'a'.repeat(64), origin })).rejects.toMatchObject({ code: 'too-large' });
    const cancel = vi.fn();
    fetchImage.mockResolvedValueOnce(new Response(new ReadableStream({
      pull(controller) { controller.enqueue(new Uint8Array(1024 * 1024)); }, cancel,
    }), { headers: { 'content-type': 'image/png', 'content-length': '1' } }));
    await expect(normalizeReviewedImage({ url: sourceUrl, sha256: 'a'.repeat(64), origin })).rejects.toMatchObject({ code: 'too-large' });
    expect(cancel).toHaveBeenCalled();
  });

  it('bounds decoded pixels', async () => {
    const bytes = await png(5001, 5000);
    fetchImage.mockResolvedValue(response(bytes));
    await expect(normalizeReviewedImage({ url: sourceUrl, sha256: hash(bytes), origin })).rejects.toMatchObject({ code: 'invalid-image' });
  });

  it('rejects multiple frames instead of silently selecting the first', async () => {
    const frame = '21f90400000000002c0000000001000100000202440100';
    const bytes = Buffer.from(`47494638396101000100800000000000ffffff${frame}${frame}3b`, 'hex');
    expect((await sharp(bytes, { animated: true }).metadata()).pages).toBe(2);
    fetchImage.mockResolvedValue(response(bytes));
    await expect(normalizeReviewedImage({ url: sourceUrl, sha256: hash(bytes), origin })).rejects.toMatchObject({ code: 'invalid-image' });
  });

  it('enforces its deadline while a response body is stalled', async () => {
    const deadline = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(deadline.signal);
    const cancel = vi.fn();
    fetchImage.mockResolvedValue(new Response(new ReadableStream({ cancel }), { headers: { 'content-type': 'image/png' } }));
    const task = normalizeReviewedImage({ url: sourceUrl, sha256: 'a'.repeat(64), origin });
    const assertion = expect(task).rejects.toMatchObject({ code: 'aborted' });
    await new Promise(resolve => setImmediate(resolve));
    deadline.abort();
    await assertion;
    expect(cancel).toHaveBeenCalled();
  });
});
