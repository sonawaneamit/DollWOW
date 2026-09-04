import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

describe("Fanreal brand hub", () => {
  it("renders the official store CTA as a safe external link", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/brands/[brand]/page.tsx"), "utf8");

    expect(source).toContain("href={profile.officialStoreHref}");
    expect(source).toContain('target="_blank"');
    expect(source).toContain('rel="noreferrer"');
  });

  it("keeps the optional short redirect on the official Fanreal domain", async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toEqual(
      expect.arrayContaining([
        {
          source: "/go/fanreal",
          destination: "https://www.fanreal.com/",
          permanent: false
        }
      ])
    );
  });
});
