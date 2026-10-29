import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import sharp from 'sharp';
import { brandDollVuePreview } from '@/lib/dollvue/branding';
import {outlinedText,dollVueWatermark} from '@/lib/dollvue/outlinedText';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'DollVue Branding Review', robots: { index: false, follow: false } };

export default async function DollVueBrandingReview() {
  if (process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') notFound();
  const fixture = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <rect width="800" height="600" fill="#e8efed"/>
    ${outlinedText('Synthetic QA image',{x:400,y:290,size:26,fill:'#465b54',anchor:'middle'}).svg}
    ${outlinedText('No generation or customer photo',{x:400,y:328,size:18,fill:'#465b54',anchor:'middle'}).svg}
  </svg>`)).png().toBuffer();
  const branded = await brandDollVuePreview(fixture, 'top-fire-doll-grace-162cm-i-cup-silicone-companion-doll', [
    { group: 'Skin tone', option: 'Dark tan' }, { group: 'Hairstyle', option: '#2' },
  ]);
  return <main style={{ maxWidth: 840, margin: '32px auto', padding: '0 20px' }}>
    <h1 style={{ fontSize: 24, marginBottom: 20 }}>DollVue Branding Review</h1>
    {/* The synthetic fixture exercises the real export code without a paid generation. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`data:image/webp;base64,${branded.toString('base64')}`} alt="Synthetic preview with selected options, white DollWOW footer and public product QR" width={800} style={{ display: 'block', width: '100%', height: 'auto' }} />
    <h2 style={{fontSize:20,margin:'24px 0 12px'}}>Existing watermark font repair</h2>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`data:image/png;base64,${(await sharp(dollVueWatermark(1600,2000)).png().toBuffer()).toString('base64')}`} alt="Outlined DollWOW.com DollVue watermark, no system fonts" style={{maxWidth:'100%',height:'auto'}}/>
  </main>;
}
