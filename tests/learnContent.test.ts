import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildArticleFaqStructuredData, getLearningArticle, getLearningArticles } from "@/lib/learn/content";

describe("Learning Center content ownership", () => {
  it("keeps every non-production article out of public routes", () => {
    expect(getLearningArticle("piper-dolls-buying-guide")).toBeNull();
    expect(getLearningArticle("how-silicone-sex-dolls-are-made")).toBeNull();
    expect(getLearningArticle("zelex-dolls-buying-guide")).toBeNull();
  });

  it("keeps the best TPE guide distinct from the broad best-dolls guide", () => {
    const tpeGuide = getLearningArticle("best-tpe-sex-dolls");
    const broadGuide = getLearningArticle("best-sex-dolls");

    expect(tpeGuide?.primaryKeyword).toBe("best TPE sex dolls");
    expect(tpeGuide?.body).toContain("Six Current TPE Starting Points");
    expect(broadGuide?.secondaryKeywords).not.toContain("best TPE sex doll");
  });

  it("publishes a complete FAQ schema for the best TPE guide", () => {
    const article = getLearningArticle("best-tpe-sex-dolls");
    expect(article).not.toBeNull();
    const faq = buildArticleFaqStructuredData(article!);
    expect(faq?.mainEntity).toHaveLength(10);
  });

  it("does not leak internal production language into the public guide", () => {
    const article = getLearningArticle("best-tpe-sex-dolls");
    expect(article?.body).not.toMatch(/PDP|SERP|search volume|crawlable/i);
  });

  it("keeps silicone education separate from the silicone collection", () => {
    const article = getLearningArticle("silicone-sex-doll-guide");
    expect(article?.primaryKeyword).toBe("what is a silicone sex doll");
    expect(article?.body).toContain("A silicone head does not make a doll full silicone");
    expect(article?.body).toContain("Browse current [full-silicone sex dolls](/shop/silicone)");
    expect(buildArticleFaqStructuredData(article!)?.mainEntity).toHaveLength(12);
  });

  it("publishes the store-selection guide as customer-facing buying guidance", () => {
    const article = getLearningArticle("best-sex-doll-stores");
    expect(article?.primaryKeyword).toBe("sex doll stores");
    expect(article?.body).toContain("The Eight-Point Store Check");
    expect(article?.body).toContain("Most approved requests can be added within 4 to 6 hours");
    expect(article?.body).not.toMatch(/PDP|SERP|crawlable|search volume|keyword cluster/i);
    expect(buildArticleFaqStructuredData(article!)?.mainEntity).toHaveLength(12);
  });

  it("publishes one distinct size-and-weight owner with dated methodology", () => {
    const article = getLearningArticle("sex-doll-size-weight-guide");
    expect(article?.primaryKeyword).toBe("sex doll sizes");
    expect(article?.body).toContain("current full-size DollWow listings");
    expect(article?.body).toContain("unit of analysis is a catalog listing");
    expect(article?.body).toContain("[sex doll cost guide](/learn/sex-doll-cost)");
    expect(article?.body).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
    expect(buildArticleFaqStructuredData(article!)?.mainEntity).toHaveLength(10);
  });

  it("places the size-and-weight guide directly after the flagship buyer guide", () => {
    expect(getLearningArticles().slice(0, 2).map((article) => article.slug)).toEqual([
      "sex-doll-guide",
      "sex-doll-size-weight-guide"
    ]);
  });

  it("links established buyer guides to the size-and-weight owner", () => {
    for (const slug of ["sex-doll-guide", "mini-sex-dolls", "sex-doll-storage", "tpe-vs-silicone-sex-dolls", "male-sex-doll-buying-guide"]) {
      const article = getLearningArticle(slug);
      expect(article?.body, slug).toContain("/learn/sex-doll-size-weight-guide");
    }
    const collectionSeo = fs.readFileSync(path.join(process.cwd(), "lib/catalog/collectionSeo.ts"), "utf8");
    expect(collectionSeo).toContain('{ label: "Read the size and weight guide", href: "/learn/sex-doll-size-weight-guide" }');
  });

  it("exposes primary manufacturer and DollWow policy sources in the flagship guide", () => {
    const article = getLearningArticle("sex-doll-guide");
    expect(article?.body).toContain("## Primary Sources And Review Standard");
    expect(article?.body).toContain("https://www.irontechdoll.com/about-us/");
    expect(article?.body).toContain("https://www.starpery.com/starpery-weight-reduction-tech");
    expect(article?.body).toContain("https://www.sedoll.com/about-sedoll/");
    expect(article?.body).toContain("https://www.tantaly.com/pages/about-us");
    expect(article?.body).toContain("https://www.erovenus.com/sex-doll-care/");
    expect(article?.body).toContain("[Buyer Protection](/buyer-protection)");
    expect(article?.body).toContain("[Care 365](/care-for-life)");
  });

  it("exposes official evidence on major brand guides without competitor retailers", () => {
    const sourceExpectations = {
      "irontech-dolls-buying-guide": "https://www.irontechdoll.com/about-us/",
      "starpery-dolls-buying-guide": "https://www.starpery.com/starpery-weight-reduction-tech",
      "tantaly-buying-guide": "https://www.tantaly.com/pages/about-us",
      "se-doll-buying-guide": "https://www.sedoll.com/about-sedoll/",
      "erovenus-dolls-review-guide": "https://www.erovenus.com/about-us/"
    };
    for (const [slug, source] of Object.entries(sourceExpectations)) {
      const body = getLearningArticle(slug)?.body;
      expect(body, slug).toContain(source);
      expect(body, slug).not.toMatch(/rosemarydoll\.com|yourdoll\.com|siliconwives\.com|joylovedolls\.com/i);
    }
  });
});
