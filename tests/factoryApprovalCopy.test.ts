import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const publicSources = [
  "app/agent-index.json/route.ts",
  "app/factory-photos/ArchiveGallery.tsx",
  "app/factory-photos/page.tsx",
  "app/how-ordering-works/page.tsx",
  "app/learn/[slug]/page.tsx",
  "app/sitemap-images.xml/route.ts",
  "components/factory-approval/FactoryApprovalPreview.tsx",
  "lib/catalog/collectionSeo.ts"
].map((file) => fs.readFileSync(path.join(process.cwd(), file), "utf8")).join("\n");

describe("factory approval archive copy", () => {
  it("uses the approved hero on the archive page and homepage block", () => {
    const hero = "4,000 factory builds. Same check you get before we ship.";
    expect(publicSources.split(hero)).toHaveLength(3);
    expect(publicSources).toContain("These are photos our team has approved on real custom orders.");
  });

  it.each([
    "not current DollWOW orders",
    "previous business",
    "Historical prior-team example",
    "prior-team",
    "prior business"
  ])("does not publish the retired framing: %s", (retiredCopy) => {
    expect(publicSources.toLowerCase()).not.toContain(retiredCopy.toLowerCase());
  });

  it("keeps the approved shopper limits", () => {
    expect(publicSources).toContain("Faces and customer details are removed.");
    expect(publicSources).toContain("not to choose a current SKU");
    expect(publicSources).toContain("Ready-to-ship orders may follow a different release process.");
    expect(publicSources).toContain("not a guarantee of hidden construction");
  });
});
