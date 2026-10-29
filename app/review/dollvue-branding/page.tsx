import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import sharp from 'sharp';
import { brandDollVuePreview } from '@/lib/dollvue/branding';
import {outlinedText,dollVueWatermark} from '@/lib/dollvue/outlinedText';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'DollVue Branding Review', robots: { index: false, follow: false } };

async function createFixture(width: number, height: number, label: string) {
  return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="#e8efed"/>
    ${outlinedText('Synthetic QA image',{x:width/2,y:height/2-20,size:Math.round(width*0.032),fill:'#465b54',anchor:'middle'}).svg}
    ${outlinedText(label,{x:width/2,y:height/2+20,size:Math.round(width*0.022),fill:'#465b54',anchor:'middle'}).svg}
  </svg>`)).png().toBuffer();
}

export default async function DollVueBrandingReview() {
  if (process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') notFound();
  
  // Test fixtures at multiple aspect ratios per Martin's requirements (Oct 29, 2026)
  const portrait = await brandDollVuePreview(
    await createFixture(1067, 1600, '1067×1600 portrait'),
    'test-doll-160cm',
    [{ group: 'Skin tone', option: 'Tan' }]
  );
  
  const landscape = await brandDollVuePreview(
    await createFixture(1600, 1067, '1600×1067 landscape'),
    'test-doll-160cm',
    []
  );
  
  const square = await brandDollVuePreview(
    await createFixture(1024, 1024, '1024×1024 square'),
    'test-doll-160cm',
    []
  );
  
  return <main style={{ maxWidth: 840, margin: '32px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
    <h1 style={{ fontSize: 28, marginBottom: 12, fontWeight: 600 }}>DollVue Mobile-Responsive Footer</h1>
    <p style={{ marginBottom: 32, color: '#666', lineHeight: 1.6 }}>
      Footer redesigned for mobile legibility (Oct 29, 2026): scaled typography (~14px effective at 360-400px width), 
      QR code at 26% of image width with proper quiet zone, clear hierarchy, generous padding. 
      QR decodes at 2&times; device pixel density (780px physical width, simulating modern mobile displays).
    </p>
    
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 600 }}>Portrait (1067×1600)</h2>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>Typical doll product photo orientation</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/webp;base64,${portrait.toString('base64')}`} 
           alt="Portrait orientation with mobile-readable footer" 
           style={{ display: 'block', width: '100%', maxWidth: 600, height: 'auto', border: '1px solid #ddd', borderRadius: 4 }} />
    </section>
    
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 600 }}>Landscape (1600×1067)</h2>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>Wider aspect ratio</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/webp;base64,${landscape.toString('base64')}`} 
           alt="Landscape orientation with mobile-readable footer" 
           style={{ display: 'block', width: '100%', maxWidth: 600, height: 'auto', border: '1px solid #ddd', borderRadius: 4 }} />
    </section>
    
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 600 }}>Square (1024×1024)</h2>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>Square aspect ratio</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/webp;base64,${square.toString('base64')}`} 
           alt="Square orientation with mobile-readable footer" 
           style={{ display: 'block', width: '100%', maxWidth: 600, height: 'auto', border: '1px solid #ddd', borderRadius: 4 }} />
    </section>
    
    <section>
      <h2 style={{fontSize:20,marginBottom: 16, fontWeight: 600}}>Watermark (in-progress overlay)</h2>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>Outlined font rendering without system font dependencies</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/png;base64,${(await sharp(dollVueWatermark(1600,2000)).png().toBuffer()).toString('base64')}`} 
           alt="Outlined DollWOW.com DollVue watermark" 
           style={{maxWidth:'100%',height:'auto', border: '1px solid #ddd', borderRadius: 4}}/>
    </section>
  </main>;
}
