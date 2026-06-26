import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "How Ordering Works"
};

export default function HowOrderingWorksPage() {
  return (
    <PolicyLayout
      eyebrow="How ordering works"
      title="A private, step-by-step order."
      intro="This category is easier to trust when every step is visible. DollWow keeps ordering simple: choose the build, review the details, approve the final look where available, and receive the order discreetly."
      ctas={[
        { label: "Browse the catalog", href: "/shop", primary: true },
        { label: "Help me choose", href: "/help-me-choose" }
      ]}
      sections={[
        {
          title: "1. Pick the right starting build",
          items: [
            "Use the catalog, warehouse list, or guided quiz to narrow by height, material, availability, and overall look.",
            "If you already found the doll elsewhere, use price match so we can check the listing before you commit."
          ]
        },
        {
          title: "2. Review options and final specs",
          items: [
            "The product page starts from the factory setup and shows available option pricing before checkout.",
            "Measurements, material, delivery timing, and relevant buying notes should be visible before you place the order."
          ]
        },
        {
          title: "3. Team review before the order moves forward",
          items: [
            "We review timing, configuration, and any support notes after checkout.",
            "If something looks unclear, we reach out before the order moves deeper into fulfillment.",
            "Ready-to-ship dolls are prepared for warehouse release, while custom builds move into production after review."
          ]
        },
        {
          title: "4. Factory photo approval for custom builds",
          items: [
            "Where available, custom builds include detailed factory photos and videos before shipment.",
            "Cosmetic revisions can be requested until the final visual build is approved.",
            "Structural re-spec work is treated differently from visual revision requests."
          ]
        },
        {
          title: "5. Discreet dispatch and tracking",
          items: [
            "Ready-to-ship warehouse dolls usually leave within 2-3 business days after stock confirmation.",
            "Custom builds usually take about 3-5 weeks before release because approval happens before shipment.",
            "Orders move in plain packaging with neutral billing and privacy-conscious communication.",
            "Tracking details are shared once the shipment is active."
          ]
        },
        {
          title: "6. Delivery check and issue reporting",
          items: [
            "If anything arrives damaged, report it within 24 hours of delivery with photos, packaging, and a short summary.",
            "Minor cosmetic shipping wear is reviewed differently from major transit damage or a meaningful mismatch."
          ]
        }
      ]}
      asideTitle="Good to know"
      asideItems={[
        "Ready-to-ship and made-to-order dolls have different timing, so always check availability first.",
        "The factory photo stage is one of the biggest trust steps for custom orders.",
        "Fast warehouse release can mean factory approval photos are not available on ready-to-ship items.",
        "If you want help before checkout, send the product, budget, or concern and our team can do a second pass with you."
      ]}
    />
  );
}
