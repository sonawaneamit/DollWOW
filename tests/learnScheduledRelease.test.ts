import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildArticleStructuredData, getLearnAuthor, getLearningArticle, getLearningArticles,
  isLearningArticleVisible, learnArticleModifiedAt
} from "@/lib/learn/content";
import { searchSiteContent } from "@/lib/search/content";
import { getAgentKnowledgeRecords } from "@/lib/seo/agentKnowledge";
import { buildSitemapSegments } from "@/lib/seo/sitemapSegments";
import { GET as agentIndex } from "@/app/agent-index.json/route";
import { GET as llms } from "@/app/llms.txt/route";
import { GET as llmsText } from "@/app/llms/route";
import { GET as llmsJson } from "@/app/llms/json/route";
import { GET as markdown } from "@/app/markdown/[[...path]]/route";
import LearnArticlePage, { generateMetadata } from "@/app/learn/[slug]/page";
import LearnPage from "@/app/learn/page";

const virtual = vi.hoisted(() => ({ files: new Map<string, string>() }));
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs") & { default: typeof import("node:fs") }>();
  const path = await import("node:path");
  const drafts = path.join(process.cwd(), "content/learn/drafts");
  return { ...actual, default: {
    ...actual.default,
    existsSync: (file: string) => String(file) === drafts || actual.default.existsSync(file),
    readdirSync: (file: string, ...args: unknown[]) => String(file) === drafts
      ? [...virtual.files.keys()] : Reflect.apply(actual.default.readdirSync, actual.default, [file, ...args]),
    readFileSync: (file: string, ...args: unknown[]) => String(file).startsWith(`${drafts}${path.sep}`)
      ? virtual.files.get(path.basename(String(file)))! : Reflect.apply(actual.default.readFileSync, actual.default, [file, ...args])
  } };
});

function post(slug: string, status: string, publishedAt?: string, author = "editorial") {
  virtual.files.set(`${slug}.md`, `---\ntitle: ${slug}\nslug: ${slug}\nstatus: ${status}\nauthor: ${author}\nauthorDisplayName: Alex\nauthorTitle: Person signoff must not survive editorial attribution\nlastReviewed: 2026-01-01\n${publishedAt === undefined ? "" : `publishedAt: "${publishedAt}"\n`}---\n# ${slug}\n\nBy Alex\n\n## Quick Answer\n\nReleasefixture guidance.\n`);
}

beforeEach(() => virtual.files.clear());
afterEach(() => vi.unstubAllGlobals());

describe("Learning Center timed release", () => {
  const publishedAt = "2026-10-19T09:00:00+01:00";
  const release = Date.parse(publishedAt);

  it("hides a scheduled article one millisecond before release and exposes it exactly at release", () => {
    post("releasefixture", "scheduled", publishedAt);
    expect(getLearningArticles(release - 1)).toEqual([]);
    expect(getLearningArticle("releasefixture", release - 1)).toBeNull();
    expect(getLearningArticle("releasefixture", release)?.publishedAt).toBe(publishedAt);
    expect(getLearningArticles(release + 1).map((article) => article.slug)).toEqual(["releasefixture"]);
  });

  it.each([
    undefined, "", "not-a-date", "2026-10-19", "2026-10-19T08:00:00",
    "2026-02-30T08:00:00Z", "2026-13-01T08:00:00Z", "2026-10-19T25:00:00Z",
    "2026-10-19T08:00:00+25:00", "2026-10-19T08:00:00Z trailing"
  ])("fails closed for a scheduled timestamp %s", (value) => {
    post("releasefixture", "scheduled", value);
    expect(getLearningArticles(release)).toEqual([]);
    expect(getLearningArticle("releasefixture", release)).toBeNull();
  });

  it.each(["2026-10-19T08:00:00Z", "2026-10-19T03:00:00-05:00", "2026-10-19T08:00:00.000Z"])("compares timezone-aware timestamps by instant: %s", (value) => {
    expect(isLearningArticleVisible({ status: "scheduled", publishedAt: value }, release - 1)).toBe(false);
    expect(isLearningArticleVisible({ status: "scheduled", publishedAt: value }, release)).toBe(true);
  });

  it("preserves legacy production and fails closed for other statuses, future production, and invalid production timestamps", () => {
    post("legacy", "production", undefined, "alex");
    post("future", "production", publishedAt);
    post("invalid", "production", "invalid");
    for (const status of ["draft", "pending", "review", "", "Scheduled"]) post(`hidden-${status}`, status, publishedAt);
    expect(getLearningArticles(release - 1).map((article) => article.slug)).toEqual(["legacy"]);
    const legacy = getLearningArticle("legacy", release)!;
    expect(buildArticleStructuredData(legacy)).toMatchObject({ datePublished: "2026-01-01", author: { "@type": "Person", name: "Alex" } });
  });

  it("uses the actual publication date and an organization, never a fake person/profile or prior review date", () => {
    post("releasefixture", "scheduled", publishedAt);
    const article = getLearningArticle("releasefixture", release)!;
    expect(article.authorDisplayName).toBe("DollWOW Editorial");
    expect(article.body).not.toContain("By Alex");
    expect(getLearnAuthor("editorial")).toBeUndefined();
    const schema = buildArticleStructuredData(article);
    expect(schema).toMatchObject({ datePublished: publishedAt, dateModified: publishedAt, author: { "@type": "Organization", name: "DollWOW Editorial" } });
    expect(schema.author).not.toHaveProperty("jobTitle");
    expect(schema.author).not.toHaveProperty("image");
    expect(schema.author.url).not.toContain("/authors/");
    expect(learnArticleModifiedAt({ publishedAt, lastReviewed: "2026-10-20" })).toBe("2026-10-20");
  });

  it("keeps future posts out of search, sitemaps, knowledge, agent index and llms text", async () => {
    post("releasefixture-future", "scheduled", new Date(Date.now() + 3_600_000).toISOString());
    post("releasefixture-live", "scheduled", new Date(Date.now() - 3_600_000).toISOString());
    const outputs = [
      JSON.stringify(searchSiteContent("releasefixture", 50)),
      JSON.stringify(buildSitemapSegments([])["learn.xml"]),
      JSON.stringify(getAgentKnowledgeRecords()),
      await (await agentIndex()).text(),
      await llms().text(),
      await llmsText(new Request("https://dollwow.com/llms?query=releasefixture")).text(),
      await llmsJson(new Request("https://dollwow.com/llms/json?query=releasefixture")).text()
    ];
    for (const output of outputs) {
      expect(output).not.toContain("releasefixture-future");
      expect(output).toContain("releasefixture-live");
    }
  });

  it("returns an uncached Markdown 404 before release without fetching potentially cached HTML", async () => {
    post("releasefixture", "scheduled", new Date(Date.now() + 3_600_000).toISOString());
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const response = await markdown(new Request("https://dollwow.com/markdown/learn/releasefixture"), { params: Promise.resolve({ path: ["learn", "releasefixture"] }) });
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("renders the editorial organization without a person link, avatar, or implied Alex signoff", async () => {
    vi.stubGlobal("React", React);
    const publishedAt = new Date(Date.now() - 3_600_000).toISOString();
    post("releasefixture", "scheduled", publishedAt);
    const params = Promise.resolve({ slug: "releasefixture" });
    const html = renderToStaticMarkup(await LearnArticlePage({ params }));
    expect(html).toContain("By DollWOW Editorial");
    expect(html).toContain(`dateTime="${publishedAt}"`);
    expect(html).toContain('"@type":"Organization","name":"DollWOW Editorial"');
    expect(html).not.toContain("/authors/editorial");
    expect(html).not.toContain("/authors/alex");
    expect(html).not.toContain("By Alex");
    expect(html).not.toContain("Person signoff");
    const metadata = await generateMetadata({ params });
    expect(metadata.openGraph).toMatchObject({ publishedTime: publishedAt });
    const listing = renderToStaticMarkup(await LearnPage({ searchParams: Promise.resolve({}) }));
    expect(listing).toContain("DollWOW Editorial");
  });

  it("hides future article metadata and responds with notFound on the article page", async () => {
    post("releasefixture", "scheduled", new Date(Date.now() + 3_600_000).toISOString());
    const params = Promise.resolve({ slug: "releasefixture" });
    expect(await generateMetadata({ params })).toEqual({});
    await expect(LearnArticlePage({ params })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("fetches fresh canonical HTML for released Markdown without caching its response", async () => {
    post("releasefixture", "scheduled", new Date(Date.now() - 3_600_000).toISOString());
    const fetch = vi.fn().mockResolvedValue(new Response("<main><h1>Released guidance</h1><p>Releasefixture.</p></main>"));
    vi.stubGlobal("fetch", fetch);
    const response = await markdown(new Request("https://dollwow.com/markdown/learn/releasefixture"), { params: Promise.resolve({ path: ["learn", "releasefixture"] }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(fetch.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
    expect(fetch.mock.calls[0][1]).not.toHaveProperty("next");
  });

  it("accepts quoted timestamps in CRLF frontmatter", () => {
    post("releasefixture", "scheduled", publishedAt);
    virtual.files.set("releasefixture.md", virtual.files.get("releasefixture.md")!.replace(`"${publishedAt}"`, `'${publishedAt}'`).replaceAll("\n", "\r\n"));
    expect(getLearningArticle("releasefixture", release)?.publishedAt).toBe(publishedAt);
  });

  it("does not statically freeze the article or listing route and keeps retrieval response caches short", async () => {
    for (const file of ["app/learn/page.tsx", "app/learn/[slug]/page.tsx"]) {
      const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source).toContain('export const dynamic = "force-dynamic"');
      expect(source).not.toContain("generateStaticParams");
    }
    for (const response of [await agentIndex(), llms()]) {
      expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=60, must-revalidate");
    }
  });
});
