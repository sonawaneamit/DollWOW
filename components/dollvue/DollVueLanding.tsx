"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { trackEvent } from "@/lib/analytics/client";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/types/product";
import { DollVueBadge } from "./DollVueBadge";
import styles from "./DollVueLanding.module.css";

const base = "/images/dollvue/landing";

const examples = [
  {
    index: "01",
    brand: "Irontech Dolls",
    product: "Luna 152cm A-Cup Silicone",
    href: "/products/irontech-luna-152cm-a-cup-silicone-companion-doll-12nvb",
    original: `${base}/01-irontech-luna-152cm-a-cup-silicone-companion-doll-12nvb-original.jpg`,
    preview: `${base}/01-irontech-luna-152cm-a-cup-silicone-companion-doll-12nvb-dollvue.webp`,
    options: [
      { group: "Skin Tone", label: "Dark Tan Skin", image: `${base}/01-option-dark-tan.jpg` },
      { group: "Eye Color", label: "Green", image: `${base}/01-option-green.jpg` }
    ]
  },
  {
    index: "02",
    brand: "Irontech Dolls",
    product: "Dark 164cm F-Cup Silicone",
    href: "/products/irontech-dark-164cm-f-cup-silicone-companion-doll-1k1t7",
    original: `${base}/02-irontech-dark-164cm-f-cup-silicone-companion-doll-1k1t7-original.jpg`,
    preview: `${base}/02-irontech-dark-164cm-f-cup-silicone-companion-doll-1k1t7-dollvue.webp`,
    options: [
      { group: "Hair Color", label: "Medium Blonde", image: `${base}/02-option-medium-blonde.jpg` },
      { group: "Eye Color", label: "Amber", image: `${base}/02-option-amber.jpg` }
    ]
  },
  {
    index: "03",
    brand: "Real Lady",
    product: "Shizuka 159cm H-Cup Silicone",
    href: "/products/real-lady-shizuka-159cm-h-cup-silicone-companion-doll-1ldrw",
    original: `${base}/03-real-lady-shizuka-159cm-h-cup-silicone-companion-doll-1ldrw-original.jpg`,
    preview: `${base}/03-real-lady-shizuka-159cm-h-cup-silicone-companion-doll-1ldrw-dollvue.webp`,
    options: [
      { group: "Skin Tone", label: "Bronze Skin", image: `${base}/03-option-bronze.png` },
      { group: "Eye Color", label: "Sky", image: `${base}/03-option-sky.jpg` }
    ]
  },
  {
    index: "04",
    brand: "WM Dolls",
    product: "Stefan 186cm Silicone",
    href: "/products/wm-head-sn-01-186cm-na-cup-silicone-companion-doll-1y0cj",
    original: `${base}/04-wm-head-sn-01-186cm-na-cup-silicone-companion-doll-1y0cj-original.jpg`,
    preview: `${base}/04-wm-head-sn-01-186cm-na-cup-silicone-companion-doll-1y0cj-dollvue.webp`,
    options: [
      { group: "Skin Tone", label: "Tan Skin", image: `${base}/04-option-tan.png` },
      { group: "Eye Color", label: "No.5", image: `${base}/04-option-eye-5.jpg` }
    ]
  }
] as const;

export function DollVueLanding({ latestEligibleProducts }: { latestEligibleProducts: Product[] }) {
  const [reveal, setReveal] = useState(50);

  useEffect(() => {
    trackEvent("dollvue_landing_page_view", { page_location: "/dollvue" });
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <header className={styles.heroCopy}>
          <p className={styles.eyebrow}>A better first date - no catfishing</p>
          <h1>The product photo got your attention. Make sure your choices keep it.</h1>
        </header>
        <figure className={styles.heroVisual}>
          <div className={styles.heroReveal}>
            <div
              className={styles.revealLayer}
              style={{ clipPath: `inset(0 ${100 - reveal}% 0 0)` }}
            >
              <Image
                src={`${base}/01-irontech-luna-152cm-a-cup-silicone-companion-doll-12nvb-original.jpg`}
                alt="Before DollVue, green-eye and dark-tan skin option cards sit over the original product photo, leaving the finished combination to the buyer's imagination."
                fill
                priority
                sizes="(min-width: 900px) 520px, 100vw"
              />
              <span className={`${styles.revealTitle} ${styles.revealTitleBefore}`}>Before DollVue</span>
              <OptionCard className={styles.eyeOption} image="00-dollvue-option-green.webp" label="Green" />
              <OptionCard className={styles.skinOption} image="00-dollvue-option-dark-tan.webp" label="Dark Tan Skin" />
            </div>
            <div className={styles.revealLayer} style={{ clipPath: `inset(0 0 0 ${reveal}%)` }} aria-hidden="true">
              <Image
                src={`${base}/01-irontech-luna-152cm-a-cup-silicone-companion-doll-12nvb-dollvue.webp`}
                alt=""
                fill
                priority
                sizes="(min-width: 900px) 520px, 100vw"
              />
              <span className={`${styles.revealTitle} ${styles.revealTitleAfter}`}>With DollVue</span>
              <DollVueBadge className={styles.heroBadge} />
            </div>
            <div className={styles.revealDivider} style={{ left: `${reveal}%` }} aria-hidden="true"><span /></div>
            <label className={styles.revealControl}>
              <span className={styles.srOnly}>Drag to compare before DollVue with the DollVue preview</span>
              <input
                type="range"
                min="0"
                max="100"
                value={reveal}
                onChange={(event) => setReveal(Number(event.target.value))}
                onPointerUp={(event) => trackEvent("dollvue_hero_reveal_interaction", { reveal: Number(event.currentTarget.value) })}
                onKeyUp={(event) => trackEvent("dollvue_hero_reveal_interaction", { reveal: Number(event.currentTarget.value) })}
                aria-label="Compare before DollVue with the DollVue preview"
              />
            </label>
          </div>
          <figcaption className={styles.heroSupport}>
            DollVue™ shows how supported appearance options may look together before the order moves forward. Fewer blind spots. Fewer avoidable surprises. A better first hello when the box opens.
          </figcaption>
        </figure>
      </section>

      <section id="dollvue-enabled" className={styles.proof}>
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>Original photo. Selected options. One clearer decision.</p><h2>See the DollVue difference</h2></div>
          <p>Compare the original product photo with a DollVue™ preview, the exact appearance choices used, and the doll’s product page.</p>
        </div>
        <div className={styles.proofList}>
          {examples.map((example) => <ProofExample key={example.index} example={example} />)}
        </div>
      </section>

      <section className={styles.impact}>
        <div className={styles.impactLead}>
          <p className={styles.eyebrow}>A clearer choice before production</p>
          <h2>See it sooner.<br />Rethink it sooner.<br />Waste less.</h2>
          <p>A clearer preview can help prevent avoidable support cases, replacement parts, return freight, and remakes. Better for the buyer’s budget, the factory’s time, and material that may never need to be wasted.</p>
        </div>
      </section>

      <section className={styles.blueCheck}>
        <DollVueBadge className={styles.largeBadge} />
        <div><p className={styles.eyebrow}>Look for the blue check</p><h2>The dolls you can preview before you commit.</h2></div>
        <div><p>A blue check beside a doll’s name means DollVue™ is available for supported appearance choices on that product.</p><TrackedLink event="dollvue_enabled_catalog_cta" href="/shop/sex-dolls?dollVue=enabled" tone="primary">Shop blue-check dolls <ArrowRight /></TrackedLink><small>No blue check yet? Ask the brand to join DollVue™.</small></div>
      </section>

      <section className={styles.manufacturer}>
        <SlidersHorizontal aria-hidden="true" />
        <p className={styles.eyebrow}>For doll brands and manufacturers</p>
        <h2>Give your dolls the blue check.</h2>
        <p>Bring your supported catalog and verified option references to DollVue™. Help customers understand customization before they order and give your products a clearer reason to be chosen.</p>
        <div className={styles.actions}>
          <TrackedLink event="dollvue_manufacturer_cta" href="/supplier?interest=dollvue" tone="primary">Apply for DollVue onboarding <ArrowRight /></TrackedLink>
          <Link href="/support?topic=dollvue-manufacturer">Talk to the DollWOW team</Link>
        </div>
      </section>

      <section className={styles.eligibleArrivals} aria-labelledby="dollvue-arrivals-heading">
        <header>
          <div>
            <p className={styles.eyebrow}>DollVue-enabled</p>
            <h2 id="dollvue-arrivals-heading">Latest arrivals</h2>
          </div>
          <TrackedLink event="dollvue_enabled_catalog_cta" href="/shop/dollvue-enabled">See more <ArrowRight /></TrackedLink>
        </header>
        <div className={styles.productRail}>
          {latestEligibleProducts.map((product, index) => (
            <div className={styles.productRailItem} key={product.id}>
              <ProductCard product={product} priority={index < 3} />
            </div>
          ))}
        </div>
        <small>DollVue creates an AI-assisted approximation from product and option-reference images. Final factory appearance may vary.</small>
      </section>
    </main>
  );
}

function ProofExample({ example }: { example: (typeof examples)[number] }) {
  const productWords = example.product.split(" ");
  const productTail = productWords.pop();

  return (
    <article className={styles.proofItem}>
      <header><span>{example.index}</span><div><p>{example.brand}</p><h3>{productWords.join(" ")} <span className={styles.productTitleTail}>{productTail}<DollVueBadge size="compact" /></span></h3></div></header>
      <div className={styles.pair}>
        <figure><Image src={example.original} alt={`Original product photo of ${example.product}`} fill sizes="(min-width: 900px) 44vw, 96vw" /><figcaption>Original product photo</figcaption></figure>
        <figure><Image src={example.preview} alt={`DollVue preview of ${example.product} with ${example.options.map((option) => option.label).join(" and ")}`} fill sizes="(min-width: 900px) 44vw, 96vw" /><figcaption><DollVueBadge size="compact" /> DollVue preview</figcaption></figure>
      </div>
      <footer className={styles.proofFooter}>
        <div aria-hidden="true" />
        <div className={styles.proofDetails}>
          <p>Options Chosen:</p>
          <div className={styles.chosenOptions}>
            {example.options.map((option) => (
              <span className={styles.chosenOption} key={`${option.group}-${option.label}`}>
                <Image src={option.image} alt="" width={48} height={48} />
                <span><small>{option.group}</small><strong>{option.label}</strong></span>
                <i aria-hidden="true">✓</i>
              </span>
            ))}
          </div>
          <Link href={example.href} onClick={() => trackEvent("dollvue_proof_product_click", { product_name: example.product })}>View this doll <ArrowRight /></Link>
        </div>
      </footer>
    </article>
  );
}

function OptionCard({ className, image, label }: { className: string; image: string; label: string }) {
  return (
    <span className={`${styles.optionCard} ${className}`} aria-hidden="true">
      <Image src={`${base}/${image}`} alt="" width={54} height={54} />
      <span><b>{label}</b><small>Included</small></span>
      <i>✓</i>
    </span>
  );
}

function TrackedLink({ event, href, tone, children }: { event: string; href: string; tone?: "primary"; children: React.ReactNode }) {
  return <Link href={href} className={tone === "primary" ? styles.primary : undefined} onClick={() => trackEvent(event, { destination: href })}>{children}</Link>;
}
