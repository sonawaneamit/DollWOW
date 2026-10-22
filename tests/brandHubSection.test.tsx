import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BrandHubSection, usesCompactBrandLayout } from "@/components/BrandHubSection";

describe("brand hub compact browsing", () => {
  it("preserves the four released sprint hubs in every deployment", () => {
    for (const deployment of ["production", "preview", "development"]) {
      for (const brand of ["irontech", "wm", "sedoll", "starpery"]) {
        expect(usesCompactBrandLayout(brand, deployment)).toBe(true);
      }
    }
  });

  it("stages only the Dolls Castle batch-A layout on preview", () => {
    expect(usesCompactBrandLayout("dolls-castle", "preview")).toBe(true);
    for (const deployment of ["production", "development", ""]) {
      expect(usesCompactBrandLayout("dolls-castle", deployment)).toBe(false);
    }
    for (const brand of ["lusandy", "evas", "fanreal", "funwest", "dolls-castle-other"]) {
      expect(usesCompactBrandLayout(brand, "preview")).toBe(false);
    }
  });

  it("keeps all content in native collapsed HTML without JavaScript", () => {
    const html = renderToStaticMarkup(<BrandHubSection compact id="brand-comparison-heading" comparison eyebrow="Brand comparison" title="How to evaluate Irontech"><p>Unchanged comparison facts</p></BrandHubSection>);
    expect(html).toContain('<details class="collection-disclosure">');
    expect(html).not.toContain(" open");
    expect(html).toContain('<h2 id="brand-comparison-heading">');
    expect(html).toContain("Unchanged comparison facts");
    expect(html).toContain("<summary>");
  });

  it("retains the previous framed comparison for unreviewed brands", () => {
    const html = renderToStaticMarkup(<BrandHubSection compact={false} comparison id="comparison" eyebrow="Brand comparison" title="How to evaluate WM"><table><tbody><tr><td>Original facts</td></tr></tbody></table></BrandHubSection>);
    expect(html).toContain('class="mb-8 overflow-hidden rounded-[8px] border border-gold-500/14 bg-ink-900/64"');
    expect(html).toContain('class="border-b border-gold-500/12 p-5"');
    expect(html).toContain('aria-labelledby="comparison"');
    expect(html).not.toContain("<details");
    expect(html).toContain("Original facts");
  });

  it("retains the previous notes and FAQ headings for unreviewed brands", () => {
    const notes = renderToStaticMarkup(<BrandHubSection compact={false} id="notes" eyebrow="Buyer notes" title="What to confirm"><p>Notes</p></BrandHubSection>);
    expect(notes).toContain('class="max-w-3xl"');
    expect(notes).toContain('class="mt-2 text-2xl font-semibold text-ivory-50"');
    const faq = renderToStaticMarkup(<BrandHubSection compact={false} id="faq" title="Buying questions"><p>FAQ</p></BrandHubSection>);
    expect(faq).not.toContain("max-w-3xl");
    expect(faq).toContain('<h2 id="faq" class="text-2xl font-semibold text-ivory-50">');
  });
});
