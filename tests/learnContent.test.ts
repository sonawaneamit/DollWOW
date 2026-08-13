import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildArticleFaqStructuredData, buildArticleStructuredData, getLearningArticle, getLearningArticles } from "@/lib/learn/content";

describe("Learning Center content ownership", () => {
  it("keeps every non-production article out of public routes", () => {
    expect(getLearningArticle("zelex-dolls-buying-guide")).toBeNull();
  });

  it("publishes the approved silicone manufacturing guide with visual and source evidence", () => {
    const article = getLearningArticle("how-silicone-sex-dolls-are-made");
    expect(article?.featuredImage).toBe("/images/learn/how-silicone-sex-dolls-are-made.webp");
    expect(article?.body).toContain("The Manufacturing Process at a Glance");
    expect(article?.body).toContain("https://www.irontechdoll.com/blog/how-to-make-a-sex-doll/");
    expect(article?.body).toContain("Exact methods vary by manufacturer and product");
    expect(article?.body).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
    expect(buildArticleFaqStructuredData(article!)?.mainEntity).toHaveLength(12);
  });

  it("publishes the approved breast-options guide without turning supplier labels into standards", () => {
    const article = getLearningArticle("sex-doll-breast-options");
    expect(article?.featuredImage).toBe("/images/learn/sex-doll-breast-options.webp");
    expect(article?.body).toContain("Cup size describes a proportion, not firmness");
    expect(article?.body).toContain("https://www.tantaly.com/pages/breast-options-guide-for-sex-doll-torsos");
    expect(article?.body).toContain("These are manufacturer option names, not universal technical standards");
    expect(article?.body).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
    expect(buildArticleFaqStructuredData(article!)?.mainEntity).toHaveLength(12);
  });

  it("publishes the approved Piper guide with qualified adult intent and visual evidence", () => {
    const article = getLearningArticle("piper-dolls-buying-guide");
    expect(article?.primaryKeyword).toBe("piper sex doll");
    expect(article?.featuredImage).toBe("/images/learn/piper-dolls-buying-guide.webp");
    expect(article?.body).toContain("The unqualified phrase “Piper doll” is ambiguous");
    expect(article?.body).toContain("https://www.piperdolls.com/");
    expect(article?.body).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
  });

  it("keeps the best TPE guide distinct from the broad best-dolls guide", () => {
    const tpeGuide = getLearningArticle("best-tpe-sex-dolls");
    const broadGuide = getLearningArticle("best-sex-dolls");

    expect(tpeGuide?.primaryKeyword).toBe("best TPE sex dolls");
    expect(tpeGuide?.body).toContain("Six Current TPE Starting Points");
    expect(broadGuide?.secondaryKeywords).not.toContain("best TPE sex doll");
  });

  it("publishes the broad best-dolls guide with dated catalog evidence and buyer routing", () => {
    const article = getLearningArticle("best-sex-dolls");
    expect(article?.title).toContain("2026");
    expect(article?.body).toContain("2,615 current full-size listings");
    expect(article?.body).toContain("[Lightweight dolls](/shop/lightweight-sex-dolls)");
    expect(article?.body).toContain("[underlying DollWow dataset](/datasets/sex-doll-size-weight-2026.json)");
    expect(article?.body).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
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
    expect(article?.body).toContain("https://pmc.ncbi.nlm.nih.gov/articles/PMC11176238/");
    expect(article?.body).toContain("https://pmc.ncbi.nlm.nih.gov/articles/PMC12753550/");
    expect(article?.body).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
    expect(buildArticleFaqStructuredData(article!)?.mainEntity).toHaveLength(10);
  });

  it("keeps focused guide search descriptions concise and customer-forward", () => {
    for (const slug of ["best-sex-dolls", "sex-doll-size-weight-guide"]) {
      const article = getLearningArticle(slug);
      expect(article?.description.length, slug).toBeLessThanOrEqual(160);
      expect(article?.description, slug).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
    }
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
    expect(article?.body).toContain("https://www.consumerfinance.gov/ask-cfpb/how-can-i-get-a-refund-on-a-product-or-service-i-purchased-with-my-credit-card-en-1969/");
  });

  it("exposes official evidence on major brand guides without competitor retailers", () => {
    const sourceExpectations = {
      "irontech-dolls-buying-guide": "https://www.irontechdoll.com/about-us/",
      "wm-dolls-buying-guide": "https://www.zs.gov.cn/ywb/economy/content/post_2567159.html",
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

  it("publishes external evidence as machine-readable article citations", () => {
    const article = getLearningArticle("sex-doll-guide")!;
    const schema = buildArticleStructuredData(article);
    expect(schema.citation).toEqual(expect.arrayContaining([
      "https://www.irontechdoll.com/about-us/",
      "https://www.starpery.com/starpery-weight-reduction-tech",
      "https://www.sedoll.com/about-sedoll/",
      "https://www.tantaly.com/pages/about-us",
      "https://www.erovenus.com/sex-doll-care/"
    ]));
    expect(schema.citation).not.toContain("https://dollwow.com/buyer-protection");
  });

  it("links the size-and-weight guide to its machine-readable dataset", () => {
    const page = fs.readFileSync(path.join(process.cwd(), "app/learn/[slug]/page.tsx"), "utf8");
    const agentIndex = fs.readFileSync(path.join(process.cwd(), "app/agent-index.json/route.ts"), "utf8");
    const llms = fs.readFileSync(path.join(process.cwd(), "app/llms.txt/route.ts"), "utf8");
    const sitemap = fs.readFileSync(path.join(process.cwd(), "app/sitemap.ts"), "utf8");
    expect(page).toContain("/datasets/sex-doll-size-weight-2026.json");
    expect(page).toContain('"@type": "Dataset"');
    expect(agentIndex).toContain("/datasets/sex-doll-size-weight-2026.json");
    expect(llms).toContain("/datasets/sex-doll-size-weight-2026.json");
    expect(sitemap).toContain("/datasets/sex-doll-size-weight-2026.json");
  });
});
