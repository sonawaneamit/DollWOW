import {it,expect} from 'vitest';
import {dollVueAccessOrigin} from '@/lib/dollvue/accessOrigin';
it('uses only the exact configured preview deployment host for preview links',()=>{
 expect(dollVueAccessOrigin('https://preview.vercel.app/dollvue/access','https://dollwow.com','preview','preview.vercel.app')).toBe('https://preview.vercel.app');
 for(const url of ['https://evil.test/dollvue/access','http://preview.vercel.app/dollvue/access','https://preview.vercel.app.evil.test/dollvue/access'])expect(dollVueAccessOrigin(url,'https://dollwow.com','preview','preview.vercel.app')).toBe('https://dollwow.com');
 expect(dollVueAccessOrigin('https://preview.vercel.app/dollvue/access','https://dollwow.com','production','preview.vercel.app')).toBe('https://dollwow.com');
});
