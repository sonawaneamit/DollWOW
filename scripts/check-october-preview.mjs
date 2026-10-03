import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin=process.argv[2]??'http://localhost:3231';
const active=process.env.PROMO_EXPECT_ACTIVE!=='0';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'});
const results=[];
try{for(const handle of ['real-lady-sienna-170cm-r15-silicone-doll','irontech-suki-glow-166cm-2-0-s20-ros-max-silicone-doll'])for(const width of [1440,390]){
 const p=await browser.newPage({viewport:{width,height:1000}});
 if(process.env.PREVIEW_COOKIE_JAR){
  const jar=await fs.readFile(process.env.PREVIEW_COOKIE_JAR,'utf8');
  const cookies=jar.split('\n').filter(l=>l&&!l.startsWith('#')||l.startsWith('#HttpOnly_')).map(l=>{
   const [domain,,path,secure,expires,name,value]=l.replace(/^#HttpOnly_/,'').split('\t');
   return {domain,path,secure:secure==='TRUE',expires:Number(expires)||-1,name,value,httpOnly:l.startsWith('#HttpOnly_')};
  });
  await p.context().addCookies(cookies);
 }
 const response=await p.goto(`${origin}/products/${handle}?promoClock=2026-10-15T12%3A00%3A00Z`,{waitUntil:'domcontentloaded',timeout:120000});
 assert.equal(response.status(),200);const panel=p.locator('[data-october-supplier-promotion]');
 if(!active){
  await p.locator('.product-builder').waitFor({timeout:90000});await p.waitForTimeout(2000);
  assert.equal(await panel.count(),0,'Future October offer must not be active in production');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  results.push({handle,width,status:'PASS',futureOfferHidden:true});await p.close();continue;
 }
 await panel.waitFor({timeout:90000});
 await panel.scrollIntoViewIfNeeded();await panel.locator('img').evaluate(i=>i.decode());
 const decline=p.getByRole('button',{name:'Decline',exact:true});if(await decline.isVisible())await decline.click();
 await p.waitForFunction(()=>{const b=document.querySelector('[data-october-supplier-promotion] button');return b&&Object.keys(b).some(k=>k.startsWith('__reactProps$')&&typeof b[k]?.onClick==='function')});
 await panel.getByRole('button').click();await p.waitForTimeout(300);
 assert.equal(await panel.getByRole('button').getAttribute('aria-expanded'),'true');
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
 const text=await panel.innerText();assert(text.includes('2026-11-'));
 await panel.screenshot({path:`/tmp/october-${handle.split('-').slice(0,2).join('-')}-${width}.png`});
 results.push({handle,width,text,status:'PASS'});await p.close();
}await fs.writeFile(`/tmp/october-${active?'preview':'production'}-browser.json`,JSON.stringify({origin,results},null,2));console.log(JSON.stringify({pages:results.length,status:'PASS'}));}finally{await browser.close()}
