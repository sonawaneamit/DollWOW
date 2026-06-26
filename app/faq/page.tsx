import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "FAQ"
};

export default function FaqPage() {
  return (
    <PolicyLayout
      eyebrow="FAQ"
      title="Clear answers before you buy."
      intro="Here are the questions buyers usually want answered before ordering: timing, privacy, price match, customization, factory photos, and what happens if something goes wrong."
      ctas={[
        { label: "Ask our team", href: "/support", primary: true },
        { label: "Help me choose", href: "/help-me-choose" }
      ]}
      sections={[
        {
          title: "Ordering",
          items: [
            "Ready-to-ship dolls usually leave the warehouse within 2-3 business days after stock is confirmed.",
            "Custom builds usually take about 3-5 weeks before release because the doll is built, checked, and approved before shipment.",
            "Product pages show the base setup first. If customization is available, option prices are shown before checkout."
          ]
        },
        {
          title: "Factory photos",
          items: [
            "Custom builds include detailed factory photos and videos before shipment.",
            "You can request cosmetic revisions before the final build is approved for shipment.",
            "Ready-to-ship warehouse dolls may not include factory photos because the goal is faster release."
          ]
        },
        {
          title: "Privacy",
          items: [
            "Packaging is plain by default.",
            "Billing and order communication are kept neutral and practical.",
            "If you have a specific privacy concern, ask our team before checkout."
          ]
        },
        {
          title: "Price match",
          items: [
            "Send the competitor URL, final quoted total, and a cart or checkout screenshot showing the selected options.",
            "We compare the full delivered deal, including options, promos, freebies, and shipping.",
            "If a match is approved, our team can send a unique discount code by email."
          ]
        },
        {
          title: "Damage or delivery issues",
          items: [
            "Report damage or delivery issues within 24 hours of delivery.",
            "Keep the packaging until the issue is understood.",
            "Major transit damage can move into replacement review. Minor cosmetic shipping wear may be handled with a free repair kit and guided support."
          ]
        }
      ]}
      asideTitle="Need a direct answer?"
      asideItems={[
        "Send a product link if you want us to check size, weight, options, or timing.",
        "Send a competitor listing if you want a price-match review.",
        "Email hello@dollwow.com for private support."
      ]}
    />
  );
}
