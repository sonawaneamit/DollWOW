import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBodyReferencePreview, getBodyReferencePreviews, referenceInches, referencePounds } from "@/lib/references/bodyReferences";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const reference = getBodyReferencePreview(slug);
  return {
    title: reference ? `${reference.title}: Factory Measurements` : "Body reference not found",
    description: reference?.answer,
    robots: { index: false, follow: false }
  };
}

export default async function BodyReferencePage({ params }: Props) {
  const { slug } = await params;
  const reference = getBodyReferencePreview(slug);
  if (!reference) notFound();

  return (
    <section className="tone-section" data-tone="blush">
      <div className="tone-inner max-w-5xl">
        <Link href="/learn" className="text-sm font-semibold underline underline-offset-4">Learning Center</Link>
        <div className="mt-8 border-b border-border pb-8">
          <Image src="/images/home-brands/irontech.png" alt="Irontech Doll" width={160} height={64} className="h-16 w-40 object-contain object-left" />
          <p className="mt-4 text-sm font-semibold text-text-dim">Body reference</p>
          <h1 className="mt-2 break-words text-3xl font-semibold leading-tight sm:text-4xl">{reference.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7">{reference.answer}</p>
          <p className="mt-4 text-sm text-text-dim">Factory source checked <time dateTime={reference.sourceCheckedAt}>{reference.sourceCheckedAt}</time></p>
        </div>

        <div className="grid gap-10 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section aria-labelledby="measurements-heading" className="min-w-0">
            <h2 id="measurements-heading" className="text-xl font-semibold">Factory measurements</h2>
            <table className="mt-4 w-full table-fixed border-collapse text-sm leading-6">
              <caption className="sr-only">{reference.designation}: factory centimetres and calculated inches</caption>
              <thead>
                <tr className="border-y border-border text-left">
                  <th scope="col" className="w-1/2 py-3 pr-3 font-semibold">Measurement</th>
                  <th scope="col" className="w-1/4 px-2 py-3 font-semibold">cm</th>
                  <th scope="col" className="w-1/4 py-3 pl-2 font-semibold">in</th>
                </tr>
              </thead>
              <tbody>
                {reference.measurements.map(row => (
                  <tr key={row.label} className="border-b border-border">
                    <th scope="row" className="break-words py-3 pr-3 text-left font-normal">{row.label}</th>
                    <td className="px-2 py-3 tabular-nums">{row.cm}</td>
                    <td className="py-3 pl-2 tabular-nums">{referenceInches(row.cm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-sm leading-6 text-text-dim">Centimetres are the source figures. Inch and pound conversions use 1in = 2.54cm and 1lb = 0.45359237kg, rounded to one decimal; they are not new factory measurements.</p>
          </section>

          <section aria-labelledby="configuration-heading" className="min-w-0">
            <h2 id="configuration-heading" className="text-xl font-semibold">Weight and configuration</h2>
            <dl className="mt-4 divide-y divide-border border-y border-border text-sm leading-6">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 py-3">
                <dt className="text-text-dim">Body-only weight</dt>
                <dd className="font-semibold"><span className="block">{reference.bodyOnlyKg}kg</span><span className="block">{referencePounds(reference.bodyOnlyKg)}lb</span></dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 py-3">
                <dt className="text-text-dim">Factory body designation</dt><dd className="break-words font-semibold">{reference.designation}</dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 py-3">
                <dt className="text-text-dim">Listed construction</dt><dd className="break-words">{reference.material}</dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 py-3">
                <dt className="text-text-dim">Source configuration</dt><dd className="break-words">{reference.example}</dd>
              </div>
            </dl>
            <p className="mt-4 leading-7">The cited mass is for the body alone. It is not a selected complete-doll weight, a packaged shipping weight or a weight-reduction upgrade result.</p>
            <p className="mt-4 leading-7">{reference.identityNote}</p>
          </section>
        </div>

        <section aria-labelledby="use-heading" className="border-t border-border py-6">
          <h2 id="use-heading" className="text-xl font-semibold">Use the exact body record</h2>
          <p className="mt-3 max-w-3xl leading-7">Check the dimensions alongside your delivery route, storage space and supported handling plan. A factory cup designation is not a standardized cross-brand clothing size. Do not treat a shared height or weight as proof that two bodies have the same proportions or head connection.</p>
        </section>
        <section aria-labelledby="source-heading" className="border-y border-border py-6">
          <h2 id="source-heading" className="text-xl font-semibold">Factory evidence</h2>
          <p className="mt-3 leading-7">{reference.sourceUrl
            ? <a href={reference.sourceUrl} className="break-words font-semibold underline underline-offset-4">{reference.sourceTitle}</a>
            : <span className="font-semibold">{reference.sourceTitle}</span>}</p>
          {reference.sourceNote && <p className="mt-3 max-w-3xl text-sm leading-6 text-text-dim">{reference.sourceNote}</p>}
          <p className="mt-3 max-w-3xl text-sm leading-6 text-text-dim">This is one dated manufacturer reference, not a hands-on test, a current DollWOW stock or price promise, or a universal specification for every option package.</p>
        </section>

        <nav aria-label="Related body references" className="flex flex-wrap gap-x-6 gap-y-3 py-6 text-sm font-semibold">
          {getBodyReferencePreviews().filter(item => item.slug !== slug).map(item => <Link key={item.slug} href={`/reference/bodies/${item.slug}`} className="underline underline-offset-4">{item.title}</Link>)}
        </nav>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
          <Link href="/learn/sex-doll-size-weight-guide" className="underline underline-offset-4">Understand size and weight</Link>
          <Link href="/brands/irontech-dolls" className="underline underline-offset-4">Browse current Irontech listings</Link>
        </div>
      </div>
    </section>
  );
}
