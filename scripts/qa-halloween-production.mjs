import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.HALLOWEEN_BASE || 'https://dollwow.com';
const out = 'data/exports/dol-217';
let agent;
try { agent = (await fs.readFile('/Users/amitsonawane/Desktop/agent-bypass-secret.txt', 'utf8')).trim(); } catch { /* Normal public access may be sufficient. */ }
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [1366, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    await context.route('**/*', route => {
      const request = route.request(); const url = new URL(request.url());
      if (/google-analytics|googletagmanager|chatra|clarity|\/_vercel\//i.test(request.url())) return route.abort();
      // The authorized origin header must never leak to Shopify or other hosts.
      return route.continue({ headers: { ...request.headers(), ...(agent && ['dollwow.com', 'www.dollwow.com'].includes(url.hostname) ? { 'x-dollwow-agent': agent } : {}) } });
    });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const response = await page.goto(`${base}/promo`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    await page.getByRole('heading', { name: 'Halloween Sex Doll Sale: $299 Off Full-Size Dolls' }).waitFor();
    assert((await page.locator('body').innerText()).includes('8 November 2026 at 23:59 Portugal time'));
    assert(!(await page.locator('body').innerText()).includes('Preview only'));
    assert(!(await page.locator('body').innerText()).includes('10% off Eligible Dolls!'));
    const consent = page.getByRole('dialog', { name: 'Privacy preferences' });
    if (await consent.count()) await consent.getByRole('button', { name: 'Decline', exact: true }).click();
    await page.screenshot({ path: `${out}/release-promo-${width}.png`, fullPage: true });
    assert(await page.locator('[data-halloween-art] img').evaluate(img => img.complete && img.naturalWidth > 0));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('button', { name: /Halloween offer/ }).click();
    const card = page.getByRole('dialog', { name: 'You caught the deal.' });
    await card.waitFor(); assert(!(await card.innerText()).includes('Preview only'));
    await page.keyboard.press('Escape');
    assert.equal(errors.length, 0, errors.join('\n'));
    results.push({ width, url: `${base}/promo`, status: 200, artworkLoaded: true, liveCopy: true, noOverflow: true, manualCard: true, errors });
    await context.close();
  }
  // Verify the actual Shopify-hosted checkout, without entering buyer data.
  const receipts = JSON.parse(await fs.readFile(`${out}/release-checkout-carts.json`, 'utf8'));
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const cart = receipts.find(r => r.name === 'custom').cart;
  await page.goto(cart.checkoutUrl, { waitUntil: 'domcontentloaded' });
  await page.getByText('HALLOWEEN299', { exact: false }).first().waitFor({ timeout: 30000 });
  const text = await page.locator('body').innerText();
  assert(/299\.00/.test(text), 'Actual checkout must show the $299 reduction');
  assert(!/10% off/i.test(text), 'Old automatic offer must not appear');
  await page.screenshot({ path: `${out}/release-shopify-checkout.png`, fullPage: true });
  results.push({ name: 'actual Shopify checkout', host: new URL(page.url()).hostname, codeVisible: true, amountVisible: true, old10Absent: true, noOrderOrBuyerData: true });
  await context.close();
  await fs.writeFile(`${out}/release-hosted-qa.json`, JSON.stringify({ at: new Date().toISOString(), base, passed: true, results }, null, 2));
  console.log(JSON.stringify(results));
} finally { await browser.close(); }
