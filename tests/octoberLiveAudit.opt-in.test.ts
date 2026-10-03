import {test,expect,vi} from 'vitest';
import {readFile,writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {promotionPricingForSelections} from '@/lib/promotions/optionPricing';
import {octoberProductFacts,octoberSupportedBenefits} from '@/lib/promotions/october2026';
vi.mock('server-only',()=>({}));
test.skipIf(process.env.OCTOBER_AUDIT!=='1')('inspects live menus against scheduled October pricing',async()=>{
 Object.assign(process.env,parseEnv(await readFile('.env.local','utf8')));
 const {getProductByHandle}=await import('@/lib/shopify/storefront');
 const reports=[];
 for(const handle of ['real-lady-sienna-170cm-r15-silicone-doll','irontech-miyuki-148cm-d-cup-silicone-companion-doll-11bvn','irontech-suki-glow-166cm-2-0-s20-ros-max-silicone-doll','sedoll-lita-b-163cm-c-cup-silicone-companion-doll-1fl7h']){
 const p=await getProductByHandle(handle);expect(p).toBeTruthy();const config=getCustomizationConfig(p!);
 const now=new Date('2026-10-15T12:00:00Z');const priced=promotionPricingForSelections(p!,config,{},now);
 reports.push({handle,id:p!.id,variant:p!.variants[0].id,facts:octoberProductFacts(p!),benefits:octoberSupportedBenefits(p!,priced.context,now),groups:config.groups,priced:priced.config.groups});
 }
 await writeFile('/tmp/october-live-menu-audit.json',JSON.stringify(reports,null,2));
},180000);
