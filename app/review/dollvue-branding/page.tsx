import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import sharp from 'sharp';
import {Download} from 'lucide-react';
import {brandingReviewFixture} from '@/lib/dollvue/brandingReviewFixture';
import {dollVueWatermark} from '@/lib/dollvue/outlinedText';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'DollVue Branding Review', robots: { index: false, follow: false } };

export default async function DollVueBrandingReview() {
  if (process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') notFound();
  const {preview:branded}=await brandingReviewFixture();
  const dataUrl=`data:image/webp;base64,${branded.toString('base64')}`;
  return <main style={{ maxWidth: 840, margin: '32px auto', padding: '0 20px' }}>
    <h1 style={{ fontSize: 24, marginBottom: 20 }}>DollVue Branding Review</h1>
    <p style={{marginBottom:16}}>Preview-only synthetic QA sample. Production generation is unchanged.</p>
    {/* The synthetic fixture exercises the real export code without a paid generation. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={dataUrl} alt="Synthetic preview with selected options, white DollWOW footer and public product QR" width={800} style={{ display: 'block', width: '100%', height: 'auto' }} />
    <a href={dataUrl} download="dollwow-dollvue-branded-preview.webp" style={{display:'inline-flex',alignItems:'center',gap:8,marginTop:16,padding:'10px 14px',background:'#17251f',color:'#fff',borderRadius:4}}>
      <Download size={18} aria-hidden="true"/>Download preview
    </a>
    <h2 style={{fontSize:20,margin:'24px 0 12px'}}>Existing watermark font repair</h2>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`data:image/png;base64,${(await sharp(dollVueWatermark(1600,2000)).png().toBuffer()).toString('base64')}`} alt="Outlined DollWOW.com DollVue watermark, no system fonts" style={{maxWidth:'100%',height:'auto'}}/>
  </main>;
}
