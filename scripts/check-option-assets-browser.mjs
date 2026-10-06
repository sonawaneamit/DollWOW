import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.OPTION_AUDIT_BASE ?? 'http://localhost:3223';
const output = path.resolve('data/exports/hotlink-repair-2026-10-06/browser');
await fs.mkdir(output, {recursive:true});
const paths = process.argv.slice(2);
if (!paths.length) paths.push('/', '/products/sedoll-lita-b-163cm-c-cup-silicone-companion-doll-1fl7h', '/products/irontech-suki-glow-166cm-2-0-s20-ros-max-silicone-doll');
const browser = await chromium.launch({headless:true, ...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {})});
const results = [];
const supplierHost = /(?:rosemarydoll|yourdoll|myrobotdoll|avisplus|sedoll\.com|real-lady\.com|fanreal\.com|topfiredoll\.com|aibeigirls\.com|nitrocdn\.com|drive\.usercontent\.google\.com)/i;
try {
  for (const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
    const context = await browser.newContext({viewport});
    for (const pathname of paths) {
      const page = await context.newPage();
      const externalRequests = [], failedImages = [], errors = [];
      page.on('request', request => {
        if (request.resourceType() === 'image' && supplierHost.test(request.url())) externalRequests.push(request.url());
      });
      page.on('response', response => {
        if (response.request().resourceType() === 'image' && response.status() >= 400) failedImages.push({url:response.url(),status:response.status()});
      });
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(new URL(pathname, base).href, {waitUntil:'networkidle', timeout:120000});
      await page.waitForTimeout(1500);
      const manualLink = page.locator('a[aria-controls^="manual-options-"]');
      if (await manualLink.count()) await manualLink.first().click();
      const openedGroups = [];
      const triggers = page.locator('.product-builder-group__trigger');
      for (let i=0; i<await triggers.count(); i++) {
        const trigger = triggers.nth(i);
        const name = await trigger.innerText();
        if (!/skin|eye|head|nail|hair/i.test(name)) continue;
        await trigger.click();
        await page.waitForTimeout(250);
        const count = await page.locator('.product-builder-group.is-active img').count();
        openedGroups.push({name:name.replace(/\s+/g,' ').trim(),imageCount:count});
      }
      // Opening native disclosure controls exercises lazy option palettes without
      // changing customer selections, adding carts, or completing orders.
      await page.locator('details').evaluateAll(nodes => nodes.forEach(node => {node.open = true;}));
      const options = page.locator('[data-configuration-purchase]');
      if (await options.count()) await options.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(1500);
      const html = await response.text();
      const externalPayload = [...new Set((html.replaceAll('\\/', '/').match(/https?:\/\/[^\s"'<>`\\]+/g) ?? [])
        .filter(url => supplierHost.test(url) && /\.(png|jpe?g|webp|gif|avif)/i.test(url)))];
      const internalLeaks = ['responseHash','observedAt','releaseHolds','gmailMessageId'].filter(key=>html.includes(`\\"${key}\\"`) || html.includes(`"${key}"`));
      const brokenVisibleImages = await page.locator('img').evaluateAll(nodes => nodes.filter(node => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top < innerHeight && rect.bottom > 0 && node.complete && node.naturalWidth === 0;
      }).map(node=>node.getAttribute('src')));
      const id = `${pathname.replace(/[^a-z0-9]+/gi,'-') || 'home'}-${viewport.width}`;
      await page.screenshot({path:path.join(output,`${id}.png`)});
      results.push({pathname,viewport,status:response.status(),htmlBytes:Buffer.byteLength(html),openedGroups,externalRequests,externalPayload,internalLeaks,failedImages,brokenVisibleImages,errors});
      await page.close();
    }
    await context.close();
  }
} finally {await browser.close();}
await fs.writeFile(path.join(output,'results.json'), JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
if (results.some(row=>row.status !== 200 || row.externalRequests.length || row.externalPayload.length || row.internalLeaks.length || row.failedImages.length || row.brokenVisibleImages.length || row.errors.length)) process.exitCode=1;
