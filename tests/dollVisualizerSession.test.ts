import { describe, expect, it } from "vitest";

process.env.PASSPORT_SESSION_SECRET ||= "test-visualizer-session-secret-at-least-32-characters";

describe("Doll Visualizer verified sessions", async () => {
  const session = await import("@/lib/doll-visualizer/session");

  it("normalizes and verifies a signed cross-device identity session", () => {
    const value = session.createVisualizerSessionValue(" Buyer@Example.com ", Date.UTC(2026, 7, 12));
    expect(session.verifyVisualizerSessionValue(value, Date.UTC(2026, 7, 13))).toMatchObject({ email: "buyer@example.com" });
  });

  it("rejects tampered and expired sessions", () => {
    const now = Date.UTC(2026, 7, 12);
    const value = session.createVisualizerSessionValue("buyer@example.com", now);
    expect(session.verifyVisualizerSessionValue(`${value}x`, now)).toBeNull();
    expect(session.verifyVisualizerSessionValue(value, now + 31 * 24 * 60 * 60 * 1000)).toBeNull();
  });

  it("binds access links to the requested Visualizer product", () => {
    const now = Date.UTC(2026, 7, 12);
    const token = session.createVisualizerAccessToken("buyer@example.com", "irontech-penny", now);
    expect(session.verifyVisualizerAccessToken(token, now)).toMatchObject({ email: "buyer@example.com", handle: "irontech-penny" });
    expect(session.verifyVisualizerAccessToken(token, now + 16 * 60 * 1000)).toBeNull();
  });

  it("uses a one-way keyed identifier and masks display email", () => {
    expect(session.visualizerEmailHash("Buyer@Example.com")).toBe(session.visualizerEmailHash("buyer@example.com"));
    expect(session.visualizerEmailHash("buyer@example.com")).not.toContain("buyer");
    expect(session.maskedEmail("buyer@example.com")).toBe("bu•••@example.com");
  });
});
