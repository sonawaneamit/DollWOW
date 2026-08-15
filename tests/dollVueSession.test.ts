import { describe, expect, it } from "vitest";

process.env.PASSPORT_SESSION_SECRET ||= "test-dollvue-session-secret-at-least-32-characters";

describe("DollVue verified sessions", async () => {
  const session = await import("@/lib/dollvue/session");

  it("normalizes and verifies a signed cross-device identity session", () => {
    const value = session.createDollVueSessionValue(" Buyer@Example.com ", Date.UTC(2026, 7, 12));
    expect(session.verifyDollVueSessionValue(value, Date.UTC(2026, 7, 13))).toMatchObject({ email: "buyer@example.com" });
  });

  it("rejects tampered and expired sessions", () => {
    const now = Date.UTC(2026, 7, 12);
    const value = session.createDollVueSessionValue("buyer@example.com", now);
    expect(session.verifyDollVueSessionValue(`${value}x`, now)).toBeNull();
    expect(session.verifyDollVueSessionValue(value, now + 31 * 24 * 60 * 60 * 1000)).toBeNull();
  });

  it("binds access links to the requested DollVue product", () => {
    const now = Date.UTC(2026, 7, 12);
    const token = session.createDollVueAccessToken("buyer@example.com", "irontech-penny", now);
    expect(session.verifyDollVueAccessToken(token, now)).toMatchObject({ email: "buyer@example.com", handle: "irontech-penny" });
    expect(session.verifyDollVueAccessToken(token, now + 16 * 60 * 1000)).toBeNull();
  });

  it("uses a one-way keyed identifier and masks display email", () => {
    expect(session.dollVueEmailHash("Buyer@Example.com")).toBe(session.dollVueEmailHash("buyer@example.com"));
    expect(session.dollVueEmailHash("buyer@example.com")).not.toContain("buyer");
    expect(session.maskedEmail("buyer@example.com")).toBe("bu•••@example.com");
  });
});
