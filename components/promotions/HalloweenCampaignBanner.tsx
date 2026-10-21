import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";
import { HalloweenCode } from "./HalloweenCode";
import "./halloween-campaign.css";

export function HalloweenCampaignBanner() {
  return <section id="halloween-2026" aria-labelledby="halloween-offer-heading">
    <div className="halloween-campaign">
      <div className="halloween-campaign-copy">
        <p className="halloween-eyebrow"><Gift size={17} aria-hidden="true" /> Halloween at DollWOW</p>
        <h1 id="halloween-offer-heading"><span className="halloween-amount">$299 <span>off</span></span><span className="halloween-offer">full-size dolls</span></h1>
        <p className="halloween-tagline">No tricks. Just your next obsession.</p>
        <p className="halloween-support">Ready-to-ship or made for you.<br />Your eligible factory bonuses stay, too.</p>
        <HalloweenCode campaign />
        <Link className="halloween-shop" href="/shop">Find your doll <ArrowRight size={19} aria-hidden="true" /></Link>
        <p className="halloween-footnote">One $299 USD discount per order, on the doll’s base price.</p>
      </div>
    </div>
    <div className="halloween-campaign-notes">
      <p>Preview only · Code not yet active at checkout.</p>
      <details><summary>Offer details & exclusions</summary><p>Full-size ready-to-ship and custom-made dolls. Torsos, hips, minis, standalone heads, parts, accessories, paid add-ons and shipping are excluded. Eligible factory and brand bonuses remain included. Shopify converts the fixed USD discount for your checkout currency. Activation and campaign dates await approval.</p></details>
    </div>
  </section>;
}
