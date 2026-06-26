import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";

export const metadata: Metadata = { title: "Returns and Replacements" };

export default function ReturnsPage() {
  return (
    <PolicyLayout
      eyebrow="Returns and replacements"
      title="Resolution rules that match the product."
      intro="High-ticket orders need clear rules before checkout. DollWow reviews product details before the order moves forward and helps with documented delivery or quality issues after arrival."
      ctas={[
        { label: "Buyer protection", href: "/buyer-protection", primary: true },
        { label: "Shipping protection", href: "/shipping-protection" }
      ]}
      sections={[
        {
          title: "Custom-order expectations",
          items: [
            "Custom items may not be returnable once production begins.",
            "That is why the option review and factory-photo approval steps matter so much before shipment.",
            "Ready-to-ship warehouse dolls move faster, but usually have fewer customization changes available."
          ]
        },
        {
          title: "Damage and delivery issues",
          items: [
            "Damage, missing-item, or wrong-item claims need photos and order details within 24 hours of delivery.",
            "Replacement decisions depend on the seriousness of the issue, supplier review, and documented product condition.",
            "Minor cosmetic shipping wear is handled differently from major transit damage."
          ]
        },
        {
          title: "How we keep this fair",
          items: [
            "Coverage is written around the realities of custom production, shipping, and documented product condition.",
            "Customer confidence comes from clear rules, careful review, and real support when something needs attention.",
            "The goal is a clear answer: repair, replacement, or another fair resolution when the order genuinely needs it."
          ]
        }
      ]}
      asideTitle="Important note"
      asideItems={[
        "Report any issue within 24 hours of delivery and keep packaging until the case is understood.",
        "Custom production limits ordinary returns, but documented delivery problems are still taken seriously.",
        "Buyer protection and shipping protection pages explain the difference between major and minor issues."
      ]}
    />
  );
}
