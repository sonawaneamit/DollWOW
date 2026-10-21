import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HalloweenCode } from "./HalloweenCode";
import "./halloween-campaign.css";

export function HalloweenCampaignArtwork({ card = false }: { card?: boolean }) {
  return <picture>
    {!card ? <source media="(max-width: 767px)" srcSet="/promo/halloween-2026/offer-mobile-gpt25.webp" width={1024} height={1536} /> : null}
    <Image src="/promo/halloween-2026/offer-desktop-gpt25.webp" alt="DollWOW Halloween: $299 off full-size dolls, ready to ship and custom made. Irontech supplier doll portrait." width={2048} height={1152} loading={card ? "lazy" : "eager"} fetchPriority={card ? "auto" : "high"} unoptimized data-halloween-art={card ? undefined : "2026-gpt25"} className="halloween-campaign-image" />
  </picture>;
}

export function HalloweenCampaignBanner() {
  return <section id="halloween-2026" aria-labelledby="halloween-offer-heading">
    <h1 id="halloween-offer-heading" className="sr-only">$299 off full-size dolls this Halloween</h1>
    <HalloweenCampaignArtwork />
    <div className="halloween-campaign-actions">
      <div><p className="halloween-bonus-line">Your Halloween treat. Plus your eligible factory bonuses.</p><HalloweenCode campaign /></div>
      <Link className="halloween-shop" href="/shop">Find your doll <ArrowRight size={19} aria-hidden="true" /></Link>
    </div>
    <div className="halloween-campaign-notes">
      <p>Preview only · Code not yet active at checkout.</p>
      <details><summary>Offer details & exclusions</summary><p>One $299 USD discount per order on the base price of a full-size ready-to-ship or custom-made doll. Torsos, hips, minis, standalone heads, parts, accessories, paid add-ons and shipping are excluded. Eligible factory and brand bonuses remain included. Shopify converts the fixed USD discount for your checkout currency. Activation and campaign dates await approval.</p></details>
    </div>
  </section>;
}
