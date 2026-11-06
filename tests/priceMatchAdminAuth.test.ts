import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/price-match/update/route";
import { POST as adminPost } from "@/app/admin/price-match/update/route";
import { POST as opsPost } from "@/app/ops/price-match/update/route";
import { proxy } from "@/proxy";

const mocks = vi.hoisted(() => ({
  env: { ADMIN_BASIC_AUTH_USERNAME: "operator", ADMIN_BASIC_AUTH_PASSWORD: "dummy:password" },
  getComparisonRequest: vi.fn(),
  updateComparisonRequestReview: vi.fn(),
  createPriceMatchDiscountCode: vi.fn(),
  sendPriceMatchCustomerReply: vi.fn()
}));

vi.mock("@/lib/utils/env", () => ({
  env: mocks.env,
  hasAdminBasicAuthEnv: () => Boolean(mocks.env.ADMIN_BASIC_AUTH_USERNAME && mocks.env.ADMIN_BASIC_AUTH_PASSWORD)
}));
vi.mock("@/lib/supabase/repositories", () => ({
  getComparisonRequest: mocks.getComparisonRequest,
  updateComparisonRequestReview: mocks.updateComparisonRequestReview
}));
vi.mock("@/lib/shopify/admin", () => ({ createPriceMatchDiscountCode: mocks.createPriceMatchDiscountCode }));
vi.mock("@/lib/shopify/storefront", () => ({ getProductByHandle: vi.fn(), getProducts: vi.fn() }));
vi.mock("@/lib/email/adminAlerts", () => ({ sendPriceMatchCustomerReply: mocks.sendPriceMatchCustomerReply }));

const id = "a355e025-4b9d-42dd-a2b6-66ee6a67facd";
const basic = (value: string) => `Basic ${Buffer.from(value).toString("base64")}`;

function request(path: string, auth?: string) {
  return new NextRequest(`https://dollwow.com${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(auth ? { authorization: auth } : {}) },
    body: JSON.stringify({ id, adminStatus: "in_review" })
  });
}

describe("price-match operator writes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.env.ADMIN_BASIC_AUTH_PASSWORD = "dummy:password";
  });

  it.each([
    ["/api/admin/price-match/update", POST],
    ["/admin/price-match/update", adminPost],
    ["/ops/price-match/update", opsPost]
  ] as const)("denies unauthenticated writes at %s before reading the body or records", async (path, handler) => {
    const req = request(path);
    const body = vi.spyOn(req, "json");
    const response = await handler(req);
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain("Basic");
    expect(body).not.toHaveBeenCalled();
    expect(mocks.getComparisonRequest).not.toHaveBeenCalled();
    expect(mocks.updateComparisonRequestReview).not.toHaveBeenCalled();
    expect(mocks.createPriceMatchDiscountCode).not.toHaveBeenCalled();
    expect(mocks.sendPriceMatchCustomerReply).not.toHaveBeenCalled();
  });

  it.each(["Basic A", "Basic !!!", basic("operator:wrong")])("rejects malformed or incorrect credentials", async auth => {
    expect(proxy(request("/ops/price-match/update", auth)).status).toBe(401);
    expect((await POST(request("/api/admin/price-match/update", auth))).status).toBe(401);
    expect(mocks.getComparisonRequest).not.toHaveBeenCalled();
  });

  it("fails closed when the credentials are missing from configuration", async () => {
    mocks.env.ADMIN_BASIC_AUTH_PASSWORD = "";
    expect((await POST(request("/api/admin/price-match/update"))).status).toBe(503);
    expect(mocks.getComparisonRequest).not.toHaveBeenCalled();
  });

  it("rejects form-compatible payloads even with cached operator credentials", async () => {
    const req = request("/ops/price-match/update", basic("operator:dummy:password"));
    req.headers.set("content-type", "text/plain");
    expect((await opsPost(req)).status).toBe(415);
    expect(mocks.getComparisonRequest).not.toHaveBeenCalled();
  });

  it("allows the signed-in operator to save through the ops path", async () => {
    const auth = basic("operator:dummy:password");
    mocks.getComparisonRequest.mockResolvedValue({ id });
    mocks.updateComparisonRequestReview.mockResolvedValue({ id, adminStatus: "in_review" });
    expect(proxy(request("/ops/price-match/update", auth)).headers.get("x-middleware-next")).toBe("1");
    expect((await opsPost(request("/ops/price-match/update", auth))).status).toBe(200);
    expect(mocks.updateComparisonRequestReview).toHaveBeenCalledWith({ id, adminStatus: "in_review" });
  });
});
