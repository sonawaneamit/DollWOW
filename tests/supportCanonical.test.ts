import { describe, expect, it } from "vitest";
import { metadata } from "@/app/support/page";

describe("support canonical", () => {
  it("uses a fixed clean canonical independent of the reported product", () => {
    expect(metadata.alternates.canonical).toBe("/support");
  });
});
