import { env } from "@/lib/utils/env";

export const dollVueCollectionFaqs = [
  { question: "What does DollVue-enabled mean here?", answer: "This collection shows listings currently marked for DollVue appearance previews. The exact product, photo and supported choices are checked again when you open or request a preview; a catalog label does not mean every pictured change is available." },
  { question: "How many appearance changes can one preview show?", answer: "Choose one or two supported appearance options for the exact product. Available choices and compatible combinations vary; the preview checks the selected options before continuing." },
  { question: "Does the preview guarantee the finished doll's appearance?", answer: "No. DollVue creates an approximate visual preview. The finished doll may vary in color, texture, styling and option details. Confirm the actual product and selected order configuration separately." }
];

export function buildDollVueCollectionInformation() {
  const root = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const url = `${root}/shop/dollvue-enabled`;
  // ItemList is deferred while the collection-membership question is with its owner.
  return [
    { "@context": "https://schema.org", "@type": "CollectionPage", name: "DollVue-enabled dolls", description: "Browse dolls currently enabled for DollVue appearance previews on DollWOW.", url },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: root },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${root}/shop/sex-dolls` },
      { "@type": "ListItem", position: 3, name: "DollVue-enabled dolls", item: url }
    ] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: dollVueCollectionFaqs.map(item => ({
      "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer }
    })) }
  ];
}
