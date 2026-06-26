import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Shipping Protection"
};

export default function ShippingProtectionPage() {
  return (
    <PolicyLayout
      eyebrow="Shipping protection"
      title="Clear protection from dispatch to delivery."
      intro="Shipping protection means you should know when to expect tracking and what to do if delivery goes wrong. We keep the process discreet, documented, and easy to follow."
      ctas={[
        { label: "Buyer protection", href: "/buyer-protection", primary: true },
        { label: "Shipping guide", href: "/shipping" }
      ]}
      cards={[
        {
          title: "Discreet by default",
          body: "Orders move in plain packaging with neutral billing and privacy-conscious communication."
        },
        {
          title: "Tracked delivery",
          body: "Tracking details are shared once the shipment is active and ready for monitoring."
        },
        {
          title: "Damage support",
          body: "If transit damage happens, report it within 24 hours of delivery so we can review repair-kit support or replacement options."
        },
        {
          title: "Loss and misdelivery review",
          body: "If a package is delayed, lost, or misdelivered, our team can review the shipping record and start the next resolution step."
        }
      ]}
      sections={[
        {
          title: "What shipping protection is for",
          items: [
            "Lost or stalled shipments after dispatch.",
            "Material shipping damage visible at delivery or unboxing.",
            "Misdelivery or delivery record problems that need carrier review.",
            "A documented shipping issue where the customer needs one clear answer instead of being passed around."
          ]
        },
        {
          title: "Timing by order type",
          items: [
            "Ready-to-ship warehouse dolls usually leave within 2-3 business days after stock confirmation.",
            "Custom builds usually take about 3-5 weeks before release because production and final approval happen before shipment.",
            "Ready-to-ship orders may not include factory approval photos because speed is the priority."
          ]
        },
        {
          title: "How to report an issue",
          items: [
            "Take photos of the outer carton, inner protection, label area, and the affected part of the product.",
            "If possible, include a short unboxing or issue video for anything that looks like meaningful transit damage.",
            "Send the order reference, delivery date, and a simple summary of what happened within 24 hours of delivery so our team can review it quickly."
          ]
        },
        {
          title: "Packaging expectations",
          items: [
            "Packaging is plain and privacy-conscious by default.",
            "Tracking is shared after shipment activation, not before carrier handoff.",
            "If additional packaging upgrades become available by supplier or lane, we will show them clearly instead of implying they are universal."
          ]
        }
      ]}
      asideTitle="Practical note"
      asideItems={[
        "Do not discard packaging right away if anything looks wrong at delivery.",
        "Faster reporting helps determine whether a repair kit, carrier claim, or replacement is the right solution.",
        "Warehouse orders and custom factory orders can have different timing, but both should feel documented and trackable."
      ]}
    />
  );
}
