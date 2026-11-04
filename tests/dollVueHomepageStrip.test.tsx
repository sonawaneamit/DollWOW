import React from 'react';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DollVueHomepageStrip, DollVueStripPicture } from '@/components/dollvue/DollVueHomepageStrip';

describe('DollVue homepage banner', () => {
  it('keeps one full-width native destination without adding a visible button', () => {
    const html = renderToStaticMarkup(<DollVueHomepageStrip />);
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toContain('href="/dollvue"');
    expect(html).toContain('aria-label="Explore DollVue personalized doll previews"');
    expect(html).not.toContain('home-dollvue-strip__cta');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('/_next/image');
  });

  it('offers separate desktop and mobile WebP sizes with original format fallbacks', () => {
    const html = renderToStaticMarkup(<DollVueStripPicture />);
    expect(html).toContain('desktop-640.webp 640w');
    expect(html).toContain('desktop-1774.webp 1774w');
    expect(html).toContain('mobile-480.webp 480w');
    expect(html).toContain('mobile-1440.webp 1440w');
    expect(html).toContain('sizes="80vw"');
    expect(html).toContain('desktop.png');
    expect(html).toContain('src="/images/dollvue/home/dollvue-skin-tone-strip-mobile.png"');
    expect(html).toContain('loading="lazy"');
  });

  it('removes every optimized source in original-only error fallback mode', () => {
    const html = renderToStaticMarkup(<DollVueStripPicture originalOnly />);
    expect(html).not.toContain('.webp');
    expect(html).toContain('desktop.png');
    expect(html).toContain('mobile.png');
    expect(html).toContain('four selectable skin tones');
  });

  it('keeps the original source bytes and complete frame while reducing each derivative', async () => {
    const directory = new URL('../public/images/dollvue/home/', import.meta.url);
    for (const [variant, widths, hash] of [
      ['desktop', [640, 1280, 1774], 'ed89281aaeeb00e18017b2d30ebfc4d13720f3179dba3fc0fc2b398f12a6b79e'],
      ['mobile', [480, 960, 1440], '652466afddcda4023239d586f665c828a3ea2a72054b48f2f396652a4938a52f']
    ] as const) {
      const original = fs.readFileSync(new URL(`dollvue-skin-tone-strip-${variant}.png`, directory));
      expect(crypto.createHash('sha256').update(original).digest('hex')).toBe(hash);
      const source = await sharp(original).metadata();
      for (const width of widths) {
        const bytes = fs.readFileSync(new URL(`dollvue-skin-tone-strip-${variant}-${width}.webp`, directory));
        const image = await sharp(bytes).metadata();
        expect(image.format).toBe('webp');
        expect(image.width).toBe(width);
        expect(image.height).toBe(Math.round(source.height! * width / source.width!));
        expect(bytes.length).toBeLessThan(original.length / 2);
        await sharp(bytes).raw().toBuffer();
      }
    }
  });
});
