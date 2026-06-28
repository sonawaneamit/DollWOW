import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Best Price Guarantee"
};

export default function BestPriceGuaranteePage() {
  return (
    <PolicyLayout
      eyebrow="Best price support"
      title="Price-match review with full deal context."
      intro="If you find the same configuration cheaper within 30 days of purchase, DollWow reviews the listing and refunds the difference when it qualifies. We check that it is really the same product, that shipping and freebies do not change the total, and that the seller looks legitimate before approving price support."
      ctas={[
        { label: "Compare a listing", href: "/compare", primary: true },
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
          title: "30-day price protection",
          body: "If the same configuration shows up cheaper within 30 days of your purchase, send us the listing and we will review it for a refund of the difference."
        },
        {
          title: "Trusted-vendor bias",
          body: "Approved vendors and well-known industry sellers are more likely to move through fast review, because their pricing and fulfillment patterns are easier to validate."
        },
        {
          title: "Team review fallback",
          body: "If the match is unclear or the promo math is too aggressive, we create a manual review instead of forcing a risky automatic decision."
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
            "The deal would require ignoring supplier or margin guardrails that are part of responsible pricing."
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
