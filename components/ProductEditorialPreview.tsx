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
            alt="Irontech Evie side portrait with long brown hair against a blue studio background"
            fill
            sizes="(min-width: 1024px) 48vw, 100vw"
            className="pdp-editorial-preview__image"
          />
        </div>
        <div className="pdp-editorial-preview__copy">
          <p className="pdp-editorial-preview__eyebrow">Her look and presence</p>
          <h2 id="pdp-editorial-preview-title">Meet Evie</h2>
          <p>
            Evie&apos;s baseball-inspired styling gives this Irontech gallery a bright, energetic identity. Her long brown waves and blue eyes are framed by red glasses, while the vivid red, white, and blue palette runs through the visor, jacket, fitted top, and striped socks. Silver headphones and colorful bracelets add playful detail without competing with her softly parted expression. At 161 cm (5 ft 3 in), her full-silicone F-cup build carries the sporty look with strong curves and a confident silhouette. The clean blue studio setting keeps every color crisp, moving from close portraits to relaxed seated poses for a look that feels polished, modern, and unmistakably Evie.
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
