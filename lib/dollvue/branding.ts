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
  const optionText = selections.map(item => `${item.group}: ${item.option}`).join('; ');
  const lines = wrapFooterText(optionText ? `This doll was reimagined with ${optionText}.` : 'This doll was reimagined with your selected appearance choices.');
  const photo = await sharp(bytes, { limitInputPixels: 25_000_000, failOn: 'warning' })
    .rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .png().toBuffer({ resolveWithObject: true });
  if (photo.info.width < 400) throw new Error('Preview is too small for readable branding');
  const width = photo.info.width;
  const scale = width / 800;
  const footerHeight = Math.round((262 + lines.length * 24) * scale);
  const inset = Math.round(24 * scale);
  const qrSize = Math.round(174 * scale);
  const logoBytes = await readFile(path.join(process.cwd(), 'public/images/brand/dollwow-black-gold-lockup.png'));
  const logo = await sharp(logoBytes)
    .resize({ width: Math.round(260 * scale) }).png().toBuffer();
  const qr = await QRCode.toBuffer(destination, {
    type: 'png', width: qrSize, margin: 4, errorCorrectionLevel: 'M',
    color: { dark: '#101818', light: '#ffffff' },
  });
  const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${footerHeight}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <path d="M0 1H${width}" stroke="#d3ad63" stroke-width="2"/>
    ${lines.map((line,index)=>outlinedText(line,{x:inset,y:Math.round((142+index*24)*scale),size:Math.round(18*scale),fill:'#17251f'}).svg).join('')}
    ${outlinedText('Created with DollVue',{x:inset,y:Math.round((166+lines.length*24)*scale),size:Math.round(29*scale),fill:'#17251f'}).svg}
    ${outlinedText('Powered by DollWOW.com',{x:inset,y:Math.round((198+lines.length*24)*scale),size:Math.round(20*scale),fill:'#17251f'}).svg}
    ${outlinedText('AI visual preview - not the finished product',{x:inset,y:Math.round((232+lines.length*24)*scale),size:Math.round(16*scale),fill:'#4d6258'}).svg}
    ${outlinedText('Scan to view this doll',{x:width-inset-qrSize/2,y:Math.round(222*scale),size:Math.round(15*scale),fill:'#17251f',anchor:'middle'}).svg}
  </svg>`);
  const footer = await sharp(label).composite([
    { input: logo, left: inset, top: Math.round(16 * scale) },
    { input: qr, left: width - inset - qrSize, top: inset },
  ]).png().toBuffer();
  return sharp({ create: { width, height: photo.info.height + footerHeight, channels: 3, background: '#101818' } })
    .composite([{ input: photo.data, left: 0, top: 0 }, { input: footer, left: 0, top: photo.info.height }])
    .webp({ quality: 91, effort: 4 }).toBuffer();
}

function wrapFooterText(text: string) {
  const chunks = text.match(/.{1,44}(?:\s|$)|\S{1,44}/g) ?? [];
  return chunks.map(chunk => chunk.trim());
}
