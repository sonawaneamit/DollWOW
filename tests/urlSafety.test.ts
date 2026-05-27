import { describe, expect, it } from "vitest";
import { validatePublicHttpUrl } from "@/lib/compare/urlSafety";

describe("validatePublicHttpUrl", () => {
  it("allows public https URLs", () => {
    expect(validatePublicHttpUrl("https://example.com/product").ok).toBe(true);
  });

  it("blocks private network URLs", () => {
    expect(validatePublicHttpUrl("http://127.0.0.1:3000").ok).toBe(false);
    expect(validatePublicHttpUrl("http://192.168.0.4/product").ok).toBe(false);
  });

  it("blocks unsafe protocols", () => {
    expect(validatePublicHttpUrl("file:///etc/passwd").ok).toBe(false);
  });
});
