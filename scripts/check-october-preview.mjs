import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin=process.argv[2]??'http://localhost:3231';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'});
const results=[];
try{for(const handle of ['real-lady-sienna-170cm-r15-silicone-doll','irontech-suki-glow-166cm-2-0-s20-ros-max-silicone-doll'])for(const width of [1440,390]){
 const p=await browser.newPage({viewport:{width,height:1000}});
 const response=await p.goto(`${origin}/products/${handle}?promoClock=2026-10-15T12%3A00%3A00Z`,{waitUntil:'domcontentloaded',timeout:120000});
 assert.equal(response.status(),200);const panel=p.locator('[data-october-supplier-promotion]');await panel.waitFor({timeout:90000});
 await panel.scrollIntoViewIfNeeded();await panel.locator('img').evaluate(i=>i.decode());
 const decline=p.getByRole('button',{name:'Decline',exact:true});if(await decline.isVisible())await decline.click();
 await p.waitForFunction(()=>{const b=document.querySelector('[data-october-supplier-promotion] button');return b&&Object.keys(b).some(k=>k.startsWith('__reactProps$')&&typeof b[k]?.onClick==='function')});
 await panel.getByRole('button').click();await p.waitForTimeout(300);
 assert.equal(await panel.getByRole('button').getAttribute('aria-expanded'),'true');
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
 const text=await panel.innerText();assert(text.includes('2026-11-'));
 await panel.screenshot({path:`/tmp/october-${handle.split('-').slice(0,2).join('-')}-${width}.png`});
 results.push({handle,width,text,status:'PASS'});await p.close();
}await fs.writeFile('/tmp/october-preview-browser.json',JSON.stringify(results,null,2));console.log(JSON.stringify({pages:results.length,status:'PASS'}));}finally{await browser.close()}
