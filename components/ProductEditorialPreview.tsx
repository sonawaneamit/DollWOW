import Image from "next/image";
import { protectedProductImageUrl } from "@/lib/catalog/productImage";
import type { Product } from "@/types/product";

type Props = {
  product: Product;
};

const EVIE_HANDLE = "irontech-evie-161cm-f-cup-silicone-t4-ros-max-companion-doll-mpyhd";

export function supportsProductEditorialPreview(product: Product) {
  return product.handle === EVIE_HANDLE;
}

export function ProductEditorialPreview({ product }: Props) {
  if (!supportsProductEditorialPreview(product)) return null;

  return (
    <section className="pdp-editorial-preview" aria-labelledby="pdp-editorial-preview-title">
      <div className="pdp-editorial-preview__notice">Preview only · Not published</div>
      <div className="pdp-editorial-preview__inner">
        <div className="pdp-editorial-preview__media">
          <Image
            src={protectedProductImageUrl(product.handle, 3)}
            alt="Irontech Evie side portrait with long brown hair against a blue background"
            fill
            sizes="(min-width: 1024px) 48vw, 100vw"
            className="pdp-editorial-preview__image"
          />
        </div>
        <div className="pdp-editorial-preview__copy">
          <p className="pdp-editorial-preview__eyebrow">A private game begins</p>
          <h2 id="pdp-editorial-preview-title">Evie after the final inning</h2>
          <p>
            Imagine the final inning is over and Evie has saved the real game for somewhere private. Her red visor sits above long brown waves, red glasses frame her blue eyes, and an open baseball jacket reveals the fitted blue top beneath. Softly parted lips and an F-cup silhouette give the sporty look a distinctly adult edge. At 161 cm (5 ft 3 in), her full-silicone build brings bold curves to the fantasy. Pull her close by the waist, slip the silver headphones from her neck, and take your time with every playful detail. With Evie, the scoreboard can wait. This is the kind of extra inning meant to be enjoyed behind closed doors.
          </p>
          <dl className="pdp-editorial-preview__facts">
            <div><dt>Height</dt><dd>5 ft 3 in / 161 cm</dd></div>
            <div><dt>Material</dt><dd>Full silicone</dd></div>
            <div><dt>Profile</dt><dd>F-cup</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}
