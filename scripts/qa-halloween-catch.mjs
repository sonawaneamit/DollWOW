import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.HALLOWEEN_BASE || 'http://localhost:3249';
const out = 'data/exports/dol-217';
const hidden = 'dollwow:halloween-2026:hidden', deadline = 'dollwow:halloween-2026:fallback-at';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
const block = r => /google-analytics|googletagmanager|chatra|clarity|\/_vercel\//i.test(r.request().url()) || !['GET', 'HEAD'].includes(r.request().method()) ? r.abort() : r.continue();
const card = p => p.getByRole('dialog', { name: 'You caught the deal.' });
async function context(options = {}) { const c = await browser.newContext(options); await c.route('**/*', block); return c; }
async function walkers(p, count = 4) { await p.waitForFunction(n => [...document.querySelectorAll('.halloween-spider')].filter(el => getComputedStyle(el).visibility === 'visible').length === n, count); }
async function clearConsent(p) { const c = p.getByRole('dialog', { name: 'Privacy preferences' }); if (await c.count()) await c.getByRole('button', { name: 'Decline', exact: true }).click(); }
try {
  for (const width of [1366, 390]) {
    const c = await context({ viewport: { width, height: 844 }, permissions: ['clipboard-read', 'clipboard-write'], ...(width === 390 ? { recordVideo: { dir: `${out}/catch-video`, size: { width: 390, height: 844 } } } : {}) });
    const p = await c.newPage(); const errors = []; p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/promo'); await walkers(p, width < 1024 ? 4 : 6);
    assert.equal(await p.getByRole('button', { name: 'Hide spiders', exact: true }).count(), 0);
    const target = await p.locator('.halloween-spider').evaluateAll(els => els.map((el, index) => {
      const b = el.querySelector('ellipse').getBoundingClientRect(); const x = b.x + b.width / 2, y = b.y + b.height / 2;
      const under = document.elementFromPoint(x, y);
      return { index, x, y, safe: getComputedStyle(el).visibility === 'visible' && !under?.closest('a,button,input,summary,label,[role=button],[tabindex]:not([tabindex="-1"])'), transform: el.style.transform };
    }).find(e => e.safe));
    assert.ok(target, 'A visible body over ordinary page content is tappable');
    await p.mouse.click(target.x, target.y);
    await p.waitForFunction(i => !!document.querySelectorAll('.halloween-spider')[i]?.dataset.scurry, target.index);
    await p.waitForTimeout(130);
    const scurry = await p.locator('.halloween-spider').nth(target.index).evaluate(el => ({ transform: el.style.transform, opacity: Number(el.style.opacity) }));
    assert.notEqual(scurry.transform, target.transform); assert.ok(scurry.opacity < 1);
    await card(p).waitFor(); assert.equal(await p.locator('.halloween-spider').count(), 0);
    await p.screenshot({ path: `${out}/v5-card-${width}.png` });
    await card(p).getByRole('button', { name: 'Copy code', exact: true }).click();
    assert.equal(await p.evaluate(() => navigator.clipboard.readText()), 'HALLOWEEN299');
    await card(p).getByRole('link', { name: 'Offer details' }).focus(); await p.keyboard.press('Tab');
    assert.equal(await card(p).getByRole('button', { name: 'Close Halloween offer' }).evaluate(el => el === document.activeElement), true);
    await p.keyboard.press('Escape'); assert.equal(await card(p).count(), 0);
    assert.equal(await p.evaluate(k => localStorage.getItem(k), hidden), '1');
    await p.reload(); await p.waitForTimeout(2000); assert.equal(await p.locator('.halloween-spider').count(), 0); assert.equal(await card(p).count(), 0);
    assert.deepEqual(errors, []); results.push({ name: 'body tap, scurry, card, copy, focus trap, persistence', width, passed: true });
    const video = width === 390 ? p.video() : null; await c.close(); if (video) await video.saveAs(`${out}/v5-catch-mobile.webm`);
  }

  // A body directly over a real shopping control must never steal its click.
  {
    const c = await context({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-read', 'clipboard-write'] }); const p = await c.newPage();
    await p.goto(base + '/promo'); await walkers(p);
    const copy = p.getByRole('button', { name: 'Copy code', exact: true }).first(); await copy.scrollIntoViewIfNeeded(); await p.waitForTimeout(500); await clearConsent(p); await walkers(p);
    const b = await copy.boundingBox();
    await p.locator('.halloween-spider').first().evaluate((el, b) => el.style.setProperty('transform', `translate3d(${b.x}px,${b.y}px,0)`, 'important'), b);
    await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    assert.equal(await p.evaluate(() => navigator.clipboard.readText()), 'HALLOWEEN299'); assert.equal(await card(p).count(), 0);
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200); await p.keyboard.press('Escape');
    await p.reload(); await p.waitForTimeout(2000); assert.equal(await p.locator('.halloween-spider').count(), 0); assert.equal(await card(p).count(), 0);
    results.push({ name: 'underlying real copy button wins; Escape retires walkers', passed: true }); await c.close();
  }

  // Use real time once, with no accelerated timer or pre-seeded deadline.
  {
    const c = await context({ viewport: { width: 390, height: 844 } }); const p = await c.newPage();
    await p.goto(base + '/promo'); await walkers(p);
    const until = await p.evaluate(k => Number(localStorage.getItem(k)), deadline);
    await p.waitForTimeout(Math.max(0, until - Date.now() - 1500)); assert.equal(await card(p).count(), 0);
    await card(p).waitFor({ timeout: 6000 }); const lateByMs = Date.now() - until; assert.ok(lateByMs >= -100 && lateByMs < 4000);
    await p.keyboard.press('Escape'); await p.goto(base + '/shop/tpe'); await p.waitForTimeout(2200);
    assert.equal(await card(p).count(), 0); assert.equal(await p.locator('.halloween-spider').count(), 0);
    const p2 = await c.newPage(); await p2.goto(base + '/promo'); await p2.waitForTimeout(2000); assert.equal(await card(p2).count(), 0);
    results.push({ name: 'actual 30-second fallback; no repeat on navigation or second tab', lateByMs, passed: true }); await c.close();
  }

  // Move an existing deadline near the present, then verify reload/route changes
  // retain it and modal/checkout activity defers rather than interrupts it.
  for (const path of ['/cart', '/account/access', '/support']) {
    const c = await context({ viewport: { width: 390, height: 844 } });
    await c.addInitScript(({ deadline }) => localStorage.setItem(deadline, String(Date.now() - 1000)), { deadline });
    const p = await c.newPage(); await p.goto(base + path); await p.waitForTimeout(2100);
    assert.equal(await card(p).count(), 0); assert.equal(await p.locator('.halloween-spider').count(), 0);
    results.push({ name: `overdue fallback excluded from ${path}`, passed: true }); await c.close();
  }
  {
    const c = await context({ viewport: { width: 390, height: 844 } }); const p = await c.newPage(); await p.goto(base + '/promo'); await walkers(p);
    const until = Date.now() + 2500; await p.evaluate(({ deadline, until }) => localStorage.setItem(deadline, String(until)), { deadline, until });
    await p.reload(); await walkers(p); assert.equal(await p.evaluate(k => Number(localStorage.getItem(k)), deadline), until);
    await p.getByRole('button', { name: 'Open menu', exact: true }).click(); await p.waitForTimeout(2800); assert.equal(await card(p).count(), 0);
    await p.getByRole('button', { name: 'Close menu', exact: true }).click(); await card(p).waitFor();
    results.push({ name: 'deadline survives reload; menu defers overdue fallback', passed: true }); await c.close();
  }
  {
    const c = await context({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); const p = await c.newPage(); await p.goto(base + '/promo'); await walkers(p);
    const before = await p.locator('.halloween-spider').evaluateAll(els => els.map(el => el.style.transform)); await p.waitForTimeout(800);
    assert.deepEqual(await p.locator('.halloween-spider').evaluateAll(els => els.map(el => el.style.transform)), before);
    const target = await p.locator('.halloween-spider').first().locator('ellipse').first().boundingBox();
    await p.mouse.click(target.x + target.width / 2, target.y + target.height / 2); await card(p).waitFor(); assert.equal(await p.locator('[data-scurry]').count(), 0);
    results.push({ name: 'static reduced motion and immediate non-animated reveal', passed: true }); await c.close();
  }
  await fs.writeFile(`${out}/v5-catch-qa.json`, JSON.stringify({ at: new Date().toISOString(), base, passed: true, results, productionActivated: false }, null, 2));
  console.log(JSON.stringify({ passed: true, results }));
} finally { await browser.close(); }
