"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  ChevronDown,
  Clock3,
  ClipboardCheck,
  CreditCard,
  Eye,
  HelpCircle,
  Heart,
  PackageCheck,
  Scale,
  ShieldCheck,
  Sparkles,
  Truck
} from "lucide-react";
import { ProductImageFrame } from "@/components/ProductImageFrame";
import type { Product } from "@/types/product";
import { formatMoney } from "@/lib/utils/currency";

type Props = {
  product: Product;
  similarProducts: Product[];
};

type TimelineStep = {
  label: string;
  detail: string;
  when: string;
  icon: ReactNode;
  featured?: boolean;
};

const marqueeItems = [
  "Discreet checkout",
  "Specialist order review",
  "Plain-box delivery",
  "Private QC options",
  "Clear factory timing",
  "Price-match help"
];

export function ProductLowerAlive({ product, similarProducts }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState(0);
  const readyToShip = product.extended.stockStatus === "ready_to_ship";
  const steps = useMemo(() => orderSteps(product, readyToShip), [product, readyToShip]);
  const specs = productSpecs(product);
  const price = product.priceRange.minVariantPrice;

  useAliveMotion(rootRef);

  function scrollRail(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.82, behavior: "smooth" });
  }

  return (
    <div ref={rootRef} className="alive-product-lower">
      <AliveBand tone="deep" className="alive-order-band">
        <div className="alive-band-head alive-reveal">
          <div>
            <p className="alive-eyebrow">
              <span />
              After you order
            </p>
            <h2>No guessing. Here&apos;s every step.</h2>
            <p className="alive-lead">
              {readyToShip
                ? "Your order is checked by our team before it moves to warehouse release and discreet shipping."
                : "Custom builds are reviewed by our team before anything is made or shipped, so the wait feels clear from the start."}
            </p>
          </div>
          <span className="alive-pill">
            <Clock3 className="h-4 w-4" />
            {readyToShip ? product.extended.deliveryEstimate ?? "Warehouse timing confirmed" : `About ${product.extended.deliveryEstimate ?? "4-8 weeks"}, start to finish`}
          </span>
        </div>

        <div className="alive-stats alive-reveal" data-delay="1">
          <Stat kicker="Human review" value={1} label="Specialist checks your build by hand, every time" />
          <Stat kicker="Before it ships" value={readyToShip ? 4 : 6} suffix="checks" label="Compatibility, pricing, timing, QC, and packaging" />
          <Stat kicker="QC photos" value={100} suffix="%" label="Private approval shots when the factory provides them" />
          <Stat kicker="On the box" value={0} suffix="logos" label="Plain, unmarked, fully tracked packaging" />
        </div>

        <div className="alive-timeline-wrap alive-reveal" data-delay="2">
          <div className="alive-timeline" data-alive-timeline>
            <div className="alive-timeline-rail">
              <div className="alive-vfill" data-alive-vfill />
            </div>
            {steps.map((step) => (
              <article key={step.label} className={step.featured ? "alive-timeline-step is-featured" : "alive-timeline-step"}>
                <div className="alive-timeline-node">{step.icon}</div>
                <p className="alive-step-when">{step.when}</p>
                <h3>
                  {step.label}
                  {step.featured && <span>Buyers love this</span>}
                </h3>
                <p>{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </AliveBand>

      <AliveBand tone="rose">
        <div className="alive-marquee" aria-hidden="true">
          <div className="alive-marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, index) => (
              <span key={`${item}-${index}`}>
                <i />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="alive-split">
          <div className="alive-reveal">
            <p className="alive-eyebrow">
              <span />
              Confidence
            </p>
            <h2>Confidence before you commit</h2>
            <p className="alive-lead">
              Clear timing, discreet delivery, and specialist review help you order with confidence before a custom build begins.
            </p>
            <div className="alive-seal" aria-hidden="true">
              <svg viewBox="0 0 120 120" className="alive-seal-ring">
                <defs>
                  <path id="alive-seal-path" d="M60,60 m-43,0 a43,43 0 1,1 86,0 a43,43 0 1,1 -86,0" />
                </defs>
                <text>
                  <textPath href="#alive-seal-path">Discreet order • team checked • </textPath>
                </text>
              </svg>
              <div className="alive-seal-core">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="alive-reassure">
            <ReassuranceCard
              icon={<BadgeCheck className="h-5 w-5" />}
              title="Specs are checked"
              text="Your selected options, timing, and fulfillment notes are reviewed before the order moves forward."
              delay={1}
            />
            <ReassuranceCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Discreet from checkout to delivery"
              text="Billing, order updates, and packaging are handled with privacy in mind."
              delay={2}
            />
            <ReassuranceCard
              icon={<Scale className="h-5 w-5" />}
              title="Found the same doll elsewhere?"
              text="Send us the listing and we can compare the match, delivery, and final price."
              delay={3}
            />
          </div>
        </div>
      </AliveBand>

      <AliveBand tone="blush">
        <div className="alive-band-head alive-reveal">
          <div>
            <p className="alive-eyebrow">
              <span />
              Buyer guide
            </p>
            <h2>Know what you&apos;re choosing</h2>
          </div>
          <Link href="/compare" className="alive-pill">
            <Scale className="h-4 w-4" />
            Compare a price
          </Link>
        </div>

        <div className="alive-guide-grid">
          <GuideCard icon={<PackageCheck className="h-5 w-5" />} kicker="Base build" title="Included setup" text="Start with the standard factory build, then personalize the details that matter to you." />
          <GuideCard icon={<Sparkles className="h-5 w-5" />} kicker="Add-ons" title="Upgrade pricing" text="Paid options show their added cost before you continue to checkout." />
          <GuideCard icon={<Eye className="h-5 w-5" />} kicker="Visuals" title="Reference images" text="Option photos and swatches make skin, hair, eyes, and details easier to compare." />
          <GuideCard icon={<Camera className="h-5 w-5" />} kicker="Before ship" title="QC photo requests" text="For custom builds, we can request factory QC photos before the order is released." />
          <GuideCard icon={<Truck className="h-5 w-5" />} kicker="Delivery" title="Factory or warehouse" text="Ready-to-ship and made-to-order dolls are labeled clearly, with timing shown up front." />
          <GuideCard icon={<HelpCircle className="h-5 w-5" />} kicker="Support" title="Need a second look?" text="Send the product, budget, or option question and our team can help you decide." />
        </div>
      </AliveBand>

      <AliveBand tone="deep">
        <div className="alive-split alive-split-wide">
          <div className="alive-reveal">
            <p className="alive-eyebrow">
              <span />
              Private questions
            </p>
            <h2>Questions before checkout</h2>
            <p className="alive-lead">A few practical answers before you place a private, high-consideration order.</p>
          </div>

          <div className="alive-faq alive-reveal" data-delay="1">
            {faqItems(product, readyToShip).map((item, index) => (
              <article key={item.question} className={openFaq === index ? "alive-faq-item is-open" : "alive-faq-item"}>
                <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                  {item.question}
                  <span>
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>
                <div>
                  <p>{item.answer}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </AliveBand>

      <AliveBand tone="blush">
        <div className="alive-spec-review-grid">
          <section className="alive-review-card alive-reveal">
            <p className="alive-eyebrow">
              <span />
              Reviews
            </p>
            <h2>Real buyer feedback only</h2>
            <p>
              We show reviews only after verified DollWow orders. For now, this page focuses on product details, privacy, and order support.
            </p>
            <div className="alive-review-proof">
              <Check className="h-5 w-5" />
              <span>Verified orders only</span>
            </div>
          </section>

          <section className="alive-specsheet alive-reveal" data-delay="1">
            <div className="alive-specsheet-head">
              <ClipboardCheck className="h-5 w-5" />
              <div>
                <h2>Product details</h2>
                <p>{product.extended.brand ?? product.vendor}</p>
              </div>
            </div>
            <div className="alive-spec-grid">
              {specs.map((spec) => (
                <div key={spec.label} className="alive-spec-cell">
                  <p>{spec.label}</p>
                  <strong>{spec.value}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      </AliveBand>

      <AliveBand tone="deep">
        <div className="alive-band-head alive-reveal">
          <div>
            <p className="alive-eyebrow">
              <span />
              Similar dolls
            </p>
            <h2>Similar dolls to compare</h2>
          </div>
          <div className="alive-rail-actions">
            <button type="button" onClick={() => scrollRail(-1)} aria-label="Previous similar dolls">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => scrollRail(1)} aria-label="Next similar dolls">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div ref={railRef} className="alive-similar-rail alive-reveal" data-delay="1">
          {similarProducts.map((item) => (
            <SimilarDollCard key={item.id} product={item} reference={product} />
          ))}
        </div>
      </AliveBand>

      <section className="alive-closing">
        <div className="alive-closing-inner alive-reveal">
          <p className="alive-eyebrow">
            <span />
            Ready when you are
          </p>
          <h2>Make your choice with confidence.</h2>
          <p>Starting at {formatMoney(price.amount, price.currencyCode)} before optional upgrades.</p>
          <div>
            <Link href="#build-studio" className="alive-primary-link">
              Customize her
            </Link>
            <Link href="/compare" className="alive-secondary-link">
              Found it cheaper?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function useAliveMotion(rootRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealEls = Array.from(root.querySelectorAll<HTMLElement>(".alive-reveal"));
    const timeline = root.querySelector<HTMLElement>("[data-alive-timeline]");
    const fill = root.querySelector<HTMLElement>("[data-alive-vfill]");
    let ticking = false;

    const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

    const runCounter = (counter: HTMLElement) => {
      if (counter.dataset.done) return;
      counter.dataset.done = "true";
      const target = Number(counter.dataset.countTo ?? "0");
      const duration = Number(counter.dataset.countDuration ?? "1200");

      if (reduce) {
        counter.textContent = `${target}`;
        return;
      }

      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        counter.textContent = `${Math.round(target * easeOutCubic(progress))}`;
        if (progress < 1) requestAnimationFrame(tick);
        else counter.textContent = `${target}`;
      };
      requestAnimationFrame(tick);
    };

    const check = () => {
      const height = window.innerHeight || document.documentElement.clientHeight;
      revealEls.forEach((el) => {
        if (el.classList.contains("is-visible")) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < height * 0.88 && rect.bottom > 0) {
          el.classList.add("is-visible");
          el.querySelectorAll<HTMLElement>("[data-count-to]").forEach(runCounter);
        }
      });

      if (timeline && fill) {
        const rect = timeline.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (height * 0.62 - rect.top) / (rect.height * 0.74)));
        fill.style.setProperty("--alive-progress", `${(progress * 100).toFixed(1)}%`);
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        check();
        ticking = false;
      });
    };

    check();
    const timeout = window.setTimeout(check, 250);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [rootRef]);
}

function AliveBand({ tone, children, className = "" }: { tone: "deep" | "rose" | "blush"; children: ReactNode; className?: string }) {
  return (
    <section data-tone={tone} className={`tone-section alive-band ${className}`}>
      <div className="tone-inner alive-inner">{children}</div>
    </section>
  );
}

function Stat({ kicker, value, suffix = "", label }: { kicker: string; value: number; suffix?: string; label: string }) {
  return (
    <div className="alive-stat">
      <p className="alive-stat-kicker">{kicker}</p>
      <strong>
        <span data-count-to={value} data-count-suffix={suffix}>
          0
        </span>
        {suffix && <small>{suffix}</small>}
      </strong>
      <p>{label}</p>
    </div>
  );
}

function ReassuranceCard({ icon, title, text, delay }: { icon: ReactNode; title: string; text: string; delay: number }) {
  return (
    <article className="alive-reassure-card alive-reveal" data-delay={delay}>
      <span>{icon}</span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  );
}

function GuideCard({ icon, kicker, title, text }: { icon: ReactNode; kicker: string; title: string; text: string }) {
  return (
    <article className="alive-guide-card alive-reveal">
      <span>{icon}</span>
      <p>{kicker}</p>
      <h3>{title}</h3>
      <small>{text}</small>
    </article>
  );
}

function SimilarDollCard({ product, reference }: { product: Product; reference: Product }) {
  const price = product.priceRange.minVariantPrice;
  return (
    <article className="alive-sim-card">
      <Link href={`/products/${product.handle}`} aria-label={`View ${product.title}`}>
        <ProductImageFrame product={product} />
      </Link>
      <div className="alive-sim-body">
        <div>
          <span>{product.extended.brand ?? product.vendor}</span>
          <small>{matchReason(product, reference)}</small>
        </div>
        <Link href={`/products/${product.handle}`}>{product.title}</Link>
        <p>
          {product.extended.heightCm ? `${product.extended.heightCm} cm` : "Height pending"}
          <span>{product.extended.material ?? "Material pending"}</span>
          <span>{product.extended.cupSize ?? "Cup pending"}</span>
        </p>
        <footer>
          <strong>{formatMoney(price.amount, price.currencyCode)}</strong>
          <Link href={`/products/${product.handle}`}>View</Link>
        </footer>
      </div>
    </article>
  );
}

function orderSteps(product: Product, readyToShip: boolean): TimelineStep[] {
  if (readyToShip) {
    return [
      { label: "Order placed", detail: "Your order details are captured privately. Card shows a neutral name.", when: "Day 0", icon: <CreditCard className="h-5 w-5" /> },
      { label: "Specialist QC review", detail: "A real person checks availability, shipping timing, and order notes before release.", when: "1 business day", icon: <ShieldCheck className="h-5 w-5" /> },
      { label: "Warehouse release", detail: "The warehouse prepares the doll for plain-box shipping.", when: product.extended.deliveryEstimate ?? "Fast timing", icon: <PackageCheck className="h-5 w-5" />, featured: true },
      { label: "Plain-box shipping", detail: "Unmarked packaging, fully tracked. We share tracking after release.", when: "Final step", icon: <Truck className="h-5 w-5" /> }
    ];
  }

  return [
    { label: "Order placed", detail: "Your build details are captured as a private order note. Card shows a neutral name.", when: "Day 0", icon: <CreditCard className="h-5 w-5" /> },
    { label: "Specialist QC review", detail: "A real person checks compatibility, pricing, timing, and order notes before anything is made.", when: "1-2 days", icon: <ShieldCheck className="h-5 w-5" /> },
    { label: "Built to order", detail: "The factory assembles the exact configuration you chose, start to finish.", when: "3-5 weeks", icon: <Sparkles className="h-5 w-5" /> },
    { label: "Private QC photos", detail: "Where available, we request supplier photos for you to approve before release.", when: "Before ship", icon: <Eye className="h-5 w-5" />, featured: true },
    { label: "Plain-box shipping", detail: "Unmarked packaging, fully tracked. We share tracking after release.", when: "3-5 days", icon: <Truck className="h-5 w-5" /> },
    { label: "Delivered", detail: "At your door, discreetly. Nothing on the box gives it away.", when: "Done", icon: <Heart className="h-5 w-5" /> }
  ];
}

function faqItems(product: Product, readyToShip: boolean) {
  return [
    {
      question: "Can I buy the default build?",
      answer: "Yes. Keep the default selections and continue to checkout. Our team still reviews the order details before fulfillment."
    },
    {
      question: "What if I choose paid options?",
      answer: "Paid options show their added cost before checkout. Our team checks compatibility and timing before production or shipment."
    },
    {
      question: readyToShip ? "Is this ready to ship?" : "How long does a custom order take?",
      answer: readyToShip
        ? `This item is marked ready to ship${product.extended.warehouseCountry ? ` from ${product.extended.warehouseCountry}` : ""}. Timing is confirmed after checkout.`
        : `This item is made to order. Current timing is ${product.extended.deliveryEstimate ?? "confirmed after checkout"}.`
    },
    {
      question: "Can DollWow check another seller’s price?",
      answer: "Yes. Send us the listing and we can compare the seller, product match, delivery terms, and final delivered price."
    }
  ];
}

function productSpecs(product: Product) {
  return [
    { label: "Brand", value: product.extended.brand ?? product.vendor },
    { label: "Material", value: product.extended.material ?? "Confirm" },
    { label: "Height", value: product.extended.heightCm ? `${product.extended.heightCm} cm` : "Confirm" },
    { label: "Weight", value: product.extended.weightLb ? `${product.extended.weightLb} lb` : "Confirm" },
    { label: "Cup size", value: product.extended.cupSize ?? "Confirm" },
    { label: "Delivery", value: product.extended.deliveryEstimate ?? "Confirm" }
  ];
}

function matchReason(product: Product, reference: Product) {
  if (product.extended.material && product.extended.material === reference.extended.material) return "Same material";
  if (product.extended.cupSize && product.extended.cupSize === reference.extended.cupSize) return "Same cup";
  if (product.extended.heightCm && reference.extended.heightCm && Math.abs(product.extended.heightCm - reference.extended.heightCm) <= 8) return "Similar size";
  return "Comparable";
}
