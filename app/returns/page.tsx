import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Sex Doll Returns and Replacements",
  description: "Read DollWow rules for custom sex doll returns, delivery damage, minor repairs, replacements, factory photo approval, and reporting an issue after delivery."
};

export default function ReturnsPage() {
  return (
    <PolicyLayout
      eyebrow="Returns and replacements"
      title="Returns, repairs, and replacements explained."
      intro="Sex dolls are personal, made-to-order products, so ordinary returns are limited once production begins. Delivery damage, incorrect items, and meaningful differences from an approved custom build still receive prompt support."
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
            "We assess the severity of the issue and the documented condition to determine whether repair, replacement, or another resolution is appropriate.",
            "Minor cosmetic shipping wear is handled differently from major transit damage."
          ]
        },
        {
          title: "How we keep this fair",
          items: [
            "Custom production begins only after the order details are confirmed.",
            "Factory photos give custom-order customers a chance to approve the final appearance before shipment.",
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
