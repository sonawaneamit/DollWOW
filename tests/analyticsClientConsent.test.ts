import { afterEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "@/lib/analytics/client";
afterEach(() => { vi.unstubAllGlobals(); });
describe("client consent queue ordering", () => {
  it("applies stored consent before an early child-component event is queued", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag, location: { hostname: "dollwow.com", href: "https://dollwow.com/dollvue?email=private@example.com" }, dollwowAnalytics: { mode: "production", measurementId: "G-4V999366W5", hosts: ["dollwow.com"] }, localStorage: { getItem: () => JSON.stringify({ state: "granted", updatedAt: new Date().toISOString() }) } });
    trackEvent("dollvue_landing_page_view", { page_location: "/dollvue" });
    expect(gtag.mock.calls[0]).toEqual(["consent", "update", expect.objectContaining({ analytics_storage: "granted", ad_storage: "denied" })]);
    expect(gtag.mock.calls[1]).toEqual(["event", "dollvue_landing_page_view", expect.objectContaining({ page_location: "https://dollwow.com/dollvue" })]);
    expect(JSON.stringify(gtag.mock.calls)).not.toContain("private@example.com");
  });
});
