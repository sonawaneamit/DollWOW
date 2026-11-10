import {beforeEach,expect,it,vi} from 'vitest';
import type {Product} from '@/types/product';
const state=vi.hoisted(()=>({public:vi.fn(),admin:vi.fn(),merge:vi.fn()}));
vi.mock('@/lib/shopify/storefront',()=>({getProductByHandle:state.public}));
vi.mock('@/lib/shopify/admin',()=>({getProductAdminMetafieldsByHandle:state.admin,mergeProductAdminMetafields:state.merge}));
import {getDollVueProductByHandle} from '@/lib/dollvue/product';
beforeEach(()=>{vi.clearAllMocks();});
it('cannot use Admin data to expose a hidden or missing public product',async()=>{
 state.public.mockResolvedValue(null);
 expect(await getDollVueProductByHandle('mmx-hidden',{strict:false})).toBeNull();
 expect(state.public).toHaveBeenCalledWith('mmx-hidden',{strict:true});expect(state.admin).not.toHaveBeenCalled();
});
it.each(['mmx-monica','fanreal-mirella'])('matches the public PDP enrichment for %s',async handle=>{
 const product={handle} as Product;const enriched={...product,extended:{bodyCode:'source-body'}};
 state.public.mockResolvedValue(product);state.admin.mockResolvedValue({bodyCode:'source-body'});state.merge.mockReturnValue(enriched);
 expect(await getDollVueProductByHandle(handle)).toBe(enriched);
 expect(state.admin).toHaveBeenCalledWith(handle);expect(state.merge).toHaveBeenCalledWith(product,{bodyCode:'source-body'});
});
it('fails closed when new-brand Admin identity cannot be loaded',async()=>{
 state.public.mockResolvedValue({handle:'fanreal-mirella'});state.admin.mockResolvedValue(null);
 expect(await getDollVueProductByHandle('fanreal-mirella')).toBeNull();expect(state.merge).not.toHaveBeenCalled();
});
it('preserves existing brand fingerprint representations',async()=>{
 const product={handle:'irontech-legacy'} as Product;state.public.mockResolvedValue(product);
 expect(await getDollVueProductByHandle(product.handle)).toBe(product);expect(state.admin).not.toHaveBeenCalled();
});
