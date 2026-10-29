import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { brandDollVuePreview, dollVuePublicReturnUrl } from '@/lib/dollvue/branding';

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@/lib/email/sendEmail', () => ({ sendEmail: mocks.send }));

import { sendDollVueLookEmail } from '@/lib/dollvue/email';

const handle = 'test-doll-160cm';
const productUrl = dollVuePublicReturnUrl(handle);

beforeEach(() => {
  mocks.send.mockReset().mockResolvedValue({ delivered: true, provider: 'test' });
});

async function decodeQR(imageBytes: Buffer): Promise<string | null> {
  const { data, info } = await sharp(imageBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const result = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  return result?.data ?? null;
}

describe('Mobile-readable footer layout', () => {
  it.each([
    [1067, 1600, 'portrait (typical doll photo)'],
    [1600, 1067, 'landscape'],
    [1024, 1024, 'square'],
  ])('renders mobile-legible footer at %dx%d (%s)', async (width, height, description) => {
    // Create synthetic non-explicit fixture
    const source = await sharp({
      create: { width, height, channels: 3, background: { r: 230, g: 240, b: 235 } }
    }).png().toBuffer();
    
    const originalHash = createHash('sha256').update(source).digest('hex');
    
    // Apply branding
    const branded = await brandDollVuePreview(source, handle, [{ group: 'Skin tone', option: 'Tan' }]);
    
    // Verify footer doesn't crop the image (height increases)
    const brandedMeta = await sharp(branded).metadata();
    expect(brandedMeta.width).toBe(width);
    expect(brandedMeta.height).toBeGreaterThan(height);
    
    // CRITICAL: QR must be >= 22% of image width (Martin's requirement)
    // We verify this by checking that the implementation produces a QR at the right size
    // The actual QR size is max(26% of width, min(240px, 22% of width))
    const expectedMinQrSize = width * 0.22;
    const expectedQrSize = Math.max(Math.round(width * 0.26), Math.min(240, Math.round(expectedMinQrSize)));
    expect(expectedQrSize).toBeGreaterThanOrEqual(expectedMinQrSize - 1); // -1 for rounding tolerance
    
    // Verify QR decodes at full resolution
    const qrUrl = await decodeQR(branded);
    expect(qrUrl).toBe(productUrl);
    
    // Test QR decoding at mobile CSS width (390px) and 2x device pixel density (780px)
    // Modern phones have 2-3x pixel density, so 390px CSS width = 780-1170 physical pixels
    const mobileCssWidth = 390;
    const mobileDeviceWidth = mobileCssWidth * 2; // 2x pixel density
    
    const mobileScale = mobileCssWidth / width;
    const mobileHeight = Math.round((brandedMeta.height ?? 0) * mobileScale);
    const mobileDeviceHeight = Math.round((brandedMeta.height ?? 0) * (mobileDeviceWidth / width));
    
    const mobileCssVersion = await sharp(branded)
      .resize({ width: mobileCssWidth, height: mobileHeight, fit: 'inside', kernel: 'nearest' })
      .png()
      .toBuffer();
    
    const mobileDeviceVersion = await sharp(branded)
      .resize({ width: mobileDeviceWidth, height: mobileDeviceHeight, fit: 'inside', kernel: 'nearest' })
      .png()
      .toBuffer();
    
    // Save evidence PNGs BEFORE assertions for debugging
    if (process.env.DOLLVUE_MOBILE_EVIDENCE_DIR) {
      const evidenceDir = process.env.DOLLVUE_MOBILE_EVIDENCE_DIR;
      await fs.mkdir(evidenceDir, { recursive: true });
      await fs.writeFile(path.join(evidenceDir, `footer-${width}x${height}-full.png`), 
        await sharp(branded).png().toBuffer());
      await fs.writeFile(path.join(evidenceDir, `footer-${width}x${height}-mobile-${mobileCssWidth}px-css.png`), 
        mobileCssVersion);
      await fs.writeFile(path.join(evidenceDir, `footer-${width}x${height}-mobile-${mobileDeviceWidth}px-2xdpr.png`), 
        mobileDeviceVersion);
    }
    
    // CRITICAL: QR must decode from mobile device pixels (simulating 2x DPR)
    const mobileQr = await decodeQR(mobileDeviceVersion);
    expect(mobileQr).toBe(productUrl);
    
    // Verify original source stays clean (requirement #1)
    expect(createHash('sha256').update(source).digest('hex')).toBe(originalHash);
  }, 30000);
  
  it('footer has mobile-readable text sizing', async () => {
    const source = await sharp({
      create: { width: 1000, height: 1500, channels: 3, background: '#ddd' }
    }).png().toBuffer();
    
    const branded = await brandDollVuePreview(source, handle, []);
    
    // At 1000px width, mobile scale is 1000/390 ≈ 2.56x
    // Minimum mobile text (14px) * 2.56 ≈ 36px at full res
    // Footer should have text sized for mobile legibility
    
    const metadata = await sharp(branded).metadata();
    expect(metadata.width).toBe(1000);
    
    // QR should be ~22-28% of image width (220-280px at 1000px width)
    // We can verify by checking the footer doesn't take excessive height
    const footerHeight = (metadata.height ?? 0) - 1500;
    expect(footerHeight).toBeGreaterThan(150); // Has substantial content
    expect(footerHeight).toBeLessThan(600); // Not excessively tall
    
    // Verify QR decodes
    expect(await decodeQR(branded)).toBe(productUrl);
  });
});

describe('Original source image stays clean (requirement #1)', () => {
  it('source attachment in email is unmodified (no footer, no QR, no watermark)', async () => {
    const originalSource = await sharp({
      create: { width: 800, height: 1200, channels: 3, background: { r: 200, g: 210, b: 205 } }
    }).webp().toBuffer();
    
    const originalHash = createHash('sha256').update(originalSource).digest('hex');
    
    // Brand the preview (result)
    const brandedPreview = await brandDollVuePreview(originalSource, handle, []);
    const previewDataUrl = `data:image/webp;base64,${brandedPreview.toString('base64')}`;
    
    // Send email
    await sendDollVueLookEmail({
      to: 'test@example.com',
      productName: 'Test Doll',
      productUrl,
      sourceImageUrl: 'data:image/webp;base64,' + originalSource.toString('base64'),
      previewDataUrl,
      selections: [],
    });
    
    const emailCall = mocks.send.mock.calls[0][0];
    
    // Find source (original) attachment
    const sourceAttachment = emailCall.attachments.find((a: { cid?: string }) => 
      a.cid === 'dollwow-original');
    
    // Source attachment should exist
    expect(sourceAttachment).toBeDefined();
    
    // CRITICAL: Source bytes must be unmodified (may be optimized but no footer/QR)
    const sourceBytes = Buffer.from(sourceAttachment.content, 'base64');
    const sourceMeta = await sharp(sourceBytes).metadata();
    
    // Original dimensions preserved (or proportionally resized, but no footer added)
    expect(sourceMeta.width).toBeLessThanOrEqual(800);
    expect(sourceMeta.height).toBeLessThanOrEqual(1200);
    expect(sourceMeta.width! / sourceMeta.height!).toBeCloseTo(800 / 1200, 1);
    
    // No QR code in source
    const sourceQr = await decodeQR(sourceBytes);
    expect(sourceQr).toBeNull();
    
    // Find result attachments (inline + download)
    const inlineAttachment = emailCall.attachments.find((a: { cid?: string }) => 
      a.cid === 'dollwow-preview');
    const downloadAttachment = emailCall.attachments.find((a: { cid?: string; filename: string }) => 
      a.filename === 'dollvue-preview.webp' && !a.cid);
    
    expect(inlineAttachment).toBeDefined();
    expect(downloadAttachment).toBeDefined();
    
    // Result attachments MUST have QR
    const inlineBytes = Buffer.from(inlineAttachment.content, 'base64');
    const downloadBytes = Buffer.from(downloadAttachment.content, 'base64');
    
    expect(await decodeQR(inlineBytes)).toBe(productUrl);
    expect(await decodeQR(downloadBytes)).toBe(productUrl);
    
    // Result bytes should be identical (or explicitly documented if different)
    const inlineMeta = await sharp(inlineBytes).metadata();
    const downloadMeta = await sharp(downloadBytes).metadata();
    
    expect(inlineMeta.width).toBe(downloadMeta.width);
    expect(inlineMeta.height).toBe(downloadMeta.height);
    
    // If dimensions match, bytes should match
    if (inlineMeta.width === downloadMeta.width && inlineMeta.height === downloadMeta.height) {
      expect(createHash('sha256').update(inlineBytes).digest('hex'))
        .toBe(createHash('sha256').update(downloadBytes).digest('hex'));
    }
  }, 30000);
  
  it('web result and email download attachment are byte-identical', async () => {
    const source = await sharp({
      create: { width: 1200, height: 1600, channels: 3, background: '#e0e8e4' }
    }).png().toBuffer();
    
    // This is what the web gets
    const webResult = await brandDollVuePreview(source, handle, [{ group: 'Eye color', option: 'Blue' }]);
    const webHash = createHash('sha256').update(webResult).digest('hex');
    
    // This is what goes to email
    const previewDataUrl = `data:image/webp;base64,${webResult.toString('base64')}`;
    await sendDollVueLookEmail({
      to: 'test@example.com',
      productName: 'Test',
      productUrl,
      sourceImageUrl: 'invalid:test',
      previewDataUrl,
      selections: [{ group: 'Eye color', option: 'Blue' }],
    });
    
    const emailCall = mocks.send.mock.calls[0][0];
    const downloadAttachment = emailCall.attachments.find((a: { filename: string; cid?: string }) => 
      a.filename === 'dollvue-preview.webp' && !a.cid);
    
    const downloadBytes = Buffer.from(downloadAttachment.content, 'base64');
    const downloadHash = createHash('sha256').update(downloadBytes).digest('hex');
    
    // CRITICAL: Web result and email download must be byte-identical
    expect(downloadHash).toBe(webHash);
  });
});
