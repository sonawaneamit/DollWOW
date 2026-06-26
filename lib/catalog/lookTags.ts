import type { Product } from "@/types/product";

export type CatalogLookOption = {
  label: string;
  value: string;
  collectionHandle: string;
  group: "Hair color" | "Skin tone" | "Look" | "Body style";
  keywords: string[];
};

export const catalogLookOptions = [
  {
    label: "Blonde dolls",
    value: "hair-blonde",
    collectionHandle: "blonde-dolls",
    group: "Hair color",
    keywords: ["blonde", "blond", "platinum"]
  },
  {
    label: "Brunette dolls",
    value: "hair-brunette",
    collectionHandle: "brunette-dolls",
    group: "Hair color",
    keywords: ["brunette", "brown hair", "dark brown hair"]
  },
  {
    label: "Black hair",
    value: "hair-black",
    collectionHandle: "black-hair-dolls",
    group: "Hair color",
    keywords: ["black hair", "raven hair"]
  },
  {
    label: "Redhead dolls",
    value: "hair-red",
    collectionHandle: "redhead-dolls",
    group: "Hair color",
    keywords: ["redhead", "red hair", "auburn", "ginger"]
  },
  {
    label: "Fair skin",
    value: "skin-fair",
    collectionHandle: "fair-skin-dolls",
    group: "Skin tone",
    keywords: ["fair skin", "white skin", "pale skin", "light skin"]
  },
  {
    label: "Tan skin",
    value: "skin-tan",
    collectionHandle: "tan-skin-dolls",
    group: "Skin tone",
    keywords: ["tan skin", "tanned skin", "light tan"]
  },
  {
    label: "Brown skin",
    value: "skin-brown",
    collectionHandle: "brown-skin-dolls",
    group: "Skin tone",
    keywords: ["brown skin", "medium brown", "dark tan"]
  },
  {
    label: "Black dolls",
    value: "skin-black",
    collectionHandle: "black-dolls",
    group: "Skin tone",
    keywords: ["black skin", "deep skin", "dark skin", "ebony"]
  },
  {
    label: "Asian look",
    value: "look-asian",
    collectionHandle: "asian-dolls",
    group: "Look",
    keywords: ["asian", "japanese", "korean", "chinese", "thai", "filipina", "east asian"]
  },
  {
    label: "Latina look",
    value: "look-latina",
    collectionHandle: "latina-dolls",
    group: "Look",
    keywords: ["latina", "latin", "hispanic"]
  },
  {
    label: "Anime look",
    value: "look-anime",
    collectionHandle: "anime-dolls",
    group: "Look",
    keywords: ["anime", "cosplay", "elf", "fantasy"]
  },
  {
    label: "Slim builds",
    value: "shape-slim",
    collectionHandle: "slim-dolls",
    group: "Body style",
    keywords: ["slim", "skinny", "petite", "slender"]
  },
  {
    label: "Curvy builds",
    value: "shape-curvy",
    collectionHandle: "curvy-dolls",
    group: "Body style",
    keywords: ["curvy", "big breast", "big boobs", "full bust"]
  },
  {
    label: "Fuller builds",
    value: "shape-fuller",
    collectionHandle: "fuller-dolls",
    group: "Body style",
    keywords: ["bbw", "chubby", "fuller", "plus size"]
  },
  {
    label: "Petite builds",
    value: "shape-petite",
    collectionHandle: "petite-dolls",
    group: "Body style",
    keywords: ["petite", "short", "compact"]
  }
] as const satisfies CatalogLookOption[];

export type CatalogLookValue = (typeof catalogLookOptions)[number]["value"];

const lookByValue: Map<string, CatalogLookOption> = new Map(catalogLookOptions.map((option) => [option.value, option]));
const lookByCollection: Map<string, CatalogLookOption> = new Map(catalogLookOptions.map((option) => [option.collectionHandle, option]));

export function getCatalogLook(value?: string | null) {
  if (!value) return undefined;
  const normalized = normalizeLookValue(value);
  return lookByValue.get(normalized) || lookByCollection.get(normalized);
}

export function lookFilterOptions() {
  return catalogLookOptions.map(({ label, value }) => ({ label, value }));
}

export function lookCollectionPresets() {
  return Object.fromEntries(
    catalogLookOptions.flatMap((look) => [
      [look.collectionHandle, { title: look.label, filters: { look: look.value } }],
      [look.value, { title: look.label, filters: { look: look.value } }]
    ])
  ) as Record<string, { title: string; filters: { look: string } }>;
}

export function productLookTags(product: Product) {
  const metafieldTags = product.extended.lookTags || [];
  const productTags = (product.tags || []).filter((tag) => getCatalogLook(tag));
  return Array.from(new Set([...metafieldTags, ...productTags].map(normalizeLookValue).filter((tag) => getCatalogLook(tag))));
}

export function productMatchesLook(product: Product, look: string) {
  const catalogLook = getCatalogLook(look);
  if (!catalogLook) return false;
  if (productLookTags(product).includes(catalogLook.value)) return true;

  const searchText = [
    product.title,
    product.description,
    product.vendor,
    product.productType,
    product.extended.brand,
    product.extended.displayName,
    product.extended.sourceTitle,
    product.extended.material,
    product.extended.cupSize,
    ...product.tags,
    ...product.images.map((image) => image.altText || "")
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return catalogLook.keywords.some((keyword) => searchText.includes(keyword));
}

export function inferredShapeLookTags(product: Product) {
  const tags: string[] = [];
  const height = product.extended.heightCm;
  const cup = product.extended.cupSize?.toUpperCase().match(/[A-Z]/)?.[0];
  const cupRank = cup ? cup.charCodeAt(0) - 64 : 0;
  const weight = product.extended.weightLb;

  if (height && height <= 154) tags.push("shape-petite");
  if (height && height <= 158 && weight && weight <= 75) tags.push("shape-slim");
  if (cupRank >= 7) tags.push("shape-curvy");
  if (cupRank >= 10 || (weight && weight >= 110)) tags.push("shape-fuller");

  return tags;
}

export function normalizeLookValue(value: string) {
  return value
    .toLowerCase()
    .replace(/^tag:/, "")
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");
}
