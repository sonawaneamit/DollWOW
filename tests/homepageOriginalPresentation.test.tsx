import React from "react";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DollVueHomepageStrip } from "@/components/dollvue/DollVueHomepageStrip";

const home = fs.readFileSync("components/HomeAlive.tsx", "utf8");
const css = fs.readFileSync("app/globals.css", "utf8");
const original = execFileSync("git", ["show", "59f0fd6b:components/HomeAlive.tsx"], { encoding: "utf8" });

describe("original homepage presentation", () => {
  it("restores the original spotlight timer and manual selection", () => {
    const effect = (source: string) => source.slice(source.indexOf("  useEffect(() => {", source.indexOf("useHomeMotion();")), source.indexOf("  const activeProduct"));
    expect(effect(home)).toBe(effect(original));
    expect(home).toContain("onClick={() => setActiveSpot(index)}");
  });
  it("does not add rotation controls or change thumbnail rail geometry", () => {
    expect(home).not.toMatch(/Pause|Resume|spotlightPaused|home-spot__controls/);
    expect(css).not.toMatch(/home-spot__rotation|home-spot__controls/);
  });
  it("keeps original banner artwork without a new visible CTA", () => {
    const html = renderToStaticMarkup(<DollVueHomepageStrip />);
    expect(html).toContain('href="/dollvue"');
    expect(html).not.toContain("Try DollVue");
    expect(html).not.toContain("<span");
    expect(css).not.toContain("home-dollvue-strip__cta");
  });
});
