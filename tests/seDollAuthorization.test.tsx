import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AuthorizedVendorsPage, { metadata } from "@/app/authorized-vendors/page";
import { BrandAuthorizationCard } from "@/components/BrandAuthorizationCard";
import { brandAuthorizations, getBrandAuthorization } from "@/lib/catalog/authorizations";

const statement = "Certified SE Doll reseller. Formal authorization certificate pending our first order.";

describe("SE Doll pending certificate disclosure", () => {
  it("declares the approvals directory's existing canonical owner", () => {
    expect(metadata.alternates?.canonical).toBe("/authorized-vendors");
  });
  it.each(["sedoll", "se-doll", "SE Doll"])("matches %s without inventing a certificate or letter", brand => {
    const entry = getBrandAuthorization(brand)!;
    expect(entry.status).toBe("certificate-pending");
    expect(entry.certificatePendingStatement).toBe(statement);
    expect(entry.certificateSrc).toBeUndefined();
    expect(entry.certificatePreviewSrc).toBeUndefined();
    expect(entry.confirmationSrc).toBeUndefined();
    expect(entry.confirmationDate).toBeUndefined();
  });

  it.each(["brand", "product"] as const)("discloses the pending document in the %s card", variant => {
    const html = renderToStaticMarkup(<BrandAuthorizationCard brand="sedoll" variant={variant} />);
    expect(html).toContain(statement);
    expect(html).toContain("Certificate pending");
    expect(html).not.toContain("View certificate");
    expect(html).not.toContain("Brand confirmation is on file");
    expect(html).not.toContain("sedoll.com/resellers");
    expect(html).not.toContain("<img");
  });

  it("keeps SE separate from certificate files and reuses the same directory disclosure", () => {
    const html = renderToStaticMarkup(<AuthorizedVendorsPage />);
    expect(html).toContain('id="pending-certificates-heading"');
    expect(html).toContain('id="se-doll"');
    expect(html).toContain(statement);
    expect(brandAuthorizations.filter(entry => entry.status === "certificate").some(entry => entry.brandValue === "sedoll")).toBe(false);
    expect(getBrandAuthorization("erovenus")?.certificateSrc).toBe("/images/authorizations/erovenus-authorized.jpg");
  });
});
