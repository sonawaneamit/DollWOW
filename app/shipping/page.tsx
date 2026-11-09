import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";
import { policies } from "@/lib/content/store-policies";

export const metadata: Metadata = {
  title: "Sex Doll Shipping Guide",
  description: "Compare ready-to-ship and custom sex doll delivery timing, factory photo approval, discreet packaging, tracking, and international shipping expectations."
};

export default function ShippingPage() {
  return (
    <PolicyLayout
      eyebrow="Shipping guide"
      title="Shipping timing and what to expect."
      intro="Delivery depends on the product, warehouse, destination and confirmed order."
      ctas={[
        { label: "Shipping protection", href: "/shipping-protection", primary: true },
        { label: "How ordering works", href: "/how-ordering-works" }
      ]}
      sections={policies.find(policy => policy.key === "shipping")!.sections.map(([title, copy]) => ({ title, items: [copy] }))}
      asideTitle="Fast read"
      asideItems={[
        "Warehouse timing is faster, but still checked before release.",
        "Custom orders are slower because approval happens before shipment, not after.",
        "Shipping protection exists for issues like damage, loss, or misdelivery."
      ]}
    />
  );
}
