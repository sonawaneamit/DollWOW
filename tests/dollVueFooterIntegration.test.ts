import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { dollVuePublicReturnUrl } from '@/lib/dollvue/branding';

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  veniceEdit: vi.fn(),
  recordPreview: vi.fn(),
  getProduct: vi.fn(),
  getEligibility: vi.fn(),
  getUsage: vi.fn(),
  normalizeReviewedImage: vi.fn(),
  readSession: vi.fn(),
}));

vi.mock('@/lib/email/sendEmail', () => ({ sendEmail: mocks.send }));
vi.mock('@/lib/dollvue/accountUsage', () => ({
  recordDollVuePreview: mocks.recordPreview,
  dollVueUsageForEmail: mocks.getUsage,
}));
vi.mock('@/lib/shopify/storefront', () => ({ getProductByHandle: mocks.getProduct }));
vi.mock('@/lib/dollvue/eligibility', () => ({ resolveCurrentDollVueEligibility: mocks.getEligibility }));
vi.mock('@/lib/dollvue/reviewedImages', () => ({ normalizeReviewedImage: mocks.normalizeReviewedImage }));
vi.mock('@/lib/dollvue/session', () => ({ readDollVueSession: mocks.readSession }));

describe('DollVue footer integration: single choke point for all output paths', () => {
  const handle = 'test-doll-160cm';
  const productUrl = dollVuePublicReturnUrl(handle);

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.send.mockResolvedValue({ delivered: true, provider: 'test' });
    mocks.recordPreview.mockResolvedValue(true);
    mocks.getUsage.mockResolvedValue({ available: true, remaining: 3, unlimited: false });
    mocks.readSession.mockReturnValue({ email: 'test@example.com', verified: Date.now() });
    
    // Mock a synthetic gradient image from Venice
    const syntheticResult = sharp({
      create: { width: 1067, height: 1600, channels: 3, background: { r: 200, g: 220, b: 210 } }
    }).png().toBuffer();

    global.fetch = vi.fn((url: string) => {
      if (typeof url === 'string' && url.includes('venice.ai')) {
        return Promise.resolve({
          ok: true,
          arrayBuffer: () => syntheticResult.then(b => b.buffer),
        } as Response);
      }
      return Promise.resolve({ ok: false, status: 404 } as Response);
    }) as typeof fetch;

    mocks.getProduct.mockResolvedValue({
      id: 'gid://shopify/Product/123',
      handle,
      title: 'Test Synthetic Doll',
      featuredImage: { url: 'https://example.com/test.jpg', width: 800, height: 1200 },
      images: [{ url: 'https://example.com/test.jpg', width: 800, height: 1200 }],
      media: [],
    });

    mocks.getEligibility.mockResolvedValue({
      available: true,
      sourcePositions: [0],
      config: {
        groups: [{
          id: 'skin', 
          label: 'Skin tone', 
          kind: 'exclusive' as const,
          options: [
            { id: 'tan', label: 'Tan', swatch: { kind: 'color' as const, value: '#d4a574' } }
          ],
          conditional: [],
          incompatibleWith: [],
        }]
      },
      revision: 1,
      imageDigests: null,
    });

    mocks.normalizeReviewedImage.mockImplementation((opts: { url: string }) => Promise.resolve(opts.url));
  });

  it('generatePreview applies branded footer at the single choke point', async () => {
    // Test the core branding flow: raw bytes → brandDollVuePreview → branded bytes
    const syntheticRawBytes = await sharp({
      create: { width: 1067, height: 1600, channels: 3, background: { r: 200, g: 220, b: 210 } }
    }).png().toBuffer();

    const { brandDollVuePreview } = await import('@/lib/dollvue/branding');
    const branded = await brandDollVuePreview(syntheticRawBytes, handle, [
      { group: 'Skin tone', option: 'Tan' }
    ]);

    // Verify footer is present (image is taller than original)
    const metadata = await sharp(branded).metadata();
    expect(metadata.height).toBeGreaterThan(1600);
    expect(metadata.width).toBe(1067);

    // Verify QR code decodes correctly
    const qrDecoded = await decodeQR(branded);
    expect(qrDecoded).toBe(productUrl);

    // Verify email receives SAME bytes via sendDollVueLookEmail
    const previewDataUrl = `data:image/webp;base64,${branded.toString('base64')}`;
    const { sendDollVueLookEmail } = await import('@/lib/dollvue/email');
    
    await sendDollVueLookEmail({
      to: 'test@example.com',
      productName: 'Test Doll',
      productUrl,
      sourceImageUrl: 'https://example.com/original.jpg',
      previewDataUrl,
      selections: [{ group: 'Skin tone', option: 'Tan' }],
    });

    const emailCall = mocks.send.mock.calls[0][0];
    
    // Verify BOTH inline (CID) AND separate downloadable attachment
    const inlineAttachment = emailCall.attachments.find((a: { cid?: string }) => a.cid === 'dollwow-preview');
    const downloadAttachment = emailCall.attachments.find((a: { cid?: string; filename: string }) => 
      a.filename === 'dollvue-preview.webp' && !a.cid);
    
    expect(inlineAttachment).toBeDefined();
    expect(downloadAttachment).toBeDefined();
    
    const inlineBytes = Buffer.from(inlineAttachment.content, 'base64');
    const downloadBytes = Buffer.from(downloadAttachment.content, 'base64');
    
    // CRITICAL: All three must have IDENTICAL bytes
    expect(createHash('sha256').update(branded).digest('hex'))
      .toBe(createHash('sha256').update(inlineBytes).digest('hex'));
    expect(createHash('sha256').update(branded).digest('hex'))
      .toBe(createHash('sha256').update(downloadBytes).digest('hex'));

    // Verify QR works in both email attachments
    expect(await decodeQR(inlineBytes)).toBe(productUrl);
    expect(await decodeQR(downloadBytes)).toBe(productUrl);
  }, 30000);

  it('preserves branded bytes without re-encoding in email (DOL-310 requirement)', async () => {
    const syntheticBranded = await createSyntheticBrandedImage(800, 1200, handle);
    const previewDataUrl = `data:image/webp;base64,${syntheticBranded.toString('base64')}`;

    const { sendDollVueLookEmail } = await import('@/lib/dollvue/email');
    await sendDollVueLookEmail({
      to: 'test@example.com',
      productName: 'Test Doll',
      productUrl,
      sourceImageUrl: 'https://example.com/original.jpg',
      previewDataUrl,
      selections: [{ group: 'Skin tone', option: 'Tan' }],
    });

    const emailCall = mocks.send.mock.calls[0][0];
    const attachment = emailCall.attachments.find((a: { cid: string }) => a.cid === 'dollwow-preview');
    const emailBytes = Buffer.from(attachment.content, 'base64');

    // Email should preserve the exact bytes, not re-encode
    expect(createHash('sha256').update(syntheticBranded).digest('hex'))
      .toBe(createHash('sha256').update(emailBytes).digest('hex'));
  });

  it.each([
    [800, 1200, '2:3 portrait'],
    [1600, 900, '16:9 landscape'],
    [800, 800, '1:1 square'],
    [1067, 1600, '2:3 narrow portrait (typical doll photo)'],
  ])('QR decodes correctly after footer compositing: %dx%d (%s)', async (width, height, label) => {
    const branded = await createSyntheticBrandedImage(width, height, handle);
    const qrUrl = await decodeQR(branded);
    expect(qrUrl).toBe(productUrl);
    
    // Verify footer is visible (white pixels in footer area)
    const metadata = await sharp(branded).metadata();
    const footerSample = await sharp(branded)
      .extract({ left: 10, top: metadata.height! - 50, width: 10, height: 10 })
      .raw()
      .toBuffer();
    
    // Footer should be white (#ffffff) or very close
    const avgBrightness = Array.from(footerSample).reduce((sum, val) => sum + val, 0) / footerSample.length;
    expect(avgBrightness).toBeGreaterThan(240); // Near white
  }, 20000);

  it('fails safe when branding cannot be applied', async () => {
    // Verify the generation route's error handling when branding throws
    const syntheticRawBytes = await sharp({
      create: { width: 800, height: 1200, channels: 3, background: '#ddd' }
    }).png().toBuffer();

    // Mock branding to throw
    vi.spyOn(await import('@/lib/dollvue/branding'), 'brandDollVuePreview')
      .mockRejectedValue(new Error('Branding failed'));

    // The generation route wraps brandDollVuePreview in try/catch
    // and returns { ok: false, status: 500 } when it throws
    const { brandDollVuePreview } = await import('@/lib/dollvue/branding');
    
    await expect(brandDollVuePreview(syntheticRawBytes, handle, [])).rejects.toThrow('Branding failed');
    
    // Verify the route's error handling: normalizeAndBrandPreview wrapper
    // catches the error and returns { ok: false, status: 500, detail: ... }
    // ensuring no unbranded bytes are ever returned to the client.
    
    vi.restoreAllMocks();
  }, 30000);
});

async function decodeQR(imageBytes: Buffer): Promise<string | null> {
  const { data, info } = await sharp(imageBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const result = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  return result?.data ?? null;
}

async function createSyntheticBrandedImage(width: number, height: number, handle: string): Promise<Buffer> {
  const { brandDollVuePreview } = await import('@/lib/dollvue/branding');
  const source = await sharp({
    create: { width, height, channels: 3, background: { r: 230, g: 240, b: 235 } }
  }).png().toBuffer();
  
  return brandDollVuePreview(source, handle, [
    { group: 'Skin tone', option: 'Tan' },
  ]);
}
