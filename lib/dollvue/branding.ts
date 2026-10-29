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
  
  // Target QR MODULE width (black squares): 24-26% of image width, min 240px at 1067px
  // The qrcode library adds quiet zone, so we need to account for that
  // QR quiet zone should be ~4 modules, so if modules are W wide, total is W + 8*moduleSize
  const targetQrModulesWidth = Math.max(240, Math.round(width * 0.25)); // 25% target
  
  // Generate larger QR to ensure we get enough module density
  // We'll measure and validate the actual QR bbox in tests
  const qrRenderSize = Math.round(targetQrModulesWidth * 1.35); // Add space for margins
  
  // Right column: QR + caption with proper spacing
  const rightColumnWidth = qrRenderSize + padding * 2;
  
  // Left column: logo + text lines (can wrap more if needed)
  const leftColumnWidth = width - rightColumnWidth - columnGap;
  
  // Text sizing for mobile legibility: at 390px mobile width, text should be ~14px
  const mobileScale = 390 / width;
  const titleSize = Math.max(36, Math.round(width * 0.034)); // Slightly smaller to fit
  const bodySize = Math.max(26, Math.round(width * 0.026)); // Slightly smaller
  const captionSize = Math.max(22, Math.round(width * 0.022)); // ~22-35px
  const disclaimerSize = Math.max(18, Math.round(width * 0.018)); // ~18-29px
  
  // Vertical spacing: at least 2% of height between elements
  const verticalGap = Math.max(Math.round(height * 0.02), Math.round(bodySize * 0.5));
  const lineSpacing = Math.round(bodySize * 0.3);
  const sectionSpacing = verticalGap;
  
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
  
  // Generate QR code with minimal margin (4 modules quiet zone per spec)
  const qr = await QRCode.toBuffer(destination, {
    type: 'png',
    width: qrRenderSize,
    margin: 4, // 4 modules quiet zone (QR code spec minimum)
    errorCorrectionLevel: 'H',
    color: { dark: '#101818', light: '#ffffff' },
  });
  
  // Measure actual QR size for positioning
  const qrMeta = await sharp(qr).metadata();
  const qrActualWidth = qrMeta.width ?? qrRenderSize;
  const qrActualHeight = qrMeta.height ?? qrRenderSize;
  
  // Calculate footer height
  let yPos = padding + logoHeight;
  yPos += verticalGap; // Gap after logo
  yPos += titleSize; // "Created with DollVue"
  yPos += verticalGap; // Gap after title
  yPos += bodySize; // "Powered by DollWOW.com"
  if (selectionLines.length > 0) {
    yPos += lineSpacing;
    yPos += bodySize * selectionLines.length + lineSpacing * (selectionLines.length - 1);
  }
  yPos += sectionSpacing; // Gap before disclaimer
  yPos += disclaimerSize; // AI disclaimer
  yPos += padding;
  
  // Ensure footer is tall enough for QR + caption with proper spacing
  const qrCaptionGap = Math.max(12, Math.round(height * 0.01)); // Small gap under QR
  const qrColumnHeight = padding + qrActualHeight + qrCaptionGap + captionSize + padding;
  const footerHeight = Math.max(yPos, qrColumnHeight);
  
  // Build footer SVG with two-column layout
  yPos = padding + logoHeight;
  const textLines: string[] = [];
  
  // Left column text with proper vertical gaps
  yPos += verticalGap;
  textLines.push(outlinedText('Created with DollVue', {
    x: padding,
    y: yPos,
    size: titleSize,
    fill: '#17251f'
  }).svg);
  
  yPos += verticalGap;
  textLines.push(outlinedText('Powered by DollWOW.com', {
    x: padding,
    y: yPos + titleSize,
    size: bodySize,
    fill: '#17251f'
  }).svg);
  
  // Selection lines
  if (selectionLines.length > 0) {
    yPos += titleSize + lineSpacing;
    for (const line of selectionLines) {
      textLines.push(outlinedText(line, {
        x: padding,
        y: yPos + bodySize,
        size: bodySize,
        fill: '#465b54'
      }).svg);
      yPos += bodySize + lineSpacing;
    }
  }
  
  // Disclaimer at bottom of left column
  textLines.push(outlinedText('AI preview - not the finished product', {
    x: padding,
    y: footerHeight - padding,
    size: disclaimerSize,
    fill: '#6b7b74'
  }).svg);
  
  // Right column: QR caption centered directly below QR with small gap
  const qrCenterX = width - padding - qrActualWidth / 2;
  const qrCaptionY = padding + qrActualHeight + qrCaptionGap + captionSize;
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
    { input: qr, left: width - padding - qrActualWidth, top: padding },
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
