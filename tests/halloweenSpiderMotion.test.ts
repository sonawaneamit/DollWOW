import { describe, expect, it } from "vitest";
import { advanceSpider, spiderLegPose } from "@/lib/promotions/halloweenSpiderMotion";

const bounds = { left: 0, top: 0, right: 400, bottom: 800 };
describe("Halloween whole-page articulated motion", () => {
  it("walks through the interior instead of treating content as obstacles", () => {
    expect(advanceSpider({ x: 50, y: 200 }, 0, 300, bounds)).toEqual({ x: 350, y: 200, angle: 0 });
  });
  it("turns at horizontal boundaries", () => {
    expect(advanceSpider({ x: 399, y: 200 }, 0, 5, bounds)).toEqual({ x: 400, y: 200, angle: Math.PI });
  });
  it("turns at vertical boundaries", () => {
    const next = advanceSpider({ x: 200, y: 799 }, Math.PI / 2, 5, bounds);
    expect(next.y).toBe(800); expect(next.angle).toBe(-Math.PI / 2);
  });
  it("stays within bounds over a long deterministic walk", () => {
    let state = { x: 200, y: 400, angle: .72 };
    for (let i = 0; i < 10000; i++) {
      state = advanceSpider(state, state.angle + Math.sin(i) * .01, 2, bounds);
      expect(state.x).toBeGreaterThanOrEqual(bounds.left); expect(state.x).toBeLessThanOrEqual(bounds.right);
      expect(state.y).toBeGreaterThanOrEqual(bounds.top); expect(state.y).toBeLessThanOrEqual(bounds.bottom);
    }
  });
  for (const side of [-1, 1]) for (const leg of [0, 1, 2, 3]) {
    it(`articulates leg ${side}:${leg} only when walking`, () => {
      expect(spiderLegPose(side, leg, 0, 1)).not.toEqual(spiderLegPose(side, leg, 1, 1));
      expect(spiderLegPose(side, leg, 0, 0)).toEqual(spiderLegPose(side, leg, 1, 0));
    });
  }
});
