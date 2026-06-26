import { describe, expect, it, beforeEach } from "vitest";
import { buildAIUsageEvent, hashPrivateIdentifier } from "@/lib/ai/usage";
import { checkRateLimit, clearMemoryRateLimitsForTests, hashRateLimitIdentifier, windowStartFor } from "@/lib/ai/rateLimit";

describe("AI usage logging helpers", () => {
  it("hashes private identifiers instead of storing raw values", () => {
    const first = hashPrivateIdentifier("Buyer@Example.com ");
    const second = hashPrivateIdentifier("buyer@example.com");

    expect(first).toBe(second);
    expect(first).not.toContain("buyer");
  });

  it("builds a normalized usage event record", () => {
    const event = buildAIUsageEvent({
      feature: "semantic-search",
      provider: "openai",
      model: "text-embedding-3-small",
      route: "/api/search",
      inputTokens: 42.4,
      outputTokens: -1,
      estimatedCostUsd: 0.00001,
      ip: "203.0.113.10",
      metadata: { fallback: false }
    });

    expect(event.input_tokens).toBe(42);
    expect(event.output_tokens).toBeNull();
    expect(event.ip_hash).toHaveLength(64);
    expect(event.metadata).toEqual({ fallback: false });
  });
});

describe("AI rate limit helpers", () => {
  beforeEach(() => {
    clearMemoryRateLimitsForTests();
  });

  it("normalizes rate-limit identifiers", () => {
    expect(hashRateLimitIdentifier("  USER@example.COM ")).toBe(hashRateLimitIdentifier("user@example.com"));
  });

  it("computes stable window starts", () => {
    expect(windowStartFor(new Date("2026-06-11T12:34:56.000Z"), 60).toISOString()).toBe("2026-06-11T12:34:00.000Z");
  });

  it("limits repeated calls in the in-memory fallback", async () => {
    const input = {
      scope: "search",
      identifier: "203.0.113.10",
      limit: 2,
      windowSeconds: 60,
      now: new Date("2026-06-11T12:34:56.000Z"),
      storage: "memory" as const
    };

    await expect(checkRateLimit(input)).resolves.toMatchObject({ allowed: true, remaining: 1 });
    await expect(checkRateLimit(input)).resolves.toMatchObject({ allowed: true, remaining: 0 });
    await expect(checkRateLimit(input)).resolves.toMatchObject({ allowed: false, remaining: 0 });
  });
});
