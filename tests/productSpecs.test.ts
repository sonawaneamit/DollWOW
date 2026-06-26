import { describe, expect, it } from "vitest";
import { descriptionSpecs, detailedProductSpecs, productHeroIntro, productMeasurementSpecs } from "@/lib/catalog/productSpecs";
import { sampleProducts } from "@/lib/data/sample-products";

describe("product spec display helpers", () => {
  it("parses labeled body measurements from imported descriptions", () => {
    const specs = descriptionSpecs(
      "Height: 5 ft / 153 cm Weight: 98.1 lbs / 44.5 kg Bra Size: G-Cup Feet Length: 8 in / 20 cm Bust: 2 ft 7 in / 80 cm Waist: 1 ft 8 in / 52 cm Hip: 3 ft 1 in / 94 cm"
    );

    expect(specs).toEqual([
      { label: "Height", value: "5 ft / 153 cm" },
      { label: "Weight", value: "98.1 lbs / 44.5 kg" },
      { label: "Cup size", value: "G-Cup" },
      { label: "Feet Length", value: "8 in / 20 cm" },
      { label: "Bust", value: "2 ft 7 in / 80 cm" },
      { label: "Waist", value: "1 ft 8 in / 52 cm" },
      { label: "Hip", value: "3 ft 1 in / 94 cm" }
    ]);
  });

  it("uses full parsed description measurements before abbreviated numeric metafields", () => {
    const product = {
      ...sampleProducts[0],
      description: "Height: 5 ft 8 in / 172 cm Weight: 78.7 lbs / 35.7 kg Bra Size: E-Cup Bust: 2 ft 10 in / 86.5 cm",
      extended: {
        ...sampleProducts[0].extended,
        heightCm: 172,
        weightLb: 78.7,
        cupSize: "E-Cup"
      }
    };

    expect(productMeasurementSpecs(product)).toEqual(
      expect.arrayContaining([
        { label: "Height", value: "5 ft 8 in / 172 cm" },
        { label: "Weight", value: "78.7 lbs / 35.7 kg" }
      ])
    );
  });

  it("does not use raw measurement run-ons as hero intro", () => {
    const product = {
      ...sampleProducts[0],
      description: "Height: 5 ft / 153 cm Weight: 98.1 lbs / 44.5 kg Bra Size: G-Cup"
    };

    expect(productHeroIntro(product)).toContain("Ida Belle");
    expect(productHeroIntro(product)).not.toContain(product.title);
    expect(productHeroIntro(product)).not.toContain("Weight:");
  });

  it("treats remaining head and depth metadata as product details, not hero copy", () => {
    const product = {
      ...sampleProducts[0],
      description:
        "Shoulders Width: 1 ft 1 in / 33 cm Vagina Depth: 7 in / 17 cm Anus Depth: 7 in / 17 cm Oral Depth: N/A Brand: Dolls Castle This doll has Dolls Castle head #196."
    };

    const intro = productHeroIntro(product);

    expect(intro).toContain("Ida Belle");
    expect(intro).not.toContain(product.title);
    expect(intro).not.toContain("Vagina Depth:");
    expect(intro).not.toContain("head #196");
  });

  it("does not use import metadata summaries as hero copy", () => {
    const product = {
      ...sampleProducts[0],
      description:
        "Brand: Dolls Castle Material: TPE Weight: 98.1 lb Cup size: G-Cup Availability: Custom factory order Warehouse: Factory order Final availability, production options, and warehouse timing are confirmed by DollWow support."
    };

    const intro = productHeroIntro(product);

    expect(intro).toContain("Ida Belle");
    expect(intro).not.toContain(product.title);
    expect(intro).not.toContain("Brand:");
    expect(intro).not.toContain("Availability:");
    expect(detailedProductSpecs(product)).toContainEqual({ label: "Warehouse", value: "Factory order" });
  });

  it("does not let supplier copy leak into parsed brand values", () => {
    const product = {
      ...sampleProducts[0],
      description:
        "Height: 5 ft 8 in / 172 cm Brand: Zelex Dolls This doll has Zelex Doll head Silicone #ZXE201-1 & Light Tan Skin. We provide a wide selection of free options."
    };

    expect(detailedProductSpecs(product)).toContainEqual({ label: "Brand", value: product.extended.brand });
    expect(detailedProductSpecs(product)).not.toContainEqual(
      expect.objectContaining({
        label: "Brand",
        value: expect.stringContaining("This doll has")
      })
    );
  });

  it("builds measurement rows with confirm states for important missing specs", () => {
    const product = {
      ...sampleProducts[0],
      description: "Bust: 2 ft 7 in / 80 cm Waist: 1 ft 8 in / 52 cm Hip: 3 ft 1 in / 94 cm"
    };

    expect(productMeasurementSpecs(product)).toEqual(
      expect.arrayContaining([
        { label: "Height", value: "5 ft 8 in / 172 cm" },
        { label: "Weight", value: "79.0 lb / 35.8 kg" },
        { label: "Cup size", value: "E" },
        { label: "Bust", value: "2 ft 7 in / 80 cm" },
        { label: "Waist", value: "1 ft 8 in / 52 cm" },
        { label: "Hip", value: "3 ft 1 in / 94 cm" }
      ])
    );

    expect(
      productMeasurementSpecs({
        ...sampleProducts[0],
        description: "",
        extended: { ...sampleProducts[0].extended, heightCm: undefined, weightLb: undefined, cupSize: undefined }
      })
    ).toEqual(
      expect.arrayContaining([
        { label: "Height", value: "Confirm with team" },
        { label: "Weight", value: "Confirm with team" },
        { label: "Cup size", value: "Confirm with team" }
      ])
    );
  });

  it("prefers structured full measurements over abbreviated imported fields", () => {
    const product = {
      ...sampleProducts[0],
      description: "",
      extended: {
        ...sampleProducts[0].extended,
        heightCm: 172,
        weightLb: 78.7,
        cupSize: "E-Cup",
        measurements: {
          Height: "5 ft 8 in / 172 cm",
          Weight: "78.7 lbs / 35.7 kg",
          "Cup size": "E-Cup",
          "Feet Length": "8 in / 21 cm",
          Bust: "2 ft 10 in / 86.5 cm",
          "Legs Length": "2 ft 9 in / 84.5 cm",
          Waist: "1 ft 11 in / 57.5 cm",
          "Arms Length": "2 ft 4 in / 70.5 cm",
          Hip: "3 ft 1 in / 94.5 cm",
          "Shoulders Width": "1 ft 3 in / 38 cm",
          "Vagina Depth": "6 in / 15 cm",
          "Anus Depth": "6 in / 15 cm",
          "Oral Depth": "3 in / 8 cm"
        }
      }
    };

    expect(productMeasurementSpecs(product)).toEqual([
      { label: "Height", value: "5 ft 8 in / 172 cm" },
      { label: "Weight", value: "78.7 lbs / 35.7 kg" },
      { label: "Cup size", value: "E-Cup" },
      { label: "Bust", value: "2 ft 10 in / 86.5 cm" },
      { label: "Waist", value: "1 ft 11 in / 57.5 cm" },
      { label: "Hip", value: "3 ft 1 in / 94.5 cm" },
      { label: "Shoulders Width", value: "1 ft 3 in / 38 cm" },
      { label: "Feet Length", value: "8 in / 21 cm" },
      { label: "Arms Length", value: "2 ft 4 in / 70.5 cm" },
      { label: "Legs Length", value: "2 ft 9 in / 84.5 cm" },
      { label: "Vagina Depth", value: "6 in / 15 cm" },
      { label: "Anus Depth", value: "6 in / 15 cm" },
      { label: "Oral Depth", value: "3 in / 8 cm" }
    ]);
  });
});
