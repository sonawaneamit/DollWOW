import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Sex Doll Shipping Guide",
  description: "Compare ready-to-ship and custom sex doll delivery timing, factory photo approval, discreet packaging, tracking, and international shipping expectations."
};

export default function ShippingPage() {
  return (
    <PolicyLayout
      eyebrow="Shipping guide"
      title="Shipping timing and what to expect."
      intro="Shipping timing depends on whether the doll is already in a warehouse or being built to order. DollWow shows that clearly before checkout so customers can tell the difference between a faster warehouse order and a custom build."
      ctas={[
        { label: "Shipping protection", href: "/shipping-protection", primary: true },
        { label: "How ordering works", href: "/how-ordering-works" }
      ]}
      sections={[
        {
          title: "Ready-to-ship orders",
          items: [
            "We confirm the exact warehouse unit and its current dispatch estimate before payment.",
            "These orders are prioritized for fast release, so customization is limited and factory approval photos may not be available.",
            "Final release still depends on stock confirmation and order review."
          ]
        },
        {
          title: "Made-to-order builds",
          items: [
            "Production and delivery timing are confirmed for your exact custom build before payment.",
            "Detailed factory photos and videos are shared before shipment so the final look can be approved before release.",
            "We confirm the expected production and shipping dates after reviewing your final choices."
          ]
        },
        {
          title: "Privacy and tracking",
          items: [
            "Packaging is plain by default.",
            "Tracking details are shared after shipment activation.",
            "Delivery damage should be reported within 24 hours of arrival with photos, packaging, and the order reference kept for review.",
            "International buyers remain responsible for local customs rules and import fees where they apply."
          ]
        }
      ]}
      asideTitle="Fast read"
      asideItems={[
        "Warehouse timing is faster, but still checked before release.",
        "Custom orders are slower because approval happens before shipment, not after.",
        "Shipping protection exists for issues like damage, loss, or misdelivery."
      ]}
    />
  );
}
