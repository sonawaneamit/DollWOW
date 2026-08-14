import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import archiveManifest from "./archive-manifest.json";
import { ArchiveGallery } from "./ArchiveGallery";
import styles from "./page.module.css";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dollwow.com").replace(/\/$/, "");
const canonicalUrl = `${siteUrl}/factory-photos`;
const coverUrl = `${siteUrl}/images/factory-approval-archive/factory-approval-cover.webp`;

export const metadata: Metadata = {
  title: "Sex Doll Factory Photos & Approval Archive | DollWOW",
  description:
    "Browse anonymized sex doll factory photos from prior team approval work and learn what pre-shipment pictures can help you review before release.",
  alternates: {
    canonical: canonicalUrl,
    types: { "text/markdown": `${siteUrl}/markdown/factory-photos` }
  },
  openGraph: {
    title: "Sex Doll Factory Photos & Approval Archive | DollWOW",
    description:
      "A selected archive of historical factory approval pictures, with a practical guide to what buyers can and cannot review before release.",
    url: canonicalUrl,
    type: "website",
    images: [{ url: coverUrl, width: 1200, height: 630, alt: "DollWOW Factory Approval Archive" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Sex Doll Factory Photos & Approval Archive | DollWOW",
    description: "See historical approval examples and learn how to review pre-shipment factory pictures.",
    images: [coverUrl]
  },
  robots: { index: true, follow: true }
};

const heroImages = [
  "/images/factory-approval-archive/factory-approval-006.webp",
  "/images/factory-approval-archive/factory-approval-005.webp",
  "/images/factory-approval-archive/factory-approval-007.webp",
  "/images/factory-approval-archive/factory-approval-008.webp"
] as const;

const checklist = [
  ["Compare the confirmed build", "Check the visible head and body combination against the configuration confirmed for the order."],
  ["Review selected appearance details", "Look for clearly shown choices such as skin tone, eyes, hair or wig, makeup, nails, and other supported visible options."],
  ["Inspect the visible finish", "Look for an obvious mark, damage, finishing concern, or meaningful visible difference that should be raised before release."],
  ["Ask when a view is unclear", "If a decision-critical detail is missing, cropped, out of focus, or difficult to judge under the available lighting, ask whether clearer media can be requested."],
  ["Keep the approval record", "Save the supplied media and written confirmation with the order record so the approved visible details remain clear."]
] as const;

const processSteps = [
  ["Confirm the supported build", "Human Build Check reviews the selected configuration, obvious compatibility questions, and details that require supplier confirmation."],
  ["Request factory media where supported", "After production, available photographs or video may be gathered for an eligible custom build before release."],
  ["Review what can be seen", "Our team compares visible details with the supported order record and identifies anything that needs clarification."],
  ["Approve or raise a visible concern", "Review the supplied media before release. Any additional view or available correction depends on the concern, product, and manufacturer."]
] as const;

const faqs = [
  ["Are these photographs from current DollWOW orders?", "No. They are selected, anonymized examples from real customer orders handled by members of the DollWOW team through a previous business before DollWOW launched. They show prior team experience, not current DollWOW fulfillment history."],
  ["Are these photographs of products currently sold by DollWOW?", "Do not use the archive to identify a current product, brand, or configuration. Customer, order, brand, and product identities have been removed, and an historical image is not proof that the same product or option is currently available."],
  ["Does every DollWOW order receive factory photos?", "No. Factory media may be available for eligible custom builds where the product and manufacturer support it. Ready-to-ship orders and some custom products may follow a different release process. Ask our team to confirm the path for the exact product before checkout."],
  ["What can factory approval photos help me check?", "Clear media may help you review the visible head and body combination, appearance selections, overall finish, and an obvious cosmetic concern. What can be confirmed depends on what the supplied photographs or video actually show."],
  ["What can factory photos not verify?", "Photographs cannot prove internal construction, joint durability, exact material feel, hidden components, electronics, long-term performance, precise measurements, seller authenticity, or condition after transportation. Lighting, camera settings, angles, and screens can also affect color."],
  ["Why can factory photos look different from product-gallery pictures?", "Product galleries often use planned lighting, styling, clothing, and finished sets. Factory media is usually practical documentation of a completed build, so lighting, camera angle, styling, and presentation can differ."],
  ["Can I ask for clearer media or raise a concern?", "Yes. If an important visible detail is unclear or appears meaningfully different from the supported order record, raise it before approval. Whether additional media or a correction is available depends on the concern, product, and manufacturer."],
  ["Do factory photos guarantee quality or the exact result I will receive?", "No. They are a visible checkpoint, not a guarantee of hidden construction, material feel, durability, transit condition, or an identical future result. Use them together with the confirmed product record, current policies, and support from the DollWOW team."],
  ["Does factory approval replace arrival support?", "No. Factory approval is a pre-shipment visual checkpoint. DollWOW's published Buyer Protection, Shipping Protection, Returns, and Care for Life pages explain the applicable support path after delivery."],
  ["Can factory media be retained with my order records?", "Available build and approval records may be retained with the qualifying private Doll Passport where that service is supported for the order."]
] as const;

export const archiveDisclosure =
  "Every image in this public preview is an anonymized historical example from a real customer order handled by members of our team.";

function safeJson(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function structuredData() {
  const representativeImages = archiveManifest.entries.slice(0, 12).map((entry, index) => ({
    "@type": "ImageObject",
    contentUrl: `${siteUrl}${entry.src}`,
    thumbnailUrl: `${siteUrl}${entry.src}`,
    caption: `Historical factory approval example for ${reviewPurpose(entry.category).toLowerCase()}.`,
    representativeOfPage: index < 4,
    creditText: "DollWOW Factory Approval Archive"
  }));
  const gallery = {
    "@type": "ImageGallery",
    "@id": `${canonicalUrl}#gallery`,
    name: "Factory Approval Archive",
    description: "Anonymized historical factory photos from prior team approval work.",
    associatedMedia: representativeImages,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: representativeImages.length,
      itemListElement: representativeImages.map((image, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: image
      }))
    }
  };
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": canonicalUrl,
      url: canonicalUrl,
      name: "Factory Approval Archive",
      description: metadata.description,
      mainEntity: { "@id": `${canonicalUrl}#gallery` }
    },
    { "@context": "https://schema.org", ...gallery },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Factory Approval Archive", item: canonicalUrl }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer }
      }))
    }
  ];
}

function reviewPurpose(category: string) {
  if (category === "build") return "Completed build";
  if (category === "face") return "Face and finish";
  if (category === "release") return "Release review";
  return "Visible details";
}

export default function FactoryPhotosPage() {
  const schemas = structuredData();
  return (
    <main className={styles.page}>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schema) }} />
      ))}

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Factory photos from prior approval work</p>
          <h1>Factory Approval Archive</h1>
          <p className={styles.heroLead}>Browse a selected, anonymized archive of sex doll factory photos from real customer orders handled by members of our team through a previous business before DollWOW launched.</p>
          <p className={styles.heroSupport}>These historical examples show the visible details pre-shipment pictures can help a buyer review. They are not current DollWOW orders, exact product references, or a promise that factory media will be available for every order.</p>
          <div className={styles.heroActions}>
            <Link href="/how-ordering-works">See how approval works</Link>
            <Link href="/shop/custom">Shop customizable dolls</Link>
          </div>
        </div>
        <div className={styles.heroMosaic} aria-label="Selected anonymized sex doll factory photos from prior approval work">
          {heroImages.map((src, index) => (
            <figure key={src}>
              <Image src={src} alt="Anonymized historical factory approval photo" fill sizes="(max-width: 760px) 50vw, 300px" priority={index < 2} />
            </figure>
          ))}
        </div>
      </header>

      <section className={styles.directAnswer} aria-labelledby="factory-photo-answer">
        <div>
          <p className={styles.eyebrow}>The pre-shipment visual checkpoint</p>
          <h2 id="factory-photo-answer">What are sex doll factory approval photos?</h2>
        </div>
        <p>Sex doll factory approval photos are pre-shipment images that may be available for an eligible custom order after production and before release. They can help a buyer compare visible configuration and appearance details with the supported order record and raise an obvious concern before shipment. They cannot prove internal construction, exact material feel, long-term durability, precise color under every light, electronic performance, or condition after transit.</p>
      </section>

      <p className={styles.galleryDisclosure}>{archiveDisclosure}</p>
      <ArchiveGallery manifestEntries={archiveManifest.entries} />

      <section className={styles.reviewSection} aria-labelledby="review-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Before you approve</p>
          <h2 id="review-title">How to review factory photos</h2>
          <p>Start with the supported order record, then use the supplied media to check only what is clearly visible. A photo is evidence for a visible decision, not proof of everything inside the product.</p>
        </div>
        <div className={styles.reviewGrid}>
          {checklist.map(([title, body], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.limitations} aria-labelledby="limitations-title">
        <div>
          <p className={styles.eyebrow}>What a photograph cannot answer</p>
          <h2 id="limitations-title">Useful evidence, not a quality guarantee</h2>
        </div>
        <div>
          <p>Factory photos can support a visible pre-shipment review, but they cannot establish material composition or feel, hidden construction, joint durability, electronics, precise measurements, long-term performance, seller authenticity, or condition after transportation. Camera settings, factory lighting, viewing screens, angles, and styling can also affect how color and finish appear.</p>
          <aside>If a fact affects your decision and the photograph cannot establish it, <Link href="/support">ask our team</Link> to confirm what the product record, manufacturer, or published policy can support.</aside>
        </div>
      </section>

      <section className={styles.process} aria-labelledby="approval-process-title">
        <div className={styles.processHeading}>
          <p className={styles.eyebrow}>For eligible custom orders</p>
          <h2 id="approval-process-title">Where factory media fits</h2>
          <p>Availability, format, timing, and coverage vary by product and manufacturer. The complete order path lives in our ordering guide.</p>
          <Link className={styles.inlineLink} href="/how-ordering-works">Read the complete ordering process</Link>
        </div>
        <ol>
          {processSteps.map(([title, body], index) => (
            <li key={title}>
              <span>0{index + 1}</span>
              <div><h3>{title}</h3><p>{body}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <nav className={styles.relatedLinks} aria-label="Factory approval guidance">
        <Link href="/learn/ready-to-ship-vs-custom-sex-dolls">Compare ready-to-ship and custom dolls</Link>
        <Link href="/care-for-life">Understand DollWOW Care for Life</Link>
        <Link href="/buyer-protection">Review buyer protection</Link>
        <Link href="/shipping-protection">Read shipping protection</Link>
        <Link href="/returns">Check the returns policy</Link>
        <Link href="/learn/sex-doll-scams">Learn how to evaluate a seller and listing</Link>
      </nav>

      <section className={styles.faq} aria-labelledby="factory-faq-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Practical answers</p>
          <h2 id="factory-faq-title">Factory-photo questions</h2>
        </div>
        <div className={styles.faqList}>
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}<span aria-hidden="true">+</span></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.closing}>
        <div>
          <p className={styles.eyebrow}>Human Build Check</p>
          <h2>Choose a custom build with experienced support already in the process.</h2>
          <p>If the exact product or approval path is unclear, ask our team. We will confirm what can be ordered, what factory media may be available, and what deserves attention before checkout.</p>
        </div>
        <div className={styles.actions}>
          <Link href="/shop/custom">Shop customizable dolls</Link>
          <Link href="/support">Ask our team</Link>
        </div>
      </section>

      <p className={styles.disclosure}>Historical prior-team examples. Factory media and available views vary by product, order, and manufacturer.</p>
    </main>
  );
}
