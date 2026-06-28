import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GoldButton } from "@/components/GoldButton";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/MarkdownContent";
import { compactFilters, filterProducts, requiresCatalogWideFetch, shopifyQueryForFilters, type CatalogFilters } from "@/lib/catalog/filters";
import { productPublicTitle } from "@/lib/catalog/naming";
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
import { getProducts } from "@/lib/shopify/storefront";
import { formatMoney } from "@/lib/utils/currency";
import type { Product } from "@/types/product";

export function generateStaticParams() {
  return getLearningArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getLearningArticle(slug);
  if (!article) return {};
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
      images: article.featuredImage ? [{ url: absoluteUrl(article.featuredImage)!, alt: article.featuredImageAlt, width: 1536, height: 1024 }] : undefined
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
  const productModule = await getArticleProductModule(article.slug);

  return (
    <main>
      {schema.map((entry) => (
        <script key={entry?.["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
      ))}

      <section className="tone-section" data-tone="deep">
        <div className="tone-inner">
          <Link href="/learn" className="text-sm font-semibold text-gold-300">
            Learning Center
          </Link>
          <p className="mt-5 text-sm uppercase tracking-[0.18em] text-gold-300">{article.category}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-ivory-50 sm:text-5xl">{article.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-ivory-300">{article.description}</p>
          {article.featuredImage ? (
            <div className="mt-8 max-w-5xl overflow-hidden rounded-[8px] border border-gold-500/18 bg-ivory-50/[0.04]">
              <Image
                src={article.featuredImage}
                alt={article.featuredImageAlt}
                width={1536}
                height={1024}
                priority
                className="h-auto w-full object-cover"
                sizes="(min-width: 1024px) 80rem, 100vw"
              />
            </div>
          ) : null}
          <div className="mt-8 max-w-3xl rounded-[8px] border border-gold-500/18 bg-ivory-50/[0.05] p-5">
            <p className="text-sm font-semibold text-ivory-50">
              By{" "}
              <Link href={`/editorial-policy#${article.author}`} className="text-gold-300 underline underline-offset-4 transition hover:text-gold-200">
                {article.authorDisplayName}
              </Link>
              , {article.authorTitle}
            </p>
            <p className="mt-2 text-sm leading-6 text-ivory-300">{author?.bio}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-gold-300">
              Last reviewed {article.lastReviewed} ·{" "}
              <Link href="/editorial-policy" className="underline underline-offset-4 transition hover:text-gold-200">
                Editorial policy
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="tone-section" data-tone="blush">
        <div className="tone-inner">
          <article className="mx-auto max-w-3xl">
            <MarkdownContent markdown={article.body} />
            <ArticleInfographic slug={article.slug} />
            <ArticleProductExamples module={productModule} />
            <ArticleActions slug={article.slug} />
          </article>
        </div>
      </section>
    </main>
  );
}

async function getArticleProductModule(slug: string) {
  const config = productModuleConfig(slug);
  if (!config) return null;

  const filters = compactFilters(config.filters);
  const products = await getProducts({
    query: shopifyQueryForFilters(filters),
    first: requiresCatalogWideFetch(filters) ? 600 : 80
  });
  const picks = filterProducts(products, filters).slice(0, 3);
  return { ...config, products: picks };
}

function ArticleInfographic({ slug }: { slug: string }) {
  const infographic = infographicConfig(slug);
  if (!infographic) return null;

  return (
    <aside className="mt-12 overflow-hidden rounded-[8px] border border-ink-950/10 bg-ink-950 text-ivory-50 shadow-soft" aria-labelledby={`${slug}-infographic-heading`}>
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative min-h-[260px] overflow-hidden bg-[radial-gradient(circle_at_24%_20%,rgba(217,157,107,0.28),transparent_34%),linear-gradient(145deg,rgba(44,20,16,0.92),rgba(8,6,5,1))] p-6">
          <div className="absolute -right-10 top-8 h-44 w-44 rounded-full border border-gold-300/20" />
          <div className="absolute bottom-6 right-7 h-32 w-20 rounded-t-full border border-ivory-50/14 bg-ivory-50/[0.04]" />
          <div className="absolute bottom-6 right-24 h-24 w-16 rounded-t-full border border-gold-300/16 bg-gold-300/[0.08]" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">{infographic.eyebrow}</p>
          <h2 id={`${slug}-infographic-heading`} className="relative mt-3 text-2xl font-semibold leading-tight text-ivory-50">
            {infographic.title}
          </h2>
          <p className="relative mt-4 max-w-sm text-sm leading-6 text-ivory-300">{infographic.summary}</p>
          <div className="relative mt-7 grid grid-cols-2 gap-3">
            {infographic.stats.map((stat) => (
              <div key={stat.label} className="rounded-[8px] border border-gold-300/16 bg-ivory-50/[0.06] p-3">
                <p className="text-lg font-semibold text-gold-200">{stat.value}</p>
                <p className="mt-1 text-xs leading-5 text-ivory-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-ivory-50 p-5 text-ink-950">
          <div className="grid gap-3">
            {infographic.items.map((item, index) => (
              <div key={item.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-[8px] border border-gold-500/16 bg-white/65 p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-300 text-sm font-semibold text-[#1f120b]">{index + 1}</span>
                <div>
                  <h3 className="text-base font-semibold leading-tight text-ink-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-700">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href={infographic.href} className="mt-5 inline-flex rounded-[12px] border border-ink-950/16 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:border-ink-950/35 hover:bg-ink-950/[0.04]">
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
    <aside className="tone-card mt-12 rounded-[8px] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-gold-400">Catalog examples</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-ink-950">{module.title}</h2>
          <p className="mt-3 text-sm leading-6 text-ink-700">{module.description}</p>
        </div>
        <Link href={module.collectionHref} className="shrink-0 rounded-[12px] border border-gold-500/20 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:border-gold-500/40 hover:bg-ivory-50/[0.45]">
          View collection
        </Link>
      </div>
      <div className="mt-5 grid gap-3">
        {module.products.map((product) => (
          <ArticleProductExampleCard key={product.id} product={product} />
        ))}
      </div>
    </aside>
  );
}

function ArticleProductExampleCard({ product }: { product: Product }) {
  const displayTitle = productPublicTitle(product);
  const image = product.featuredImage ?? product.images[0] ?? null;
  const price = product.priceRange.minVariantPrice;
  const specs = [
    product.extended.heightCm ? `${product.extended.heightCm} cm` : null,
    product.extended.material,
    product.extended.cupSize
  ].filter((spec): spec is string => Boolean(spec));

  return (
    <article className="grid gap-4 rounded-[8px] border border-gold-500/14 bg-ivory-50/[0.35] p-3 sm:grid-cols-[112px_minmax(0,1fr)]">
      <Link href={`/products/${product.handle}`} className="relative aspect-square overflow-hidden rounded-[8px] bg-ink-950/10">
        {image ? (
          <Image src={image.url} alt={displayTitle} fill sizes="112px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center p-3 text-center text-xs font-semibold text-ink-700">{displayTitle}</span>
        )}
      </Link>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">{product.extended.brand ?? product.vendor}</p>
        <h3 className="mt-1 text-base font-semibold leading-snug text-ink-950">
          <Link href={`/products/${product.handle}`} className="transition hover:text-gold-700">
            {displayTitle}
          </Link>
        </h3>
        {specs.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {specs.map((spec) => (
              <span key={spec} className="rounded-full border border-gold-500/14 px-2.5 py-1 text-xs font-semibold text-ink-700">
                {spec}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-lg font-semibold text-ink-950">{formatMoney(price.amount, price.currencyCode)}</p>
          <GoldButton href={`/products/${product.handle}`} variant="primary" className="min-h-0 px-4 py-2">
            View doll
          </GoldButton>
        </div>
      </div>
    </article>
  );
}

function ArticleActions({ slug }: { slug: string }) {
  const collections = relatedCollections(slug);

  return (
    <aside className="mt-12 rounded-[8px] border border-gold-500/18 bg-ivory-50/[0.45] p-5 shadow-soft">
      <p className="text-sm uppercase tracking-[0.16em] text-gold-600">Next step</p>
      <h2 className="mt-2 text-2xl font-semibold leading-tight text-ink-950">Compare options with real catalog context</h2>
      <p className="mt-3 text-sm leading-6 text-ink-800">
        Use the finder, submit another listing for review, or ask DollWow to confirm product details before checkout.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <GoldButton href="/help-me-choose">Use the DollWow finder</GoldButton>
        <GoldButton href="/compare" variant="secondary" className="border-ink-950/18 bg-ink-950/[0.04] text-ink-950 hover:border-ink-950/40 hover:bg-ink-950/[0.08]">
          Compare a listing
        </GoldButton>
        <GoldButton href="/support" variant="secondary" className="border-ink-950/18 bg-ink-950/[0.04] text-ink-950 hover:border-ink-950/40 hover:bg-ink-950/[0.08]">
          Ask support
        </GoldButton>
      </div>
      {collections.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {collections.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[8px] border border-ink-950/10 bg-white/45 p-4 text-sm font-semibold text-ink-950 transition hover:border-ink-950/25 hover:bg-white/70"
            >
              {item.label}
              <span className="mt-1 block text-xs font-normal leading-5 text-ink-700">{item.description}</span>
            </Link>
          ))}
        </div>
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
    "tpe-vs-silicone-sex-dolls": {
      eyebrow: "Material comparison",
      title: "Compare the whole build before choosing a material",
      summary: "TPE and silicone are useful buying shortcuts, but the better decision comes from comparing material, size, care, weight, and configuration together.",
      stats: [
        { value: "2", label: "core materials to compare" },
        { value: "5", label: "product facts to verify" }
      ],
      items: [
        { title: "Feel and finish", body: "Compare softness, surface detail, firmness, and how the product is finished by the specific brand." },
        { title: "Care routine", body: "Check cleaning, drying, powdering, and storage requirements before assuming one material is easier." },
        { title: "Handling comfort", body: "Height and weight can matter more in daily use than the material label alone." },
        { title: "Final configuration", body: "Confirm whether the listing is full TPE, full silicone, silicone-head, or another mixed build." }
      ],
      href: "/shop/tpe",
      cta: "Compare TPE listings"
    },
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
        { title: "Verification", body: "Support confirmation reduces risk when photos, specs, or included items are unclear." }
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
        { title: "Compare facts", body: "Use material, height, measurements, stock status, and custom order path before judging photos." },
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
      title: "Small builds still need exact measurements",
      summary: "Mini and compact dolls can be easier to plan around, but storage and handling depend on more than height.",
      stats: [
        { value: "155", label: "cm and under is a useful starting filter" },
        { value: "4", label: "storage facts to confirm" }
      ],
      items: [
        { title: "Height", body: "Use height as a starting filter, then check the full measurement table." },
        { title: "Weight", body: "Compact dolls can still be dense depending on material and internal structure." },
        { title: "Storage footprint", body: "Review boxed size, orientation, and where the product will be stored." },
        { title: "Privacy path", body: "Confirm delivery timing, packaging, and support notes if discretion is the reason for buying small." }
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
        { title: "Options", body: "Custom availability can vary by male body, head model, and supplier." },
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
      href: "/compare",
      cta: "Compare a listing"
    },
    "ready-to-ship-vs-custom-sex-dolls": {
      eyebrow: "Order path",
      title: "Ready-to-ship and custom solve different problems",
      summary: "One path favors timing and fixed configuration. The other favors control, supplier rules, and production confirmation.",
      stats: [
        { value: "2", label: "main order paths" },
        { value: "1", label: "confirmation step before checkout" }
      ],
      items: [
        { title: "Ready-to-ship", body: "Useful when timing matters, but exact stock and configuration still need confirmation." },
        { title: "Custom", body: "Useful when options matter, but production time and compatibility rules can vary." },
        { title: "Photos", body: "Confirm whether images show the exact unit, a sample, or a reference build." },
        { title: "Final check", body: "Ask support to confirm timing, included items, and supplier constraints." }
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
    }
  };

  return map[slug] ?? null;
}

type ArticleProductModule = {
  title: string;
  description: string;
  collectionHref: string;
  filters: CatalogFilters;
  products: Product[];
};

function productModuleConfig(slug: string): Omit<ArticleProductModule, "products"> | null {
  const map: Record<string, Omit<ArticleProductModule, "products">> = {
    "tpe-vs-silicone-sex-dolls": {
      title: "Compare TPE listings in the catalog",
      description: "Use live catalog examples to compare size, price, stock status, and material details before choosing between TPE and silicone.",
      collectionHref: "/shop/tpe",
      filters: { material: "tpe" }
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
      description: "These examples help compare smaller builds by listed height, weight, material, and stock status.",
      collectionHref: "/shop/mini-sex-dolls",
      filters: { height: "0-154" }
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
      description: "Live product cards keep review research grounded in actual listings, specs, stock status, and support-confirmed details.",
      collectionHref: "/shop/sex-dolls",
      filters: {}
    }
  };

  return map[slug] ?? null;
}

function relatedCollections(slug: string) {
  const common = [
    { label: "Browse the catalog", href: "/shop", description: "Compare live DollWow products, filters, and pricing." }
  ];
  const map: Record<string, Array<{ label: string; href: string; description: string }>> = {
    "tpe-vs-silicone-sex-dolls": [
      { label: "Browse TPE dolls", href: "/shop/tpe", description: "Compare softer material builds and care tradeoffs." },
      { label: "Browse silicone dolls", href: "/shop/silicone", description: "Compare firmer premium builds and detail." }
    ],
    "ready-to-ship-vs-custom-sex-dolls": [
      { label: "Ready-to-ship dolls", href: "/shop/ready-to-ship", description: "Compare warehouse-style listings with fixed configurations." },
      { label: "Custom dolls", href: "/shop/custom", description: "Compare factory-order options and customization depth." }
    ],
    "male-sex-doll-buying-guide": [
      { label: "Male dolls", href: "/shop/male-dolls", description: "Compare male body-type listings and build details." },
      { label: "Custom dolls", href: "/shop/custom", description: "Review option-led builds and factory-order paths." }
    ],
    "mini-sex-dolls": [
      { label: "Dolls under 155 cm", href: "/shop/height-under-155", description: "Compare smaller builds, weight, and storage needs." },
      { label: "Ready-to-ship dolls", href: "/shop/ready-to-ship", description: "Check fixed configurations with faster comparison paths." }
    ],
    "most-realistic-sex-dolls": [
      { label: "Silicone dolls", href: "/shop/silicone", description: "Compare premium material builds and sculpt detail." },
      { label: "Custom dolls", href: "/shop/custom", description: "Review configurable builds with supplier-supported options." }
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
      { label: "Price match review", href: "/compare", description: "Submit a listing for side-by-side review." }
    ]
  };

  return map[slug] ?? common;
}
