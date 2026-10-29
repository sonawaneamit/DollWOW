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
}));

vi.mock('@/lib/email/sendEmail', () => ({ sendEmail: mocks.send }));
vi.mock('@/lib/dollvue/accountUsage', () => ({
  recordDollVuePreview: mocks.recordPreview,
  dollVueUsageForEmail: mocks.getUsage,
}));
vi.mock('@/lib/shopify/storefront', () => ({ getProductByHandle: mocks.getProduct }));
vi.mock('@/lib/dollvue/eligibility', () => ({ resolveCurrentDollVueEligibility: mocks.getEligibility }));
vi.mock('@/lib/dollvue/reviewedImages', () => ({ normalizeReviewedImage: mocks.normalizeReviewedImage }));

describe('DollVue footer integration: single choke point for all output paths', () => {
  const handle = 'test-doll-160cm';
  const productUrl = dollVuePublicReturnUrl(handle);

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.send.mockResolvedValue({ delivered: true, provider: 'test' });
    mocks.recordPreview.mockResolvedValue(true);
    mocks.getUsage.mockResolvedValue({ available: true, remaining: 3 });
    
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
      images: { nodes: [{ url: 'https://example.com/test.jpg', width: 800, height: 1200 }] },
    });

    mocks.getEligibility.mockResolvedValue({
      available: true,
      sourcePositions: [0],
      config: {
        groups: [{
          id: 'skin', label: 'Skin tone', kind: 'exclusive' as const,
          options: [{ id: 'tan', label: 'Tan', swatch: { kind: 'color' as const, value: '#d4a574' } }]
        }]
      },
      revision: 1,
      imageDigests: null,
    });

    mocks.normalizeReviewedImage.mockImplementation((opts: { url: string }) => Promise.resolve(opts.url));
  });

  it('applies branded footer with QR code at the single choke point after generation', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://dollwow.com');
    vi.stubEnv('VENICE_API_KEY', 'test-key');
    vi.stubEnv('DOLLVUE_ENABLED', 'true');
    vi.stubEnv('DOLLVUE_DAILY_LIMIT', '100');

    const { POST } = await import('@/app/dollvue/generate/route');

    const request = new Request('https://dollwow.com/dollvue/generate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://dollwow.com',
        cookie: `dollvue_session=${Buffer.from(JSON.stringify({ email: 'test@example.com', verified: Date.now() })).toString('base64')}`,
        'x-vercel-ip-country': 'US',
      },
      body: JSON.stringify({
        productHandle: handle,
        sourcePosition: 0,
        selections: [{ groupId: 'skin', optionId: 'tan' }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result.previewDataUrl).toMatch(/^data:image\/webp;base64,/);

    // Extract the branded bytes
    const base64Data = result.previewDataUrl.replace(/^data:image\/webp;base64,/, '');
    const brandedBytes = Buffer.from(base64Data, 'base64');

    // Verify footer is present (image is taller than original)
    const metadata = await sharp(brandedBytes).metadata();
    expect(metadata.height).toBeGreaterThan(1600);
    expect(metadata.width).toBe(1067);

    // Verify QR code decodes correctly
    const qrDecoded = await decodeQR(brandedBytes);
    expect(qrDecoded).toBe(productUrl);

    // Verify email was sent with the SAME bytes
    expect(mocks.send).toHaveBeenCalledTimes(1);
    const emailCall = mocks.send.mock.calls[0][0];
    const attachment = emailCall.attachments.find((a: { cid: string }) => a.cid === 'dollwow-preview');
    expect(attachment).toBeDefined();
    
    const emailBytes = Buffer.from(attachment.content, 'base64');
    
    // CRITICAL: web preview and email attachment must be IDENTICAL bytes
    expect(createHash('sha256').update(brandedBytes).digest('hex'))
      .toBe(createHash('sha256').update(emailBytes).digest('hex'));

    // Verify QR still works in email attachment
    expect(await decodeQR(emailBytes)).toBe(productUrl);

    vi.unstubAllEnvs();
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
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://dollwow.com');
    vi.stubEnv('VENICE_API_KEY', 'test-key');
    vi.stubEnv('DOLLVUE_ENABLED', 'true');
    vi.stubEnv('DOLLVUE_DAILY_LIMIT', '100');

    // Mock branding to throw
    const { brandDollVuePreview } = await import('@/lib/dollvue/branding');
    vi.spyOn(await import('@/lib/dollvue/branding'), 'brandDollVuePreview')
      .mockRejectedValue(new Error('Branding failed'));

    const { POST } = await import('@/app/dollvue/generate/route');

    const request = new Request('https://dollwow.com/dollvue/generate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://dollwow.com',
        cookie: `dollvue_session=${Buffer.from(JSON.stringify({ email: 'test@example.com', verified: Date.now() })).toString('base64')}`,
        'x-vercel-ip-country': 'US',
      },
      body: JSON.stringify({
        productHandle: handle,
        sourcePosition: 0,
        selections: [{ groupId: 'skin', optionId: 'tan' }],
      }),
    });

    const response = await POST(request);
    
    // Should return error, not unbranded image
    expect(response.status).toBeGreaterThanOrEqual(500);
    const result = await response.json();
    expect(result.error).toBeDefined();
    
    vi.unstubAllEnvs();
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
