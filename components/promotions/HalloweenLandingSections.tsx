import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { getProductsByHandles } from "@/lib/shopify/storefront";
import { brandHubHref } from "@/lib/catalog/brands";
import { HALLOWEEN_2026 } from "@/lib/promotions/halloween2026";

const featuredHandles = [
  "irontech-vivian-153cm-f-cup-silicone-head-companion-doll-qryli",
  "starpery-freya-165cm-g-cup-silicone-head-companion-doll-46ftg",
  "yl-isla-158cm-e-cup-silicone-companion-doll-1iikg"
];

export async function HalloweenLandingSections({ preview = false }: { preview?: boolean }) {
  // Reuse public entries already featured on the homepage, not a final discount manifest.
  const products = await getProductsByHandles(featuredHandles);
  return <>
    <nav className="halloween-page-nav" aria-label="Halloween sale sections">
      <a href="#how-it-works">How it works</a><a href="#full-size">Eligible dolls</a><a href="#campaign-dates">Dates</a><a href="#featured-dolls">Explore dolls</a><a href="#halloween-faq">FAQs</a>
    </nav>
    <section className="halloween-page-section" id="how-it-works" aria-labelledby="halloween-how-heading">
      <h2 id="halloween-how-heading">One treat. Your choice of doll.</h2>
      <ol className="halloween-steps">
        <li><strong>Find your full-size doll</strong>Choose a ready-to-ship configuration or create a custom-made build.</li>
        <li><strong>Make it yours</strong>Choose available options on the product page. Eligible factory bonuses stay included.</li>
        <li><strong>Use HALLOWEEN299</strong>Enter the code at checkout for $299 USD off the doll&apos;s base price. One discount per order.</li>
      </ol>
    </section>
    <section className="halloween-page-section" id="full-size" aria-labelledby="halloween-eligible-heading">
      <h2 id="halloween-eligible-heading">What counts as full-size?</h2>
      <div className="halloween-eligibility">
        <div><h3>Complete, full-body dolls</h3><p>The offer covers full-size ready-to-ship and custom-made dolls. Choose the material and available configuration that suit you.</p></div>
        <div><h3>Not included in this offer</h3><ul><li>Torsos, hips and minis</li><li>Standalone heads, parts and accessories</li><li>Paid add-ons and shipping</li></ul></div>
      </div>
      <p>The discount applies to eligible complete dolls over 120cm, not each option or each item in your cart. Minis of 120cm or less are excluded. One $299 discount per order, even when ordering multiple dolls.</p>
    </section>
    <section className="halloween-page-section" id="campaign-dates" aria-labelledby="halloween-dates-heading">
      <h2 id="halloween-dates-heading">Halloween sale dates</h2>
      <p><strong>Starts:</strong> 21 October 2026. <strong>Ends:</strong> {HALLOWEEN_2026.endLabel}.</p>
      <p>{preview ? "This is a preview. HALLOWEEN299 is not active here yet. " : "Enter HALLOWEEN299 at checkout. "}Factory promotions below have their own dates and eligibility.</p>
    </section>
    <section className="halloween-page-section" id="featured-dolls" aria-labelledby="halloween-featured-heading">
      <h2 id="halloween-featured-heading">Find your Halloween match</h2>
      <p>A few full-body styles from our current catalog. Prices shown are catalog prices, before the Halloween checkout discount.</p>
      {products.length ? <div className="halloween-featured">{products.map(product => <ProductCard key={product.id} product={product} />)}</div> : null}
      <Link className="halloween-page-link" href="/shop/ready-to-ship">Shop ready-to-ship dolls</Link>{" · "}<Link className="halloween-page-link" href="/shop">Explore the full catalog</Link>
    </section>
    <section className="halloween-page-section" aria-labelledby="halloween-brands-heading">
      <h2 id="halloween-brands-heading">Explore by brand</h2>
      <p>Compare styles, materials and options across our brand collections.</p>
      <div className="halloween-brand-links">{[["irontech", "Irontech"], ["starpery", "Starpery"], ["sedoll", "SE Doll"], ["wm", "WM Doll"], ["yl", "YL Doll"]].map(([key, label]) => <Link key={key} href={brandHubHref(key)}>{label}</Link>)}</div>
    </section>
    <section className="halloween-page-section halloween-faq" id="halloween-faq" aria-labelledby="halloween-faq-heading">
      <h2 id="halloween-faq-heading">Halloween offer questions</h2>
      {[
        ["Does the offer include ready-to-ship dolls?", "Yes. The offer covers full-size ready-to-ship and custom-made dolls, with one $299 USD discount per order on the base doll price."],
        ["Do factory bonuses stay included?", "Yes, eligible factory and brand bonuses remain included. Each brand promotion has its own dates, qualifying models and options; see the offer details below."],
        ["Can I combine this with the sitewide 10% offer?", "No. The Halloween offer replaces the sitewide 10% offer. It is not an additional discount on top of that 10%."],
        ["Does it discount customization options?", "No. The $299 discount comes off the base price of the doll. Paid options, accessories and shipping are excluded."],
        ["How does it work in another currency?", "The offer is a fixed $299 USD discount. Shopify converts that fixed amount for your checkout currency."],
        ["When can I use the code?", preview ? "This is a preview; checkout activation is separate." : `Use HALLOWEEN299 from 21 October until ${HALLOWEEN_2026.endLabel}.`]
      ].map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
    </section>
  </>;
}
