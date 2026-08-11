import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Sex Doll Best Price Guarantee",
  description: "Found the same sex doll and configuration for less? Send DollWow the final offer for a price match before purchase or within 30 days of your order."
};

export default function BestPriceGuaranteePage() {
  return (
    <PolicyLayout
      eyebrow="30-Day Price Lock"
      title="A fair comparison before or after you order."
      intro="We compare the complete offer, including the doll, selected options, extras, shipping, and final price. If the same configuration qualifies, we will match it before purchase or refund the difference within 30 days of your DollWow order."
      ctas={[
        { label: "Request a price match", href: "/price-match", primary: true },
        { label: "Buyer protection", href: "/buyer-protection" }
      ]}
      cards={[
        {
          title: "Same product first",
          body: "We compare body, head, material, availability, and included options before treating two listings as the same doll."
        },
        {
          title: "Total deal review",
          body: "Coupons, seasonal discounts, free add-ons, and shipping terms all matter. We review the effective final price, including the headline number."
        },
        {
          title: "30-Day Price Lock",
          body: "If the same configuration shows up cheaper within 30 days of your purchase, send us the listing and we will review it for a refund of the difference."
        },
        {
          title: "Trusted sellers",
          body: "Listings from established, authorized sellers are usually faster to verify."
        },
        {
          title: "When we need more details",
          body: "If the product, selected options, or final price is unclear, we will email you before deciding."
        }
      ]}
      sections={[
        {
          title: "What helps a fast decision",
          items: [
            "The exact URL of the listing you want checked.",
            "A visible price, promo, coupon, shipping offer, or freebie offer on the page.",
            "A close product match in body, head, material, and availability.",
            "A seller we can reasonably validate as legitimate for that brand.",
            "A request submitted within 30 days of the original purchase when you are asking for a refund of the difference."
          ]
        },
        {
          title: "What slows or blocks approval",
          items: [
            "The listing is from an unverified or obviously risky seller.",
            "The promo depends on vague bundles, hidden coupons, or hard-to-value freebies.",
            "The other page does not look like the same product once body, head, or material are checked closely.",
            "The requested price is below what we can responsibly offer."
          ]
        }
      ]}
      asideTitle="How we treat price support"
      asideItems={[
        "We care more about the real delivered deal than a flashy headline discount.",
        "Some requests can be approved quickly; others need a manual check.",
        "A fair comparison includes shipping, product specs, seller history, and the final delivered price."
      ]}
    />
  );
}
