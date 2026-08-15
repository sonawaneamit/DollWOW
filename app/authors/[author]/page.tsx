import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  absoluteUrl,
  getLearnAuthor,
  getLearnAuthors,
  getLearningArticles,
  learnAuthorUrl
} from "@/lib/learn/content";

const authorFocus: Record<string, { introduction: string; knowsAbout: string[] }> = {
  jesse: {
    introduction: "Jesse helps adults navigate sensitive questions about care, privacy, intimacy, ownership, and buying with less uncertainty.",
    knowsAbout: ["sexology", "intimacy education", "privacy", "doll care", "buyer comfort"]
  },
  alex: {
    introduction: "Alex helps buyers compare the product details that materially change ownership, from construction and measurements to customization and handling.",
    knowsAbout: ["doll collecting", "doll materials", "measurements", "customization", "product comparison"]
  }
};

export function generateStaticParams() {
  return Object.keys(getLearnAuthors()).map((author) => ({ author }));
}

export async function generateMetadata({ params }: { params: Promise<{ author: string }> }): Promise<Metadata> {
  const { author: authorKey } = await params;
  const author = getLearnAuthor(authorKey);
  if (!author) return {};

  const title = `${author.displayName} | DollWow Contributor`;
  return {
    title,
    description: author.shortBio,
    alternates: { canonical: author.profilePath },
    openGraph: {
      title,
      description: author.shortBio,
      url: learnAuthorUrl(authorKey),
      type: "profile",
      images: [{ url: absoluteUrl(author.image)!, alt: author.imageAlt }]
    },
    twitter: {
      card: "summary",
      title,
      description: author.shortBio,
      images: [absoluteUrl(author.image)!]
    }
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ author: string }> }) {
  const { author: authorKey } = await params;
  const author = getLearnAuthor(authorKey);
  if (!author) notFound();

  const focus = authorFocus[authorKey] ?? { introduction: author.shortBio, knowsAbout: [] };
  const articles = getLearningArticles().filter((article) => article.author === authorKey);
  const profileUrl = learnAuthorUrl(authorKey);
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      name: `${author.displayName}, ${author.title}`,
      description: author.bio,
      url: profileUrl,
      mainEntity: {
        "@type": "Person",
        name: author.displayName,
        jobTitle: author.title,
        description: author.bio,
        image: absoluteUrl(author.image),
        url: profileUrl,
        knowsAbout: focus.knowsAbout,
        worksFor: { "@type": "Organization", name: "DollWow", url: absoluteUrl("/") }
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Learning Center", item: absoluteUrl("/learn") },
        { "@type": "ListItem", position: 3, name: author.displayName, item: profileUrl }
      ]
    }
  ];

  return (
    <div>
      {schema.map((entry) => (
        <script key={entry["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
      ))}

      <section className="tone-section" data-tone="deep">
        <div className="tone-inner grid items-center gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[8px] border border-gold-500/18 bg-ivory-50/[0.04]">
            <Image
              src={author.image}
              alt={author.imageAlt}
              fill
              priority
              sizes="(min-width: 1024px) 280px, 70vw"
              className="object-cover"
              style={{ objectPosition: author.imagePosition }}
            />
          </div>
          <div>
            <Link href="/learn" className="text-sm font-semibold text-gold-300">DollWow Learning Center</Link>
            <h1 className="mt-4 text-5xl font-semibold leading-none text-ivory-50 sm:text-6xl">{author.displayName}</h1>
            <p className="mt-4 max-w-3xl text-xl font-medium leading-8 text-ivory-100">{author.title}</p>
            <p className="mt-6 max-w-3xl text-base leading-7 text-ivory-300">{focus.introduction}</p>
            <p className="mt-4 max-w-3xl text-base leading-7 text-ivory-300">{author.bio}</p>
            <p className="mt-6 max-w-2xl border-l border-gold-300/55 pl-4 text-sm leading-6 text-ivory-400">{author.privacyNote} This catalog-doll avatar is not a photograph of the contributor.</p>
          </div>
        </div>
      </section>

      <section className="tone-section" data-tone="blush">
        <div className="tone-inner">
          <p className="text-sm font-semibold text-gold-300">Published guidance</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-ivory-50 sm:text-4xl">Articles by {author.displayName}</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ivory-300">Each article is reviewed against current DollWow catalog, supplier, and policy information before publication.</p>

          <div className="mt-9 grid gap-px overflow-hidden rounded-[8px] border border-gold-500/18 bg-gold-500/18 md:grid-cols-2">
            {articles.map((article) => (
              <Link key={article.slug} href={`/learn/${article.slug}`} className="group bg-ivory-50/[0.04] p-6 transition hover:bg-ivory-50/[0.08]">
                <p className="text-xs font-semibold text-gold-300">{article.category}</p>
                <h3 className="mt-3 text-xl font-semibold leading-7 text-ivory-50 group-hover:text-gold-300">{article.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-ivory-300">{article.excerpt}</p>
                <span className="mt-5 inline-block text-sm font-semibold text-gold-300">Read article</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
