"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Camera, ChevronDown, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { ProductImageFrame } from "@/components/ProductImageFrame";
import { productUrl } from "@/lib/catalog/productUrl";
import type { Product } from "@/types/product";
import { productPublicTitle } from "@/lib/catalog/naming";
import { formatMoney } from "@/lib/utils/currency";

type Props = {
  product: Product;
  similarProducts: Product[];
};

type ProcessStep = {
  label: string;
  detail: string;
  timing: string;
  icon: ReactNode;
};

export function ProductLowerAlive({ product, similarProducts }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState(0);
  const readyToShip = product.extended.stockStatus === "ready_to_ship";

  useRevealMotion(rootRef);

  function scrollRail(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.82, behavior: "smooth" });
  }

  return (
    <div ref={rootRef} className="alive-product-lower">
      {similarProducts.length ? (
        <AliveBand tone="deep" className="pdp-related-band">
          <div className="alive-band-head alive-reveal">
            <div>
              <p className="alive-eyebrow">
                <span />
                More from this brand
              </p>
              <h2>New arrivals from {product.extended.brand ?? product.vendor}</h2>
            </div>
            <div className="alive-rail-actions">
              <button type="button" onClick={() => scrollRail(-1)} aria-label="Previous products">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => scrollRail(1)} aria-label="Next products">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div ref={railRef} className="alive-similar-rail alive-reveal" data-delay="1">
            {similarProducts.map((item) => (
              <SimilarDollCard key={item.id} product={item} />
            ))}
          </div>
        </AliveBand>
      ) : null}

      <AliveBand tone="rose" className="pdp-practical-band">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-start">
          <div className="alive-reveal">
            <p className="alive-eyebrow">
              <span />
              {readyToShip ? "Warehouse order" : "Made to order"}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-text">What happens next</h2>
            <p className="alive-lead mt-3">
              {readyToShip
                ? "Stock confirmation, warehouse release, and discreet tracked delivery—kept to three clear stages."
                : "Your configuration is reviewed, built, and approved with you before discreet tracked delivery."}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {orderSteps(product, readyToShip).map((step) => (
                <article key={step.label} className="tone-card rounded-[14px] p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-accent">{step.icon}</span>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-accent">{step.timing}</p>
                  <h3 className="mt-2 text-base font-semibold text-text">{step.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-dim">{step.detail}</p>
                </article>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-accent">
              <Link href="/buyer-protection" className="underline underline-offset-4">Buyer protection</Link>
              <Link href="/shipping-protection" className="underline underline-offset-4">Delivery details</Link>
              <Link href="/how-ordering-works" className="underline underline-offset-4">How ordering works</Link>
            </div>
          </div>

          <div className="alive-reveal" data-delay="1">
            <p className="alive-eyebrow">
              <span />
              Practical questions
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-text">Before you order</h2>
            <div className="alive-faq mt-5">
              {faqItems(product, readyToShip).map((item, index) => (
                <article key={item.question} className={openFaq === index ? "alive-faq-item is-open" : "alive-faq-item"}>
                  <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                    {item.question}
                    <span><ChevronDown className="h-4 w-4" /></span>
                  </button>
                  <div><p>{item.answer}</p></div>
                </article>
              ))}
            </div>
            <Link href={`/support?source=pdp-bug-report&product=${encodeURIComponent(product.handle)}`} className="alive-feedback-link">
              Found a bug? Improve this page and get $50 off.
            </Link>
          </div>
        </div>
      </AliveBand>
    </div>
  );
}

function AliveBand({ tone, children, className = "" }: { tone: "deep" | "rose" | "blush"; children: ReactNode; className?: string }) {
  return (
    <section data-tone={tone} className={`tone-section alive-band ${className}`}>
      <div className="tone-inner alive-inner">{children}</div>
    </section>
  );
}

function SimilarDollCard({ product }: { product: Product }) {
  const price = product.priceRange.minVariantPrice;
  const displayTitle = productPublicTitle(product);
  return (
    <article className="alive-sim-card">
      <Link className="alive-sim-link" href={productUrl(product.handle)} aria-label={`View ${displayTitle}`}>
        <ProductImageFrame product={product} />
        <span className="alive-sim-scrim" aria-hidden="true" />
        {product.extended.stockStatus === "ready_to_ship" ? <span className="alive-sim-status">Ready to ship</span> : null}
        <div className="alive-sim-body">
          <div><span>{product.extended.brand ?? product.vendor}</span></div>
          <h3>{displayTitle}</h3>
          <p>
            {product.extended.heightCm ? `${product.extended.heightCm} cm` : "Height pending"}
            <span>{product.extended.material ?? "Material pending"}</span>
            <span>{product.extended.cupSize ?? "Cup pending"}</span>
          </p>
          <footer>
            <strong>{formatMoney(price.amount, price.currencyCode)}</strong>
            <span>View</span>
          </footer>
        </div>
      </Link>
    </article>
  );
}

function orderSteps(product: Product, readyToShip: boolean): ProcessStep[] {
  if (readyToShip) {
    return [
      { label: "Stock confirmed", detail: "We verify this exact warehouse unit and its current timing.", timing: "Before payment", icon: <ShieldCheck className="h-5 w-5" /> },
      { label: "Warehouse release", detail: "The fixed configuration is prepared for dispatch.", timing: product.extended.deliveryEstimate ?? "Confirmed for this unit", icon: <PackageCheck className="h-5 w-5" /> },
      { label: "Private delivery", detail: "Plain packaging with tracking shared after release.", timing: "After release", icon: <Truck className="h-5 w-5" /> }
    ];
  }
  return [
    { label: "Build reviewed", detail: "We check your selected options, compatibility, price, and timing.", timing: "Before production", icon: <ShieldCheck className="h-5 w-5" /> },
    { label: "Made for you", detail: "The factory produces the configuration recorded with your order.", timing: product.extended.deliveryEstimate ?? "Quoted for your build", icon: <PackageCheck className="h-5 w-5" /> },
    { label: "You approve it", detail: "Factory photos and videos are reviewed before discreet shipment.", timing: "Before shipping", icon: <Camera className="h-5 w-5" /> }
  ];
}

function faqItems(product: Product, readyToShip: boolean) {
  if (readyToShip) {
    return [
      {
        question: "Is this exact doll currently in stock?",
        answer: `This listing is marked ready to ship${product.extended.warehouseRegions?.length ? ` from ${product.extended.warehouseRegions.join(", ")}` : product.extended.warehouseCountry ? ` from ${product.extended.warehouseCountry}` : ""}. We verify the unit before warehouse release.`
      },
      { question: "Can I customize this warehouse doll?", answer: product.extended.customAvailable ? "Only the options shown on this page are supported for this stock unit." : "No. This warehouse unit is sold in the fixed configuration shown so it can dispatch quickly." },
      { question: "When does it leave the warehouse?", answer: product.extended.deliveryEstimate ? `Estimated delivery: ${product.extended.deliveryEstimate}. Tracking is shared after dispatch.` : "Tracking is shared after dispatch." },
      { question: "What if it arrives damaged?", answer: "Contact us within 24 hours with photos of the product, carton, and packaging so the delivery claim can be reviewed." }
    ];
  }
  return [
    { question: "Can I buy the standard configuration?", answer: "Yes. Use Buy As Shown In Photos if the default build suits you, or open the configurator to personalize it." },
    { question: "When is the final price shown?", answer: "Supported paid options update the build total before you add the configured doll to your cart." },
    { question: "Do I approve the finished doll?", answer: "Yes. We share detailed factory photos and videos before shipment and review cosmetic revision requests before approval." },
    { question: "How long does production take?", answer: product.extended.deliveryEstimate ? `Estimated production and delivery: ${product.extended.deliveryEstimate}.` : "Production timing depends on the selected build." }
  ];
}

function useRevealMotion(rootRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.add("alive-motion-enabled");
    const elements = Array.from(root.querySelectorAll<HTMLElement>(".alive-reveal"));
    const reveal = () => {
      const height = window.innerHeight || document.documentElement.clientHeight;
      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < height * 0.9 && rect.bottom > 0) element.classList.add("is-visible");
      });
    };
    reveal();
    window.addEventListener("scroll", reveal, { passive: true });
    window.addEventListener("resize", reveal);
    return () => {
      window.removeEventListener("scroll", reveal);
      window.removeEventListener("resize", reveal);
    };
  }, [rootRef]);
}
