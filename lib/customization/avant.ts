import template from "@/data/avant-customization-groups.json";
import type { CustomizationGroup } from "@/types/customization";
import type { Product } from "@/types/product";

export function getAvantCustomizationGroups(product: Product): CustomizationGroup[] {
  const groups = structuredClone(template.groups) as CustomizationGroup[];
  const skinTone = `${product.handle} ${product.extended.sourceTitle ?? ""} ${product.title}`.toLowerCase();
  const skinGroup = groups.find((group) => group.id === "skin-tone");

  if (skinGroup && /white/.test(skinTone)) {
    skinGroup.options.sort((left, right) => Number(right.id === "white") - Number(left.id === "white"));
  }

  return groups;
}
