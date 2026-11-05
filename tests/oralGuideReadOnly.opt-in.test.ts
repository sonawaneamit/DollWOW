import { describe, expect, it } from "vitest";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { getProductByHandle } from "@/lib/shopify/storefront";
import { getCustomizationConfig } from "@/lib/customization/configs";

const handles = [
  "irontech-molly-166cm-2-0-s44-ros-max-silicone-doll",
  "dolls-castle-galatea-emma-gt06-163cm-c-cup-silicone-doll",
  "dolls-castle-chiku-sz25-160cm-q-cup-silicone-character-doll"
];

describe.skipIf(process.env.DOL288_READ_ONLY_PREFLIGHT !== "1")("oral guide current catalog sources", () => {
  it("reads three exact public products without creating carts, orders or metadata", async () => {
    const records = [];
    for (const handle of handles) {
      const product = await getProductByHandle(handle, { cache: "no-store", strict: true, publishedOnly: true });
      expect(product?.handle).toBe(handle);
      expect(product?.featuredImage?.url).toBeTruthy();
      const config = getCustomizationConfig(product!);
      records.push({
        product,
        config,
        sourceMenuSha256: createHash("sha256").update(JSON.stringify(product!.extended.customizationGroups)).digest("hex")
      });
    }
    const directory = "data/exports/dol-288-redo-2026-10-29";
    await mkdir(directory, { recursive: true });
    await writeFile(`${directory}/catalog-source-private.json`, JSON.stringify({ checkedAt: new Date().toISOString(), records }, null, 2));
  }, 60000);
});
