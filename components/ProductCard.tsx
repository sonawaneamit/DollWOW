import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Scale } from "lucide-react";
import { WishlistButton } from "@/components/WishlistButton";
import { DisplayMoney } from "@/components/CurrencyProvider";
import { productPublicTitle } from "@/lib/catalog/naming";
import type { Product } from "@/types/product";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
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
      <Link className="catalog-product-card__media" href={`/products/${product.handle}`} aria-label={`View ${displayTitle}`}>
        {image ? <Image src={image.url} alt={displayTitle} fill sizes="(min-width: 1280px) 28vw, (min-width: 768px) 44vw, 92vw" className="catalog-product-card__image" priority={priority} loading={priority ? "eager" : "lazy"} /> : <div className="catalog-product-card__empty"><span>{displayTitle}</span></div>}
        <span className={`catalog-product-card__status ${ready ? "is-ready" : ""}`}>{ready ? "Ready to ship" : "Custom build"}</span>
      </Link>
      <div className="catalog-product-card__body">
        <p>{product.extended.brand ?? product.vendor}</p>
        <Link href={`/products/${product.handle}`}><h2>{displayTitle}</h2></Link>
        <div className="catalog-product-card__specs">
          {specs.slice(0, 3).map((spec) => <span key={spec}>{spec}</span>)}
        </div>
        <footer>
          <strong><DisplayMoney amount={price.amount} currencyCode={price.currencyCode} /></strong>
          <Link href={`/products/${product.handle}`}>View doll <ArrowRight className="h-4 w-4" /></Link>
        </footer>
      </div>
      <Link
        href={`/compare?product=${encodeURIComponent(product.handle)}&title=${encodeURIComponent(displayTitle)}`}
        className="catalog-product-card__compare"
        aria-label="Check price match"
      >
        <Scale className="h-4 w-4" />
      </Link>
      <WishlistButton
        entry={{
          productHandle: product.handle,
          productTitle: displayTitle,
          brand: product.extended.brand ?? product.vendor,
          imageUrl: image?.url,
          imageAlt: image?.altText ?? displayTitle,
          unitPrice: Number(price.amount),
          currencyCode: price.currencyCode,
          readyToShip: ready
        }}
        className="catalog-product-card__wish"
      />
    </article>
  );
}
