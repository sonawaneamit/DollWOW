import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GoldButton } from "@/components/GoldButton";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/MarkdownContent";
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
              By {article.authorDisplayName}, {article.authorTitle}
            </p>
            <p className="mt-2 text-sm leading-6 text-ivory-300">{author?.bio}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-gold-300">Last reviewed {article.lastReviewed}</p>
          </div>
        </div>
      </section>

      <section className="tone-section" data-tone="blush">
        <div className="tone-inner">
          <article className="mx-auto max-w-3xl">
            <MarkdownContent markdown={article.body} />
            <ArticleActions slug={article.slug} />
          </article>
        </div>
      </section>
    </main>
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
