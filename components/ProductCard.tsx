import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Scale } from "lucide-react";
import { formatMoney } from "@/lib/utils/currency";
import { productPublicTitle } from "@/lib/catalog/naming";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  const price = product.priceRange.minVariantPrice;
  const displayTitle = productPublicTitle(product);
  const image = product.featuredImage ?? product.images[0] ?? null;
  const ready = product.extended.stockStatus === "ready_to_ship";
  const specs = [
    product.extended.heightCm ? `${product.extended.heightCm} cm` : null,
    product.extended.material,
    product.extended.cupSize
  ].filter((spec): spec is string => Boolean(spec));

  return (
    <article className="catalog-product-card group">
      <Link className="catalog-product-card__link" href={`/products/${product.handle}`} aria-label={`View ${displayTitle}`}>
        {image ? (
          <Image
            src={image.url}
            alt={displayTitle}
            fill
            sizes="(min-width: 1280px) 28vw, (min-width: 768px) 44vw, 92vw"
            className="catalog-product-card__image"
          />
        ) : (
          <div className="catalog-product-card__empty">
            <span>{displayTitle}</span>
          </div>
        )}
        <span className="catalog-product-card__vignette" aria-hidden="true" />
        <span className={`catalog-product-card__status ${ready ? "is-ready" : ""}`}>{ready ? "Ready to ship" : "Custom build"}</span>
        <div className="catalog-product-card__body">
          <p>{product.extended.brand ?? product.vendor}</p>
          <h2>{displayTitle}</h2>
          <div className="catalog-product-card__specs">
            {specs.slice(0, 3).map((spec) => (
              <span key={spec}>{spec}</span>
            ))}
          </div>
          <footer>
            <strong>{formatMoney(price.amount, price.currencyCode)}</strong>
            <span>
              View doll <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </footer>
        </div>
      </Link>
      <Link
        href={`/compare?product=${encodeURIComponent(product.handle)}&title=${encodeURIComponent(displayTitle)}`}
        className="catalog-product-card__compare"
        aria-label="Check price match"
      >
        <Scale className="h-4 w-4" />
      </Link>
    </article>
  );
}
