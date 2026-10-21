import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.HALLOWEEN_BASE || 'http://localhost:3249';
const output = 'data/exports/dol-217';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch();
const records = [];
const block = route => /google-analytics|googletagmanager|chatra|clarity|\/_vercel\//i.test(route.request().url()) || !['GET', 'HEAD'].includes(route.request().method()) ? route.abort() : route.continue();
const poses = page => page.locator('.halloween-spider').evaluateAll(elements => elements.filter(el => getComputedStyle(el).visibility === 'visible').map(el => ({
  x: el.getBoundingClientRect().x, y: el.getBoundingClientRect().y,
  pointer: getComputedStyle(el).pointerEvents,
  leg: el.querySelector('[data-leg-part=thin]').getAttribute('d'),
  heading: el.querySelector('[data-spider-heading]').getAttribute('transform')
})));
async function waitForWalkers(page, count) {
  await page.waitForFunction(count => [...document.querySelectorAll('.halloween-spider')].filter(el => getComputedStyle(el).visibility === 'visible').length === count, count, { timeout: 20000 });
}
try {
  for (const viewport of process.env.HALLOWEEN_INTERACTIONS_ONLY ? [] : [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    for (const path of ['/promo', '/', '/shop/tpe', '/products/irontech-vivian-153cm-f-cup-silicone-head-companion-doll-qryli']) {
      const context = await browser.newContext({ viewport });
      await context.route('**/*', block);
      const page = await context.newPage();
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.getByRole('button', { name: 'Decline', exact: true }).click({ timeout: 1000 }).catch(() => {});
      const count = viewport.width < 1024 ? 4 : 6;
      await waitForWalkers(page, count);
      const before = await poses(page);
      assert.ok(before.every(pose => pose.pointer === 'none'));
      assert.ok(before.some(pose => pose.x > viewport.width * .3 && pose.x < viewport.width * .7), 'Spiders occupy the central page area');
      assert.equal(await page.locator('[data-halloween-spiders] button').count(), 0);
      await page.waitForTimeout(1100);
      const after = await poses(page);
      assert.notDeepEqual(before, after, 'Walkers move and articulate');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${path}: horizontal overflow`);
      const label = path === '/' ? 'home' : path === '/promo' ? 'promo' : path.startsWith('/shop') ? 'collection' : 'pdp';
      if (path === '/promo') {
        assert.equal(await page.locator('main h1').count(), 1);
        assert.match(await page.locator('main h1').innerText(), /Halloween Sex Doll Sale: \$299 Off Full-Size Dolls/);
        const bounds = await page.locator('.halloween-banner-art img').boundingBox();
        if (viewport.width >= 768) {
          assert.ok(bounds.y + bounds.height <= viewport.height, `Entire desktop image fits: ${JSON.stringify(bounds)}`);
          assert.ok(bounds.height <= viewport.height * .67);
        }
        assert.equal(await page.locator('.halloween-featured article').count(), 3);
        for (const id of ['how-it-works', 'full-size', 'campaign-dates', 'featured-dolls', 'halloween-faq']) assert.equal(await page.locator(`#${id}`).count(), 1);
        assert.match(await page.locator('#campaign-dates').innerText(), /To be confirmed/);
        assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://dollwow.com/promo');
        const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
        schema.forEach(json => JSON.parse(json));
        assert.ok(schema.every(json => !json.includes('"@type":"Offer"')), 'Do not advertise an active structured Offer');
        await page.screenshot({ path: `${output}/v4-${label}-${viewport.width}.png` });
        if (viewport.width === 390) await page.locator('#how-it-works').screenshot({ path: `${output}/v4-structure-mobile.png` });
      } else if ([1440, 390].includes(viewport.width)) await page.screenshot({ path: `${output}/v4-${label}-${viewport.width}.png` });
      await page.evaluate(() => scrollBy(0, 430));
      await page.waitForTimeout(250);
      const consent = page.getByRole('dialog', { name: 'Privacy preferences' });
      if (await consent.count()) {
        assert.equal((await poses(page)).length, 0);
        await consent.getByRole('button', { name: 'Decline', exact: true }).click();
      }
      await waitForWalkers(page, count);
      assert.deepEqual(errors, []);
      records.push({ ...viewport, path, count, moving: true, interior: true, clickThrough: true, noOverflow: true, errors });
      await context.close();
    }
  }
  if (records.length) await fs.writeFile(`${output}/v4-page-layout-qa.json`, JSON.stringify({ at: new Date().toISOString(), passed: true, records }, null, 2));
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-read', 'clipboard-write'] });
  await context.route('**/*', block);
  const page = await context.newPage(); await page.goto(base + '/promo'); await waitForWalkers(page, 4);
  const copy = page.getByRole('button', { name: 'Copy code', exact: true }).first();
  await copy.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const consent = page.getByRole('dialog', { name: 'Privacy preferences' });
  if (await consent.count()) await consent.getByRole('button', { name: 'Decline', exact: true }).click();
  await waitForWalkers(page, 4);
  // Force a spider directly over a real copy button, then verify browser hit testing and a physical click.
  const button = await copy.boundingBox();
  await page.locator('.halloween-spider').first().evaluate((el, rect) => el.style.setProperty('transform', `translate3d(${rect.x}px,${rect.y}px,0)`, 'important'), button);
  const hit = await page.evaluate(rect => document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest('button')?.textContent, button);
  assert.match(hit, /Copy code/);
  await page.mouse.click(button.x + button.width / 2, button.y + button.height / 2);
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'HALLOWEEN299');
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(500);
  if (await consent.count()) await consent.getByRole('button', { name: 'Decline', exact: true }).click();
  await waitForWalkers(page, 4);
  await page.getByRole('button', { name: 'Show Halloween offer', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'You caught the deal.' }); await dialog.waitFor();
  assert.equal(await page.locator('.halloween-spider').count(), 0);
  await page.screenshot({ path: `${output}/v4-card-mobile.png` });
  await page.keyboard.press('Escape'); assert.equal(await dialog.count(), 0);
  await page.reload(); await page.waitForTimeout(2000); assert.equal(await page.locator('.halloween-spider').count(), 0);
  await page.evaluate(() => localStorage.removeItem('dollwow:halloween-2026:hidden')); await page.reload(); await waitForWalkers(page, 4);
  assert.equal(await page.getByRole('button', { name: 'Hide spiders', exact: true }).count(), 0);
  await page.keyboard.press('Escape'); await page.reload(); await page.waitForTimeout(2000); assert.equal(await page.locator('.halloween-spider').count(), 0);
  for (const path of ['/cart', '/account/access', '/support']) {
    await page.evaluate(() => localStorage.removeItem('dollwow:halloween-2026:hidden')); await page.goto(base + path); await page.waitForTimeout(1800); assert.equal(await page.locator('.halloween-spider').count(), 0);
  }
  await context.close();
  const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); await reduced.route('**/*', block);
  const rp = await reduced.newPage(); await rp.goto(base + '/promo'); await waitForWalkers(rp, 4);
  const before = await poses(rp); await rp.waitForTimeout(1300); assert.deepEqual(await poses(rp), before); await reduced.close();
  const nojs = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false }); await nojs.route('**/*', block);
  const np = await nojs.newPage(); await np.goto(base + '/promo'); assert.match(await np.locator('h1').innerText(), /Halloween Sex Doll Sale/); assert.equal(await np.locator('#halloween-faq details').count(), 6); assert.match(await np.locator('#how-it-works').innerText(), /HALLOWEEN299/); await nojs.close();
  await fs.writeFile(`${output}/v4-roaming-qa.json`, JSON.stringify({ at: new Date().toISOString(), base, passed: true, records, forcedOverlayClick: true, reveal: true, dismissal: true, reducedMotion: true, noJs: true, activation: false }, null, 2));
  console.log(JSON.stringify({ passed: true, cases: records.length, output }));
} finally { await browser.close(); }
