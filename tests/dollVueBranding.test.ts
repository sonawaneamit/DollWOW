import { beforeEach, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { brandDollVuePreview, dollVuePublicReturnUrl } from '@/lib/dollvue/branding';

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@/lib/email/sendEmail', () => ({ sendEmail: mocks.send }));
import { sendDollVueLookEmail } from '@/lib/dollvue/email';
import BrandingReview, { metadata as reviewMetadata } from '@/app/review/dollvue-branding/page';

const handle = 'top-fire-doll-grace-162cm-i-cup-silicone-companion-doll';
beforeEach(() => { mocks.send.mockReset().mockResolvedValue({ delivered: true, provider: 'test-only' }); });

async function decode(bytes: Buffer) {
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data;
}

it.each([[800, 1200], [1600, 900], [800, 800], [400, 1600]])('embeds readable branding and a product QR after email optimization: %sx%s', async (width, height) => {
  const source = await sharp({ create: { width, height, channels: 3, background: '#b9d5cc' } }).png().toBuffer();
  const branded = await brandDollVuePreview(source, handle, [{ group: 'Skin tone', option: 'Dark tan' }, { group: 'Hairstyle', option: '#2' }]);
  const metadata = await sharp(branded).metadata();
  expect(metadata.width).toBe(width);
  expect(metadata.height).toBeGreaterThan(height);
  expect(await decode(branded)).toBe(dollVuePublicReturnUrl(handle));
  await sendDollVueLookEmail({ to: 'fixture@example.invalid', productName: 'Safe synthetic fixture',
    productUrl: dollVuePublicReturnUrl(handle), sourceImageUrl: 'invalid:test-only-no-fetch',
    previewDataUrl: `data:image/webp;base64,${branded.toString('base64')}`, selections: [] });
  const mail = mocks.send.mock.calls[0][0];
  const attachment = mail.attachments.find((item: { cid: string }) => item.cid === 'dollwow-preview');
  expect(Buffer.from(attachment.content, 'base64')).toEqual(branded);
  expect(await decode(Buffer.from(attachment.content, 'base64'))).toBe(dollVuePublicReturnUrl(handle));
  expect(mail.text).toContain('Created with DollVue. Powered by DollWOW.');
  expect(mail.html).not.toContain('cid:dollwow-original');
  expect(mail.html).toContain('Image unavailable');
  // Pixel proof: photo remains intact, while the new footer is outside its bounds.
  const top = await sharp(branded).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
  expect(Math.abs(top[0] - 185)).toBeLessThan(10);
  if (process.env.DOLLVUE_BRANDING_EVIDENCE_DIR) {
    await fs.mkdir(process.env.DOLLVUE_BRANDING_EVIDENCE_DIR, { recursive: true });
    await fs.writeFile(path.join(process.env.DOLLVUE_BRANDING_EVIDENCE_DIR, `preview-${width}x${height}.webp`), branded);
    await fs.writeFile(path.join(process.env.DOLLVUE_BRANDING_EVIDENCE_DIR, `email-${width}x${height}.webp`), Buffer.from(attachment.content, 'base64'));
  }
}, 15000);

it('does not encode a supplied origin, email, token, query or fragment in the QR destination', () => {
  for (const invalid of ['https://evil.test', 'grace?token=secret', 'grace#email', 'hello@example.test', '../grace', '']) {
    expect(() => dollVuePublicReturnUrl(invalid)).toThrow();
  }
  expect(dollVuePublicReturnUrl(handle)).toBe(`https://dollwow.com/products/${handle}`);
});

it('keeps the synthetic review noindex and inaccessible in production', async () => {
  expect(reviewMetadata.robots).toEqual({ index: false, follow: false });
  vi.stubEnv('VERCEL_ENV', 'production');
  vi.stubEnv('NODE_ENV', 'production');
  try { await expect(BrandingReview()).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404'); }
  finally { vi.unstubAllEnvs(); }
});
