import { describe, expect, it, vi } from "vitest";
import vm from "node:vm";
import { analyticsBootstrap, analyticsConfig, analyticsHostAllowed, analyticsPageLocation, PRODUCTION_MEASUREMENT_ID } from "@/lib/analytics/config";
import { trackServerEvent } from "@/lib/analytics/events";
import { POST } from "@/app/api/webhooks/shopify/orders/route";

describe("GA deployment, host and privacy isolation", () => {
  it.each([{}, { NODE_ENV: "production" }, { VERCEL_ENV: "preview", GA_MEASUREMENT_ID: PRODUCTION_MEASUREMENT_ID }])("does not enable production GA outside production: %o", env => {
    expect(analyticsConfig(env)).toBeNull();
  });
  it("requires both production deployment and exact public hostname", () => {
    const config = analyticsConfig({ VERCEL_ENV: "production" });
    for (const host of ["localhost", "127.0.0.1", "doll-wow.vercel.app", "dollwow.com.example.org", "ops.dollwow.com"]) expect(analyticsHostAllowed(config, host)).toBe(false);
    expect(analyticsHostAllowed(config, "www.dollwow.com")).toBe(true);
    for (const host of ["localhost", "dollwow.com"]) {
      const context = { location: { hostname: host, origin: `https://${host}`, pathname: "/dollvue", search: "?email=private@example.com&utm_source=tdf" }, document: { referrer: "https://example.com/?private=secret" }, window: {} as Record<string, unknown>, URLSearchParams, URL, Date };
      vm.runInNewContext(analyticsBootstrap(config!), context);
      expect(!!context.window.dollwowAnalytics).toBe(host === "dollwow.com");
      if (host === "dollwow.com") {
        const payload = JSON.stringify(context.window.dataLayer);
        expect(payload).not.toContain("private@example");
        expect(payload).not.toContain("private=secret");
        expect(payload).toContain("campaign_source");
        expect(payload).toContain("https://dollwow.com/dollvue");
      }
    }
  });
  it("only permits distinct QA IDs with an explicit host allowlist", () => {
    expect(analyticsConfig({ GA_TEST_MEASUREMENT_ID: PRODUCTION_MEASUREMENT_ID, GA_TEST_ALLOWED_HOSTS: "localhost" })).toBeNull();
    expect(analyticsConfig({ GA_TEST_MEASUREMENT_ID: "G-QA123" })).toBeNull();
    const config = analyticsConfig({ VERCEL_ENV: "preview", GA_TEST_MEASUREMENT_ID: "G-QA123", GA_TEST_ALLOWED_HOSTS: "localhost,preview.example.com" });
    expect(config?.mode).toBe("test");
    expect(analyticsHostAllowed(config, "localhost")).toBe(true);
    expect(analyticsHostAllowed(config, "dollwow.com")).toBe(false);
  });
  it("reports absolute page locations without query, fragment or checkout token", () => {
    expect(analyticsPageLocation("https://dollwow.com/dollvue?email=private#secret")).toBe("https://dollwow.com/dollvue");
    expect(analyticsPageLocation("https://checkout.dollwow.com/checkouts/cn/private-token?key=secret")).toBe("https://checkout.dollwow.com/checkout");
  });
  it("only switches a production browser to QA after its explicit opt-in", () => {
    const config = analyticsConfig({ VERCEL_ENV: "production", GA_TEST_MEASUREMENT_ID: "G-QA123" })!;
    const window = {} as Record<string, unknown>;
    vm.runInNewContext(analyticsBootstrap(config), { location: { hostname: "dollwow.com", origin: "https://dollwow.com", pathname: "/dollvue", search: "" }, document: { cookie: "dollwow_analytics_qa=1", referrer: "" }, window, URLSearchParams, URL, Date });
    expect(window.dollwowAnalytics).toMatchObject({ mode: "test", measurementId: "G-QA123" });
    const queue = window.dataLayer as Array<ArrayLike<unknown>>;
    expect(Array.from(queue.find(x => x[0] === "config")!)[1]).toBe("G-QA123");
  });
  it("retires the order webhook without parsing or persisting customer data", async () => {
    expect((await POST()).status).toBe(410);
  });
  it("never emits a purchase from the old server path, even if secrets exist", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    await trackServerEvent("purchase", { clientId: "1.2", analyticsConsent: true });
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });
});
