import React from "react";
import fs from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { parse } from "node-html-parser";
import { describe, expect, it } from "vitest";
import { featureGuideMedia } from "@/components/FeatureGuideMedia";
import { MarkdownContent } from "@/components/MarkdownContent";
import { getLearningArticle } from "@/lib/learn/content";

describe("credited manufacturer feature media", () => {
  for (const [slug, count] of [["irontech-head-types-ros-max", 2], ["sex-doll-skeleton-options", 1]] as const) {
    it(`renders ${slug} media in initial HTML with local assets and native playback`, () => {
      const article = getLearningArticle(slug)!;
      const insertions = featureGuideMedia(slug);
      for (const insertion of insertions) expect(article.body).toContain(`## ${insertion.afterHeading}\n`);
      const html = renderToStaticMarkup(<MarkdownContent markdown={article.body} sectionInsertions={insertions} />);
      const dom = parse(html);
      expect(dom.querySelectorAll("video")).toHaveLength(count);
      for (const video of dom.querySelectorAll("video")) {
        expect(video.hasAttribute("controls")).toBe(true);
        expect(video.hasAttribute("autoplay")).toBe(false);
        expect(video.getAttribute("preload")).toBe("none");
        expect(video.getAttribute("aria-label")).toBeTruthy();
        expect(dom.querySelector(`#${video.getAttribute("aria-describedby")}`)?.text).toContain("Media: Irontech");
        for (const asset of [video.getAttribute("poster"), video.querySelector("source")?.getAttribute("src")]) {
          expect(asset).toMatch(/^\/images\/learn\/irontech-features\//);
          expect(fs.statSync(`public${asset}`).size).toBeGreaterThan(1000);
        }
      }
      expect(dom.querySelectorAll("figcaption a").every(a => a.getAttribute("href")?.startsWith("https://www.irontechdoll.com/"))).toBe(true);
      expect(html).not.toContain("nitrocdn");
      if (slug === "irontech-head-types-ros-max") {
        expect(html).toContain("S1 ROS is on the left and S31 ROS MAX is on the right");
        expect(html).toContain("not identified standard head codes");
        expect(dom.querySelector("img[alt*='S31 ROS MAX']")).toBeTruthy();
      } else expect(html).toContain("does not show the safe range of a finished doll");
    });
  }
  it("does not add feature media to unrelated guides", () => {
    expect(featureGuideMedia("sex-doll-guide")).toEqual([]);
    expect(featureGuideMedia("implanted-hair-vs-wig")).toEqual([]);
  });
});
