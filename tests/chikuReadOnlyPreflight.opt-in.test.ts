import { describe, expect, it } from "vitest";
import { getProductsByVariantIds } from "@/lib/shopify/storefront";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { getDefaultSelections } from "@/lib/customization/resolve";
import { serverValidateAndRepriceLines } from "@/lib/cart/server-validation";
import { includedBuildItems, CHIKU_ID } from "@/lib/customization/chiku-preview";

describe.skipIf(process.env.DOL313_READ_ONLY_PREFLIGHT !== "1")("Chiku read-only live-source preflight", () => {
  it("reads the real variant and revalidates four eyes without creating carts or orders", async () => {
    const id = "gid://shopify/ProductVariant/54492812640440";
    const product = (await getProductsByVariantIds([id])).get(id)!;
    expect(product.id).toBe(CHIKU_ID);
    expect(Number(product.variants.find(v => v.id === id)!.price.amount)).toBe(1999);
    expect(includedBuildItems(product)).toHaveLength(8);
    const defaults = getDefaultSelections(getCustomizationConfig(product));
    const eyes = ["blue", "purple", "amber", "green"];
    const lines = await serverValidateAndRepriceLines(eyes.map(eye => ({ merchandiseId: id, quantity: 1,
      selections: { ...defaults, "eye-color": eye, "body-functions": ["body-heating", "vaginal-suction"] }
    })));
    for (const [index, line] of lines.entries()) {
      expect(line.customizationCharge?.amount).toBe(165);
      expect(line.customizationCharge?.items.map(x => [x.label, x.amount])).toEqual([["Body heating", 90], ["Vaginal suction", 75]]);
      expect(line.attributes.find(x => /Eye color/.test(x.key))?.value.toLowerCase()).toContain(eyes[index]);
      expect(line.namedUpgradeAttributes?.find(x => /Eye color/.test(x.key))?.value.toLowerCase()).toContain(eyes[index]);
    }
  }, 60000);
});
