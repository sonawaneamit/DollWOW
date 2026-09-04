import floraEditorialIntro from "@/data/irontech/flora-editorial-intro.json";
import { hasEditorialIntro } from "@/lib/catalog/editorialIntro";
import type { Product } from "@/types/product";

export const IRONTECH_FLORA_PREVIEW_HANDLE = "irontech-flora-161cm-g-cup-hybrid-companion-doll-14dpc";

export function withPreviewEditorialFixture(product: Product, vercelEnvironment = process.env.VERCEL_ENV): Product {
  if (
    vercelEnvironment !== "preview" ||
    product.handle !== IRONTECH_FLORA_PREVIEW_HANDLE ||
    hasEditorialIntro(product.extended.editorialIntro)
  ) {
    return product;
  }

  return {
    ...product,
    extended: {
      ...product.extended,
      editorialIntro: floraEditorialIntro
    }
  };
}
