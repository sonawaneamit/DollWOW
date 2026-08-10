import { describe, expect, it } from "vitest";
import { getBrandAuthorization, isLiveAuthorizedBrand } from "@/lib/catalog/authorizations";

describe("catalog authorization matching", () => {
  it("uses the Irontech certificate for Real Lady", () => {
    const authorization = getBrandAuthorization("Real Lady");

    expect(authorization?.id).toBe("irontech");
    expect(authorization?.certificateIssuer).toBe("Irontech Dolls");
    expect(authorization?.certificateSrc).toBe("/images/authorizations/irontech-authorization.jpeg");
  });

  it("normalizes hyphenated canonical brand values", () => {
    expect(getBrandAuthorization("dolls-castle")?.id).toBe("dolls-castle");
    expect(getBrandAuthorization("il-doll")?.id).toBe("il-doll");
  });

  it("does not advertise an authorization section without authorization on file", () => {
    expect(isLiveAuthorizedBrand("Climax Doll")).toBe(false);
    expect(isLiveAuthorizedBrand("Ai-Tech")).toBe(false);
    expect(isLiveAuthorizedBrand("Zelex Dolls")).toBe(false);
  });
});
