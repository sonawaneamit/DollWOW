import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const host = process.argv[2] || "http://localhost:3013";
const output = "data/exports/dol-313-2026-10-29";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" });
const proof = [];
try {
  for (const width of [1319, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 950 } });
    const cartRequests = [];
    page.on("request", (r) => { if (/\/api\/cart/.test(r.url())) cartRequests.push(r.url()); });
    await page.goto(`${host}/products/dolls-castle-chiku-sz25-160cm-q-cup-silicone-character-doll`, { waitUntil: "networkidle" });
    const decline = page.getByRole("button", { name: "Decline", exact: true });
    if (await decline.isVisible()) await decline.click();
    assert.match(await page.locator('meta[name="robots"]').getAttribute("content"), /noindex.*nofollow/);
    const included = page.getByRole("region", { name: "Included in this build" });
    assert.equal(await included.locator("li").count(), 8);
    assert.match(await included.innerText(), /Fixed teeth and tongue/);
    assert.equal(await page.getByRole("button", { name: /Add standard configuration/ }).count(), 0);
    const eyes = page.locator("#custom-step-eye-color");
    await eyes.locator("button").first().click();
    const quotes = [];
    for (const color of ["Blue (#1)", "Purple (#2)", "Amber (#3)", "Green (#4)"]) {
      await eyes.getByRole("button", { name: new RegExp(color.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click();
      assert.match(await page.locator(".product-builder").innerText(), /\$1,999/);
      quotes.push({ eye: color, base: 1999 });
    }
    const body = page.locator("#custom-step-body-functions");
    await body.locator("button").first().click();
    await body.getByRole("button", { name: /Body heating/ }).click();
    await body.getByRole("button", { name: /Vaginal suction/ }).click();
    assert.match(await page.locator(".product-builder").innerText(), /\$2,164/);
    await eyes.locator("button").first().click();
    await eyes.getByRole("button", { name: /Blue \(#1\)/ }).click();
    await eyes.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/chiku-eyes-${width}.png` });
    await page.locator("#custom-step-review > button").click();
    const add = page.getByRole("button", { name: "Add to Cart", exact: true });
    assert.equal(await add.isDisabled(), true);
    assert.match(await page.locator(".product-builder").innerText(), /Blue \(#1\)/);
    const overflow = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth }));
    assert.ok(overflow.document <= overflow.viewport);
    await included.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/chiku-${width}.png` });
    const galleryImage = page.locator("main img").filter({ visible: true }).first();
    await galleryImage.scrollIntoViewIfNeeded();
    await galleryImage.evaluate((img) => img.decode());
    const image = await galleryImage.evaluate((img) => ({ loaded: img.complete && img.naturalWidth > 0, width: img.naturalWidth, height: img.naturalHeight }));
    assert.ok(image.loaded);
    assert.equal(cartRequests.length, 0);
    proof.push({ width, included: 8, quotes, heatingAndSuction: 2164, bluePreservedInReview: true, checkoutDisabled: true, cartRequests: 0, overflow, image });
    await page.close();
  }
  await writeFile(`${output}/browser-proof.json`, JSON.stringify({ at: new Date().toISOString(), host, proof }, null, 2));
  console.log(JSON.stringify({ host, cases: proof.length, status: "PASS" }));
} finally {
  await browser.close();
}
