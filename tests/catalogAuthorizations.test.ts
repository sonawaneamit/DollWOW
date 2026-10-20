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

  it("uses the Ai-Tech authorization certificate for its brand collection", () => {
    const authorization = getBrandAuthorization("AI Tech");

    expect(authorization?.id).toBe("ai-tech");
    expect(authorization?.certificateSrc).toBe("/images/authorizations/ai-tech-authorization.png");
    expect(isLiveAuthorizedBrand("Ai-Tech")).toBe(true);
  });

  it("shows the Climax Doll and HR Doll certificates", () => {
    expect(isLiveAuthorizedBrand("Climax Doll")).toBe(true);
    expect(getBrandAuthorization("Climax Doll")?.certificateSrc).toBe("/images/authorizations/climax-doll-authorized.jpg");
    expect(getBrandAuthorization("HR Dolls")?.status).toBe("certificate");
  });

  it("does not advertise an authorization section without authorization on file", () => {
    expect(isLiveAuthorizedBrand("Zelex Dolls")).toBe(false);
    expect(isLiveAuthorizedBrand("Lusandy")).toBe(false);
    expect(getBrandAuthorization("Lusandy")).toBeNull();
  });
});
