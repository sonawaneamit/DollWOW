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
import { productPublicTitle } from "@/lib/catalog/naming";
import { protectedProductImageUrlFor } from "@/lib/catalog/productImage";
import type { Product } from "@/types/product";
import guideProductGroupsData from "@/content/learn/sex-doll-guide-products.json";
import sizeWeightIndexData from "@/content/learn/sex-doll-size-weight-index.json";

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
  const schema: Array<{ "@type": string; [key: string]: unknown }> = [
    buildArticleStructuredData(article),
    buildArticleBreadcrumbStructuredData(article)
  ];
  const faqSchema = buildArticleFaqStructuredData(article);
  if (faqSchema) schema.push(faqSchema);
  if (article.slug === "sex-doll-size-weight-guide") schema.push(sizeWeightDatasetStructuredData());
  const productModule = article.slug === "sex-doll-guide" ? null : await getArticleProductModule(article.slug);
  const guideProductGroups = article.slug === "sex-doll-guide" ? await getGuideProductGroups() : [];
  const catalogHero = articleCatalogHero(article.slug);
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
          {catalogHero && productModule?.products.length ? (
            <ArticleCatalogHero products={productModule.products.slice(0, 3)} {...catalogHero} />
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
            {article.slug === "sex-doll-size-weight-guide" ? (
              <SizeWeightArticle markdown={article.body} />
            ) : (
              <MarkdownContent
                markdown={article.body}
                sectionVisuals={guideSectionVisuals(article.slug)}
                sectionInsertions={guideProductGroups.length ? [{
                  afterHeading: "Curated Live Product Shortlists",
                  content: <GuideProductShortlists groups={guideProductGroups} />
                }] : []}
              />
            )}
            <ArticleInfographic slug={article.slug} />
            <ArticleProductExamples module={productModule} />
            <ArticleActions slug={article.slug} />
          </article>
        </div>
      </section>
    </div>
  );
}

function ArticleCatalogHero({ products, caption, imageContext }: { products: Product[]; caption: string; imageContext: string }) {
  return (
    <figure className="mt-8 max-w-5xl overflow-hidden rounded-[8px] border border-gold-500/18 bg-ivory-50/[0.04]">
      <div className="grid grid-cols-3">
        {products.map((product) => {
          const image = product.featuredImage ?? product.images[0] ?? null;
          const imageUrl = protectedProductImageUrlFor(product, image, "card");
          const title = productPublicTitle(product);
          return (
            <Link key={product.handle} href={`/products/${product.handle}`} className="group relative aspect-[4/5] overflow-hidden border-r border-gold-500/14 last:border-r-0" aria-label={`View ${title}`}>
              {imageUrl ? <Image src={imageUrl} alt={`${title}, ${imageContext}`} fill sizes="(min-width: 1024px) 27rem, 33vw" className="object-cover object-top transition duration-300 group-hover:scale-[1.02]" /> : null}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-12 text-xs font-semibold leading-5 text-white sm:px-5 sm:pb-5 sm:text-sm">{title}</span>
            </Link>
          );
        })}
      </div>
      <figcaption className="px-5 py-4 text-sm leading-6 text-ivory-300">{caption}</figcaption>
    </figure>
  );
}

function articleCatalogHero(slug: string) {
  const heroes: Record<string, { caption: string; imageContext: string }> = {
    "best-tpe-sex-dolls": {
      caption: "Current TPE catalog examples for comparison. Product facts and availability should be checked on each live listing.",
      imageContext: "a current DollWow TPE catalog example"
    },
    "silicone-sex-doll-guide": {
      caption: "Current full-silicone catalog examples from three manufacturers. Compare the exact body, head, measurements, listed weight, finish, and supported options on each live product page.",
      imageContext: "a current DollWow full-silicone catalog example"
    },
    "sex-doll-size-weight-guide": {
      caption: "Three current full-size catalog examples at different points in the size and handling range. Open each listing for its complete measurements, current price, configuration, and availability.",
      imageContext: "a current DollWow full-size catalog example"
    },
    "best-sex-doll-stores": {
      caption: "Current DollWow catalog examples from three manufacturers. A reputable store should connect every photograph to the exact product, specifications, ordering path, and continuing support.",
      imageContext: "a current DollWow catalog product used to check seller and listing quality"
    }
  };
  return heroes[slug] ?? null;
}

function SizeWeightCatalogIndex() {
  const data = sizeWeightIndexData;
  const maxHeightBand = Math.max(...data.heightBands.map((band) => band.count));
  const maxWeightBand = Math.max(...data.weightBands.map((band) => band.count));
  return (
    <section className="mb-12 border-y border-border py-10" aria-labelledby="catalog-index-heading">
      <p className="text-sm font-semibold text-accent">Original DollWow catalog analysis</p>
      <h2 id="catalog-index-heading" className="mt-2 text-3xl font-semibold leading-tight text-text">What {data.methodology.analyzedListings.toLocaleString("en-US")} current full-size listings show</h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-text-dim">Reviewed August 12, 2026. These figures describe current DollWow listings with usable height, weight, and price data. They are not a universal market average.</p>

      <div className="mt-8 grid gap-px overflow-hidden rounded-[8px] border border-border bg-border sm:grid-cols-3">
        <CatalogIndexStat value={`${data.summary.medianHeightImperial} / ${data.summary.medianHeightCm} cm`} label="Median listed height" />
        <CatalogIndexStat value={`${data.summary.medianWeightLb} lb / ${data.summary.medianWeightKg} kg`} label="Median listed weight" />
        <CatalogIndexStat value={`${data.summary.middleHalfWeightLb[0]}-${data.summary.middleHalfWeightLb[1]} lb`} label={`${data.summary.middleHalfWeightKg[0]}-${data.summary.middleHalfWeightKg[1]} kg middle-half range`} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <CatalogDistribution title="Listings by height" rows={data.heightBands.map((band) => ({ label: band.label, secondary: band.imperial, count: band.count, share: band.sharePercent, width: (band.count / maxHeightBand) * 100 }))} />
        <CatalogDistribution title="Listings by weight" rows={data.weightBands.map((band) => ({ label: band.label, secondary: band.metric, count: band.count, share: band.sharePercent, width: (band.count / maxWeightBand) * 100 }))} />
      </div>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <caption className="mb-4 text-left text-xl font-semibold text-text">Material snapshot</caption>
          <thead><tr className="border-y border-border text-text-dim"><th className="px-3 py-3 font-semibold">Construction</th><th className="px-3 py-3 font-semibold">Listings</th><th className="px-3 py-3 font-semibold">Median height</th><th className="px-3 py-3 font-semibold">Median weight</th><th className="px-3 py-3 font-semibold">Median starting price</th></tr></thead>
          <tbody>{data.materials.map((material) => <tr key={material.label} className="border-b border-border"><th className="px-3 py-4 font-semibold text-text">{material.label}</th><td className="px-3 py-4 text-text-dim">{material.count.toLocaleString("en-US")}</td><td className="px-3 py-4 text-text-dim">{material.medianHeightImperial} / {material.medianHeightCm} cm</td><td className="px-3 py-4 text-text-dim">{material.medianWeightLb} lb / {material.medianWeightKg} kg</td><td className="px-3 py-4 text-text-dim">${material.medianPrice.toLocaleString("en-US")}</td></tr>)}</tbody>
        </table>
      </div>

      <details className="mt-8 border-t border-border pt-5 text-sm text-text-dim">
        <summary className="cursor-pointer font-semibold text-text">How this catalog snapshot was built</summary>
        <p className="mt-3 leading-6">{data.methodology.rule} {data.methodology.limitation}</p>
      </details>
      <p className="mt-5 text-sm leading-6 text-text-dim">
        Researchers and publishers can use the <a href="/datasets/sex-doll-size-weight-2026.json" className="font-semibold text-accent underline underline-offset-4">machine-readable aggregate dataset</a> with attribution to this guide.
      </p>
    </section>
  );
}

function sizeWeightDatasetStructuredData() {
  const data = sizeWeightIndexData;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "DollWow Sex Doll Size and Weight Index 2026",
    description: "A dated aggregate analysis of current full-size DollWow catalog listings with usable height, listed weight, and price data.",
    url: "https://dollwow.com/learn/sex-doll-size-weight-guide",
    sameAs: "https://dollwow.com/datasets/sex-doll-size-weight-2026.json",
    datePublished: "2026-08-12",
    dateModified: "2026-08-12",
    creator: { "@type": "Organization", name: "DollWow", url: "https://dollwow.com" },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    measurementTechnique: data.methodology.rule,
    temporalCoverage: "2026-08-12",
    variableMeasured: ["listed height", "listed weight", "starting price", "construction material"],
    distribution: [{
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: "https://dollwow.com/datasets/sex-doll-size-weight-2026.json"
    }]
  };
}

function SizeWeightArticle({ markdown }: { markdown: string }) {
  const boundary = "\n## How To Read Sex Doll Height";
  const boundaryIndex = markdown.indexOf(boundary);
  if (boundaryIndex === -1) return <MarkdownContent markdown={markdown} />;
  return (
    <>
      <MarkdownContent markdown={markdown.slice(0, boundaryIndex)} />
      <SizeWeightCatalogIndex />
      <MarkdownContent markdown={markdown.slice(boundaryIndex + 1)} />
    </>
  );
}

function CatalogIndexStat({ value, label }: { value: string; label: string }) {
  return <div className="bg-surface-elevated p-5"><strong className="block text-2xl font-semibold text-accent">{value}</strong><span className="mt-2 block text-sm leading-5 text-text-dim">{label}</span></div>;
}

function CatalogDistribution({ title, rows }: { title: string; rows: Array<{ label: string; secondary: string; count: number; share: number; width: number }> }) {
  return <div><h3 className="text-xl font-semibold text-text">{title}</h3><div className="mt-5 space-y-5">{rows.map((row) => <div key={row.label}><div className="flex items-end justify-between gap-4 text-sm"><span className="font-semibold text-text">{row.label}<small className="ml-2 font-normal text-text-dim">{row.secondary}</small></span><span className="shrink-0 text-text-dim">{row.count.toLocaleString("en-US")} · {row.share}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-border" aria-hidden="true"><div className="h-full rounded-full bg-accent" style={{ width: `${row.width}%` }} /></div></div>)}</div></div>;
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
  const picks = filterProducts(products, filters).slice(0, config.limit ?? 3);
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
                  <p className="font-semibold text-text">Why consider it</p>
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
  const articleVisuals: Record<string, MarkdownSectionVisual[]> = {
    "best-sex-dolls": [
      {
        afterHeading: "How DollWow Selected These Candidates",
        src: "/images/learn/best-sex-dolls/choose-by-fit.webp",
        alt: "Three current DollWow catalog dolls illustrating four factors for choosing by fit: material, handling, ready-to-ship or custom ordering, and support",
        caption: "There is no universal winner. Compare the exact material and finish, size and handling weight, ready-to-ship or custom path, and ownership support for your needs.",
        width: 1024,
        height: 1536
      }
    ],
    "most-realistic-sex-dolls": [
      {
        afterHeading: "Realism Is a System, Not One Feature",
        src: "/images/learn/most-realistic-sex-dolls/inspect-the-evidence.webp",
        alt: "Two current catalog dolls and close-up details showing how to inspect facial sculpt, surface finish, eyes, hair, and multiple photo angles",
        caption: "Realism should survive a closer look. Compare facial proportions, surface transitions, eyes, hair, and consistent evidence across several angles and lighting conditions.",
        width: 1024,
        height: 1536
      }
    ],
    "male-sex-doll-buying-guide": [
      {
        afterHeading: "Key Takeaways",
        src: "/images/learn/male-sex-doll-buying-guide/compare-the-build.webp",
        alt: "Starpery, WM Dolls, and Irontech male catalog dolls with a four-step framework for comparing construction, handling, body and head pairing, delivery, and storage",
        caption: "Compare the complete male build. Material, listed height and weight, body and head pairing, delivery access, and storage all affect the ownership fit.",
        width: 1024,
        height: 1536
      }
    ],
    "tpe-vs-silicone-sex-dolls": [
      {
        afterHeading: "TPE, Full Silicone, and Hybrid Construction",
        src: "/images/learn/tpe-vs-silicone-sex-dolls/ownership-paths.webp",
        alt: "WM Christy TPE doll and Starpery Candy full-silicone doll beside ownership factors for comparing material paths",
        caption: "Material changes the ownership path, but the exact build still decides softness, detail, handling weight, care, options, and delivered price.",
        width: 1024,
        height: 1536
      }
    ],
    "sex-doll-cost": [
      {
        afterHeading: "Starting Price, Configured Price, and Delivered Cost",
        src: "/images/learn/sex-doll-cost/total-cost.webp",
        alt: "Four-layer sex doll cost guide covering starting price, configured price, delivered cost, and ownership setup",
        caption: "Compare the same body, head, material, options, and destination through all four layers. A lower starting price is not automatically a lower delivered cost.",
        width: 887,
        height: 1774
      }
    ],
    "irontech-dolls-buying-guide": [
      {
        afterHeading: "What Irontech Is Known For",
        src: "/images/learn/irontech-dolls-buying-guide/exact-build.webp",
        alt: "Irontech Evie product visual explaining material, head system, handling weight, and model-specific option checks",
        caption: "Start with the exact Irontech body and head, then compare material, listed handling weight, and options supported for that build.",
        width: 1024,
        height: 1536
      }
    ],
    "wm-dolls-buying-guide": [
      {
        afterHeading: "What WM Dolls Is Known For",
        src: "/images/learn/wm-dolls-buying-guide/compare-build.webp",
        alt: "Female and male WM Dolls products with four checks for material, body and head pairing, handling, and options",
        caption: "WM offers many body and head combinations. Read height and weight together, then confirm the exact material, pairing, and available options.",
        width: 1024,
        height: 1536
      }
    ],
    "starpery-dolls-buying-guide": [
      {
        afterHeading: "How To Compare Starpery Dolls",
        src: "/images/learn/starpery-dolls-buying-guide/finished-build.webp",
        alt: "Two current Starpery products with close-up checks for face, eyes, material, proportions, hands, weight, and model-specific options",
        caption: "Compare the finished Starpery build in layers, then verify weight, material, and supported choices on the exact product page.",
        width: 1024,
        height: 1536
      }
    ],
    "6ye-dolls-buying-guide": [
      {
        afterHeading: "How To Compare 6YE Dolls",
        src: "/images/learn/6ye-dolls-buying-guide/range-map.webp",
        alt: "Three current 6YE catalog dolls showing TPE full-body, silicone-head, and male build paths with body, weight, options, and storage checks",
        caption: "6YE covers more than one ownership path. Confirm the exact body and head, read height with listed weight, and verify supported options and storage needs.",
        width: 1024,
        height: 1536
      }
    ],
    "se-doll-buying-guide": [
      {
        afterHeading: "How To Compare SE Dolls",
        src: "/images/learn/se-doll-buying-guide/material-and-finish.webp",
        alt: "SE Doll Avery, Kiko, and Annika with four checks for material, makeup level, body and head pairing, and finish-specific care",
        caption: "Compare the exact SE Doll material and makeup level, confirm the listed body and head pairing, and follow the care routine for that finish. Availability varies by product.",
        width: 1024,
        height: 1536
      }
    ],
    "sex-doll-maintenance-checklist": [
      {
        afterHeading: "Routine Maintenance Checklist",
        src: "/images/learn/sex-doll-maintenance-checklist/monthly-care.webp",
        alt: "A fully supported clothed catalog doll beside a six-step monthly care checklist for material, cleaning, drying, inspection, approved powder, and storage",
        caption: "Use the six-step check as a monthly reminder, then follow the care instructions for the exact material, finish, and construction.",
        width: 1024,
        height: 1536
      }
    ],
    "sex-doll-scams": [
      {
        afterHeading: "Red Flags To Watch",
        src: "/images/learn/sex-doll-scams/listing-trust-check.webp",
        alt: "A six-point listing trust check comparing verifiable product facts with common seller red flags",
        caption: "A low price is not proof of a scam. Verify the exact product, how the order will be fulfilled, included options, support, policies, and payment method before deciding.",
        width: 1024,
        height: 1536
      }
    ],
    "sex-doll-laws-us": [
      {
        afterHeading: "The Practical Answer",
        src: "/images/learn/sex-doll-laws-us/legal-checklist.webp",
        alt: "Six-step US legal and buying-safety checklist covering adult-only products, location, importing and shipping, current law, privacy, and qualified advice",
        caption: "Treat legality as a checklist. Confirm the product is clearly adult, check current rules for your location, keep privacy separate from legality, and use qualified advice for legal questions.",
        width: 864,
        height: 1821
      }
    ],
    "ready-to-ship-vs-custom-sex-dolls": [
      {
        afterHeading: "Side-by-Side Comparison",
        src: "/images/learn/ready-to-ship-vs-custom-sex-dolls/choose-order-path.webp",
        alt: "A ready-to-ship Jarliet doll and a made-to-order SY doll with the four checks that define each ordering path",
        caption: "Choose ready to ship when the confirmed existing build fits. Choose made to order when a supported non-negotiable detail is missing.",
        width: 1024,
        height: 1536
      }
    ],
    "implanted-hair-vs-wig": [
      {
        afterHeading: "Comparison Table",
        src: "/images/learn/implanted-hair-vs-wig/hair-choice.webp",
        alt: "The same adult catalog doll shown with a removable wig and an implanted-hair example, with flexibility, care, and compatibility checks",
        caption: "Wigs favor flexibility and replacement. Implanted hair favors an integrated look but needs gentler care and confirmation for the exact head.",
        width: 1024,
        height: 1536
      }
    ],
    "standing-feet-sex-doll-guide": [
      {
        afterHeading: "Pros And Tradeoffs",
        src: "/images/learn/standing-feet-sex-doll-guide/standing-options.webp",
        alt: "A fully clothed catalog doll using external support beside examples of non-standing, bolt-standing, and boltless-standing feet",
        caption: "Standing options change the foot, floor contact, and support plan. Confirm the exact body, skeleton, and manufacturer guidance before choosing.",
        width: 1024,
        height: 1536
      }
    ],
    "sex-doll-skeleton-options": [
      {
        afterHeading: "Comparison Table",
        src: "/images/learn/sex-doll-skeleton-options/choose-by-use.webp",
        alt: "Four fully clothed companion-doll mannequins illustrating standard, flexible, advanced supplier-named, and standing-compatible movement paths",
        caption: "Choose by the movement you will use, then confirm the exact body, weight, skeleton, standing option, and storage guidance.",
        width: 1024,
        height: 1536
      }
    ],
    "body-heating-sex-doll-guide": [
      {
        afterHeading: "What To Compare",
        src: "/images/learn/body-heating-sex-doll-guide/check-before-adding.webp",
        alt: "A fully clothed companion-doll mannequin with example warming zones and seven checks for body support, power, controls, compatibility, cleaning, and storage",
        caption: "The heating label alone does not explain the system. Confirm the exact body, warming zone, power and controls, compatible options, and supplied care instructions.",
        width: 1024,
        height: 1536
      }
    ],
    "custom-sex-dolls": [
      {
        afterHeading: "Common Custom Options",
        src: "/images/learn/custom-sex-dolls/build-order.webp",
        alt: "A fully clothed companion-doll mannequin surrounded by five custom-build stages: base model, appearance, structure, functions, and final checks",
        caption: "Start with the right body, head, material, height, and weight. Add appearance, structure, and function choices only where the exact product supports them.",
        width: 864,
        height: 1821
      }
    ],
    "mini-sex-dolls": [
      {
        afterHeading: "What Counts as a Mini Sex Doll?",
        src: "/images/learn/mini-sex-dolls/size-and-fit.webp",
        alt: "Three adult-coded full-doll size categories and a separate full-doll versus torso product-form check",
        caption: "Use the size categories to narrow the catalog, then compare the exact product form, weight, width, depth, delivery route, storage position, material, and care needs.",
        width: 1024,
        height: 1536
      }
    ],
    "discreet-sex-doll-shipping": [
      {
        afterHeading: "Practical Comparison: What Buyers Should Compare",
        src: "/images/learn/discreet-sex-doll-shipping/whole-journey.webp",
        alt: "A plain shipping carton and six privacy checks across packaging, label, billing, messages, handoff, and customs, plus ready and custom fulfillment journeys",
        caption: "Privacy is more than a plain box. Check the outer packaging, label, billing descriptor, messages, signature and handoff, and customs where applicable.",
        width: 864,
        height: 1821
      }
    ],
    "sex-doll-reviews": [
      {
        afterHeading: "The Review Evidence Ladder",
        src: "/images/learn/sex-doll-reviews/evidence-ladder.webp",
        alt: "A six-level review evidence ladder from exact-order evidence to context-free ratings, with six questions to test relevance",
        caption: "Specific, traceable details beat a star rating. Use reviews to find questions, then use current product facts and written confirmation to answer them.",
        width: 1024,
        height: 1536
      }
    ],
    "ai-sex-dolls": [
      {
        afterHeading: "A Capability Ladder for AI Dolls",
        src: "/images/learn/ai-sex-dolls/capability-ladder.webp",
        alt: "Six-level AI doll capability ladder from an unverified marketing label to a documented AI-controlled robot",
        caption: "Identify the level you are actually buying. Conversation, physical connection, electronic movement, sensors, and robotics each need their own evidence.",
        width: 864,
        height: 1821
      }
    ],
    "sex-robots": [
      {
        afterHeading: "What Counts as a Sex Robot?",
        src: "/images/learn/sex-robots/product-types.webp",
        alt: "Five product types separating a conventional doll, electronic option, AI companion, robotic head or upper body, and humanoid robot",
        caption: "Define the product type before comparing features or prices. Movement, AI, sensors, power, privacy, cleaning, and repair must be verified separately.",
        width: 916,
        height: 1717
      }
    ],
    "sex-doll-storage": [
      {
        afterHeading: "Choose Storage Before You Choose The Doll",
        src: "/images/learn/sex-doll-storage/plan-storage.webp",
        alt: "Five-step storage plan covering delivery route, supported positioning, surface protection, room conditions, and safe access",
        caption: "Measure the route and rehearse access before delivery. Any hanging or standing method still needs approval for the exact product.",
        width: 864,
        height: 1821
      }
    ],
    "how-to-clean-a-sex-doll": [
      {
        afterHeading: "The Safe Baseline Routine",
        src: "/images/learn/how-to-clean-a-sex-doll/safe-baseline.webp",
        alt: "Six-step care routine covering material identification, gentle cleaning, careful rinsing, drying, approved care, and supported storage",
        caption: "Use this as a baseline sequence, then follow the manufacturer instructions for the exact material, construction, and powered features.",
        width: 864,
        height: 1821
      }
    ]
  };

  if (slug !== "sex-doll-guide") return articleVisuals[slug] ?? [];
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
      caption: "These current products show why height alone does not predict handling weight. Check the latest measurements before ordering.",
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
      title: "Compare the complete price, not the first number",
      summary: "Starting price helps you scan. Product form, material, size, options, stock status, shipping, taxes, and ownership setup determine the useful comparison.",
      stats: [
        { value: "6", label: "current starting-price bands" },
        { value: "3", label: "prices to separate" }
      ],
      items: [
        { title: "Starting price", body: "Use it to compare similar product forms and materials." },
        { title: "Configured price", body: "Add the exact body, head, material, and paid options you want." },
        { title: "Delivered cost", body: "Review shipping, taxes, destination charges, and the confirmed order total." },
        { title: "Ownership value", body: "Include handling, cleaning, storage, Care 365, and continuing repair support." }
      ],
      href: "/shop/cheap-sex-dolls",
      cta: "Browse dolls up to $1,000"
    },
    "best-sex-dolls": {
      eyebrow: "Buyer shortlist",
      title: "Six buyer needs, six useful starting points",
      summary: "DollWow selects current candidates from verifiable catalog facts and distinct buyer needs. The shortlist does not claim sales leadership, anonymous ratings, or hands-on testing.",
      stats: [
        { value: "6", label: "buyer-fit categories" },
        { value: "7", label: "product details checked" }
      ],
      items: [
        { title: "Define the need", body: "Value, lower weight, hybrid construction, full silicone, male anatomy, and compact premium builds solve different problems." },
        { title: "Check the body", body: "Compare product form, height, weight, measurements, material, and storage fit." },
        { title: "Verify the build", body: "Review the exact head, skeleton, anatomy, options, images, and current availability." },
        { title: "Compare ownership", body: "Include delivery, arrival, care, storage, and repair support in the final decision." }
      ],
      href: "/help-me-choose",
      cta: "Use the DollWow finder"
    },
    "best-sex-doll-stores": {
      eyebrow: "Store check",
      title: "Eight checks before you compare the final price",
      summary: "A convincing storefront is only the beginning. Verify the seller, exact product, approval, availability, configuration, payment, arrival process, and ownership support as one buying path.",
      stats: [
        { value: "8", label: "store and order checks" },
        { value: "1", label: "exact build to verify" }
      ],
      items: [
        { title: "Identify the seller and product", body: "Confirm who supports the order and the exact manufacturer, body, head, material, form, and measurements." },
        { title: "Verify approval and availability", body: "Check that the seller is approved for the brand and whether the exact configuration already exists or will be made." },
        { title: "Protect the transaction", body: "Use a documented payment method and understand cancellation, arrival, and dispute terms before paying." },
        { title: "Plan for ownership", body: "Compare care, parts, repair guidance, and access to support after the product arrives." }
      ],
      href: "/buyer-protection",
      cta: "Review buyer protection"
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
      title: "Use size and weight together",
      summary: "A male doll's height describes its length. Its listed weight, proportions, and product form tell you far more about carrying, cleaning, positioning, and storage.",
      stats: [
        { value: "160-186 cm", label: "5 ft 3 in-6 ft 1 in current full-body examples" },
        { value: "59.5-125.7 lb", label: "27-57 kg current known-weight examples" }
      ],
      items: [
        { title: "Product form", body: "Separate full-body dolls from compact and partial-body products before comparing price or capabilities." },
        { title: "Handling", body: "Match the listed weight to your route from delivery, cleaning setup, and storage method." },
        { title: "Construction", body: "Compare full TPE, full silicone, and silicone-head/TPE-body hybrid builds separately." },
        { title: "Configuration", body: "Confirm anatomy, head pairing, skeleton, styling, and functions for the exact body." }
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
      title: "Choose an existing unit or a made-to-order build",
      summary: "Ready-to-ship favors a confirmed fixed configuration and a shorter fulfillment path. Made-to-order favors product-specific choices, build review, and factory approval.",
      stats: [
        { value: "2", label: "ways to order" },
        { value: "1", label: "exact configuration to confirm" }
      ],
      items: [
        { title: "Ready-to-ship", body: "Confirm the unit, warehouse, fixed configuration, measurements, and dispatch path." },
        { title: "Made-to-order", body: "Confirm body, head, material, options, compatibility, price changes, and production path." },
        { title: "Build review", body: "Eligible custom selections receive a Human Build Check before production." },
        { title: "Factory approval", body: "Eligible custom builds can receive factory media before shipment where supported." }
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
  limit?: number;
  products: Product[];
};

function productModuleConfig(slug: string): Omit<ArticleProductModule, "products"> | null {
  const map: Record<string, Omit<ArticleProductModule, "products">> = {
    "sex-doll-size-weight-guide": {
      title: "Three current sizes to compare",
      description: "These current full-size examples show why height and listed weight must be read together. They are comparison references, not a universal ranking or a claim that one size is right for every buyer.",
      collectionHref: "/shop/sex-dolls",
      filters: { productForm: "full-doll" },
      handles: sizeWeightIndexData.representativeListings.map((product) => product.handle)
    },
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
    "best-tpe-sex-dolls": {
      title: "Six current TPE dolls for different buyer priorities",
      description: "This live shortlist compares ready-to-ship and factory-order TPE dolls across five manufacturers, varied heights, and a wide listed-weight range. It is a buyer-fit comparison, not a sales ranking or hands-on test.",
      collectionHref: "/shop/tpe",
      filters: { material: "tpe", productForm: "full-doll" },
      handles: [
        "jarliet-dolls-besty-148cm-e-cup-tpe-companion-doll-1jscw",
        "wm-rayna-155cm-l-cup-tpe-companion-doll-vpv6y",
        "wm-christy-148cm-l-cup-tpe-companion-doll-1eoz0",
        "sedoll-avery-b-153cm-f-cup-tpe-companion-doll-1jtw6",
        "irontech-len-stilwell-158cm-l-cup-tpe-companion-doll-1g8uu",
        "6ye-cherry-noel-152cm-f-cup-tpe-companion-doll-wml82"
      ]
    },
    "silicone-sex-doll-guide": {
      title: "Six current full-silicone products to compare",
      description: "These live examples span six manufacturers, varied heights, a 63.9-101.4 lb / 29-46 kg listed-weight range, and different head and finish paths. They illustrate the buying checks in the guide rather than a universal ranking.",
      collectionHref: "/shop/silicone",
      filters: { material: "silicone", productForm: "full-doll" },
      handles: [
        "angelkiss-flora-ciruka-160cm-a-cup-silicone-companion-doll-1g2b0",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "irontech-evie-161cm-f-cup-silicone-t4-ros-max-companion-doll-mpyhd",
        "sedoll-mariko-160cm-e-cup-silicone-companion-doll-cgdxn",
        "wm-y019-157cm-b-cup-silicone-companion-doll-txhmc",
        "real-lady-sylvia-170cm-s43-silicone-doll"
      ]
    },
    "best-sex-doll-stores": {
      title: "Six current products for testing a store's catalog quality",
      description: "Use these varied full-doll examples to check whether a store clearly identifies the manufacturer, product form, body, head, material, measurements, availability, price, and support path. They are examples, not a sales ranking.",
      collectionHref: "/shop/sex-dolls",
      filters: { productForm: "full-doll" },
      handles: [
        "irontech-len-stilwell-158cm-l-cup-tpe-companion-doll-1g8uu",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "6ye-rowan-165cm-f-cup-tpe-companion-doll-1ldwi",
        "real-lady-viki-150cm-r10-silicone-doll",
        "6ye-claudy-170cm-na-cup-silicone-head-companion-doll-c6f1s",
        "irontech-kevin-170cm-silicone-companion-doll-1kpog"
      ]
    },
    "tantaly-buying-guide": {
      title: "Compare six current Tantaly formats",
      description: "These current Tantaly products span smaller, mid-size, larger, female, and male formats. Compare the complete dimensions, listed weight, material, base, and storage needs on each product page.",
      collectionHref: "/brands/tantaly-dolls",
      filters: {},
      handles: [
        "tantaly-rosie-29cm-companion-doll-860mx",
        "tantaly-hannah-mini-41cm-d-cup-companion-doll-vs9yl",
        "tantaly-mark-60cm-companion-doll-7k5kk",
        "tantaly-badd-angel-74cm-i-cup-companion-doll-1odf7",
        "tantaly-aurora-2-0-89cm-g-cup-companion-doll-1rjq0",
        "tantaly-rebecca-92cm-tpe-companion-doll-1cjp1"
      ]
    },
    "erovenus-dolls-review-guide": {
      title: "Compare six current Erovenus formats",
      description: "These current Erovenus products span hips, smaller compact bodies, and larger torso formats. Compare the exact form, dimensions, silicone finish, care needs, price, and ordering details on each product page.",
      collectionHref: "/brands/erovenus-dolls",
      filters: {},
      handles: [
        "erovenus-lucy-20-5cm-silicone-hips-wcena",
        "erovenus-lauren-54cm-d-cup-silicone-companion-doll-g16fo",
        "erovenus-emma-72-5cm-g-cup-silicone-companion-doll-3svp9",
        "erovenus-hot-kitty-aria-82cm-silicone-companion-doll-fvyv0",
        "erovenus-chloe-wildd-85cm-f-cup-silicone-companion-doll-4sblg",
        "erovenus-iris-112-5cm-d-cup-silicone-companion-doll-299ob"
      ]
    },
    "piper-dolls-buying-guide": {
      title: "Compare six current Piper doll builds",
      description: "These current Piper examples span compact and full-size builds, TPE and silicone, and varied handling weights. They are comparison starting points, not a bestseller list or hands-on ranking.",
      collectionHref: "/brands/piper-dolls",
      filters: {},
      handles: [
        "piper-akira-75cm-c-cup-tpe-companion-doll-1alay",
        "piper-akira-150cm-b-cup-tpe-companion-doll-18tol",
        "piper-akira-150cm-c-cup-silicone-companion-doll-1pjdo-6",
        "piper-eimi-155cm-c-cup-silicone-companion-doll-1ae2u",
        "piper-akira-160cm-g-cup-tpe-companion-doll-qyv1k",
        "piper-akira-160cm-g-cup-silicone-companion-doll-1uolz"
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
      title: "Compare six live starting-price levels",
      description: "These current full-doll examples span entry, mid-range, premium, ready-to-ship, made-to-order, TPE, hybrid, and silicone choices. Prices update automatically; compare the complete configuration on each product page.",
      collectionHref: "/shop/sex-dolls",
      filters: {},
      handles: [
        "jarliet-dolls-besty-148cm-e-cup-tpe-companion-doll-1jscw",
        "climax-sola-157cm-d-cup-hybrid-companion-doll-2bj7d",
        "wm-christy-148cm-l-cup-tpe-companion-doll-1eoz0",
        "irontech-xiaying-148cm-d-cup-silicone-companion-doll-1wvlv",
        "starpery-xue-171cm-xue-4-full-silicone-doll",
        "real-lady-viki-150cm-r10-silicone-doll"
      ]
    },
    "best-sex-dolls": {
      title: "Six current candidates for different buyer needs",
      description: "This live shortlist spans value, lower listed weight, hybrid construction, full silicone, male anatomy, and a compact premium build. It is a transparent comparison set, not a universal ranking.",
      collectionHref: "/shop/sex-dolls",
      filters: {},
      handles: [
        "jarliet-dolls-besty-148cm-e-cup-tpe-companion-doll-1jscw",
        "sedoll-clementine-148cm-d-cup-tpe-companion-doll-1pp2y",
        "climax-sola-157cm-d-cup-hybrid-companion-doll-2bj7d",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "irontech-kevin-170cm-silicone-companion-doll-1kpog",
        "real-lady-viki-150cm-r10-silicone-doll"
      ]
    },
    "most-realistic-sex-dolls": {
      title: "Six full-silicone realism candidates",
      description: "This mixed set spans six DollWow brands, varied heights, body proportions, finishes, and handling weights. Use it to compare details, not as a universal best-of ranking.",
      collectionHref: "/shop/realistic-sex-dolls",
      filters: { material: "silicone", productForm: "full-doll" },
      handles: [
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "real-lady-sylvia-170cm-s43-silicone-doll",
        "irontech-evie-161cm-f-cup-silicone-t4-ros-max-companion-doll-mpyhd",
        "sedoll-mariko-160cm-e-cup-silicone-companion-doll-cgdxn",
        "angelkiss-flora-ciruka-160cm-a-cup-silicone-companion-doll-1g2b0",
        "wm-y019-157cm-b-cup-silicone-companion-doll-txhmc"
      ]
    },
    "mini-sex-dolls": {
      title: "Compare compact catalog options",
      description: "Compare full mini dolls by exact height, listed weight, material, price, availability, and storage fit.",
      collectionHref: "/shop/mini-sex-dolls",
      filters: { productForm: "full-doll", height: "0-120" }
    },
    "male-sex-doll-buying-guide": {
      title: "Six ways to compare male doll formats",
      description: "This mixed live-catalog set spans compact and full-body products, TPE, full silicone, hybrid construction, several brands, and a wide handling-weight range. It is a comparison starting point, not a best-of ranking.",
      collectionHref: "/shop/male-dolls",
      filters: { bodyType: "male" },
      handles: [
        "tantaly-mark-60cm-companion-doll-7k5kk",
        "wm-cyan-160cm-na-cup-tpe-companion-doll-vaz1z",
        "6ye-claudy-170cm-na-cup-silicone-head-companion-doll-c6f1s",
        "irontech-kevin-170cm-silicone-companion-doll-1kpog",
        "irontech-tidiane-175cm-tpe-companion-doll-1pv82",
        "wm-head-sn-01-186cm-na-cup-silicone-companion-doll-1y0cj"
      ]
    },
    "ready-to-ship-vs-custom-sex-dolls": {
      title: "Compare three ready and three custom examples",
      description: "These live examples compare ready-to-ship and made-to-order options across TPE, silicone, and hybrid construction. Check the exact configuration and current availability before choosing.",
      collectionHref: "/shop/custom",
      filters: {},
      handles: [
        "jarliet-dolls-besty-148cm-e-cup-tpe-companion-doll-1jscw",
        "jarliet-dolls-eve-163cm-g-cup-silicone-head-companion-doll-1k96a",
        "jarliet-dolls-eve-163cm-g-cup-silicone-companion-doll-bt4pc",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "irontech-evie-161cm-f-cup-silicone-t4-ros-max-companion-doll-mpyhd",
        "real-lady-sylvia-170cm-s43-silicone-doll"
      ]
    },
    "sex-doll-reviews": {
      title: "Practice with six current product pages",
      description: "Use these varied listings to compare product identity, photos, materials, measurements, options, availability, and price. They are verification examples, not a ratings-based ranking.",
      collectionHref: "/shop/sex-dolls",
      filters: {},
      handles: [
        "jarliet-dolls-besty-148cm-e-cup-tpe-companion-doll-1jscw",
        "sedoll-clementine-148cm-d-cup-tpe-companion-doll-1pp2y",
        "climax-sola-157cm-d-cup-hybrid-companion-doll-2bj7d",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "irontech-kevin-170cm-silicone-companion-doll-1kpog",
        "real-lady-viki-150cm-r10-silicone-doll"
      ]
    },
    "how-to-clean-a-sex-doll": {
      title: "Compare care needs before choosing a doll",
      description: "These current TPE, hybrid, and full-silicone examples show why the correct cleaning routine depends on the complete construction, finish, removable parts, and supported options.",
      collectionHref: "/shop/sex-dolls",
      filters: {},
      handles: [
        "irontech-len-stilwell-158cm-l-cup-tpe-companion-doll-1g8uu",
        "6ye-rowan-165cm-f-cup-tpe-companion-doll-1ldwi",
        "climax-sola-157cm-d-cup-hybrid-companion-doll-2bj7d",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "real-lady-viki-150cm-r10-silicone-doll",
        "irontech-kevin-170cm-silicone-companion-doll-1kpog"
      ]
    },
    "sex-doll-storage": {
      title: "Compare six storage-planning examples",
      description: "These current listings span compact and full-size bodies, lighter and heavier builds, and TPE, hybrid, and full-silicone construction. Use exact measurements and weight to test your storage plan.",
      collectionHref: "/shop/sex-dolls",
      filters: {},
      handles: [
        "jarliet-dolls-besty-148cm-e-cup-tpe-companion-doll-1jscw",
        "sedoll-clementine-148cm-d-cup-tpe-companion-doll-1pp2y",
        "climax-sola-157cm-d-cup-hybrid-companion-doll-2bj7d",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "irontech-kevin-170cm-silicone-companion-doll-1kpog",
        "real-lady-viki-150cm-r10-silicone-doll"
      ]
    },
    "sex-doll-maintenance-checklist": {
      title: "Compare six maintenance-planning examples",
      description: "These current full dolls span TPE, hybrid, and full-silicone construction plus different heights and listed weights. Use each exact product to plan handling, cleaning, drying, storage, and feature-specific care.",
      collectionHref: "/shop/sex-dolls",
      filters: {},
      handles: [
        "jarliet-dolls-besty-148cm-e-cup-tpe-companion-doll-1jscw",
        "sedoll-clementine-148cm-d-cup-tpe-companion-doll-1pp2y",
        "climax-sola-157cm-d-cup-hybrid-companion-doll-2bj7d",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "irontech-kevin-170cm-silicone-companion-doll-1kpog",
        "real-lady-viki-150cm-r10-silicone-doll"
      ]
    },
    "sex-doll-scams": {
      title: "Compare six current full-doll listings",
      description: "Use these current TPE, hybrid, and full-silicone products to compare exact identity, material, measurements, listed weight, price, in-stock or made-to-order status, and support against another seller's offer.",
      collectionHref: "/shop/sex-dolls",
      filters: {},
      handles: [
        "jarliet-dolls-besty-148cm-e-cup-tpe-companion-doll-1jscw",
        "sedoll-clementine-148cm-d-cup-tpe-companion-doll-1pp2y",
        "climax-sola-157cm-d-cup-hybrid-companion-doll-2bj7d",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "irontech-kevin-170cm-silicone-companion-doll-1kpog",
        "real-lady-viki-150cm-r10-silicone-doll"
      ]
    },
    "custom-sex-dolls": {
      title: "Choose a base model for your custom build",
      description: "Compare current full-doll base models by material, height, listed weight, measurements, price, and product-specific option path before adding appearance or functions.",
      collectionHref: "/shop/custom",
      filters: {},
      handles: [
        "jarliet-dolls-besty-148cm-e-cup-tpe-companion-doll-1jscw",
        "sedoll-clementine-148cm-d-cup-tpe-companion-doll-1pp2y",
        "climax-sola-157cm-d-cup-hybrid-companion-doll-2bj7d",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "irontech-kevin-170cm-silicone-companion-doll-1kpog",
        "real-lady-viki-150cm-r10-silicone-doll"
      ]
    },
    "wm-dolls-buying-guide": {
      title: "Compare six WM body and material paths",
      description: "Use current products to compare TPE, silicone, female, male, shorter, taller, lighter, and heavier builds. This is a decision sample, not a bestseller ranking.",
      collectionHref: "/brands/wm-dolls",
      filters: { brand: "wm" },
      handles: [
        "wm-christy-148cm-l-cup-tpe-companion-doll-1eoz0",
        "wm-rayna-155cm-l-cup-tpe-companion-doll-vpv6y",
        "wm-head-198-163cm-h-cup-silicone-companion-doll-1gykh",
        "wm-head-206-170cm-d-cup-silicone-companion-doll-1t3ox",
        "wm-marvin-head-n6-175cm-tpe-companion-doll-nrr0c",
        "wm-head-sn-01-186cm-na-cup-silicone-companion-doll-1y0cj"
      ]
    },
    "irontech-dolls-buying-guide": {
      title: "Compare six Irontech build paths",
      description: "Use current products to compare TPE, hybrid, full silicone, female, male, compact, and heavier builds. This is a decision sample, not a bestseller ranking.",
      collectionHref: "/brands/irontech-dolls",
      filters: { brand: "irontech" },
      handles: [
        "irontech-len-stilwell-158cm-l-cup-tpe-companion-doll-1g8uu",
        "irontech-evie-161cm-f-cup-silicone-t4-ros-max-companion-doll-mpyhd",
        "irontech-letitia-nell-165cm-g-cup-hybrid-companion-doll-18er7",
        "irontech-alessia-154cm-i-cup-tpe-companion-doll-1ymco",
        "irontech-kevin-170cm-silicone-companion-doll-1kpog",
        "irontech-abraham-176cm-silicone-companion-doll-1xmxj"
      ]
    },
    "starpery-dolls-buying-guide": {
      title: "Compare six Starpery build paths",
      description: "Use current products to compare silicone-head and full-silicone construction, compact and taller bodies, different head systems, and a range of handling needs. This is a decision sample, not a bestseller ranking.",
      collectionHref: "/brands/starpery-dolls",
      filters: { brand: "starpery" },
      handles: [
        "starpery-rong-151cm-b-cup-silicone-head-companion-doll-x9q92",
        "starpery-candy-159cm-e-cup-silicone-head-companion-doll-z0szr",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "starpery-xue-171cm-xue-4-full-silicone-doll",
        "starpery-seraphina-171cm-seraphina-ros-full-silicone-doll",
        "starpery-nieve-176cm-f-cup-silicone-head-companion-doll-kyfgd"
      ]
    },
    "zelex-dolls-buying-guide": {
      title: "Compare Zelex Dolls listings",
      description: "Compare current Zelex models by material, measurements, price, availability, and custom options.",
      collectionHref: "/brands/zelex-dolls",
      filters: { brand: "zelex" }
    },
    "se-doll-buying-guide": {
      title: "Compare six SE Doll paths",
      description: "Use current products to compare TPE and full silicone, made-to-order and ready-to-ship, full-size and compact builds. This is a decision sample, not a bestseller ranking.",
      collectionHref: "/brands/se-doll",
      filters: { brand: "sedoll" },
      handles: [
        "sedoll-avery-b-153cm-f-cup-tpe-companion-doll-1jtw6",
        "sedoll-makoto-c-161cm-f-cup-tpe-companion-doll-3l5zo",
        "sedoll-kiko-e-155cm-e-cup-silicone-companion-doll-1cobf",
        "sedoll-annika-a-160cm-c-cup-silicone-companion-doll-gt6si",
        "sedoll-yuuka-a-157cm-i-cup-silicone-companion-doll-1va6g",
        "sedoll-nadia-voss-a-103cm-j-cup-silicone-companion-doll-1galc"
      ]
    },
    "6ye-dolls-buying-guide": {
      title: "Compare six 6YE build paths",
      description: "Use current products to compare TPE and silicone-head construction, shorter and taller female bodies, different proportions, and a male build. This is a decision sample, not a bestseller ranking.",
      collectionHref: "/brands/6ye-dolls",
      filters: { brand: "6ye" },
      handles: [
        "6ye-cherry-noel-152cm-f-cup-tpe-companion-doll-wml82",
        "6ye-rowan-165cm-f-cup-tpe-companion-doll-1ldwi",
        "6ye-rozenn-161cm-l-cup-silicone-head-companion-doll-1emle",
        "6ye-meniu-a-158cm-a-cup-silicone-head-companion-doll-8mmao",
        "6ye-edith-irving-167cm-k-cup-silicone-head-companion-doll-2xjwx",
        "6ye-claudy-170cm-na-cup-silicone-head-companion-doll-c6f1s"
      ]
    },
    "yourdoll-alternatives": {
      title: "Compare six current DollWow starting points",
      description: "These products span TPE, hybrid, full silicone, ready-to-ship, made-to-order, female, and male choices. Use them to compare the details that matter before submitting an exact outside listing.",
      collectionHref: "/shop/sex-dolls",
      filters: {},
      handles: [
        "jarliet-dolls-besty-148cm-e-cup-tpe-companion-doll-1jscw",
        "climax-sola-157cm-d-cup-hybrid-companion-doll-2bj7d",
        "wm-christy-148cm-l-cup-tpe-companion-doll-1eoz0",
        "starpery-xue-171cm-xue-4-full-silicone-doll",
        "real-lady-viki-150cm-r10-silicone-doll",
        "irontech-kevin-170cm-silicone-companion-doll-1kpog"
      ]
    },
    "bestrealdoll-alternatives": {
      title: "Six starting points for different buyer needs",
      description: "Compare current candidates for value, lower listed weight, hybrid construction, full silicone, male anatomy, and a compact premium build. This is a buyer-fit shortlist, not a universal ranking.",
      collectionHref: "/shop/sex-dolls",
      filters: {},
      handles: [
        "jarliet-dolls-besty-148cm-e-cup-tpe-companion-doll-1jscw",
        "sedoll-clementine-148cm-d-cup-tpe-companion-doll-1pp2y",
        "climax-sola-157cm-d-cup-hybrid-companion-doll-2bj7d",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "irontech-kevin-170cm-silicone-companion-doll-1kpog",
        "real-lady-viki-150cm-r10-silicone-doll"
      ]
    },
    "siliconwives-alternatives": {
      title: "Compare TPE, hybrid, and silicone choices",
      description: "These current products provide a practical material comparison across several brands, sizes, prices, and ordering paths. Open each product for current measurements, availability, and supported options.",
      collectionHref: "/shop/sex-dolls",
      filters: {},
      handles: [
        "wm-christy-148cm-l-cup-tpe-companion-doll-1eoz0",
        "6ye-rowan-165cm-f-cup-tpe-companion-doll-1ldwi",
        "climax-sola-157cm-d-cup-hybrid-companion-doll-2bj7d",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "real-lady-sylvia-170cm-s43-silicone-doll",
        "irontech-evie-161cm-f-cup-silicone-t4-ros-max-companion-doll-mpyhd"
      ]
    },
    "joylovedolls-alternatives": {
      title: "Compare six male doll formats",
      description: "These current products span compact and full-body formats, TPE, silicone-head hybrid, and full silicone across several heights and brands. Open each product for current details.",
      collectionHref: "/shop/male-dolls",
      filters: { bodyType: "male" },
      handles: [
        "tantaly-mark-60cm-companion-doll-7k5kk",
        "wm-cyan-160cm-na-cup-tpe-companion-doll-vaz1z",
        "6ye-claudy-170cm-na-cup-silicone-head-companion-doll-c6f1s",
        "irontech-kevin-170cm-silicone-companion-doll-1kpog",
        "irontech-tidiane-175cm-tpe-companion-doll-1pv82",
        "wm-head-sn-01-186cm-na-cup-silicone-companion-doll-1y0cj"
      ]
    },
    "rosemarydoll-alternatives": {
      title: "Compare six live DollWow starting points",
      description: "These examples span TPE, hybrid, full silicone, ready-to-ship, made-to-order, female, and male builds. Use them to compare facts before submitting an exact competing listing.",
      collectionHref: "/shop/sex-dolls",
      filters: {},
      handles: [
        "jarliet-dolls-besty-148cm-e-cup-tpe-companion-doll-1jscw",
        "climax-sola-157cm-d-cup-hybrid-companion-doll-2bj7d",
        "wm-christy-148cm-l-cup-tpe-companion-doll-1eoz0",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "irontech-kevin-170cm-silicone-companion-doll-1kpog",
        "real-lady-viki-150cm-r10-silicone-doll"
      ]
    },
    "realdoll-alternatives": {
      title: "Compare six current full-silicone companions",
      description: "These products span six DollWow brands and varied sculpting, proportions, finishes, measurements, handling weights, and supported options. They are comparison starting points, not RealDoll products or claimed equivalents.",
      collectionHref: "/shop/realistic-sex-dolls",
      filters: { material: "silicone", productForm: "full-doll" },
      handles: [
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "real-lady-sylvia-170cm-s43-silicone-doll",
        "irontech-evie-161cm-f-cup-silicone-t4-ros-max-companion-doll-mpyhd",
        "sedoll-mariko-160cm-e-cup-silicone-companion-doll-cgdxn",
        "angelkiss-flora-ciruka-160cm-a-cup-silicone-companion-doll-1g2b0",
        "wm-y019-157cm-b-cup-silicone-companion-doll-txhmc"
      ]
    },
    "betterlovedoll-alternatives": {
      title: "Compare six product and ordering paths",
      description: "These current products span TPE, hybrid, full silicone, compact and full-size builds, ready-stock and made-to-order routes, and female and male products. Compare the exact facts rather than treating the categories as interchangeable.",
      collectionHref: "/shop/sex-dolls",
      filters: {},
      handles: [
        "jarliet-dolls-besty-148cm-e-cup-tpe-companion-doll-1jscw",
        "climax-sola-157cm-d-cup-hybrid-companion-doll-2bj7d",
        "starpery-yuan-154cm-yuan-2-full-silicone-doll",
        "sedoll-clementine-148cm-d-cup-tpe-companion-doll-1pp2y",
        "tantaly-mark-60cm-companion-doll-7k5kk",
        "irontech-kevin-170cm-silicone-companion-doll-1kpog"
      ]
    },
    "realsexdoll-alternatives": {
      title: "Compare six realism-focused starting points",
      description: "These current full-silicone products span six manufacturers, different sculpting and finish directions, varied proportions, and different handling needs. They are starting points for inspection, not claimed equivalents or a universal ranking.",
      collectionHref: "/shop/realistic-sex-dolls",
      filters: { material: "silicone", productForm: "full-doll" },
      handles: [
        "real-lady-sylvia-170cm-s43-silicone-doll",
        "angelkiss-flora-ciruka-160cm-a-cup-silicone-companion-doll-1g2b0",
        "starpery-xue-171cm-xue-4-full-silicone-doll",
        "irontech-evie-161cm-f-cup-silicone-t4-ros-max-companion-doll-mpyhd",
        "sedoll-mariko-160cm-e-cup-silicone-companion-doll-cgdxn",
        "wm-y019-157cm-b-cup-silicone-companion-doll-txhmc"
      ]
    },
    "sexdolltech-alternatives": {
      title: "Compare six current TPE starting points",
      description: "These current TPE products span six brands, different heights and proportions, varied handling needs, and both ready-stock and made-to-order choices. Compare the exact build and delivered order rather than the material label alone.",
      collectionHref: "/shop/tpe",
      filters: { material: "tpe" },
      handles: [
        "wm-christy-148cm-l-cup-tpe-companion-doll-1eoz0",
        "jarliet-dolls-besty-148cm-e-cup-tpe-companion-doll-1jscw",
        "6ye-cherry-noel-152cm-f-cup-tpe-companion-doll-wml82",
        "irontech-len-stilwell-158cm-l-cup-tpe-companion-doll-1g8uu",
        "sedoll-avery-b-153cm-f-cup-tpe-companion-doll-1jtw6",
        "wm-rayna-155cm-l-cup-tpe-companion-doll-vpv6y"
      ]
    },
    "myrobotdoll-alternatives": {
      title: "Compare six current ready-to-ship examples",
      description: "Use current ready-stock products to compare the physical doll first: exact configuration, material, measurements, handling, warehouse, dispatch stage, and any documented electronic option.",
      collectionHref: "/shop/ready-to-ship",
      filters: { availability: "ready_to_ship" },
      limit: 6
    },
    "sexdollqueen-alternatives": {
      title: "Review ready-to-ship listings",
      description: "Compare ready-to-ship dolls by warehouse location, expected dispatch time, and the exact included configuration.",
      collectionHref: "/shop/ready-to-ship",
      filters: { availability: "ready_to_ship" },
      limit: 6
    }
  };

  return map[slug] ?? null;
}

function relatedCollections(slug: string) {
  const common = [
    { label: "Browse all dolls", href: "/shop/sex-dolls", description: "Compare current DollWow products by material, size, price, and availability." }
  ];
  const map: Record<string, Array<{ label: string; href: string; description: string }>> = {
    "sex-doll-guide": [
      { label: "Browse all sex dolls", href: "/shop/sex-dolls", description: "Compare current products by material, size, price, and availability." },
      { label: "Use the DollWow finder", href: "/help-me-choose", description: "Narrow products around material, size, body type, and delivery preferences." },
      { label: "Compare active brands", href: "/brands", description: "Review manufacturer hubs and current DollWow listings." }
    ],
    "sex-doll-size-weight-guide": [
      { label: "Lightweight sex dolls", href: "/shop/lightweight-sex-dolls", description: "Compare current full dolls by listed weight and handling fit." },
      { label: "Mini sex dolls", href: "/shop/mini-sex-dolls", description: "Compare full dolls up to 120 cm / 3 ft 11 in." },
      { label: "Storage guide", href: "/learn/sex-doll-storage", description: "Plan support, clearance, privacy, and access before delivery." },
      { label: "Cost guide", href: "/learn/sex-doll-cost", description: "Compare starting price, configured price, and delivered cost." },
      { label: "Browse all sex dolls", href: "/shop/sex-dolls", description: "Compare current products by material, measurements, weight, price, and availability." }
    ],
    "tpe-vs-silicone-sex-dolls": [
      { label: "Browse TPE dolls", href: "/shop/tpe", description: "Compare softer material builds and care tradeoffs." },
      { label: "Browse silicone dolls", href: "/shop/silicone", description: "Compare full-silicone builds, detail, weight, and price." },
      { label: "Browse hybrid dolls", href: "/shop/hybrid", description: "Compare silicone-head and TPE-body construction." }
    ],
    "best-tpe-sex-dolls": [
      { label: "Browse TPE dolls", href: "/shop/tpe", description: "Compare current full TPE dolls by size, weight, price, and availability." },
      { label: "TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls", description: "Review material, care, feel, and ownership tradeoffs." },
      { label: "Lightweight dolls", href: "/shop/lightweight-sex-dolls", description: "Start with listed weight when routine handling is the main constraint." },
      { label: "Ready-to-ship dolls", href: "/shop/ready-to-ship", description: "Compare current warehouse configurations and confirm dispatch details." }
    ],
    "silicone-sex-doll-guide": [
      { label: "Browse full-silicone dolls", href: "/shop/silicone", description: "Compare current products by body, head, measurements, weight, price, and supported options." },
      { label: "TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls", description: "Compare material, care, feel, weight, repair, and price tradeoffs." },
      { label: "Most realistic dolls", href: "/learn/most-realistic-sex-dolls", description: "Use a detailed visual inspection method instead of relying on the material label." },
      { label: "Cleaning guide", href: "/learn/how-to-clean-a-sex-doll", description: "Build a gentle cleaning and drying routine around the exact product." }
    ],
    "best-sex-doll-stores": [
      { label: "Browse all sex dolls", href: "/shop/sex-dolls", description: "Compare current products by material, size, price, availability, and manufacturer." },
      { label: "Buyer protection", href: "/buyer-protection", description: "Review DollWow's purchase clarity and support commitments." },
      { label: "Compare a listing", href: "/compare", description: "Send another current offer for a fact-by-fact comparison." },
      { label: "30-Day Price Lock", href: "/best-price-guarantee", description: "Review eligible comparable offers before or after purchase under the published terms." }
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
      { label: "Lightweight sex dolls", href: "/shop/lightweight-sex-dolls", description: "Start with listed weight when handling is the main constraint." }
    ],
    "most-realistic-sex-dolls": [
      { label: "Silicone dolls", href: "/shop/silicone", description: "Compare premium material builds and sculpt detail." },
      { label: "Custom dolls", href: "/shop/custom", description: "Browse dolls with model-specific customization options." }
    ],
    "discreet-sex-doll-shipping": [
      { label: "Ready-to-ship dolls", href: "/shop/ready-to-ship", description: "Compare listings where timing and warehouse confirmation matter." },
      { label: "Shipping information", href: "/shipping", description: "Review DollWow delivery and privacy expectations." },
      { label: "Shipping protection", href: "/shipping-protection", description: "See what to document when a shipment is delayed, misdelivered, or damaged." },
      { label: "Ready or made to order", href: "/learn/ready-to-ship-vs-custom-sex-dolls", description: "Understand when production ends and the carrier journey begins." },
      { label: "Ask support", href: "/support", description: "Confirm the privacy details that matter before checkout." }
    ],
    "sex-doll-cost": [
      { label: "Affordable sex dolls", href: "/shop/cheap-sex-dolls", description: "Compare current products with starting prices up to $1,000." },
      { label: "All sex dolls", href: "/shop/sex-dolls", description: "Compare current products by material, size, price, and availability." },
      { label: "30-Day Price Lock", href: "/best-price-guarantee", description: "See how DollWow reviews eligible comparable offers before and after purchase." }
    ],
    "sex-doll-reviews": [
      { label: "Buyer protection", href: "/buyer-protection", description: "Review verification and purchase clarity expectations." },
      { label: "Compare a listing", href: "/compare", description: "Send DollWow a review, product link, screenshot, or competing offer to check." },
      { label: "Best sex dolls guide", href: "/learn/best-sex-dolls", description: "Use a transparent buyer-fit method instead of relying on ratings alone." }
    ],
    "how-to-clean-a-sex-doll": [
      { label: "TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls", description: "Compare material care before choosing a product." },
      { label: "Storage guide", href: "/learn/sex-doll-storage", description: "Plan drying and storage as part of the same routine." },
      { label: "Maintenance checklist", href: "/learn/sex-doll-maintenance-checklist", description: "Keep cleaning, inspection, storage, and repair decisions in one repeatable routine." },
      { label: "Care 365", href: "/care-for-life", description: "See the ownership help included with every DollWow doll under the published terms." }
    ],
    "sex-doll-storage": [
      { label: "Mini sex dolls", href: "/shop/mini-sex-dolls", description: "Compare compact listings for smaller storage spaces." },
      { label: "Lightweight sex dolls", href: "/shop/lightweight-sex-dolls", description: "Start with listed weight when handling is the main constraint." },
      { label: "Cleaning guide", href: "/learn/how-to-clean-a-sex-doll", description: "Clean and dry fully before storage." },
      { label: "Maintenance checklist", href: "/learn/sex-doll-maintenance-checklist", description: "Review material, handling, inspection, and repair steps as one ownership routine." }
    ],
    "sex-doll-maintenance-checklist": [
      { label: "Cleaning guide", href: "/learn/how-to-clean-a-sex-doll", description: "Use a gentle cleaning routine matched to material." },
      { label: "Storage guide", href: "/learn/sex-doll-storage", description: "Protect the material after cleaning." },
      { label: "TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls", description: "Compare material and care tradeoffs before choosing a doll." },
      { label: "Care 365", href: "/care-for-life", description: "Review the ownership help included with every DollWow doll under the published terms." }
    ],
    "sex-doll-scams": [
      { label: "Scam alert", href: "/scam-alert", description: "Review DollWow's buyer-protection warning signs." },
      { label: "Compare a listing", href: "/compare", description: "Submit another seller's product, quote, or claim for a product-level check." },
      { label: "Sex doll reviews", href: "/learn/sex-doll-reviews", description: "Learn how to judge testimonials, ratings, customer media, and seller feedback." },
      { label: "Best sex doll stores", href: "/learn/best-sex-doll-stores", description: "Use a complete seller-vetting framework before checkout." }
    ],
    "sex-doll-laws-us": [
      { label: "Adult-only policy", href: "/adult-only", description: "Review DollWow's adult-only catalog standard." },
      { label: "Buyer protection", href: "/buyer-protection", description: "Review purchase clarity and support expectations." },
      { label: "Discreet shipping", href: "/learn/discreet-sex-doll-shipping", description: "Plan packaging, delivery, and privacy without confusing discretion with legality." },
      { label: "Ask support", href: "/support", description: "Confirm product, catalog, and order facts before checkout." }
    ],
    "custom-sex-dolls": [
      { label: "Custom dolls", href: "/shop/custom", description: "Compare factory-order listings and option paths." },
      { label: "Customize", href: "/customize", description: "Build from current product-specific choices and compatibility rules." },
      { label: "Ready or made to order", href: "/learn/ready-to-ship-vs-custom-sex-dolls", description: "Choose between an existing configuration and a factory build." },
      { label: "TPE or silicone", href: "/learn/tpe-vs-silicone-sex-dolls", description: "Choose the material and care path before appearance upgrades." },
      { label: "Ask support", href: "/support", description: "Review the final build, conflicts, price changes, and manufacturer confirmations." }
    ],
    "implanted-hair-vs-wig": [
      { label: "Custom dolls", href: "/shop/custom", description: "Compare listings where hair options may be available." },
      { label: "Custom sex dolls", href: "/learn/custom-sex-dolls", description: "Review the broader customization process." },
      { label: "Ready or made to order", href: "/learn/ready-to-ship-vs-custom-sex-dolls", description: "See when a hair choice becomes part of factory production." },
      { label: "Care for Life", href: "/care-for-life", description: "Review first-year ownership help and ongoing repair coordination." },
      { label: "Ask support", href: "/support", description: "Confirm the exact head, hair option, price, and compatibility before production." }
    ],
    "standing-feet-sex-doll-guide": [
      { label: "Custom dolls", href: "/shop/custom", description: "Compare option-led builds." },
      { label: "Skeleton options", href: "/learn/sex-doll-skeleton-options", description: "Review pose and handling tradeoffs." },
      { label: "Storage guide", href: "/learn/sex-doll-storage", description: "Plan a supported storage position instead of assuming long-term standing is safe." },
      { label: "Lightweight dolls", href: "/shop/lightweight-sex-dolls", description: "Compare listed weight when lifting and setup are major constraints." },
      { label: "Ask support", href: "/support", description: "Confirm the body, foot system, support method, and storage guidance before production." }
    ],
    "body-heating-sex-doll-guide": [
      { label: "Custom dolls", href: "/shop/custom", description: "Review factory-order listings where functions may be configurable." },
      { label: "Custom sex dolls", href: "/learn/custom-sex-dolls", description: "Review the complete made-to-order process and compatibility checks." },
      { label: "Cleaning guide", href: "/learn/how-to-clean-a-sex-doll", description: "Start with the correct material routine, then add the system-specific care instructions." },
      { label: "Storage guide", href: "/learn/sex-doll-storage", description: "Protect cables, connectors, material, and the complete body between uses." },
      { label: "Ask support", href: "/support", description: "Confirm the exact body, warming zones, power setup, and instructions before production." }
    ],
    "sex-robots": [
      { label: "Ai-Tech Dolls", href: "/brands/ai-tech-dolls", description: "Review current products without assuming every model includes AI or robotics." },
      { label: "Custom dolls", href: "/shop/custom", description: "Compare product-specific electronic options and compatibility." },
      { label: "Compare a listing", href: "/compare", description: "Ask DollWow to verify the exact functions shown on another page." }
    ],
    "ai-sex-dolls": [
      { label: "Ai-Tech Dolls", href: "/brands/ai-tech-dolls", description: "Review current products while verifying every electronic or AI capability separately." },
      { label: "Custom dolls", href: "/shop/custom", description: "Compare product-specific electronic options and compatibility." },
      { label: "Compare a listing", href: "/compare", description: "Ask DollWow to separate the body, electronics, software, and support claims." }
    ],
    "sex-doll-skeleton-options": [
      { label: "Custom dolls", href: "/shop/custom", description: "Compare factory-order listings by body and option path." },
      { label: "Standing feet guide", href: "/learn/standing-feet-sex-doll-guide", description: "Review how feet and skeleton choices interact." },
      { label: "Storage guide", href: "/learn/sex-doll-storage", description: "Plan movement, pressure, and long-term support before choosing a body." },
      { label: "Lightweight dolls", href: "/shop/lightweight-sex-dolls", description: "Compare listed weight separately from pose range." },
      { label: "Ask support", href: "/support", description: "Translate supplier skeleton names into the movements supported on the exact body." }
    ],
    "wm-dolls-buying-guide": [
      { label: "WM Dolls brand hub", href: "/brands/wm-dolls", description: "Compare current DollWow WM listings." },
      { label: "TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls", description: "Compare material and care tradeoffs." },
      { label: "Sex doll reviews", href: "/learn/sex-doll-reviews", description: "Check what a useful model review should prove." },
      { label: "Custom dolls", href: "/shop/custom", description: "Review made-to-order dolls and available options." }
    ],
    "irontech-dolls-buying-guide": [
      { label: "Irontech Dolls brand hub", href: "/brands/irontech-dolls", description: "Compare current DollWow Irontech listings." },
      { label: "TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls", description: "Compare material and care tradeoffs." },
      { label: "Male doll guide", href: "/learn/male-sex-doll-buying-guide", description: "Review male body-type fit and measurements." },
      { label: "Standing feet guide", href: "/learn/standing-feet-sex-doll-guide", description: "Plan standing support and storage safely." }
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
      { label: "Compare a listing", href: "/compare", description: "Submit the current product URL for a fact-by-fact comparison." },
      { label: "All sex dolls", href: "/shop/sex-dolls", description: "Compare DollWow products by material, size, price, availability, and brand." },
      { label: "30-Day Price Lock", href: "/best-price-guarantee", description: "Review the terms for eligible comparable offers before or after purchase." }
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
