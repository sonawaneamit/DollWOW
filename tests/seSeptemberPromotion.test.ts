import { describe, expect, it } from "vitest";
import handleData from "@/data/promotions/dol-25/se-pdp-frees-handles.json";
import { isSeSeptemberPromotionPublished, seSeptemberPdpPromotion } from "@/lib/promotions/seSeptember2026";

describe("SE Doll September 2026 PDP bonuses", () => {
  it("matches the authoritative custom-order handle counts", () => {
    expect(handleData.tpe_custom_handles).toHaveLength(268);
    expect(handleData.silicone_pro_custom_handles).toHaveLength(100);
    expect(handleData.silicone_pro_soft_belly_height_proxy_handles).toHaveLength(26);
  });

  it("shows the six TPE bonuses only on listed custom TPE handles", () => {
    const promotion = seSeptemberPdpPromotion(handleData.tpe_custom_handles[0]);
    expect(promotion?.material).toBe("TPE / STPE");
    expect(promotion?.frees).toHaveLength(6);
    expect(promotion?.includesSoftBelly).toBe(false);
    expect(seSeptemberPdpPromotion(handleData.tpe_rts_handles[0])).toBeNull();
  });

  it("adds soft belly only to listed Silicone Pro body-height proxies", () => {
    const eligible = seSeptemberPdpPromotion(handleData.silicone_pro_soft_belly_height_proxy_handles[0]);
    const ineligibleHandle = handleData.silicone_pro_custom_handles.find(
      (handle) => !handleData.silicone_pro_soft_belly_height_proxy_handles.includes(handle)
    );
    expect(eligible?.material).toBe("Silicone Pro");
    expect(eligible?.includesSoftBelly).toBe(true);
    expect(ineligibleHandle).toBeTruthy();
    expect(seSeptemberPdpPromotion(ineligibleHandle!)?.includesSoftBelly).toBe(false);
  });

  it("skips all RTS and explicitly excluded products", () => {
    for (const handle of [...handleData.tpe_rts_handles, ...handleData.silicone_rts_handles, ...handleData.skip_handles]) {
      expect(seSeptemberPdpPromotion(handle)).toBeNull();
    }
  });

  it("publishes the promotion for the launch window and retires it after September", () => {
    expect(isSeSeptemberPromotionPublished(new Date("2026-08-30T12:00:00.000Z"))).toBe(true);
    expect(isSeSeptemberPromotionPublished(new Date("2026-09-30T23:59:59.999Z"))).toBe(true);
    expect(isSeSeptemberPromotionPublished(new Date("2026-10-01T00:00:00.000Z"))).toBe(false);
  });
});
