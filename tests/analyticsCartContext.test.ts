import { describe, expect, it, vi } from "vitest";
import { checkoutAnalyticsAttribute, attachCheckoutAnalytics } from "@/lib/analytics/cart-context";
const update = vi.hoisted(() => vi.fn());
vi.mock("@/lib/shopify/storefront", () => ({ updateCartAnalyticsAttribute: update }));
const env = { VERCEL_ENV: "production", GA_TEST_MEASUREMENT_ID: "G-QA123" };
function request(fields = {}, host = "dollwow.com") {
  const context = { clientId: "123.456", sessionId: "789", measurementId: "G-4V999366W5", mode: "production", at: Date.now(), ...fields };
  return new Request(`https://${host}/api/cart/checkout`, { headers: { cookie: `other=value; dollwow_ga_context=${encodeURIComponent(JSON.stringify(context))}` } });
}
describe("consented context survives Shopify domain changes", () => {
  it("only mirrors validated identity fields into the checkout attribute", () => {
    const result = checkoutAnalyticsAttribute(request({ email: "private@example.com" }), env);
    expect(result?.key).toBe("_dollwow_analytics_context");
    expect(JSON.parse(result!.value)).toMatchObject({ clientId: "123.456", sessionId: "789", mode: "production" });
    expect(result?.value).not.toContain("private@example.com");
  });
  it.each([{ at: 0 }, { at: "bad" }, { mode: "test", measurementId: "G-4V999366W5" }, { clientId: "order.123" }, { sessionId: "email@example.com" }])("rejects invalid identity %o", fields => {
    expect(checkoutAnalyticsAttribute(request(fields), env)).toBeNull();
  });
  it("does not attach production identities from preview or unapproved hosts", () => {
    expect(checkoutAnalyticsAttribute(request(), {})).toBeNull();
    expect(checkoutAnalyticsAttribute(request({}, "preview.vercel.app"), env)).toBeNull();
    expect(checkoutAnalyticsAttribute(new Request("https://dollwow.com"), env)).toBeNull();
  });
  it("accepts only the configured QA stream for a test identity", () => {
    expect(checkoutAnalyticsAttribute(request({ mode: "test", measurementId: "G-QA123" }), env)?.value).toContain("G-QA123");
  });
  it("does not prevent checkout when attribute persistence fails", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    update.mockRejectedValueOnce(new Error("Network unavailable"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try { await expect(attachCheckoutAnalytics({ id: "cart" }, request())).resolves.toBeUndefined(); expect(update).toHaveBeenCalledOnce(); }
    finally { warn.mockRestore(); vi.unstubAllEnvs(); }
  });
});
