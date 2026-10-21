import { describe, expect, it } from "vitest";
import { isSpiderStepSafe, spiderFootprint, spiderLegPose, spiderRectsOverlap } from "@/lib/promotions/halloweenSpiderMotion";

const bounds = { left: 0, top: 0, right: 400, bottom: 800 };
describe("Halloween articulated motion safety", () => {
  it("uses the full footprint", () => {
    expect(spiderFootprint({ x: 50, y: 60 }, 64)).toEqual({ left: 18, top: 28, right: 82, bottom: 92 });
  });
  it("rejects crossing text even when both endpoints are free", () => {
    expect(isSpiderStepSafe({ x: 50, y: 200 }, { x: 350, y: 200 }, 64, bounds, [{ left: 180, top: 180, right: 220, bottom: 220 }])).toBe(false);
  });
  it("rejects a narrow edge that cannot fit the spider", () => {
    expect(isSpiderStepSafe({ x: 36, y: 200 }, { x: 36, y: 202 }, 64, bounds, [{ left: 16, top: 100, right: 384, bottom: 300 }])).toBe(false);
  });
  it("does not allow a footprint outside the viewport", () => {
    expect(isSpiderStepSafe({ x: 30, y: 200 }, { x: 30, y: 202 }, 64, bounds, [])).toBe(false);
  });
  it("allows a fully clear step", () => {
    expect(isSpiderStepSafe({ x: 50, y: 200 }, { x: 50, y: 202 }, 64, bounds, [{ left: 150, top: 100, right: 350, bottom: 300 }])).toBe(true);
  });
  it("keeps separation between spiders", () => {
    expect(spiderRectsOverlap(spiderFootprint({ x: 50, y: 200 }, 64), spiderFootprint({ x: 115, y: 200 }, 64))).toBe(true);
  });
  for (const side of [-1, 1]) for (const leg of [0, 1, 2, 3]) {
    it(`articulates leg ${side}:${leg} only when walking`, () => {
      expect(spiderLegPose(side, leg, 0, 1)).not.toEqual(spiderLegPose(side, leg, 1, 1));
      expect(spiderLegPose(side, leg, 0, 0)).toEqual(spiderLegPose(side, leg, 1, 0));
    });
  }
});
