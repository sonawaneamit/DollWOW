import { describe, expect, it } from "vitest";
import { compareOptionCoverage } from "../scripts/lib/option-coverage.mjs";

describe("source option coverage", () => {
  it("reports source-only groups and choices instead of treating existing prices as completion", () => {
    const stored = [{
      label: "Choose a Head",
      options: [{ label: "Head 8", priceDelta: 0 }, { label: "Head 9", priceDelta: 0 }]
    }];
    const source = [
      {
        label: "Choose a Head",
        options: [{ label: "Head 8", priceDelta: 0 }, { label: "Head 9", priceDelta: 0 }, { label: "Head 13", priceDelta: 0 }]
      },
      {
        label: "Eye Color",
        options: [{ label: "Brown", priceDelta: 0 }, { label: "Blue", priceDelta: 0 }]
      }
    ];

    expect(compareOptionCoverage(stored, source)).toMatchObject({
      complete: false,
      sourceGroupCount: 2,
      storedGroupCount: 1,
      missingSourceGroups: [{ label: "Eye Color", sourceOptionCount: 2 }],
      missingSourceOptions: [{ group: "Choose a Head", option: "Head 13" }]
    });
  });

  it("does not mark additional stored choices as missing source coverage", () => {
    const stored = [{
      label: "Skin Tone",
      options: [{ label: "White" }, { label: "Tan" }, { label: "Black" }]
    }];
    const source = [{
      label: "Skin Tone",
      options: [{ label: "White" }, { label: "Tan" }]
    }];

    const result = compareOptionCoverage(stored, source);
    expect(result.complete).toBe(true);
    expect(result.extraStoredOptions).toEqual([{ group: "Skin Tone", option: "Black" }]);
  });

  it("treats photographed and factory defaults as the same source choice", () => {
    const stored = [{
      label: "Eye Color",
      options: [{ label: "Factory default" }, { label: "Blue" }]
    }];
    const source = [{
      label: "Eye Color",
      options: [{ label: "No Change" }, { label: "Blue" }]
    }];

    expect(compareOptionCoverage(stored, source).complete).toBe(true);
  });
});
