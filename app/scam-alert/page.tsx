import type { Metadata } from "next";
import { PolicyLayout } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Scam Alert"
};

export default function ScamAlertPage() {
  return (
    <PolicyLayout
      eyebrow="Scam alert"
      title="How to spot a risky listing before you pay."
      intro="High-ticket adult products attract copied listings, fake promotions, and stores that look polished until something goes wrong. DollWow wants the warning signs to be obvious before a customer sends money anywhere."
      ctas={[
        { label: "Compare a listing", href: "/compare", primary: true },
        { label: "Buyer protection", href: "/buyer-protection" }
      ]}
      cards={[
        {
          title: "Unreal pricing",
          body: "If the discount looks wildly lower than the normal market for the same brand and build, it may not be the same product or the seller may not be trustworthy."
        },
        {
          title: "Weak shipping details",
          body: "A serious store should explain timing, tracking, packaging, and what happens if there is damage or loss."
        },
        {
          title: "No real support",
          body: "If you cannot get a clear answer about options, delivery, or claims, the risk goes up fast."
        },
        {
          title: "No approval details",
          body: "For custom orders especially, a serious seller should be able to explain final approval, factory photos, or how mismatches get resolved."
        }
      ]}
      sections={[
        {
          title: "Red flags to watch for",
          items: [
            "The product looks copied from other stores, but policies and support details are vague or missing.",
            "The site pushes a huge discount without explaining shipping, availability, or what is actually included.",
            "The seller cannot explain what happens if the order arrives damaged, delayed, or wrong.",
            "There is no clear privacy language around billing, delivery, or communication."
          ]
        },
        {
          title: "What to ask before paying",
          items: [
            "Is this the exact same body, head, and material as the listing I am comparing?",
            "Is it ready to ship or made to order, and what does that change about timing?",
            "Will I see factory photos before shipment if this is a custom build?",
            "What happens if the item is damaged or never arrives?"
          ]
        }
      ]}
      asideTitle="DollWow shortcut"
      asideItems={[
        "If a listing feels off, send the URL through price match and we can check it with you.",
        "A lower number is not always a better deal once delivery, legitimacy, and product match are checked.",
        "Trust is partly policy, but mostly whether the full process is documented clearly."
      ]}
    />
  );
}
