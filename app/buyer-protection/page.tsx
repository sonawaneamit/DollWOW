import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";
import { Care365Seal } from "@/components/care/Care365Seal";

export const metadata: Metadata = {
  title: "Sex Doll Buyer Protection",
  description: "Understand DollWow buyer protection for custom sex dolls, factory photo approval, shipping damage, lost orders, repairs, replacements, and refunds."
};

export default function BuyerProtectionPage() {
  return (
    <PolicyLayout
      eyebrow="Buyer protection"
      title="Order with a clear plan if something goes wrong."
      intro="Every DollWow order includes private support from checkout through delivery. Custom dolls include factory photo approval, and documented delivery problems are covered by a clear repair, replacement, or refund process."
      ctas={[
        { label: "See shipping protection", href: "/shipping-protection", primary: true },
        { label: "How ordering works", href: "/how-ordering-works" }
      ]}
      cards={[
        {
          title: "Arrival guarantee",
          body: "If an order is lost in transit, misdelivered, or does not arrive after a confirmed shipment, our team investigates and helps with replacement or refund support when it qualifies."
        },
        {
          title: "Material damage coverage",
          body: "If the doll arrives with meaningful shipping damage, we work toward a full replacement or another fair resolution. Minor cosmetic transit wear is handled with a complimentary repair kit and guided support."
        },
        {
          title: "Pre-shipment approval",
          body: "For custom builds, we send detailed factory photos and videos before shipment. Cosmetic revision requests can continue until you approve the final look for release."
        },
        {
          title: "Order confirmation",
          body: "We confirm the selected doll, options, and expected timing before production or dispatch. If you found the same configuration for less, send it to us for a price match."
        }
      ]}
      sections={[
        {
          title: "What is covered",
          items: [
            "Orders that do not arrive after a confirmed shipment and documented investigation.",
            "Material shipping damage that affects the doll in a meaningful way.",
            "Major mismatch between the approved final build and what was delivered, when documented clearly after delivery.",
            "Shipping issues that fall inside the active protection and claim windows shared at checkout or in support."
          ]
        },
        {
          title: "What happens with minor cosmetic damage",
          intro: "Small transit wear should not force a customer into a full replacement process when a fast repair is the better outcome.",
          items: [
            "Minor cuts, bruises, small finish marks, or similar cosmetic transit wear are handled through a complimentary silicone or TPE repair kit, depending on the material.",
            "Our team provides guided repair support so the issue can be handled quickly and privately.",
            "If the damage is more serious, we move to a replacement or refund assessment."
          ]
        },
        {
          title: "Ready-to-ship vs custom orders",
          items: [
            "For ready-to-ship dolls, we confirm the exact warehouse unit and its current dispatch estimate before payment. Customization is usually limited, and factory approval photos may not be available.",
            "For custom builds, we confirm production and delivery timing for the exact configuration before payment and share factory photos and videos before shipment."
          ]
        },
        {
          title: "Factory photo revision rules",
          items: [
            "Cosmetic revision requests can be made during the factory photo approval step before shipment.",
            "This covers visual details such as finish, styling, or similar appearance-level concerns shown in the approval material.",
            "Structural production changes like height, cup size, skeleton type, and similar major specification changes are not part of unlimited cosmetic revision coverage."
          ]
        },
        {
          title: "Claim expectations",
          items: [
            "Damage or delivery issues should be reported within 24 hours of delivery with photos, video where useful, and the order reference.",
            "We may ask for packaging photos, label photos, and a short description so we can resolve the claim quickly.",
            "Custom products are reviewed carefully before release, which is why pre-shipment approval matters so much in this category."
          ]
        },
        {
          title: "What is not treated as a full replacement case",
          items: [
            "Minor transit wear such as small finish marks, light surface bruising, or similar cosmetic issues that can be resolved with guided repair support.",
            "Major post-approval specification changes requested after production has already been confirmed.",
            "Claims raised after the documented delivery-reporting window without enough evidence for a shipping review."
          ]
        }
      ]}
      asideTitle="Before you order"
      asideItems={[
        "Custom products should always be reviewed at the factory-photo stage before shipment.",
        "Keep all delivery packaging until any shipping concern is resolved.",
        "Ready-to-ship items move faster, but that can mean fewer pre-release approval steps.",
        "Keep your order confirmation and factory approval messages until delivery is complete."
      ]}
    ><Care365Seal /></PolicyLayout>
  );
}
