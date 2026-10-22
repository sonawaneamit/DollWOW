import floraEditorialIntro from "@/data/irontech/flora-editorial-intro.json";
import idoEditorialIntros from "@/data/ido/preview-editorial-intros.json";
import mdEditorialIntros from "@/data/md/preview-editorial-intros.json";
import lusandyEditorialIntros from "@/data/lusandy/preview-editorial-intros.json";
import topFireEditorialIntros from "@/data/top-fire/preview-editorial-intros.json";
import funwestEditorialIntros from "@/data/funwest/preview-editorial-intros.json";
import irontechIrnEditorialIntros from "@/data/irontech/irn-preview-editorial-intros.json";
import irontechEditorialIntros from "@/data/irontech/preview-editorial-intros.json";
import reviewedEditorialIntros from "@/data/preview-editorial/dol177-approved-oct22.json";
import { hasEditorialIntro } from "@/lib/catalog/editorialIntro";
import type { Product } from "@/types/product";

export const IRONTECH_FLORA_PREVIEW_HANDLE = "irontech-flora-161cm-g-cup-hybrid-companion-doll-14dpc";

export function withPreviewEditorialFixture(product: Product, vercelEnvironment = process.env.VERCEL_ENV): Product {
  if (vercelEnvironment !== "preview" || hasEditorialIntro(product.extended.editorialIntro)) return product;
  // Preview deployments have no Admin credentials, so the saved custom.editorial_intro
  // text (public fields only) for the reviewed preview cohorts is mirrored here for review.
  const editorialIntro = product.handle === IRONTECH_FLORA_PREVIEW_HANDLE
    ? floraEditorialIntro
    : ({ ...idoEditorialIntros, ...mdEditorialIntros, ...lusandyEditorialIntros, ...topFireEditorialIntros, ...funwestEditorialIntros, ...irontechIrnEditorialIntros, ...irontechEditorialIntros, ...reviewedEditorialIntros } as Record<string, { eyebrow: string; heading: string; paragraph: string }>)[product.handle];
  if (!editorialIntro) return product;

  return {
    ...product,
    extended: {
      ...product.extended,
      editorialIntro
    }
  };
}
