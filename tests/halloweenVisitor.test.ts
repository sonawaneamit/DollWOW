import { describe, expect, it } from "vitest";
import { HALLOWEEN_2026 } from "@/lib/promotions/halloween2026";
import { claimHalloweenReveal, halloweenFallbackDeadline, isSpiderBodyHit } from "@/lib/promotions/halloweenVisitor";

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}

describe("Halloween visitor interaction", () => {
  it("sets the first deadline exactly 30 seconds ahead", () => {
    expect(halloweenFallbackDeadline(storage(), 1000)).toBe(31000);
  });
  it("keeps the deadline across navigation and repeat visits", () => {
    const visitor = storage();
    expect(halloweenFallbackDeadline(visitor, 1000)).toBe(31000);
    expect(halloweenFallbackDeadline(visitor, 20000)).toBe(31000);
    expect(halloweenFallbackDeadline(visitor, 40000)).toBe(31000);
  });
  it.each(["", "NaN", "-100", "Infinity"])("repairs invalid stored deadlines: %s", value => {
    const visitor = storage(); visitor.setItem(HALLOWEEN_2026.fallbackAtKey, value);
    expect(halloweenFallbackDeadline(visitor, 1000)).toBe(31000);
  });
  it("claims automatic or spider reveal only once", () => {
    const visitor = storage();
    expect(claimHalloweenReveal(visitor)).toBe(true);
    expect(claimHalloweenReveal(visitor)).toBe(false);
    expect(visitor.getItem(HALLOWEEN_2026.dismissalKey)).toBe("1");
  });
  it("honors an earlier Escape dismissal", () => {
    const visitor = storage(); visitor.setItem(HALLOWEEN_2026.dismissalKey, "1");
    expect(claimHalloweenReveal(visitor)).toBe(false);
  });
  it("allows explicitly reopening the offer", () => {
    const visitor = storage(); claimHalloweenReveal(visitor);
    expect(claimHalloweenReveal(visitor, true)).toBe(true);
  });
  it("hits only the small abdomen area, not the surrounding leg footprint", () => {
    const abdomen = { left: 100, top: 100, width: 14, height: 18 };
    expect(isSpiderBodyHit(107, 109, abdomen)).toBe(true);
    expect(isSpiderBodyHit(131, 109, abdomen)).toBe(false);
    expect(isSpiderBodyHit(107, 134, abdomen)).toBe(false);
  });
});
