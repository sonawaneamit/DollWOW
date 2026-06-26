import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Buyer Protection"
};

export default function BuyerProtectionPage() {
  return (
    <PolicyLayout
      eyebrow="Buyer protection"
      title="Protection built for high-consideration orders."
      intro="Buyer protection should answer the biggest checkout questions up front: will the order actually arrive, what happens if it is damaged, and how much approval you get before shipment. We keep those rules visible before payment."
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
          title: "Authenticity and match review",
          body: "We verify the ordered build, timing, and supplier details before the order moves forward. If you found the same listing elsewhere, we can compare the final delivered price before you commit."
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
            "If the issue is not minor, the claim can be escalated into replacement review instead."
          ]
        },
        {
          title: "Ready-to-ship vs custom orders",
          items: [
            "Ready-to-ship warehouse dolls usually leave within 2-3 business days after stock confirmation, with limited customization and no promise of factory approval photos.",
            "Custom builds usually take about 3-5 weeks before release and always include factory photos and videos before shipment."
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
            "We may ask for packaging photos, label photos, and a short description of the issue so the shipping and supplier review can move quickly.",
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
        "Buyer protection is strongest when the order details, options, and final approval are documented clearly."
      ]}
    />
  );
}
