import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";

export const metadata: Metadata = { title: "Shipping Guide" };

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
            "Ready-to-ship products usually leave the warehouse within 2-3 business days after stock confirmation.",
            "These orders are prioritized for fast release, so customization is limited and factory approval photos may not be available.",
            "Final release still depends on stock confirmation and order review."
          ]
        },
        {
          title: "Made-to-order builds",
          items: [
            "Custom orders usually take about 3-5 weeks before release because the build moves through production, review, and final approval before shipment.",
            "Detailed factory photos and videos are shared before shipment so the final look can be approved before release.",
            "Timing is confirmed before the order moves deeper into fulfillment."
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
