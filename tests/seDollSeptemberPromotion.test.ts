import { describe, expect, it } from "vitest";
import handleData from "@/data/promotions/se-doll-september-2026-handles.json";
import {
  isSeDollSeptemberPromotionVisible,
  SE_DOLL_PROMOTION_HANDLE_COUNTS,
  seDollSeptemberFreebiesForProduct
} from "@/lib/promotions/seDollSeptember2026";
import type { Product } from "@/types/product";

const duringPromotion = new Date("2026-09-15T12:00:00.000Z");

function product(handle: string, extended: Product["extended"] = { stockStatus: "custom" }) {
  return { handle, extended };
}

describe("SE Doll September 2026 promotion", () => {
  it("preserves the authoritative handle counts", () => {
    expect(SE_DOLL_PROMOTION_HANDLE_COUNTS).toEqual({
      sil_rts: 26,
      tpe_rts: 28,
      tpe_custom: 268,
      sil_custom: 100,
      skip: 1
    });
    expect(handleData.tpe_custom_handles).toHaveLength(268);
    expect(handleData.silicone_pro_custom_handles).toHaveLength(100);
    expect(handleData.silicone_pro_soft_belly_height_proxy_handles).toHaveLength(26);
  });

  it("shows all six TPE and STPE bonuses only on listed custom handles", () => {
    const promotion = seDollSeptemberFreebiesForProduct(
      product(handleData.tpe_custom_handles[0]),
      duringPromotion
    );

    expect(promotion?.material).toBe("TPE / STPE");
    expect(promotion?.freebies).toEqual([
      "Free STPE upgrade",
      "Free EVO skeleton",
      "Free gel breasts",
      "Free lubricant-free vagina",
      "Free realistic body painting",
      "Free fixed tongue"
    ]);
  });

  it("never shows custom-order bonuses on RTS or the Sophie Lane AI handle", () => {
    expect(
      seDollSeptemberFreebiesForProduct(
        product(handleData.tpe_rts_handles[0], { stockStatus: "ready_to_ship" }),
        duringPromotion
      )
    ).toBeNull();
    expect(
      seDollSeptemberFreebiesForProduct(product(handleData.skip_handles[0]), duringPromotion)
    ).toBeNull();
  });

  it("uses a body code before the supplied soft-belly height proxy", () => {
    const proxyHandle = handleData.silicone_pro_soft_belly_height_proxy_handles[0];

    expect(
      seDollSeptemberFreebiesForProduct(product(proxyHandle), duringPromotion)?.includesSoftBelly
    ).toBe(true);
    expect(
      seDollSeptemberFreebiesForProduct(
        product(proxyHandle, { stockStatus: "custom", bodyCode: "T160" }),
        duringPromotion
      )?.includesSoftBelly
    ).toBe(false);
    expect(
      seDollSeptemberFreebiesForProduct(
        product(handleData.silicone_pro_custom_handles[0], { stockStatus: "custom", bodyCode: "T175" }),
        duringPromotion
      )?.includesSoftBelly
    ).toBe(true);
  });

  it("publishes for launch and expires after September", () => {
    expect(isSeDollSeptemberPromotionVisible(new Date("2026-08-30T00:00:00.000Z"))).toBe(true);
    expect(isSeDollSeptemberPromotionVisible(duringPromotion)).toBe(true);
    expect(isSeDollSeptemberPromotionVisible(new Date("2026-10-01T00:00:00.000Z"))).toBe(true);
    expect(isSeDollSeptemberPromotionVisible(new Date("2026-10-01T07:00:00.000Z"))).toBe(false);
  });
});
