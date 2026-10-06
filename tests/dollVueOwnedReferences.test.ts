import {describe,it,expect,vi} from 'vitest';
import sharp from 'sharp';
import {normalizeOwnedOptionReference} from '@/lib/dollvue/option-reference';

describe('DollVue owned option references',()=>{
  it('resolves local assets against the deployment and verifies actual image bytes',async()=>{
    const image=await sharp({create:{width:300,height:300,channels:3,background:'#fff'}}).png().toBuffer();
    const fetcher=vi.fn().mockResolvedValue(new Response(new Uint8Array(image),{headers:{'content-type':'image/png'}}));
    expect(await normalizeOwnedOptionReference('/option-assets/test.png','https://dollwow.com',fetcher)).toMatch(/^data:image\/webp;base64,/);
    expect(fetcher.mock.calls[0][0]).toBe('https://dollwow.com/option-assets/test.png');
  });
  it('never forwards external images, challenge HTML or failed URLs to generation',async()=>{
    const fetcher=vi.fn().mockResolvedValue(new Response('challenge',{headers:{'content-type':'text/html'}}));
    expect(await normalizeOwnedOptionReference('https://supplier.invalid/image.jpg','https://dollwow.com',fetcher)).toBe('');
    expect(fetcher).not.toHaveBeenCalled();
    expect(await normalizeOwnedOptionReference('/option-assets/test.png','https://dollwow.com',fetcher)).toBe('');
  });
});
