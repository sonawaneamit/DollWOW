import { describe, expect, it } from "vitest";
import { cleanNote } from "@/components/DollDetailsCard";

describe("DollDetailsCard customer-facing notes", () => {
  it("replaces internal source-store language with customer help copy", () => {
    expect(cleanNote("Price follows the reviewed Rosemary Real Lady height-based catalog logic.")).toBe(
      "Questions about this configuration? Our team can confirm the details before you order."
    );
  });

  it("preserves useful customer-facing notes", () => {
    expect(cleanNote("Custom selections are confirmed before production begins.")).toBe(
      "Custom selections are confirmed before production begins."
    );
  });
});
