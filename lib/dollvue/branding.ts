import 'server-only';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import QRCode from 'qrcode';
import {outlinedText} from './outlinedText';

export const DOLLVUE_BRANDING_VERSION = 'share-footer-white-v4-outlined-font';

export function dollVuePublicReturnUrl(handle: string) {
  if (!/^[a-z0-9_-]{1,180}$/.test(handle)) throw new Error('Invalid public product handle');
  return `https://dollwow.com/products/${handle}`;
}

/** Append branding outside the photo. Never include identity or access tokens. */
export async function brandDollVuePreview(bytes: Buffer, productHandle: string, selections: Array<{ group: string; option: string }> = []) {
  const destination = dollVuePublicReturnUrl(productHandle);
  if (selections.length > 2 || selections.some(item => item.group.length > 100 || item.option.length > 100)) throw new Error('Invalid preview choices');
  
  const photo = await sharp(bytes, { limitInputPixels: 25_000_000, failOn: 'warning' })
    .rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .png().toBuffer({ resolveWithObject: true });
  
  if (!photo.info.width || !photo.info.height || photo.info.width < 400) {
    throw new Error('Preview is too small for readable branding');
  }
  
  const width = photo.info.width;
  const height = photo.info.height;
  
  // Scale footer to ensure readability on mobile (390px width → 14px min effective text)
  // At 390px mobile width, we need text that renders at ~14px minimum
  // For 1600px image: 1600/390 ≈ 4.1x, so 14px * 4.1 ≈ 57px at full res
  const mobileWidthTarget = 390;
  const mobileMinTextPx = 14;
  const fullResMinTextPx = Math.max(57, Math.round((width / mobileWidthTarget) * mobileMinTextPx));
  
  // QR code: 25% of image width (within Martin's 22-28% spec)
  // Large enough to scan on mobile devices with camera
  const qrSize = Math.round(width * 0.26);
  
  // Generous padding scaled to image width
  const padding = Math.max(32, Math.round(width * 0.025)); // 2.5% min 32px
  const verticalSpacing = Math.max(20, Math.round(width * 0.015)); // 1.5% min 20px
  
  // Text sizes: scaled to ensure mobile legibility
  const titleSize = Math.max(fullResMinTextPx * 1.4, Math.round(width * 0.045)); // ~45px at 1000px
  const subtitleSize = Math.max(fullResMinTextPx, Math.round(width * 0.032)); // ~32px at 1000px
  const labelSize = Math.max(fullResMinTextPx * 0.85, Math.round(width * 0.027)); // ~27px at 1000px
  const disclaimerSize = Math.max(fullResMinTextPx * 0.75, Math.round(width * 0.022)); // ~22px at 1000px
  
  const logoBytes = await readFile(path.join(process.cwd(), 'public/images/brand/dollwow-black-gold-lockup.png'));
  const logoWidth = Math.round(width * 0.35); // 35% of image width
  const logo = await sharp(logoBytes).resize({ width: logoWidth }).png().toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const logoHeight = logoMeta.height ?? 0;
  
  // Calculate footer height based on content
  const footerHeight = Math.round(
    padding + logoHeight + verticalSpacing + titleSize + verticalSpacing + 
    subtitleSize + verticalSpacing + disclaimerSize + padding
  );
  
  const qr = await QRCode.toBuffer(destination, {
    type: 'png', 
    width: qrSize, 
    margin: Math.max(6, Math.round(qrSize * 0.12)), // 12% margin for proper quiet zone
    errorCorrectionLevel: 'H', // High error correction for better scanning
    color: { dark: '#101818', light: '#ffffff' },
  });
  
  // Clear hierarchy: logo, title, subtitle, QR with label, disclaimer
  const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${footerHeight}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <path d="M0 1H${width}" stroke="#d3ad63" stroke-width="3"/>
    ${outlinedText('Created with DollVue', {
      x: padding,
      y: padding + logoHeight + verticalSpacing + titleSize,
      size: titleSize,
      fill: '#17251f'
    }).svg}
    ${outlinedText('Powered by DollWOW.com', {
      x: padding,
      y: padding + logoHeight + verticalSpacing * 2 + titleSize + subtitleSize,
      size: subtitleSize,
      fill: '#17251f'
    }).svg}
    ${outlinedText('Scan to view this doll', {
      x: width - padding - qrSize / 2,
      y: padding + qrSize + Math.round(verticalSpacing * 0.7) + labelSize,
      size: labelSize,
      fill: '#17251f',
      anchor: 'middle'
    }).svg}
    ${outlinedText('AI preview - not the finished product', {
      x: padding,
      y: footerHeight - padding,
      size: disclaimerSize,
      fill: '#6b7b74'
    }).svg}
  </svg>`);
  
  const footer = await sharp(label).composite([
    { input: logo, left: padding, top: padding },
    { input: qr, left: width - padding - qrSize, top: padding },
  ]).png().toBuffer();
  
  const canvas = await sharp({
    create: {
      width,
      height: height + footerHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })
    .composite([
      { input: photo.data, left: 0, top: 0 },
      { input: footer, left: 0, top: height }
    ])
    .webp({ quality: 91, effort: 4 })
    .toBuffer();
  
  return canvas;
}
