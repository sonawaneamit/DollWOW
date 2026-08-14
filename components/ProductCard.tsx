import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WishlistButton } from "@/components/WishlistButton";
import { CompareButton } from "@/components/compare/CompareButton";
import { DisplayMoney } from "@/components/CurrencyProvider";
import { WarehouseLocationBadge } from "@/components/WarehouseLocationBadge";
import { productPublicTitle } from "@/lib/catalog/naming";
import { protectedProductImageUrlFor } from "@/lib/catalog/productImage";
import type { Product } from "@/types/product";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const price = product.priceRange.minVariantPrice;
  const displayTitle = productPublicTitle(product);
  const image = product.featuredImage ?? product.images[0] ?? null;
  const publicImageUrl = protectedProductImageUrlFor(product, image, "card");
  const ready = product.extended.stockStatus === "ready_to_ship";
  const specs = [
    product.extended.heightCm ? `${product.extended.heightCm} cm` : null,
    product.extended.material,
    product.extended.cupSize
  ].filter((spec): spec is string => Boolean(spec));

  return (
    <article className="catalog-product-card group">
      <Link className="catalog-product-card__link" href={`/products/${product.handle}`} aria-label={`View ${displayTitle}`} />
      <div className="catalog-product-card__media">
        {publicImageUrl ? <Image src={publicImageUrl} alt={displayTitle} fill sizes="(min-width: 1280px) 28vw, (min-width: 768px) 44vw, 92vw" className="catalog-product-card__image" priority={priority} loading={priority ? "eager" : "lazy"} /> : <div className="catalog-product-card__empty"><span>{displayTitle}</span></div>}
        <span className={`catalog-product-card__status ${ready ? "is-ready" : ""}`}>{ready ? "Ready to ship" : "Custom build"}</span>
      </div>
      <div className="catalog-product-card__body">
        <p>{product.extended.brand ?? product.vendor}</p>
        <h2>{displayTitle}</h2>
        <div className="catalog-product-card__specs">
          {specs.slice(0, 3).map((spec) => <span key={spec}>{spec}</span>)}
        </div>
        {ready ? (
          <div className="catalog-product-card__warehouse">
            <WarehouseLocationBadge regions={product.extended.warehouseRegions} country={product.extended.warehouseCountry} compact />
          </div>
        ) : null}
        <footer>
          <strong><DisplayMoney amount={price.amount} currencyCode={price.currencyCode} /></strong>
          <span>View doll <ArrowRight className="h-4 w-4" /></span>
        </footer>
      </div>
      <CompareButton
        entry={{
          productHandle: product.handle,
          productTitle: displayTitle,
          brand: product.extended.brand ?? product.vendor,
          imageUrl: publicImageUrl,
          unitPrice: Number(price.amount),
          currencyCode: price.currencyCode,
          merchandiseId: product.variants.find((variant) => variant.availableForSale)?.id,
          material: product.extended.material,
          heightCm: product.extended.heightCm,
          weightLb: product.extended.weightLb,
          cupSize: product.extended.cupSize,
          productType: product.productType,
          measurements: product.extended.measurements,
          warehouseRegions: product.extended.warehouseRegions,
          stockStatus: product.extended.stockStatus,
          customAvailable: product.extended.customAvailable
        }}
        className="catalog-product-card__compare"
      />
      <WishlistButton
        entry={{
          productHandle: product.handle,
          productTitle: displayTitle,
          brand: product.extended.brand ?? product.vendor,
          imageUrl: publicImageUrl,
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
