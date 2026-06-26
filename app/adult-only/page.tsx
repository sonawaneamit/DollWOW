import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";

export const metadata: Metadata = { title: "Adult-Only Policy" };

export default function AdultOnlyPage() {
  return (
    <PolicyLayout
      eyebrow="Adult-only policy"
      title="DollWow is for adults only."
      intro="This site is intended only for adults who are legally allowed to buy adult products in their location. We keep the catalog adult, clear, and responsible."
      ctas={[
        { label: "Browse catalog", href: "/shop", primary: true },
        { label: "Privacy policy", href: "/privacy-policy" }
      ]}
      sections={[
        {
          title: "Age and local laws",
          items: [
            "You must be an adult in your location to use this site or buy from DollWow.",
            "Customers are responsible for following local laws, customs rules, and import restrictions.",
            "Support may refuse requests that do not fit these standards."
          ]
        },
        {
          title: "Content standards",
          items: [
            "No underage-coded categories, language, imagery, themes, or styling are allowed.",
            "We avoid school themes, teen language, and misleading product claims.",
            "AI-generated visuals must not misrepresent the actual product, included accessories, or shipping state."
          ]
        }
      ]}
      asideTitle="Simple rule"
      asideItems={[
        "Adults only.",
        "No underage-coded content.",
        "No fake reviews, fake buyers, or misleading claims."
      ]}
    />
  );
}
