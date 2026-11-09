import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";
import { policies } from "@/lib/content/store-policies";

export const metadata: Metadata = {
  title: "Sex Doll Returns and Replacements",
  description: "Read DollWow rules for custom sex doll returns, delivery damage, minor repairs, replacements, factory photo approval, and reporting an issue after delivery."
};

export default function ReturnsPage() {
  return (
    <PolicyLayout
      eyebrow="Returns and replacements"
      title="Returns, repairs, and replacements explained."
      intro="How cancellations, returns and product issues are handled."
      ctas={[
        { label: "Buyer protection", href: "/buyer-protection", primary: true },
        { label: "Shipping protection", href: "/shipping-protection" }
      ]}
      sections={policies.find(policy => policy.key === "refund")!.sections.map(([title, copy]) => ({ title, items: [copy] }))}
      asideTitle="Important note"
      asideItems={[
        "Ready-to-ship cancellation or modification requests must be made within four hours of placing the order.",
        "Contact us before returning an item so we can confirm the remedy, costs and destination.",
        "Cancellation rules do not remove remedies for damage, an incorrect item, defects or rights that apply by law."
      ]}
    />
  );
}
