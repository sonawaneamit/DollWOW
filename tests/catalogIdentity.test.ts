import { describe, expect, it } from "vitest";
import { brandFromText, canonicalBrandValue } from "@/lib/catalog/brands";
import { buildProductIdentity, extractCupSize, extractHeadModel, extractHeightCm, normalizeMaterial } from "@/lib/catalog/identity";

describe("catalog brand canonicalization", () => {
  it("normalizes common brand aliases", () => {
    expect(canonicalBrandValue("Angel Kiss Dolls")).toBe("angelkiss");
    expect(canonicalBrandValue("Anglekiss Dolls")).toBe("angelkiss");
    expect(canonicalBrandValue("Iron Tech")).toBe("irontech");
    expect(canonicalBrandValue("Zellix")).toBe("zelex");
  });

  it("finds the longest useful brand match in product text", () => {
    expect(brandFromText("A new WM Dolls factory order")?.value).toBe("wm");
    expect(brandFromText("SE Doll Alba A 161cm F-Cup TPE Companion Doll")?.value).toBe("sedoll");
  });
});

describe("catalog product identity", () => {
  it("builds a stable identity from rewritten DollWow product data", () => {
    const identity = buildProductIdentity({
      handle: "wm-anae-156cm-h-cup-tpe-companion-doll-17j0e",
      title: "Anae 156cm H-Cup TPE Customizable Companion Doll",
      sourceTitle: "156cm/5ft1 H-cup TPE Sex Doll - Anae",
      sourceHandle: "156cm-5ft1-h-cup-tpe-sex-doll-anae",
      vendor: "DollWow",
      tags: ["wm", "wm-dolls", "custom"],
      extended: {
        brand: "WM Dolls",
        heightCm: 156,
        cupSize: "H",
        material: "TPE"
      }
    });

    expect(identity.key).toBe("wm__anae__156cm__h-cup__tpe");
    expect(identity.bodyKey).toBe("wm__anae__156cm__h-cup__tpe");
    expect(identity.modelName).toBe("Anae");
    expect(identity.warnings).toEqual([]);
  });

  it("adds a head model when source copy exposes the default head", () => {
    const identity = buildProductIdentity({
      title: "Anae 156cm H-Cup TPE Customizable Companion Doll",
      sourceTitle: "156cm/5ft1 H-cup TPE Sex Doll - Anae. This doll has WM Dolls head #233 & Tan Skin.",
      tags: ["wm", "wm-dolls"],
      extended: {
        brand: "WM Dolls",
        heightCm: 156,
        cupSize: "H",
        material: "TPE"
      }
    });

    expect(identity.bodyKey).toBe("wm__anae__156cm__h-cup__tpe");
    expect(identity.headModel).toBe("head-233");
    expect(identity.key).toBe("wm__anae__156cm__h-cup__tpe__head-233");
  });

  it("falls back to title parsing when metafields are missing", () => {
    const identity = buildProductIdentity({
      title: "Starpery Adele 153cm E-Cup Silicone Head Customizable Companion Doll",
      tags: ["starpery-dolls"]
    });

    expect(identity.brandValue).toBe("starpery");
    expect(identity.heightCm).toBe(153);
    expect(identity.cupSize).toBe("E");
    expect(identity.material).toBe("silicone-head");
    expect(identity.modelSlug).toBe("adele");
  });

  it("extracts common spec fragments", () => {
    expect(extractHeightCm("Alba A 161cm F-cup TPE")).toBe(161);
    expect(extractCupSize("Alba A 161cm F-cup TPE")).toBe("F");
    expect(extractCupSize("Mark 60cm NA-Cup companion")).toBeUndefined();
    expect(extractCupSize("Mark 60cm N/A-Cup companion")).toBeUndefined();
    expect(normalizeMaterial("Custom Silicone Head doll")).toBe("silicone-head");
    expect(extractHeadModel("This doll has WM Dolls head #233 & Tan Skin.")).toBe("head-233");
    expect(extractHeadModel("This doll has Irontech Dolls Silicone head T4.")).toBe("head-t4");
  });
});
