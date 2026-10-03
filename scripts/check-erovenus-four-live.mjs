import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const plan=JSON.parse(await fs.readFile('/Volumes/Extreme Pro/Projects/DollWOW/data/exports/erovenus-unread-2026-10-03/plan.json'));
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'});
const results=[];
try{
 for(const d of plan)for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(`https://dollwow.com/products/${d.handle}`,{waitUntil:'domcontentloaded',timeout:120000});
  assert.equal(response.status(),200);
  const decline=page.getByRole('button',{name:'Decline',exact:true});if(await decline.isVisible())await decline.click();
  const editorial=page.getByTestId('pdp-editorial-magazine');await editorial.scrollIntoViewIfNeeded();
  await editorial.locator('img').evaluate(i=>i.decode());
  assert((await editorial.innerText()).includes(d.heading));
  assert((await page.title()).toLowerCase().includes(d.name));
  assert((await page.locator('h1').innerText()).includes('Torso'));
  assert.equal(await page.getByText('Choose your setup',{exact:true}).count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  assert.deepEqual(errors,[]);
  await editorial.screenshot({path:`/tmp/${d.name}-editorial-${width}.png`});
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(1000);
  await page.screenshot({path:`/tmp/${d.name}-pdp-${width}.png`});
  results.push({name:d.name,width,status:'PASS',editorial:true,noOverflow:true,noPresets:true});
  await page.close();
 }
 const carts=JSON.parse(await fs.readFile('/tmp/erovenus-four-live-carts.json'));
 const chosen=carts.find(c=>c.choice!=='Default');
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto(chosen.checkoutUrl,{waitUntil:'domcontentloaded',timeout:120000});
 await page.getByText(chosen.choice,{exact:false}).first().waitFor({timeout:90000});
 await page.screenshot({path:'/tmp/erovenus-four-checkout.png',fullPage:true});
 await fs.writeFile('/tmp/erovenus-four-browser.json',JSON.stringify({results,checkoutChoiceVisible:chosen.choice,noOrdersPlaced:true},null,2));
 console.log(JSON.stringify({status:'PASS',pages:results.length,checkoutChoiceVisible:chosen.choice}));
}finally{await browser.close();}
