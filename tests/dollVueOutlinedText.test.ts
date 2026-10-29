import {expect,it} from 'vitest';
import sharp from 'sharp';
import {outlinedText,dollVueWatermark} from '@/lib/dollvue/outlinedText';

it('uses deterministic glyph paths, never system-font SVG text',()=>{
  const a=outlinedText('DOLLWOW.COM - DOLLVUE',{x:0,y:30,size:24,fill:'#17251f'});
  const b=outlinedText('DOLLWOW.COM - DOLLVUE',{x:0,y:30,size:24,fill:'#17251f'});
  expect(a).toEqual(b);expect(a.width).toBeGreaterThan(100);
  expect(a.svg).toContain('<path');expect(a.svg).not.toContain('<text');expect(a.svg).not.toContain('font-family');
});
it('rejects unsupported glyphs rather than rendering replacement squares',()=>{
  expect(()=>outlinedText('\u{1f680}',{x:0,y:30,size:24,fill:'#17251f'})).toThrow('unsupported glyph');
});
it('rasterizes an outlined watermark without requiring an installed system font',async()=>{
  const svg=dollVueWatermark(1600,2000);expect(svg.toString()).not.toContain('<text');
  const {data,info}=await sharp(svg).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  expect(info.width).toBeLessThan(1600);expect(info.height).toBeGreaterThan(30);
  const opaqueLightPixels=Array.from({length:info.width*info.height},(_,i)=>i*4)
    .filter(i=>data[i]>200&&data[i+1]>200&&data[i+2]>200&&data[i+3]>200).length;
  expect(opaqueLightPixels).toBeGreaterThan(100);
});
