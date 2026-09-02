import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  SeDollBrandPromotionBanner,
  SeDollPdpFreebieBlock,
  SeDollPromoIndexCards
} from "@/components/promotions/SeDollSeptemberPromotion";
import handleData from "@/data/promotions/se-doll-september-2026-handles.json";
import {
  isSeDollSeptemberPromotionVisible,
  SE_DOLL_PROMOTION_HANDLE_COUNTS,
  SE_DOLL_SEPTEMBER_OFFERS,
  SE_DOLL_WAREHOUSE_STPE_MAKEUP_NOTE,
  seDollSeptemberOfferForProduct
} from "@/lib/promotions/seDollSeptember2026";
import type { Product } from "@/types/product";

const duringPromotion = new Date("2026-09-15T12:00:00.000Z");

function product(handle: string, extended: Product["extended"] = { stockStatus: "custom" }) {
  return { handle, extended };
}

describe("SE Doll September 2026 promotion", () => {
  it("preserves the authoritative four-offer handle counts", () => {
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
    expect(handleData.silicone_rts_handles).toHaveLength(26);
    expect(handleData.tpe_rts_handles).toHaveLength(28);
    expect(Object.values(SE_DOLL_SEPTEMBER_OFFERS)).toHaveLength(4);
  });

  it("shows Cecile exactly the seven TPE/STPE custom bonuses, including Loose Joint System", () => {
    const offer = seDollSeptemberOfferForProduct(
      product("sedoll-cecile-167cm-g-cup-tpe-companion-doll-bek49"),
      duringPromotion
    );

    expect(offer).toMatchObject({
      kind: "tpe_custom",
      included: [
        "Free STPE upgrade",
        "Free EVO skeleton",
        "Free gel breasts",
        "Free fixed tongue",
        "Free lubricant-free vagina",
        "Free realistic body painting",
        "Free Loose Joint System"
      ],
      discounts: [],
      includesSoftBelly: false
    });
    expect(offer?.makeupPriceNote).toBeUndefined();
  });

  it("shows Pearl Silicone Pro frees and option discounts without soft belly", () => {
    const offer = seDollSeptemberOfferForProduct(
      product("sedoll-pearl-160cm-e-cup-silicone-companion-doll-17zfr"),
      duringPromotion
    );

    expect(offer?.kind).toBe("silicone_custom");
    expect(offer?.included).toContain("Free ROS");
    expect(offer?.included).toContain("Free Loose Joint System");
    expect(offer?.included).not.toContain("Free STPE upgrade");
    expect(offer?.discounts).toEqual([
      "10% off master makeup",
      "30% off movable eyelids",
      "50% off gel butt",
      "50% off realistic skin texture"
    ]);
    expect(offer?.includesSoftBelly).toBe(false);
    expect(offer?.makeupPriceNote).toBeUndefined();
  });

  it("adds soft belly only to eligible Silicone Pro bodies and prefers body code", () => {
    const yuukaHandle = "sedoll-yuuka-h-165cm-c-cup-silicone-companion-doll-14jg7";
    expect(seDollSeptemberOfferForProduct(product(yuukaHandle), duringPromotion)?.includesSoftBelly).toBe(true);
    expect(
      seDollSeptemberOfferForProduct(
        product(yuukaHandle, { stockStatus: "custom", bodyCode: "T160" }),
        duringPromotion
      )?.includesSoftBelly
    ).toBe(false);
    expect(
      seDollSeptemberOfferForProduct(
        product(handleData.silicone_pro_custom_handles[0], { stockStatus: "custom", bodyCode: "T175" }),
        duringPromotion
      )?.includesSoftBelly
    ).toBe(true);
  });

  it("puts the 15% offer and makeup-price note on every TPE/STPE warehouse handle", () => {
    for (const handle of handleData.tpe_rts_handles) {
      const offer = seDollSeptemberOfferForProduct(
        product(handle, { stockStatus: "ready_to_ship" }),
        duringPromotion
      );
      expect(offer?.kind, handle).toBe("warehouse_tpe_stpe");
      expect(offer?.discounts, handle).toEqual(["15% off this ready-to-ship warehouse doll"]);
      expect(offer?.included, handle).toEqual([]);
      expect(offer?.makeupPriceNote, handle).toBe(SE_DOLL_WAREHOUSE_STPE_MAKEUP_NOTE);
    }
  });

  it("covers both Tracy warehouse examples with the same required makeup note", () => {
    for (const handle of [
      "sedoll-tracy-b-160cm-c-cup-tpe-companion-doll-1suv1-rts-us",
      "sedoll-tracy-b-160cm-c-cup-tpe-companion-doll-1suv1-rts-eu"
    ]) {
      expect(
        seDollSeptemberOfferForProduct(product(handle, { stockStatus: "ready_to_ship" }), duringPromotion)?.makeupPriceNote,
        handle
      ).toBe(SE_DOLL_WAREHOUSE_STPE_MAKEUP_NOTE);
    }
  });

  it("renders the makeup-price note in the PDP block and keeps it off custom and silicone RTS markup", () => {
    vi.setSystemTime(duringPromotion);
    try {
      const tracyMarkup = renderToStaticMarkup(createElement(SeDollPdpFreebieBlock, {
        product: product("sedoll-tracy-b-160cm-c-cup-tpe-companion-doll-1suv1-rts-us", { stockStatus: "ready_to_ship" })
      }));
      const cecileMarkup = renderToStaticMarkup(createElement(SeDollPdpFreebieBlock, {
        product: product("sedoll-cecile-167cm-g-cup-tpe-companion-doll-bek49")
      }));
      const yuukaRtsMarkup = renderToStaticMarkup(createElement(SeDollPdpFreebieBlock, {
        product: product("sedoll-yuuka-h-165cm-c-cup-silicone-companion-doll-14jg7-rts-us", { stockStatus: "ready_to_ship" })
      }));

      expect(tracyMarkup).toContain("Warehouse STPE makeup pricing:");
      expect(tracyMarkup).toContain("sold at the price without body makeup");
      expect(cecileMarkup).not.toContain("Warehouse STPE makeup pricing:");
      expect(yuukaRtsMarkup).not.toContain("Warehouse STPE makeup pricing:");
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders every PDP offer as a full-width banner above solid offer details", () => {
    vi.setSystemTime(duringPromotion);
    try {
      for (const sample of [
        product("sedoll-cecile-167cm-g-cup-tpe-companion-doll-bek49"),
        product("sedoll-pearl-160cm-e-cup-silicone-companion-doll-17zfr")
      ]) {
        const markup = renderToStaticMarkup(createElement(SeDollPdpFreebieBlock, { product: sample }));

        expect(markup).toMatch(/data-se-pdp-promotion-banner[^>]*><picture><source media="\(max-width: 639px\)" srcSet="\/promo\/se-doll\/factory-Loose-Joints-1080x1350.jpg"\/><img[^>]+width="1200"[^>]+height="900"/);
        expect(markup).toMatch(/data-se-pdp-promotion-banner[\s\S]+data-se-pdp-promotion-details/);
        expect(markup).toContain("bg-ink-900");
        expect(markup).not.toContain("bg-ink-900/80");
        expect(markup).not.toContain("opacity-55");
        expect(markup).not.toContain("bg-gradient-to-r");
        expect(markup).not.toContain("Option-Loose-Joints.jpg");
        expect(markup).not.toContain("4-limb-loose-joint.jpg");
      }

      const warehouseMarkup = renderToStaticMarkup(createElement(SeDollPdpFreebieBlock, {
        product: product("sedoll-tracy-b-160cm-c-cup-tpe-companion-doll-1suv1-rts-us", { stockStatus: "ready_to_ship" })
      }));
      expect(warehouseMarkup).toMatch(/data-se-pdp-promotion-banner[^>]*><img[^>]+width="1920"[^>]+height="750"/);
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders all four offer blocks and the warehouse note on the promo index", () => {
    vi.setSystemTime(duringPromotion);
    try {
      const markup = renderToStaticMarkup(createElement(SeDollPromoIndexCards));
      expect(markup.match(/<article/g)).toHaveLength(4);
      expect(markup).toContain("SE Doll TPE / STPE custom-order bonuses");
      expect(markup).toContain("SE Doll Silicone Pro custom offer");
      expect(markup).toContain("SE Doll silicone torso custom offer");
      expect(markup).toContain("SE Doll US / EU warehouse offer");
      expect(markup).toContain("sold at the price without body makeup");
    } finally {
      vi.useRealTimers();
    }
  });

  it("puts only 10% off and free skin texture on every silicone warehouse handle", () => {
    for (const handle of handleData.silicone_rts_handles) {
      const offer = seDollSeptemberOfferForProduct(
        product(handle, { stockStatus: "ready_to_ship" }),
        duringPromotion
      );
      expect(offer?.kind, handle).toBe("warehouse_silicone");
      expect(offer?.discounts, handle).toEqual(["10% off this ready-to-ship warehouse doll"]);
      expect(offer?.included, handle).toEqual(["Free realistic skin texture"]);
      expect(offer?.makeupPriceNote, handle).toBeUndefined();
      expect(offer?.included, handle).not.toContain("Free STPE upgrade");
      expect(offer?.included, handle).not.toContain("Free Loose Joint System");
    }
  });

  it("keeps warehouse and custom messages mutually exclusive across every handle", () => {
    for (const handle of [...handleData.tpe_custom_handles, ...handleData.silicone_pro_custom_handles]) {
      const offer = seDollSeptemberOfferForProduct(product(handle), duringPromotion);
      expect(offer?.kind, handle).not.toMatch(/^warehouse_/);
      expect(offer?.makeupPriceNote, handle).toBeUndefined();
    }
    for (const handle of [...handleData.tpe_rts_handles, ...handleData.silicone_rts_handles]) {
      const offer = seDollSeptemberOfferForProduct(product(handle, { stockStatus: "ready_to_ship" }), duringPromotion);
      expect(offer?.kind, handle).toMatch(/^warehouse_/);
      expect(offer?.included, handle).not.toContain("Free EVO skeleton");
      expect(offer?.included, handle).not.toContain("Free gel breasts");
      expect(offer?.included, handle).not.toContain("Free Loose Joint System");
    }
  });

  it("never shows an offer on the skipped Sophie Lane handle", () => {
    expect(seDollSeptemberOfferForProduct(product(handleData.skip_handles[0]), duringPromotion)).toBeNull();
  });

  it("renders Loose Joint System art and limitations only for eligible custom full dolls", () => {
    vi.setSystemTime(duringPromotion);
    try {
      const customMarkup = renderToStaticMarkup(createElement(SeDollPdpFreebieBlock, {
        product: product("sedoll-cecile-167cm-g-cup-tpe-companion-doll-bek49")
      }));
      const rtsMarkup = renderToStaticMarkup(createElement(SeDollPdpFreebieBlock, {
        product: product("sedoll-tracy-b-160cm-c-cup-tpe-companion-doll-1suv1-rts-us", { stockStatus: "ready_to_ship" })
      }));

      expect(customMarkup).toContain("Free Loose Joint System");
      expect(customMarkup).toContain("%2Fpromo%2Fse-doll%2Ffactory-Loose-Joints-1200x900.jpg");
      expect(customMarkup).toContain("/promo/se-doll/factory-Loose-Joints-1080x1350.jpg");
      expect(customMarkup).toContain("Not torsos · Not ready to ship");
      expect(customMarkup).toContain("less support for unsupported standing, sitting, and held poses");
      expect(rtsMarkup).not.toContain("Loose Joint System");
      expect(rtsMarkup).not.toContain("factory-Loose-Joints");
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows Loose Joint System copy on the promo index and SE Doll brand banner", () => {
    vi.setSystemTime(duringPromotion);
    try {
      const promoMarkup = renderToStaticMarkup(createElement(SeDollPromoIndexCards));
      const brandMarkup = renderToStaticMarkup(createElement(SeDollBrandPromotionBanner));

      expect(promoMarkup.match(/Free Loose Joint System/g)).toHaveLength(2);
      expect(promoMarkup.match(/data-loose-joint-promotion-banner/g)).toHaveLength(2);
      expect(promoMarkup.match(/factory-Loose-Joints-1080x1350\.jpg/g)).toHaveLength(2);
      expect(promoMarkup.match(/alt="SE Doll factory promotion for the 4-Limb Loose Joint System/g)).toHaveLength(2);
      expect(promoMarkup).not.toContain("Option-Loose-Joints.jpg");
      expect(promoMarkup).not.toContain("4-limb-loose-joint.jpg");
      expect(brandMarkup).toContain("free Loose Joint System");
      expect(brandMarkup).toContain("Torsos and ready-to-ship dolls are excluded");
    } finally {
      vi.useRealTimers();
    }
  });

  it("publishes for launch and expires at the Pacific cutoff", () => {
    expect(isSeDollSeptemberPromotionVisible(new Date("2026-08-30T00:00:00.000Z"))).toBe(true);
    expect(isSeDollSeptemberPromotionVisible(duringPromotion)).toBe(true);
    expect(isSeDollSeptemberPromotionVisible(new Date("2026-10-01T00:00:00.000Z"))).toBe(true);
    expect(isSeDollSeptemberPromotionVisible(new Date("2026-10-01T07:00:00.000Z"))).toBe(false);
  });
});
