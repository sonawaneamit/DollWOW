import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Discreet Sex Doll Shipping Protection",
  description: "Learn how DollWow handles plain packaging, tracking, lost shipments, misdelivery, transit damage, repair kits, and replacement support."
};

export default function ShippingProtectionPage() {
  return (
    <PolicyLayout
      eyebrow="Shipping protection"
      title="Discreet, tracked shipping with help when you need it."
      intro="Your doll ships in plain packaging, and tracking is sent as soon as the carrier receives it. If a package is lost, misdelivered, or damaged in transit, contact us within 24 hours of delivery so we can help."
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
          title: "Lost or misdelivered orders",
          body: "If a package is delayed, lost, or delivered to the wrong place, we check the carrier record and help arrange the appropriate resolution."
        }
      ]}
      sections={[
        {
          title: "What shipping protection is for",
          items: [
            "Lost or stalled shipments after dispatch.",
            "Material shipping damage visible at delivery or unboxing.",
            "Misdelivery or delivery record problems that need carrier review.",
            "One DollWow contact to help you through the claim."
          ]
        },
        {
          title: "Timing by order type",
          items: [
            "For ready-to-ship dolls, we confirm the exact warehouse unit and its current dispatch estimate before payment.",
            "For custom builds, we confirm production and delivery timing for the exact configuration before payment.",
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
            "Available packaging or shipping upgrades are shown on the product page or confirmed before payment."
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
