import { describe, expect, it, vi } from "vitest";
import { buildShopifyPurchasePixel, installShopifyPurchasePixel } from "../scripts/analytics/shopify-purchase-pixel.mjs";

type TestEvent = { context: { document: { location: { hostname: string; href: string } } }; data: { checkout: { order: { id: string; customer: { email: string } } | null; email: string; currencyCode: string; subtotalPrice: { amount: number | string }; shippingLine: { price: { amount: number } }; totalTax: { amount: number }; lineItems: Array<{ id: string; variant: { id: string }; quantity: number; finalLinePrice: { amount: number }; properties: Array<{ key: string; value: string }> }> } } };
type ConsentEvent = { customerPrivacy: { analyticsProcessingAllowed: boolean } };
type Purchase = { send_to: string; event_callback: () => Promise<void>; [key: string]: unknown };

function fixture(options: { consent?: boolean; mode?: string; age?: number; productionEnabled?: boolean; cookie?: string; diagnostics?: boolean } = {}) {
  const callbacks: Record<string, (event: TestEvent) => Promise<void> | void> = {};
  const consentCallbacks: Record<string, (event: ConsentEvent) => void> = {};
  const sent: unknown[][] = [];
  const logs: string[] = [];
  const storage = new Map();
  const cookie = options.cookie ?? encodeURIComponent(JSON.stringify({ clientId: "123.456", sessionId: "789", mode: options.mode || "test", measurementId: options.mode === "production" ? "G-PROD123" : "G-QA123", at: Date.now() - (options.age || 0) }));
  const api = { init: { customerPrivacy: { analyticsProcessingAllowed: options.consent !== false } }, customerPrivacy: { subscribe: (key: string, cb: (event: ConsentEvent) => void) => { consentCallbacks[key] = cb; } }, analytics: { subscribe: (key: string, cb: (event: TestEvent) => Promise<void>) => { callbacks[key] = cb; } }, browser: { cookie: { get: vi.fn(async () => cookie) }, localStorage: { getItem: vi.fn(async (key: string) => storage.get(key)), setItem: vi.fn(async (key: string, value: string) => { storage.set(key, value); }) } } };
  const script: { onload?: () => void; onerror?: () => void } = {};
  const runtime = { console: { info: (value: string) => logs.push(value) }, gtag: (...args: unknown[]) => sent.push(args), document: { createElement: vi.fn(() => script), head: { appendChild: vi.fn() } } };
  installShopifyPurchasePixel(api, { testId: "G-QA123", productionId: "G-PROD123", productionEnabled: options.productionEnabled || false, diagnostics: options.diagnostics }, runtime);
  const event: TestEvent = { context: { document: { location: { hostname: "checkout.dollwow.com", href: "https://checkout.dollwow.com/checkouts/private-token?email=pii@example.com" } } }, data: { checkout: { order: { id: "gid://shopify/Order/12345", customer: { email: "pii@example.com" } }, email: "pii@example.com", currencyCode: "USD", subtotalPrice: { amount: 90 }, shippingLine: { price: { amount: 5 } }, totalTax: { amount: 9 }, lineItems: [{ id: "line1", variant: { id: "variant1" }, quantity: 2, finalLinePrice: { amount: 90 }, properties: [{ key: "custom", value: "private" }] }] } } };
  const run = () => callbacks.checkout_completed(event);
  const purchases = () => sent.filter(x => x[0] === "event" && x[1] === "purchase").map(x => x[2] as Purchase);
  return { api, event, run, purchases, sent, runtime, consentCallbacks, storage, logs, script };
}

describe("single consent-aware checkout purchase emitter", () => {
  it("uses QA only, correct post-discount merchandise value, real client/session, and no PII", async () => {
    const f = fixture(); await f.run();
    expect(f.purchases()).toHaveLength(1);
    expect(f.purchases()[0]).toMatchObject({ send_to: "G-QA123", transaction_id: "12345", value: 90, shipping: 5, tax: 9, currency: "USD", session_id: 789, debug_mode: true, items: [{ item_id: "variant1", quantity: 2, price: 45 }] });
    expect(JSON.stringify(f.sent)).not.toMatch(/pii@example|private-token|"private"|customer/);
    expect(f.sent.find(x => x[0] === "config")?.[2]).toMatchObject({ client_id: "123.456", send_page_view: false });
  });
  it.each([{ consent: false }, { age: 1800001 }, { cookie: "bad" }, { mode: "production" }])("does not emit for blocked state %o", async options => {
    const f = fixture(options); await f.run(); expect(f.purchases()).toHaveLength(0);
  });
  it("honours checkout consent withdrawal even after storefront consent", async () => {
    const f = fixture(); f.consentCallbacks.visitorConsentCollected({ customerPrivacy: { analyticsProcessingAllowed: false } }); await f.run(); expect(f.purchases()).toHaveLength(0);
  });
  it("prevents duplicate delivery in-flight and after GA callback", async () => {
    const f = fixture(); await Promise.all([f.run(), f.run()]); expect(f.purchases()).toHaveLength(1);
    await f.purchases()[0].event_callback(); await f.run(); expect(f.purchases()).toHaveLength(1);
  });
  it("ignores untrusted host, missing order, malformed currency and invalid values", async () => {
    for (const mutate of [(f: ReturnType<typeof fixture>) => { f.event.context.document.location.hostname = "localhost"; }, (f: ReturnType<typeof fixture>) => { f.event.data.checkout.order = null; }, (f: ReturnType<typeof fixture>) => { f.event.data.checkout.currencyCode = "BAD CURRENCY"; }, (f: ReturnType<typeof fixture>) => { f.event.data.checkout.subtotalPrice.amount = "NaN"; }, (f: ReturnType<typeof fixture>) => { f.event.data.checkout.lineItems[0].quantity = 0; }]) {
      const f = fixture(); mutate(f); await f.run(); expect(f.purchases()).toHaveLength(0);
    }
  });
  it("keeps production closed until separately enabled", async () => {
    const f = fixture({ mode: "production", productionEnabled: true }); await f.run(); expect(f.purchases()[0].send_to).toBe("G-PROD123"); expect(f.purchases()[0]).not.toHaveProperty("debug_mode");
  });
  it("uses the checkout attribute if Shopify moves the completion page off our cookie domain", async () => {
    const f = fixture({ cookie: "" });
    f.event.context.document.location.hostname = "shopify.com";
    Object.assign(f.event.data.checkout, { attributes: [{ key: "_dollwow_analytics_context", value: JSON.stringify({ clientId: "123.456", sessionId: "789", mode: "test", measurementId: "G-QA123", at: Date.now() }) }] });
    await f.run(); expect(f.purchases()).toHaveLength(1);
  });
  it("documents the current shop.app host gap even with consent and a valid checkout identity", async () => {
    const f = fixture({ cookie: "" });
    f.event.context.document.location.hostname = "shop.app";
    Object.assign(f.event.data.checkout, { attributes: [{ key: "_dollwow_analytics_context", value: JSON.stringify({ clientId: "123.456", sessionId: "789", mode: "test", measurementId: "G-QA123", at: Date.now() }) }] });
    await f.run();
    expect(f.purchases()).toHaveLength(0);
    f.event.context.document.location.hostname = "checkout.dollwow.com";
    await f.run();
    expect(f.purchases()).toHaveLength(1);
  });
  it("requires distinct streams when generating the Shopify install artifact", () => {
    expect(() => buildShopifyPurchasePixel({ testId: "G-SAME", productionId: "G-SAME" })).toThrow();
    expect(buildShopifyPurchasePixel({ testId: "G-QA123", productionId: "G-PROD123", productionEnabled: false })).toContain('"productionEnabled":false');
  });
  it("reports fixed privacy-safe reasons without widening host, consent or identity gates", async () => {
    const host = fixture({ diagnostics: true }); host.event.context.document.location.hostname = 'shop.app'; await host.run();
    expect(host.purchases()).toHaveLength(0); expect(host.logs).toContain('DollWOW purchase QA: checkout host not allowed');
    const expired = fixture({ diagnostics: true, age: 1800001 }); await expired.run();
    expect(expired.purchases()).toHaveLength(0); expect(expired.logs).toContain('DollWOW purchase QA: checkout identity expired or timestamp invalid');
    const denied = fixture({ diagnostics: true, consent: false }); await denied.run();
    expect(denied.purchases()).toHaveLength(0); expect(denied.logs).toContain('DollWOW purchase QA: analytics permission absent');
    const invalid = fixture({ diagnostics: true }); invalid.event.data.checkout.order = null; await invalid.run();
    expect(invalid.logs).toContain('DollWOW purchase QA: order identity absent or invalid');
    expect(JSON.stringify([...host.logs,...expired.logs,...denied.logs,...invalid.logs])).not.toMatch(/pii@example|private-token|12345|123\.456|789|shop\.app/);
  });
  it("distinguishes tag loading and event callback from independently verified delivery", async () => {
    const f=fixture({diagnostics:true}); await f.run();
    f.script.onload?.(); f.script.onerror?.(); await f.purchases()[0].event_callback();
    expect(f.logs).toContain('DollWOW purchase QA: Google tag script loaded');
    expect(f.logs).toContain('DollWOW purchase QA: Google tag script load failed');
    expect(f.logs).toContain('DollWOW purchase QA: Google event callback received; delivery not independently verified');
    const quiet=fixture(); await quiet.run(); expect(quiet.logs).toEqual([]);
  });
});
