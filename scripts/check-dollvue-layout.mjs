import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const base=process.env.DOLLVUE_UI_CHECK_URL;
if(!base)throw new Error('Set DOLLVUE_UI_CHECK_URL to the isolated UI fixture, never a customer session.');
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH} : {})});
try {
  for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:700}]){
    const context=await browser.newContext({viewport});
    const page=await context.newPage();
    let requests=0;
    await page.route('**/dollvue/generate',async route=>{
      requests++;
      await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Test response; no image generated.'})});
    });
    await page.goto(base);
    await page.getByRole('button',{name:'Choose this photo'}).click();
    await page.getByRole('button',{name:'Choice 1 A',exact:true}).click();
    const button=page.getByRole('button',{name:'Create my preview',exact:true});
    assert.equal(await button.getAttribute('aria-disabled'),'true');
    // aria-disabled intentionally permits activation solely to explain the missing agreement.
    await button.scrollIntoViewIfNeeded();
    const target=await button.boundingBox();
    await page.mouse.click(target.x+target.width/2,target.y+target.height/2);
    await page.getByRole('alert').filter({hasText:'Please tick'}).waitFor();
    assert.equal(requests,0);
    const checkbox=page.getByRole('checkbox');
    assert.equal(await checkbox.evaluate(el=>el===document.activeElement),true);
    const box=await checkbox.boundingBox(),cta=await button.boundingBox();
    assert.ok(box.y>=cta.y+cta.height,'Agreement must be below the button');
    await checkbox.check();
    assert.equal(await button.getAttribute('aria-disabled'),'false');
    assert.equal(await page.getByRole('alert').filter({hasText:'Please tick'}).count(),0);
    await button.click();
    await page.getByText('Test response; no image generated.').waitFor();
    assert.equal(requests,1);
    await page.getByRole('button',{name:'Choice 2 A',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:/Choice 3 A/}).isDisabled(),true);
    await page.getByRole('button',{name:'Choice 1 A',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Choice 3 A',exact:true}).isEnabled(),true);
    const metrics=await page.evaluate(()=>{
      const area=document.querySelector('.dollvue-scroll-area');
      return {overflow:getComputedStyle(area).overflowY,overscroll:getComputedStyle(area).overscrollBehaviorY,
        actionPosition:getComputedStyle(document.querySelector('.dollvue-actionbar')).position,
        introPosition:getComputedStyle(document.querySelector('.dollvue-option-intro')).position,
        horizontal:document.documentElement.scrollWidth>innerWidth};
    });
    assert.equal(metrics.overflow,'visible');
    assert.equal(metrics.overscroll,'auto');
    assert.equal(metrics.actionPosition,'static');
    assert.equal(metrics.introPosition,'static');
    assert.equal(metrics.horizontal,false);
    await page.locator('.dollvue-option-intro').scrollIntoViewIfNeeded();
    const before=await page.evaluate(()=>scrollY);
    await page.locator('.dollvue-option-row').first().hover();
    await page.mouse.wheel(0,500);
    await page.waitForTimeout(350);
    assert.ok(await page.evaluate(()=>scrollY)>before,'Wheel over options must scroll the page');
    await button.scrollIntoViewIfNeeded();
    await page.screenshot({path:`/tmp/dollvue-controls-${viewport.width}.png`,fullPage:false});
    await page.emulateMedia({reducedMotion:'reduce'});
    await checkbox.uncheck();
    await button.evaluate(el=>el.click());
    const animation=await checkbox.evaluate(el=>getComputedStyle(el.closest('label').parentElement).animationName);
    assert.equal(animation,'none');
    await checkbox.press('Space');
    await button.focus();
    await button.press('Enter');
    await page.waitForTimeout(100);
    assert.equal(requests,2);
    console.log(JSON.stringify({viewport,requests,metrics,result:'PASS'}));
    await context.close();
  }
} finally {await browser.close();}
