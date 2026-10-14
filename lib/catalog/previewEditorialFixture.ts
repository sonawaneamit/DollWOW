import floraEditorialIntro from "@/data/irontech/flora-editorial-intro.json";
import idoEditorialIntros from "@/data/ido/preview-editorial-intros.json";
import mdEditorialIntros from "@/data/md/preview-editorial-intros.json";
import { hasEditorialIntro } from "@/lib/catalog/editorialIntro";
import type { Product } from "@/types/product";

export const IRONTECH_FLORA_PREVIEW_HANDLE = "irontech-flora-161cm-g-cup-hybrid-companion-doll-14dpc";

export function withPreviewEditorialFixture(product: Product, vercelEnvironment = process.env.VERCEL_ENV): Product {
  if (vercelEnvironment !== "preview" || hasEditorialIntro(product.extended.editorialIntro)) return product;
  // Preview deployments have no Admin credentials, so the saved custom.editorial_intro
  // text (public fields only) for the hidden IDO and MD cohorts is mirrored here for review.
  const editorialIntro = product.handle === IRONTECH_FLORA_PREVIEW_HANDLE
    ? floraEditorialIntro
    : ({ ...idoEditorialIntros, ...mdEditorialIntros } as Record<string, { eyebrow: string; heading: string; paragraph: string }>)[product.handle];
  if (!editorialIntro) return product;

  return {
    ...product,
    extended: {
      ...product.extended,
      editorialIntro
    }
  };
}
