import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Privacy Policy"
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      eyebrow="Privacy"
      title="Private by default."
      intro="Privacy is not a small detail in this category. DollWow is built around discreet billing, plain packaging, and communication that does not say more than it needs to."
      ctas={[
        { label: "Shipping protection", href: "/shipping-protection", primary: true },
        { label: "Support", href: "/support" }
      ]}
      sections={[
        {
          title: "Checkout and billing",
          items: [
            "Checkout uses protected payment.",
            "Billing language should stay neutral and privacy-conscious.",
            "We only ask for the information needed to process, review, and deliver the order."
          ]
        },
        {
          title: "Order communication",
          items: [
            "Order updates are kept practical and discreet.",
            "If support needs more information about your build, shipping issue, or approval step, we ask for only what helps resolve the case.",
            "Private order notes are used to keep the order clear for the team handling it."
          ]
        },
        {
          title: "Delivery privacy",
          items: [
            "Packaging is plain by default.",
            "Tracking is shared after shipment activation so you can monitor delivery privately.",
            "If a claim or issue happens, we may ask for photos of the package or product to support the review."
          ]
        }
      ]}
      asideTitle="Plain-language promise"
      asideItems={[
        "Private checkout, neutral billing, and discreet delivery are core parts of the DollWow experience.",
        "Every privacy promise on DollWow is written to match the way orders are actually handled.",
        "If you need something handled discreetly, ask our team before checkout so expectations are clear."
      ]}
    />
  );
}
