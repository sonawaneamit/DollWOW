import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GoldButton } from "@/components/GoldButton";
import { GuideDownloadButton } from "@/components/GuideDownloadButton";
import { ProductCard } from "@/components/ProductCard";
import { notFound } from "next/navigation";
import { headingId, MarkdownContent, type MarkdownSectionVisual } from "@/components/MarkdownContent";
import { compactFilters, filterProducts, requiresCatalogWideFetch, shopifyQueryForFilters, type CatalogFilters } from "@/lib/catalog/filters";
import {
  buildArticleBreadcrumbStructuredData,
  buildArticleFaqStructuredData,
  buildArticleStructuredData,
  absoluteUrl,
  getLearnAuthor,
  getLearningArticle,
  getLearningArticles,
  learnArticleUrl
} from "@/lib/learn/content";
import { getProducts, getProductsByHandles } from "@/lib/shopify/storefront";
import type { Product } from "@/types/product";
import guideProductGroupsData from "@/content/learn/sex-doll-guide-products.json";

export function generateStaticParams() {
  return getLearningArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getLearningArticle(slug);
  if (!article) return {};
  const featuredImageDimensions = article.slug === "sex-doll-guide"
    ? { width: 1672, height: 941 }
    : { width: 1536, height: 1024 };
  return {
    title: article.title,
    description: article.description,
    keywords: [article.primaryKeyword, ...article.secondaryKeywords],
    alternates: { canonical: learnArticleUrl(article.slug) },
    openGraph: {
      title: article.title,
      description: article.description,
      url: learnArticleUrl(article.slug),
      type: "article",
      siteName: "DollWow",
      images: article.featuredImage ? [{ url: absoluteUrl(article.featuredImage)!, alt: article.featuredImageAlt, ...featuredImageDimensions }] : undefined
    },
    twitter: {
      card: article.featuredImage ? "summary_large_image" : "summary",
      title: article.title,
      description: article.description,
      images: article.featuredImage ? [absoluteUrl(article.featuredImage)!] : undefined
    }
  };
}

export default async function LearnArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getLearningArticle(slug);
  if (!article) notFound();
  const author = getLearnAuthor(article.author);
  const schema = [buildArticleStructuredData(article), buildArticleBreadcrumbStructuredData(article), buildArticleFaqStructuredData(article)].filter(Boolean);
  const productModule = article.slug === "sex-doll-guide" ? null : await getArticleProductModule(article.slug);
  const guideProductGroups = article.slug === "sex-doll-guide" ? await getGuideProductGroups() : [];
  const featuredImageDimensions = article.slug === "sex-doll-guide"
    ? { width: 1672, height: 941 }
    : { width: 1536, height: 1024 };

  return (
    <div>
      {schema.map((entry) => (
        <script key={entry?.["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
      ))}

      <section className="tone-section" data-tone="deep">
        <div className="tone-inner">
          <Link href="/learn" className="text-sm font-semibold text-gold-300">
            Learning Center
          </Link>
          <p className="mt-5 text-sm  text-gold-300">{article.category}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-ivory-50 sm:text-5xl">{article.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-ivory-300">{article.description}</p>
          {article.slug === "sex-doll-guide" ? <GuideDownloadButton /> : null}
          {article.featuredImage ? (
            <div className="mt-8 max-w-5xl overflow-hidden rounded-[8px] border border-gold-500/18 bg-ivory-50/[0.04]">
              <Image
                src={article.featuredImage}
                alt={article.featuredImageAlt}
                width={featuredImageDimensions.width}
                height={featuredImageDimensions.height}
                priority
                className="h-auto w-full object-cover"
                sizes="(min-width: 1024px) 80rem, 100vw"
              />
            </div>
          ) : null}
          <div className="mt-8 max-w-3xl rounded-[8px] border border-gold-500/18 bg-ivory-50/[0.05] p-5">
            <p className="text-sm font-semibold text-ivory-50">
              By {article.authorDisplayName}, {article.authorTitle}
            </p>
            <p className="mt-2 text-sm leading-6 text-ivory-300">{author?.bio}</p>
            <p className="mt-3 text-sm  text-gold-300">Last reviewed {article.lastReviewed}</p>
          </div>
        </div>
      </section>

      <section className="tone-section" data-tone="blush">
        <div className="tone-inner">
          <article className="mx-auto max-w-3xl">
            {article.slug === "sex-doll-guide" ? <GuideTableOfContents markdown={article.body} /> : null}
            <MarkdownContent
              markdown={article.body}
              sectionVisuals={guideSectionVisuals(article.slug)}
              sectionInsertions={guideProductGroups.length ? [{
                afterHeading: "Curated Live Product Shortlists",
                content: <GuideProductShortlists groups={guideProductGroups} />
              }] : []}
            />
            <ArticleInfographic slug={article.slug} />
            <ArticleProductExamples module={productModule} />
            <ArticleActions slug={article.slug} />
          </article>
        </div>
      </section>
    </div>
  );
}

function GuideTableOfContents({ markdown }: { markdown: string }) {
  const headings = markdown
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => line.replace(/^##\s+/, ""))
    .filter((heading) => !["Quick Answer", "What This Guide Covers"].includes(heading));

  return (
    <nav aria-label="Guide chapters" className="mb-12 border-y border-gold-500/20 py-7">
      <p className="text-sm font-semibold text-gold-700">Guide chapters</p>
      <ol className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {headings.map((heading, index) => (
          <li key={heading} className="text-sm leading-6 text-ink-700">
            <a href={`#${headingId(heading)}`} className="transition hover:text-gold-700">
              <span className="mr-2 font-semibold text-gold-700">{String(index + 1).padStart(2, "0")}</span>
              {heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

async function getArticleProductModule(slug: string) {
  const config = productModuleConfig(slug);
  if (!config) return null;

  if (config.handles?.length) {
    const products = await getProductsByHandles(config.handles, { revalidate: 120 });
    return { ...config, products };
  }

  const filters = compactFilters(config.filters);
  const products = await getProducts({
    query: shopifyQueryForFilters(filters),
    first: requiresCatalogWideFetch(filters) ? 600 : 80
  });
  const picks = filterProducts(products, filters).slice(0, 3);
  return { ...config, products: picks };
}

type GuideProductGroupDefinition = {
  title: string;
  description: string;
  collectionHref: string;
  collectionLabel: string;
  items: Array<{ handle: string; reason: string }>;
};

type GuideProductGroup = Omit<GuideProductGroupDefinition, "items"> & {
  items: Array<{ product: Product; reason: string }>;
};

async function getGuideProductGroups(): Promise<GuideProductGroup[]> {
  const definitions = guideProductGroupsData as GuideProductGroupDefinition[];
  const handles = definitions.flatMap((group) => group.items.map((item) => item.handle));
  const products = await getProductsByHandles(handles, { revalidate: 120 });
  const byHandle = new Map(products.map((product) => [product.handle, product]));

  return definitions.map((group) => ({
    ...group,
    items: group.items.flatMap((item) => {
      const product = byHandle.get(item.handle);
      return product ? [{ product, reason: item.reason }] : [];
    })
  })).filter((group) => group.items.length);
}

function GuideProductShortlists({ groups }: { groups: GuideProductGroup[] }) {
  return (
    <div className="mt-6 space-y-12">
      <p className="text-base leading-7 text-text-dim">
        These are comparison examples, not a universal ranking. Prices, availability, specifications, and options come from the live DollWow catalog and should be rechecked on the product page before ordering.
      </p>
      {groups.map((group) => (
        <section key={group.title} aria-labelledby={headingId(group.title)} className="border-t border-border pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 id={headingId(group.title)} className="text-2xl font-semibold leading-tight text-text">{group.title}</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-text-dim">{group.description}</p>
            </div>
            <Link href={group.collectionHref} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-accent underline underline-offset-4 transition hover:text-text">
              {group.collectionLabel}
            </Link>
          </div>
          <div className="catalog-grid mt-6 grid gap-5 sm:grid-cols-2">
            {group.items.map(({ product, reason }, index) => (
              <div key={product.handle} className="min-w-0">
                <ProductCard product={product} priority={index < 2} />
                <div className="border-x border-b border-border bg-surface-elevated px-4 py-4 text-sm leading-6 text-text-dim">
                  <p className="font-semibold text-text">Why it is included</p>
                  <p className="mt-1">{reason}</p>
                  <p className="mt-2 text-xs text-text-dim">{guideMeasurements(product)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function guideMeasurements(product: Product) {
  const values = [];
  if (product.extended.heightCm) values.push(`${heightImperial(product.extended.heightCm)} / ${product.extended.heightCm} cm`);
  if (product.extended.weightLb) values.push(`${trimNumber(product.extended.weightLb)} lb / ${trimNumber(product.extended.weightLb * 0.45359237)} kg`);
  else values.push("Current listed weight: ask support to confirm");
  if (product.extended.material) values.push(product.extended.material);
  return values.join(" | ");
}

function heightImperial(heightCm: number) {
  const totalInches = Math.round(heightCm / 2.54);
  return `${Math.floor(totalInches / 12)} ft ${totalInches % 12} in`;
}

function trimNumber(value: number) {
  return Number(value.toFixed(1)).toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function ArticleInfographic({ slug }: { slug: string }) {
  const infographic = infographicConfig(slug);
  if (!infographic) return null;

  return (
    <aside className="tone-card mt-12 overflow-hidden rounded-[8px] p-0 shadow-soft" aria-labelledby={`${slug}-infographic-heading`}>
      <div className="border-b border-gold-500/14 bg-ivory-50/[0.48] p-5">
        <p className="text-sm font-semibold  text-gold-700">{infographic.eyebrow}</p>
        <h2 id={`${slug}-infographic-heading`} className="mt-2 text-2xl font-semibold leading-tight text-text">
          {infographic.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-ink-700">{infographic.summary}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {infographic.stats.map((stat) => (
            <div key={stat.label} className="rounded-[8px] border border-gold-500/16 bg-white/60 p-4">
              <p className="text-2xl font-semibold text-gold-700">{stat.value}</p>
              <p className="mt-1 text-sm leading-5 text-ink-700">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 p-5">
        {infographic.items.map((item, index) => (
          <div key={item.title} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 rounded-[8px] border border-gold-500/14 bg-white/55 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-300 text-sm font-semibold text-white">{index + 1}</span>
            <div>
              <h3 className="text-base font-semibold leading-tight text-text">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-700">{item.body}</p>
            </div>
          </div>
        ))}
        <div className="pt-1">
          <Link href={infographic.href} className="inline-flex rounded-[12px] border border-border-strong px-4 py-2 text-sm font-semibold text-text transition hover:border-border-strong hover:bg-ink-950/[0.04]">
            {infographic.cta}
          </Link>
        </div>
      </div>
    </aside>
  );
}

function ArticleProductExamples({ module }: { module: ArticleProductModule | null }) {
  if (!module || !module.products.length) return null;

  return (
    <aside className="mt-14 border-y border-border py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">Explore the catalog</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-text">{module.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-dim">{module.description}</p>
        </div>
        <Link href={module.collectionHref} className="inline-flex min-h-11 shrink-0 items-center rounded-sm border border-border px-4 text-sm font-semibold text-text transition hover:border-accent">
          View collection
        </Link>
      </div>
      <div className="catalog-grid mt-7 grid gap-5 sm:grid-cols-2">
        {module.products.map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index < 2} />
        ))}
      </div>
    </aside>
  );
}

function guideSectionVisuals(slug: string): MarkdownSectionVisual[] {
  if (slug !== "sex-doll-guide") return [];
  return [
    {
      afterHeading: "TPE, Silicone, and Hybrid Construction",
      src: "/images/learn/sex-doll-guide/material-comparison.webp",
      alt: "DollWow visual comparison of a TPE doll and a silicone doll with practical material tradeoffs",
      caption: "Use material as the start of the comparison, then verify the exact formulation, weight, care routine, and configuration.",
      width: 916,
      height: 1717
    },
    {
      afterHeading: "Size and Weight Matter More Than Buyers Expect",
      src: "/images/learn/sex-doll-guide/size-and-handling.webp",
      alt: "Starpery Yuan, WM Rhea Lynn, and Irontech Len Stilwell compared by height and handling weight",
      caption: "These live catalog examples show why height alone does not predict handling weight. Recheck product measurements before ordering.",
      width: 928,
      height: 1695
    },
    {
      afterHeading: "What Creates a Realistic Appearance",
      src: "/images/learn/sex-doll-guide/realism-layers.webp",
      alt: "DollWow visual guide to evaluating sculpt, finish, styling, and photographic evidence",
      caption: "Evaluate realism in layers, then compare close-ups and multiple angles for the exact head and body combination.",
      width: 1003,
      height: 1568
    },
    {
      afterHeading: "Customization Starts With the Exact Product",
      src: "/images/learn/sex-doll-guide/customization-order.webp",
      alt: "Five-step DollWow customization sequence from body and material through optional functions",
      caption: "Choose the core body and head first, then verify which styling, skeleton, standing, and function options are compatible with that exact product.",
      width: 1003,
      height: 1568
    },
    {
      afterHeading: "Ready-to-Ship vs Custom Order",
      src: "/images/learn/sex-doll-guide/ready-vs-custom.webp",
      alt: "DollWow comparison of ready-to-ship and custom-order purchasing paths",
      caption: "Compare stock confirmation, production, transit, and delivery as separate timelines. Verify the exact order before checkout.",
      width: 1003,
      height: 1568
    },
    {
      afterHeading: "Which Doll Brand Is Right for You?",
      src: "/images/learn/sex-doll-guide/se-doll-brand-spotlight.webp",
      alt: "SE Doll brand spotlight featuring a real SE Doll Xanthe product image",
      caption: "Brand profiles help narrow the catalog, but the final decision should still be based on the exact body, head, material, options, and support path.",
      width: 1122,
      height: 1402
    },
    {
      afterHeading: "How to Evaluate a Listing",
      src: "/images/learn/sex-doll-guide/listing-audit.webp",
      alt: "Three-pass DollWow checklist for auditing identity, practicality, and configuration in a doll listing",
      caption: "Audit the listing in three passes and turn missing facts into questions before comparing configured totals.",
      width: 887,
      height: 1774
    },
    {
      afterHeading: "Cleaning by Material and Construction",
      src: "/images/learn/sex-doll-guide/care-routine.webp",
      alt: "Five-step sex doll care routine covering material checks, gentle cleaning, drying, conditioning, and supported storage",
      caption: "A practical first-week care sequence. Instructions for the exact product and material always take priority."
    }
  ];
}

function ArticleActions({ slug }: { slug: string }) {
  const collections = relatedCollections(slug);

  return (
    <aside className="mt-14 border-t border-border pt-10">
      <p className="text-sm font-semibold text-accent">Next step</p>
      <h2 className="mt-2 text-2xl font-semibold leading-tight text-text">Ready to narrow the catalog?</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-text-dim">
        Start with the finder, browse the full catalog, or ask DollWow to confirm a product-specific detail before checkout.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <GoldButton href="/help-me-choose">Use the DollWow finder</GoldButton>
        <GoldButton href="/shop/sex-dolls" variant="secondary">
          Browse all dolls
        </GoldButton>
        <Link href="/price-match" className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline underline-offset-4 transition hover:text-text">Compare a listing</Link>
        <Link href="/support" className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline underline-offset-4 transition hover:text-text">Ask support</Link>
      </div>
      {collections.length ? (
        <nav aria-label="Related buying paths" className="mt-7 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-5">
          {collections.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-text transition hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </aside>
  );
}

type ArticleInfographicConfig = {
  eyebrow: string;
  title: string;
  summary: string;
  stats: Array<{ value: string; label: string }>;
  items: Array<{ title: string; body: string }>;
  href: string;
  cta: string;
};

function infographicConfig(slug: string): ArticleInfographicConfig | null {
  const map: Record<string, ArticleInfographicConfig> = {
    "sex-doll-cost": {
      eyebrow: "Cost breakdown",
      title: "What changes the delivered price",
      summary: "A low catalog price can still become expensive if the listing is unclear, shipping is missing, or the configuration needs extra confirmation.",
      stats: [
        { value: "$", label: "base price is only one layer" },
        { value: "6", label: "cost factors to review" }
      ],
      items: [
        { title: "Base model", body: "Brand, material, height, and body design set the first price range." },
        { title: "Options", body: "Skin tone, eyes, wig, functions, skeleton upgrades, and accessories can affect the final total." },
        { title: "Shipping path", body: "Ready-to-ship and factory-order listings can have different timing and logistics." },
        { title: "Ask when unsure", body: "Our team can confirm unclear photos, measurements, options, or included items before you buy." }
      ],
      href: "/best-price-guarantee",
      cta: "Review the price guarantee"
    },
    "best-sex-dolls": {
      eyebrow: "Buyer shortlist",
      title: "A practical way to shortlist dolls",
      summary: "The best choice is the listing that fits the buyer, not the one with the loudest promo banner.",
      stats: [
        { value: "4", label: "shortlist filters" },
        { value: "1", label: "final support check" }
      ],
      items: [
        { title: "Start with constraints", body: "Budget, storage, privacy, weight, and timing narrow the catalog quickly." },
        { title: "Compare facts", body: "Use material, height, measurements, availability, and custom options before judging photos." },
        { title: "Read the product page", body: "Check what the exact listing includes and what requires confirmation." },
        { title: "Ask before checkout", body: "If a detail affects the order, get support to confirm it before payment." }
      ],
      href: "/shop/sex-dolls",
      cta: "Browse the catalog"
    },
    "most-realistic-sex-dolls": {
      eyebrow: "Realism checklist",
      title: "What makes a doll look realistic",
      summary: "Realism comes from the finished build: proportions, face detail, eyes, skin finish, hair, pose support, and whether the final product matches the confirmed configuration.",
      stats: [
        { value: "7", label: "visual details to check" },
        { value: "1", label: "confirmed configuration" }
      ],
      items: [
        { title: "Face and eyes", body: "Check sculpt, eye placement, expression, and whether the head matches the chosen body." },
        { title: "Proportions", body: "Height, shoulders, waist, hips, hands, and feet affect realism at full scale." },
        { title: "Finish", body: "Material, skin texture, faceup, hair, and lighting all change the final look." },
        { title: "Photo accuracy", body: "Confirm whether images show the exact build, a sample, or a reference configuration." }
      ],
      href: "/shop/realistic-sex-dolls",
      cta: "Compare realistic listings"
    },
    "mini-sex-dolls": {
      eyebrow: "Compact fit",
      title: "Choose the size path that solves the real constraint",
      summary: "Mini, petite, and lightweight describe different buying needs. Use the exact height and weight instead of treating the labels as synonyms.",
      stats: [
        { value: "120 cm", label: "3 ft 11 in mini collection ceiling" },
        { value: "121-154 cm", label: "4 ft-5 ft 1 in petite range" }
      ],
      items: [
        { title: "Mini", body: "Use the mini collection when a full doll must be 120 cm / 3 ft 11 in or shorter." },
        { title: "Petite", body: "Use the petite collection for compact full dolls from 121 to 154 cm / 4 ft to 5 ft 1 in." },
        { title: "Lighter", body: "Use listed weight when carrying and positioning matter more than height." },
        { title: "Product form", body: "Keep full dolls, torsos, hips, and standalone heads in separate comparisons." }
      ],
      href: "/shop/mini-sex-dolls",
      cta: "Compare mini dolls"
    },
    "male-sex-doll-buying-guide": {
      eyebrow: "Male doll fit",
      title: "Body scale comes before styling",
      summary: "Male dolls should be compared by proportions, measurements, material, skeleton support, and available options before choosing by image alone.",
      stats: [
        { value: "6", label: "body facts to compare" },
        { value: "1", label: "product-specific option check" }
      ],
      items: [
        { title: "Body proportions", body: "Compare height, shoulders, waist, hips, and weight before focusing on styling." },
        { title: "Material", body: "Review whether the body and head are TPE, silicone, or a mixed construction." },
        { title: "Options", body: "Available choices can vary by body, head, and material." },
        { title: "Delivery path", body: "Confirm stock, production timing, and final approval details before checkout." }
      ],
      href: "/shop/male-dolls",
      cta: "Compare male dolls"
    },
    "sex-doll-reviews": {
      eyebrow: "Review check",
      title: "How to tell whether a review is useful",
      summary: "Useful reviews connect claims to a real product, clear specs, current seller policies, and verifiable support.",
      stats: [
        { value: "3", label: "claims to verify" },
        { value: "0", label: "fake-review tolerance" }
      ],
      items: [
        { title: "Match the product", body: "Check whether the review refers to the exact brand, body, head, and material." },
        { title: "Look for specifics", body: "Measurements, delivery timing, care notes, and support details are more useful than vague praise." },
        { title: "Watch for mismatches", body: "Photos, specs, and pricing should point to the same product." },
        { title: "Use support", body: "Ask DollWow to compare a listing if the review or seller page feels unclear." }
      ],
      href: "/price-match",
      cta: "Compare a listing"
    },
    "ready-to-ship-vs-custom-sex-dolls": {
      eyebrow: "Ordering options",
      title: "Ready-to-ship and custom solve different problems",
      summary: "Ready-to-ship dolls favor speed and a fixed configuration. Made-to-order dolls offer more choices and take longer to produce.",
      stats: [
        { value: "2", label: "ways to order" },
        { value: "1", label: "confirmation step before checkout" }
      ],
      items: [
        { title: "Ready-to-ship", body: "Useful when timing matters, but exact stock and configuration still need confirmation." },
        { title: "Custom", body: "Useful when options matter, but production time and compatibility rules can vary." },
        { title: "Photos", body: "Confirm whether images show the exact unit, a sample, or a reference build." },
        { title: "Final check", body: "Ask us to confirm timing, included items, and any limits on your selected options." }
      ],
      href: "/shop/ready-to-ship",
      cta: "Compare ready-to-ship dolls"
    },
    "discreet-sex-doll-shipping": {
      eyebrow: "Privacy path",
      title: "Discretion is a delivery process, not a slogan",
      summary: "Privacy depends on packaging, billing expectations, timing, support communication, and whether the order details are confirmed before shipment.",
      stats: [
        { value: "4", label: "privacy details to review" },
        { value: "1", label: "plain support conversation" }
      ],
      items: [
        { title: "Packaging", body: "Look for plain, practical packaging expectations instead of vague promises." },
        { title: "Timing", body: "Confirm current stock and delivery path if timing affects privacy." },
        { title: "Communication", body: "Use support to clarify sensitive details before checkout." },
        { title: "Order accuracy", body: "Make sure the product, options, and shipping path match what you expect." }
      ],
      href: "/shipping",
      cta: "Review shipping details"
    },
    "how-to-clean-a-sex-doll": {
      eyebrow: "Care routine",
      title: "Clean gently, dry fully, store carefully",
      summary: "A good cleaning routine protects the material and makes ownership easier. Follow the care instructions for your doll's exact material.",
      stats: [
        { value: "3", label: "core steps: clean, dry, store" },
        { value: "2", label: "main material paths to compare" }
      ],
      items: [
        { title: "Confirm material", body: "Check whether the doll is TPE, silicone, silicone-head, or mixed construction before choosing care products." },
        { title: "Use mild care", body: "Avoid harsh cleaners, abrasive tools, high heat, and products that are not confirmed for the material." },
        { title: "Dry fully", body: "Surface and internal areas should be fully dry before storage." },
        { title: "Ask first", body: "If the routine affects your purchase decision, ask support to confirm the product-specific care path." }
      ],
      href: "/learn/tpe-vs-silicone-sex-dolls",
      cta: "Compare material care"
    },
    "sex-doll-storage": {
      eyebrow: "Storage plan",
      title: "Plan privacy and material protection together",
      summary: "Storage should protect the doll from moisture, heat, pressure, dye transfer, and awkward positioning while still fitting the buyer's space.",
      stats: [
        { value: "5", label: "storage risks to avoid" },
        { value: "1", label: "real room to plan around" }
      ],
      items: [
        { title: "Measure first", body: "Height, weight, and boxed size decide whether a storage plan is realistic." },
        { title: "Avoid pressure", body: "Long-term compression and awkward joint positions can create avoidable problems." },
        { title: "Protect the surface", body: "Use clean, light-colored fabrics and avoid dye-transfer risks." },
        { title: "Keep it dry", body: "Store only after cleaning and drying are complete." }
      ],
      href: "/shop/mini-sex-dolls",
      cta: "Compare compact dolls"
    },
    "sex-doll-maintenance-checklist": {
      eyebrow: "Maintenance rhythm",
      title: "A repeatable checklist beats guesswork",
      summary: "Maintenance should be simple enough to follow consistently: clean, dry, inspect, protect, store, and recheck the setup.",
      stats: [
        { value: "6", label: "routine checks" },
        { value: "0", label: "harsh products needed" }
      ],
      items: [
        { title: "Before buying", body: "Choose a product that fits your storage, lifting comfort, and care expectations." },
        { title: "After cleaning", body: "Dry fully and inspect the surface before storage." },
        { title: "During storage", body: "Avoid heat, pressure, dark dyes, and cramped positions." },
        { title: "Monthly review", body: "Check surface condition, storage fabric, joints, and care supplies." }
      ],
      href: "/support",
      cta: "Ask about care"
    },
    "sex-doll-scams": {
      eyebrow: "Buyer protection",
      title: "Verify the offer before the price talks you into it",
      summary: "Scam risk rises when low prices, vague product facts, unclear shipping, and weak support appear together.",
      stats: [
        { value: "6", label: "red flags to check" },
        { value: "1", label: "listing review before checkout" }
      ],
      items: [
        { title: "Check the exact doll", body: "The product, material, size, availability, and included options should be clear." },
        { title: "Question photos", body: "Images should be backed by product facts and support, not used as the only proof." },
        { title: "Compare delivered value", body: "Review shipping, options, policies, and support before trusting a low price." },
        { title: "Use support", body: "Submit another listing for review if the offer feels unclear." }
      ],
      href: "/price-match",
      cta: "Compare a listing"
    },
    "sex-doll-laws-us": {
      eyebrow: "Adult-only standard",
      title: "Keep legality, privacy, and product standards separate",
      summary: "Adult buyers should avoid underage-coded or unlawful product presentation completely and verify local rules when they have a specific legal concern.",
      stats: [
        { value: "18+", label: "adult-only buying context" },
        { value: "0", label: "underage-coded tolerance" }
      ],
      items: [
        { title: "Adult presentation", body: "Products should be clearly adult and should not use underage-coded or school-themed presentation." },
        { title: "Local variation", body: "State, local, import, payment, and platform rules can vary." },
        { title: "Privacy is separate", body: "Discreet shipping protects privacy, but it does not answer legal questions." },
        { title: "Verify concerns", body: "Specific legal questions should be checked with a qualified source." }
      ],
      href: "/adult-only",
      cta: "Review adult-only policy"
    }
  };

  return map[slug] ?? null;
}

type ArticleProductModule = {
  title: string;
  description: string;
  collectionHref: string;
  filters: CatalogFilters;
  handles?: string[];
  products: Product[];
};

function productModuleConfig(slug: string): Omit<ArticleProductModule, "products"> | null {
  const map: Record<string, Omit<ArticleProductModule, "products">> = {
    "sex-doll-guide": {
      title: "Six useful starting points",
      description: "This mixed set spans TPE and silicone, compact and full-size builds, ready-to-ship and custom orders, and female and male dolls. It is a comparison starting point, not a best-of ranking.",
      collectionHref: "/shop/sex-dolls",
      filters: {},
      handles: [
        "irontech-len-stilwell-158cm-l-cup-tpe-companion-doll-1g8uu",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "6ye-rowan-165cm-f-cup-tpe-companion-doll-1ldwi",
        "real-lady-viki-150cm-r10-silicone-doll",
        "6ye-claudy-170cm-na-cup-silicone-head-companion-doll-c6f1s",
        "irontech-kevin-170cm-silicone-companion-doll-1kpog"
      ]
    },
    "tpe-vs-silicone-sex-dolls": {
      title: "Compare TPE and full-silicone examples",
      description: "These live examples show why material alone does not predict price or handling weight. Compare the complete measurements, construction, options, and availability on each product page.",
      collectionHref: "/shop/sex-dolls",
      filters: {},
      handles: [
        "irontech-len-stilwell-158cm-l-cup-tpe-companion-doll-1g8uu",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "6ye-rowan-165cm-f-cup-tpe-companion-doll-1ldwi",
        "real-lady-viki-150cm-r10-silicone-doll",
        "irontech-alessia-154cm-i-cup-tpe-companion-doll-1ymco",
        "starpery-xue-171cm-xue-4-full-silicone-doll"
      ]
    },
    "sex-doll-cost": {
      title: "Price-check ready-to-ship listings",
      description: "These catalog examples help anchor cost research in real DollWow listings instead of generic price ranges.",
      collectionHref: "/shop/ready-to-ship",
      filters: { availability: "ready_to_ship" }
    },
    "best-sex-dolls": {
      title: "Start with the main sex doll catalog",
      description: "Use live product cards as a practical starting point, then narrow by material, height, body type, and delivery path.",
      collectionHref: "/shop/sex-dolls",
      filters: {}
    },
    "most-realistic-sex-dolls": {
      title: "Compare realistic-detail candidates",
      description: "Silicone and silicone-head listings are useful starting points for comparing sculpt detail, finish, and configuration notes.",
      collectionHref: "/shop/realistic-sex-dolls",
      filters: { material: "silicone" }
    },
    "mini-sex-dolls": {
      title: "Compare compact catalog options",
      description: "Compare full mini dolls by exact height, listed weight, material, price, availability, and storage fit.",
      collectionHref: "/shop/mini-sex-dolls",
      filters: { productForm: "full-doll", height: "0-120" }
    },
    "male-sex-doll-buying-guide": {
      title: "Compare male doll listings",
      description: "Use live catalog cards to check body scale, material, stock status, and product-specific details.",
      collectionHref: "/shop/male-dolls",
      filters: { bodyType: "male" }
    },
    "ready-to-ship-vs-custom-sex-dolls": {
      title: "See ready-to-ship examples",
      description: "Ready-to-ship listings are useful when timing matters, but current stock and exact configuration still need review.",
      collectionHref: "/shop/ready-to-ship",
      filters: { availability: "ready_to_ship" }
    },
    "discreet-sex-doll-shipping": {
      title: "Compare listings where timing matters",
      description: "Ready-to-ship product examples help buyers discuss packaging, delivery path, and timing with support before checkout.",
      collectionHref: "/shop/ready-to-ship",
      filters: { availability: "ready_to_ship" }
    },
    "sex-doll-reviews": {
      title: "Use product pages to verify review claims",
      description: "Use current product pages to compare photos, measurements, availability, and confirmed details.",
      collectionHref: "/shop/sex-dolls",
      filters: {}
    },
    "how-to-clean-a-sex-doll": {
      title: "Compare material-specific care needs",
      description: "Use catalog examples to compare material, size, weight, and product facts before choosing a care routine.",
      collectionHref: "/shop/tpe",
      filters: { material: "tpe" }
    },
    "sex-doll-storage": {
      title: "Compare storage-friendly sizes",
      description: "Compact listings help buyers think through height, weight, storage footprint, and privacy before checkout.",
      collectionHref: "/shop/mini-sex-dolls",
      filters: { height: "0-154" }
    },
    "sex-doll-maintenance-checklist": {
      title: "Start with material and size",
      description: "Maintenance planning is easier when product size, weight, material, and storage needs are visible before checkout.",
      collectionHref: "/shop/sex-dolls",
      filters: {}
    },
    "sex-doll-scams": {
      title: "Use live listings as a fact baseline",
      description: "Real catalog examples make it easier to compare material, price, measurements, and support context against another seller's offer.",
      collectionHref: "/shop/sex-dolls",
      filters: {}
    },
    "sex-doll-laws-us": {
      title: "Compare adult-only catalog listings",
      description: "DollWow keeps catalog comparison focused on adult products, clear facts, and support-confirmed order details.",
      collectionHref: "/shop/sex-dolls",
      filters: {}
    },
    "custom-sex-dolls": {
      title: "Compare custom-order listings",
      description: "Use current catalog examples to compare base model, material, size, price, and product-specific option paths.",
      collectionHref: "/shop/custom",
      filters: { availability: "custom" }
    },
    "implanted-hair-vs-wig": {
      title: "Start with custom-order listings",
      description: "Hair choices are product-specific, so compare base models and ask support to confirm current wig or implanted hair options.",
      collectionHref: "/shop/custom",
      filters: { availability: "custom" }
    },
    "standing-feet-sex-doll-guide": {
      title: "Compare custom builds before choosing standing feet",
      description: "Standing feet are not available on every doll. Check the exact body, skeleton, and material before adding this option.",
      collectionHref: "/shop/custom",
      filters: { availability: "custom" }
    },
    "body-heating-sex-doll-guide": {
      title: "Compare factory-order options",
      description: "Heating is product-specific and should be confirmed against the exact body, material, power setup, and production path.",
      collectionHref: "/shop/custom",
      filters: { availability: "custom" }
    },
    "sex-doll-skeleton-options": {
      title: "Compare custom listings by body and option path",
      description: "Skeleton choices affect posing, handling, and storage, so start with product facts before choosing an upgrade.",
      collectionHref: "/shop/custom",
      filters: { availability: "custom" }
    },
    "wm-dolls-buying-guide": {
      title: "Compare WM Dolls listings",
      description: "Compare current WM models by material, size, price, availability, and custom options.",
      collectionHref: "/brands/wm-dolls",
      filters: { brand: "wm" }
    },
    "irontech-dolls-buying-guide": {
      title: "Compare Irontech Dolls listings",
      description: "Compare current Irontech models by body type, material, size, availability, and options.",
      collectionHref: "/brands/irontech-dolls",
      filters: { brand: "irontech" }
    },
    "starpery-dolls-buying-guide": {
      title: "Compare Starpery Dolls listings",
      description: "Compare current Starpery models by material, size, price, finish, and availability.",
      collectionHref: "/brands/starpery-dolls",
      filters: { brand: "starpery" }
    },
    "zelex-dolls-buying-guide": {
      title: "Compare Zelex Dolls listings",
      description: "Compare current Zelex models by material, measurements, price, availability, and custom options.",
      collectionHref: "/brands/zelex-dolls",
      filters: { brand: "zelex" }
    },
    "se-doll-buying-guide": {
      title: "Compare SE Doll listings",
      description: "Use current SE Doll product cards to compare material, measurements, finish, and support-confirmed order details.",
      collectionHref: "/brands/se-doll",
      filters: { brand: "sedoll" }
    },
    "6ye-dolls-buying-guide": {
      title: "Compare 6YE Dolls listings",
      description: "Compare current 6YE models by price, material, size, availability, and total value.",
      collectionHref: "/brands/6ye-dolls",
      filters: { brand: "6ye" }
    },
    "yourdoll-alternatives": {
      title: "Start with comparable DollWow listings",
      description: "Compare material, price, measurements, availability, and support before choosing between stores.",
      collectionHref: "/shop/sex-dolls",
      filters: {}
    },
    "bestrealdoll-alternatives": {
      title: "Compare best-fit candidates with live catalog data",
      description: "These examples keep best-doll research tied to product facts, not ranking labels or promo language.",
      collectionHref: "/shop/sex-dolls",
      filters: {}
    },
    "siliconwives-alternatives": {
      title: "Compare material-led listings",
      description: "Compare materials alongside actual measurements, weight, availability, and confirmed product details.",
      collectionHref: "/shop/silicone",
      filters: { material: "silicone" }
    },
    "joylovedolls-alternatives": {
      title: "Compare male doll listings",
      description: "Compare body scale, material, measurements, availability, and delivery timing.",
      collectionHref: "/shop/male-dolls",
      filters: { bodyType: "male" }
    },
    "rosemarydoll-alternatives": {
      title: "Compare TPE listings with clear product facts",
      description: "Compare TPE dolls by material, height, weight, availability, and confirmed order details.",
      collectionHref: "/shop/tpe",
      filters: { material: "tpe" }
    },
    "betterlovedoll-alternatives": {
      title: "Compare silicone listings with clear product facts",
      description: "Compare material, size, price, availability, and support before choosing a seller.",
      collectionHref: "/shop/silicone",
      filters: { material: "silicone" }
    },
    "realsexdoll-alternatives": {
      title: "Compare realistic catalog options",
      description: "Ground realism research in actual DollWow listings, measurements, material, weight, and product-specific details.",
      collectionHref: "/shop/realistic-sex-dolls",
      filters: {}
    },
    "sexdolltech-alternatives": {
      title: "Compare TPE listings by value and detail",
      description: "Compare material and price alongside exact measurements, availability, and confirmed details.",
      collectionHref: "/shop/tpe",
      filters: { material: "tpe" }
    },
    "myrobotdoll-alternatives": {
      title: "Compare ready-to-ship examples",
      description: "Compare ready-to-ship dolls by dispatch time, material, size, and included configuration.",
      collectionHref: "/shop/ready-to-ship",
      filters: { availability: "ready_to_ship" }
    },
    "sexdollqueen-alternatives": {
      title: "Review ready-to-ship listings",
      description: "Compare ready-to-ship dolls by warehouse location, expected dispatch time, and the exact included configuration.",
      collectionHref: "/shop/ready-to-ship",
      filters: { availability: "ready_to_ship" }
    }
  };

  return map[slug] ?? null;
}

function relatedCollections(slug: string) {
  const common = [
    { label: "Browse the catalog", href: "/shop/sex-dolls", description: "Compare live DollWow products, filters, and pricing." }
  ];
  const map: Record<string, Array<{ label: string; href: string; description: string }>> = {
    "sex-doll-guide": [
      { label: "Browse all sex dolls", href: "/shop/sex-dolls", description: "Compare the complete live catalog by material, size, price, and availability." },
      { label: "Use the DollWow finder", href: "/help-me-choose", description: "Narrow products around material, size, body type, and delivery preferences." },
      { label: "Compare active brands", href: "/brands", description: "Review manufacturer hubs and current DollWow listings." }
    ],
    "tpe-vs-silicone-sex-dolls": [
      { label: "Browse TPE dolls", href: "/shop/tpe", description: "Compare softer material builds and care tradeoffs." },
      { label: "Browse silicone dolls", href: "/shop/silicone", description: "Compare full-silicone builds, detail, weight, and price." },
      { label: "Browse hybrid dolls", href: "/shop/hybrid", description: "Compare silicone-head and TPE-body construction." }
    ],
    "ready-to-ship-vs-custom-sex-dolls": [
      { label: "Ready-to-ship dolls", href: "/shop/ready-to-ship", description: "Compare warehouse-style listings with fixed configurations." },
      { label: "Custom dolls", href: "/shop/custom", description: "Compare factory-order options and customization depth." }
    ],
    "male-sex-doll-buying-guide": [
      { label: "Male dolls", href: "/shop/male-dolls", description: "Compare male body-type listings and build details." },
      { label: "Custom dolls", href: "/shop/custom", description: "Review made-to-order dolls and available options." }
    ],
    "mini-sex-dolls": [
      { label: "Mini sex dolls", href: "/shop/mini-sex-dolls", description: "Compare full dolls up to 120 cm / 3 ft 11 in." },
      { label: "Petite sex dolls", href: "/shop/petite-dolls", description: "Compare compact full dolls from 121 to 154 cm / 4 ft to 5 ft 1 in." },
      { label: "Lighter dolls", href: "/shop/lighter", description: "Start with listed weight when handling is the main constraint." }
    ],
    "most-realistic-sex-dolls": [
      { label: "Silicone dolls", href: "/shop/silicone", description: "Compare premium material builds and sculpt detail." },
      { label: "Custom dolls", href: "/shop/custom", description: "Browse dolls with model-specific customization options." }
    ],
    "discreet-sex-doll-shipping": [
      { label: "Ready-to-ship dolls", href: "/shop/ready-to-ship", description: "Compare listings where timing and warehouse confirmation matter." },
      { label: "Shipping information", href: "/shipping", description: "Review DollWow delivery and privacy expectations." }
    ],
    "sex-doll-cost": [
      { label: "Ready-to-ship dolls", href: "/shop/ready-to-ship", description: "Compare fixed configurations and delivered value." },
      { label: "Best price guarantee", href: "/best-price-guarantee", description: "See how DollWow reviews comparable offers." }
    ],
    "sex-doll-reviews": [
      { label: "Buyer protection", href: "/buyer-protection", description: "Review verification and purchase clarity expectations." },
      { label: "Price match review", href: "/price-match", description: "Submit a listing for price review." }
    ],
    "how-to-clean-a-sex-doll": [
      { label: "TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls", description: "Compare material care before choosing a product." },
      { label: "Storage guide", href: "/learn/sex-doll-storage", description: "Plan drying and storage as part of the same routine." }
    ],
    "sex-doll-storage": [
      { label: "Mini sex dolls", href: "/shop/mini-sex-dolls", description: "Compare compact listings for smaller storage spaces." },
      { label: "Cleaning guide", href: "/learn/how-to-clean-a-sex-doll", description: "Clean and dry fully before storage." }
    ],
    "sex-doll-maintenance-checklist": [
      { label: "Cleaning guide", href: "/learn/how-to-clean-a-sex-doll", description: "Use a gentle cleaning routine matched to material." },
      { label: "Storage guide", href: "/learn/sex-doll-storage", description: "Protect the material after cleaning." }
    ],
    "sex-doll-scams": [
      { label: "Scam alert", href: "/scam-alert", description: "Review DollWow's buyer-protection warning signs." },
      { label: "Price match", href: "/price-match", description: "Submit another seller's offer for review." }
    ],
    "sex-doll-laws-us": [
      { label: "Adult-only policy", href: "/adult-only", description: "Review DollWow's adult-only catalog standard." },
      { label: "Buyer protection", href: "/buyer-protection", description: "Review purchase clarity and support expectations." }
    ],
    "custom-sex-dolls": [
      { label: "Custom dolls", href: "/shop/custom", description: "Compare factory-order listings and option paths." },
      { label: "Customize", href: "/customize", description: "Review DollWow's customization workflow." }
    ],
    "implanted-hair-vs-wig": [
      { label: "Custom dolls", href: "/shop/custom", description: "Compare listings where hair options may be available." },
      { label: "Custom sex dolls", href: "/learn/custom-sex-dolls", description: "Review the broader customization process." }
    ],
    "standing-feet-sex-doll-guide": [
      { label: "Custom dolls", href: "/shop/custom", description: "Compare option-led builds." },
      { label: "Skeleton options", href: "/learn/sex-doll-skeleton-options", description: "Review pose and handling tradeoffs." }
    ],
    "body-heating-sex-doll-guide": [
      { label: "Custom dolls", href: "/shop/custom", description: "Review factory-order listings where functions may be configurable." },
      { label: "Ask support", href: "/support", description: "Confirm product-specific heating compatibility." }
    ],
    "sex-doll-skeleton-options": [
      { label: "Custom dolls", href: "/shop/custom", description: "Compare factory-order listings by body and option path." },
      { label: "Standing feet guide", href: "/learn/standing-feet-sex-doll-guide", description: "Review how feet and skeleton choices interact." }
    ],
    "wm-dolls-buying-guide": [
      { label: "WM Dolls brand hub", href: "/brands/wm-dolls", description: "Compare current DollWow WM listings." },
      { label: "Custom dolls", href: "/shop/custom", description: "Review made-to-order dolls and available options." }
    ],
    "irontech-dolls-buying-guide": [
      { label: "Irontech Dolls brand hub", href: "/brands/irontech-dolls", description: "Compare current DollWow Irontech listings." },
      { label: "Male doll guide", href: "/learn/male-sex-doll-buying-guide", description: "Review male body-type fit and measurements." }
    ],
    "starpery-dolls-buying-guide": [
      { label: "Starpery Dolls brand hub", href: "/brands/starpery-dolls", description: "Compare current DollWow Starpery listings." },
      { label: "Most realistic guide", href: "/learn/most-realistic-sex-dolls", description: "Review realism factors before choosing." }
    ],
    "zelex-dolls-buying-guide": [
      { label: "Zelex Dolls brand hub", href: "/brands/zelex-dolls", description: "Compare current DollWow Zelex listings." },
      { label: "Silicone dolls", href: "/shop/silicone", description: "Compare silicone-focused catalog options." }
    ],
    "se-doll-buying-guide": [
      { label: "SE Doll brand hub", href: "/brands/se-doll", description: "Compare current DollWow SE Doll listings." },
      { label: "TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls", description: "Review material tradeoffs before checkout." }
    ],
    "6ye-dolls-buying-guide": [
      { label: "6YE Dolls brand hub", href: "/brands/6ye-dolls", description: "Compare current DollWow 6YE listings." },
      { label: "Sex doll cost guide", href: "/learn/sex-doll-cost", description: "Compare delivered value beyond headline price." }
    ],
    "yourdoll-alternatives": [
      { label: "Sex dolls", href: "/shop/sex-dolls", description: "Compare live product listings, filters, and buyer-fit details." },
      { label: "Ready-to-ship dolls", href: "/shop/ready-to-ship", description: "Review fixed-configuration listings where timing matters." }
    ],
    "bestrealdoll-alternatives": [
      { label: "Best sex dolls guide", href: "/learn/best-sex-dolls", description: "Use a practical shortlist framework before choosing a model." },
      { label: "Custom dolls", href: "/shop/custom", description: "Compare made-to-order dolls and product-specific options." }
    ],
    "siliconwives-alternatives": [
      { label: "TPE vs silicone guide", href: "/learn/tpe-vs-silicone-sex-dolls", description: "Compare material tradeoffs before judging by photos alone." },
      { label: "Silicone dolls", href: "/shop/silicone", description: "Review premium material listings and detailed product facts." }
    ],
    "joylovedolls-alternatives": [
      { label: "Male dolls", href: "/shop/male-dolls", description: "Compare male body-type listings and build details." },
      { label: "DollWow finder", href: "/help-me-choose", description: "Narrow the catalog with guided buyer preferences." }
    ],
    "rosemarydoll-alternatives": [
      { label: "TPE dolls", href: "/shop/tpe", description: "Compare TPE dolls by size, weight, value, and availability." },
      { label: "Price match", href: "/price-match", description: "Submit another offer for price review." }
    ],
    "betterlovedoll-alternatives": [
      { label: "Silicone dolls", href: "/shop/silicone", description: "Compare silicone dolls by sculpt detail, weight, and availability." },
      { label: "Ready-to-ship dolls", href: "/shop/ready-to-ship", description: "Review fixed-configuration listings where timing matters." }
    ],
    "realsexdoll-alternatives": [
      { label: "Realistic sex dolls", href: "/shop/realistic-sex-dolls", description: "Compare realistic-looking listings by product facts." },
      { label: "Most realistic guide", href: "/learn/most-realistic-sex-dolls", description: "Review what actually makes a doll look realistic." }
    ],
    "sexdolltech-alternatives": [
      { label: "TPE dolls", href: "/shop/tpe", description: "Compare TPE dolls by material, size, price, and availability." },
      { label: "Sex doll cost guide", href: "/learn/sex-doll-cost", description: "Compare total delivered value before checkout." }
    ],
    "myrobotdoll-alternatives": [
      { label: "Ready-to-ship dolls", href: "/shop/ready-to-ship", description: "Compare listings where timing and stock confirmation matter." },
      { label: "Custom dolls", href: "/shop/custom", description: "Compare made-to-order dolls and available customization." }
    ],
    "sexdollqueen-alternatives": [
      { label: "Ready-to-ship dolls", href: "/shop/ready-to-ship", description: "Review listings organized for faster fulfillment." },
      { label: "Sex doll reviews", href: "/learn/sex-doll-reviews", description: "Learn how to evaluate review claims before buying." }
    ]
  };

  return map[slug] ?? common;
}
