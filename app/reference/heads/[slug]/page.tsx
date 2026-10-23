import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHeadReferencePreview, getHeadReferencePreviews } from "@/lib/references/headReferences";
import { ArticleProductCards } from "@/components/ArticleProductCards";
import { articleProducts } from "@/lib/learn/productCards";
import { getProductsByHandles } from "@/lib/shopify/storefront";
import productHandles from "@/content/references/head-products.json";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const reference = getHeadReferencePreview(slug);
  return {
    title: reference ? `${reference.title}: Head and Body` : "Head reference not found",
    description: reference?.answer,
    robots: { index: false, follow: false }
  };
}

export default async function HeadReferencePage({ params }: Props) {
  const { slug } = await params;
  const reference = getHeadReferencePreview(slug);
  if (!reference) notFound();
  const handles = productHandles[slug as keyof typeof productHandles] ?? [];
  const products = articleProducts(handles, await getProductsByHandles(handles, { revalidate: 120 }));
  const facts = [
    ["Manufacturer", reference.brand],
    ["Head code", reference.code],
    ...(reference.designation ? [["Head designation", reference.designation]] : []),
    ["Body pairing", reference.body],
    ["Model", reference.example]
  ];

  return (
    <section className="tone-section" data-tone="blush">
      <div className="tone-inner max-w-5xl">
        <Link href="/learn" className="text-sm font-semibold underline underline-offset-4">Learning Center</Link>
        <div className="mt-8 border-b border-border pb-8">
          <Image src="/images/home-brands/irontech.png" alt="Irontech Doll" width={160} height={64} className="h-16 w-40 object-contain object-left" />
          <p className="mt-4 text-sm font-semibold text-text-dim">Head reference</p>
          <h1 className="mt-2 break-words text-3xl font-semibold leading-tight sm:text-4xl">{reference.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7">{reference.answer}</p>
        </div>

        <div className="grid gap-10 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section aria-labelledby="identity-heading" className="min-w-0">
            <h2 id="identity-heading" className="text-xl font-semibold">Head and body</h2>
            <dl className="mt-4 divide-y divide-border border-y border-border">
              {facts.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 py-3 text-sm leading-6">
                  <dt className="text-text-dim">{label}</dt>
                  <dd className="break-words font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="reading-heading" className="min-w-0">
            <h2 id="reading-heading" className="text-xl font-semibold">Choosing your build</h2>
            <p className="mt-4 leading-7">{reference.detail}</p>
            <p className="mt-4 leading-7">{reference.boundary}</p>
          </section>
        </div>

        <ArticleProductCards products={products} label={`Explore ${reference.example}`} />
        <section aria-labelledby="source-heading" className="border-y border-border py-6">
          <h2 id="source-heading" className="text-xl font-semibold">Explore the model</h2>
          <p className="mt-3 leading-7"><a href={reference.sourceUrl} className="break-words font-semibold underline underline-offset-4">{reference.sourceTitle}</a></p>
        </section>

        <nav aria-label="Related head references" className="flex flex-wrap gap-x-6 gap-y-3 py-6 text-sm font-semibold">
          {getHeadReferencePreviews().filter(item => item.slug !== slug).map(item => <Link key={item.slug} href={`/reference/heads/${item.slug}`} className="underline underline-offset-4">{item.title}</Link>)}
        </nav>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
          <Link href="/learn/irontech-head-types-ros-max" className="underline underline-offset-4">Understand ROS and ROS MAX labels</Link>
          <Link href="/brands/irontech-dolls" className="underline underline-offset-4">Browse current Irontech listings</Link>
        </div>
      </div>
    </section>
  );
}
