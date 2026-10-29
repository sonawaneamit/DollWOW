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
  
  // Two-column layout: left column for text, right column for QR
  const padding = Math.max(24, Math.round(width * 0.024)); // 2.4% padding
  const columnGap = Math.max(20, Math.round(width * 0.02)); // 2% gap between columns
  
  // QR: 26% of image width, minimum 150px for reliable long-URL decoding
  // At narrow widths (400px), this gives 150px QR (37.5% of width)
  // At typical widths (1067px), this gives 277px QR (26% of width)
  const qrSize = Math.max(150, Math.round(width * 0.26));
  
  // Right column: QR + caption
  const rightColumnWidth = qrSize + padding * 2;
  
  // Left column: logo + text lines
  const leftColumnWidth = width - rightColumnWidth - columnGap;
  
  // Text sizing for mobile legibility: at 390px mobile width, text should be ~14px
  const mobileScale = 390 / width;
  const titleSize = Math.max(40, Math.round(width * 0.038)); // ~40-60px
  const bodySize = Math.max(28, Math.round(width * 0.028)); // ~28-45px  
  const captionSize = Math.max(24, Math.round(width * 0.024)); // ~24-38px
  const disclaimerSize = Math.max(20, Math.round(width * 0.020)); // ~20-32px
  
  // Vertical spacing
  const lineSpacing = Math.round(bodySize * 0.4);
  const sectionSpacing = Math.round(bodySize * 0.8);
  
  // Load and resize logo to fit left column
  const logoBytes = await readFile(path.join(process.cwd(), 'public/images/brand/dollwow-black-gold-lockup.png'));
  const logoWidth = Math.min(Math.round(leftColumnWidth * 0.85), Math.round(width * 0.35));
  const logo = await sharp(logoBytes).resize({ width: logoWidth }).png().toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const logoHeight = logoMeta.height ?? 0;
  
  // Optional selection text
  const selectionLines: string[] = [];
  if (selections.length > 0) {
    const optionText = selections.map(item => `${item.group}: ${item.option}`).join(', ');
    const wrappedText = `Reimagined with ${optionText}`;
    // Simple word wrap for left column - approximate width check
    const words = wrappedText.split(' ');
    let currentLine = '';
    const avgCharWidth = bodySize * 0.5; // Approximate character width
    const maxCharsPerLine = Math.floor((leftColumnWidth - padding * 2) / avgCharWidth);
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length > maxCharsPerLine && currentLine) {
        selectionLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) selectionLines.push(currentLine);
  }
  
  // Calculate footer height
  let yPos = padding + logoHeight;
  yPos += sectionSpacing + titleSize; // "Created with DollVue"
  yPos += lineSpacing + bodySize; // "Powered by DollWOW.com"
  if (selectionLines.length > 0) {
    yPos += lineSpacing + bodySize * selectionLines.length;
  }
  yPos += sectionSpacing + disclaimerSize; // AI disclaimer
  yPos += padding;
  
  // Ensure footer is tall enough for QR + caption
  const qrColumnHeight = padding + qrSize + lineSpacing + captionSize + padding;
  const footerHeight = Math.max(yPos, qrColumnHeight);
  
  // Generate QR code
  const qr = await QRCode.toBuffer(destination, {
    type: 'png',
    width: qrSize,
    margin: Math.max(4, Math.round(qrSize * 0.1)),
    errorCorrectionLevel: 'H',
    color: { dark: '#101818', light: '#ffffff' },
  });
  
  // Build footer SVG with two-column layout
  yPos = padding + logoHeight;
  const textLines: string[] = [];
  
  // Left column text
  yPos += sectionSpacing;
  textLines.push(outlinedText('Created with DollVue', {
    x: padding,
    y: yPos,
    size: titleSize,
    fill: '#17251f'
  }).svg);
  
  yPos += lineSpacing + titleSize;
  textLines.push(outlinedText('Powered by DollWOW.com', {
    x: padding,
    y: yPos,
    size: bodySize,
    fill: '#17251f'
  }).svg);
  
  // Selection lines
  if (selectionLines.length > 0) {
    yPos += lineSpacing + bodySize;
    for (const line of selectionLines) {
      textLines.push(outlinedText(line, {
        x: padding,
        y: yPos,
        size: bodySize,
        fill: '#465b54'
      }).svg);
      yPos += bodySize + lineSpacing;
    }
  }
  
  // Disclaimer at bottom of left column
  textLines.push(outlinedText('AI preview - not the finished product', {
    x: padding,
    y: footerHeight - padding - disclaimerSize,
    size: disclaimerSize,
    fill: '#6b7b74'
  }).svg);
  
  // Right column: QR caption centered below QR
  const qrCenterX = width - padding - qrSize / 2;
  const qrCaptionY = padding + qrSize + lineSpacing + captionSize;
  textLines.push(outlinedText('Scan to view this doll', {
    x: qrCenterX,
    y: qrCaptionY,
    size: captionSize,
    fill: '#17251f',
    anchor: 'middle'
  }).svg);
  
  const footerSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${footerHeight}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <path d="M0 1H${width}" stroke="#d3ad63" stroke-width="2"/>
    ${textLines.join('\n')}
  </svg>`);
  
  const footer = await sharp(footerSvg).composite([
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
