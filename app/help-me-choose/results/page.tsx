import { HumanHelpCTA } from "@/components/HumanHelpCTA";
import { ProductCard } from "@/components/ProductCard";
import { ProductGrid } from "@/components/ProductGrid";
import { quizAnswerSummary, quizAnswersFromParams, quizAnswersToSearchParams } from "@/lib/quiz/answers";
import { recommendProducts } from "@/lib/quiz/recommendProducts";
import { getProducts } from "@/lib/shopify/storefront";
import { getGuidedSession } from "@/lib/supabase/repositories";
import { ArrowRight, CheckCircle2, Filter, MessageCircle, Scale } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Quiz Results" };

export default async function QuizResultsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const { ids, session } = params;
  const idList = ids?.split(",").filter(Boolean) ?? [];
  const products = await getProducts();
  const guidedSession = session ? await getGuidedSession(session) : null;
  const answers = guidedSession?.answers ?? quizAnswersFromParams(params);
  const recommendations = recommendProducts(products, answers);
  const recommendationById = new Map(recommendations.map((item) => [item.productId, item]));
  const recommended = idList.length
    ? products.filter((product) => idList.includes(product.id))
    : recommendations.length
      ? products.filter((product) => recommendationById.has(product.id))
      : products.slice(0, 5);
  const orderedRecommended = idList.length
    ? idList.map((id) => recommended.find((product) => product.id === id)).filter(Boolean)
    : recommended;
  const selectedOptions = quizAnswerSummary(answers);
  const editHref = `/help-me-choose?${quizAnswersToSearchParams(answers).toString()}`;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Your recommendations</p>
      <div className="mt-2 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div>
          <h1 className="text-4xl font-semibold text-ivory-50">Start with these dolls.</h1>
          <p className="mt-3 max-w-3xl text-ivory-400">
            Based on the options you picked, these are good dolls to review first. Open any product to check
            measurements, photos, options, and price-match support.
          </p>
        </div>
        <div className="border border-gold-500/14 bg-ink-800/72 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Options selected</p>
            <Link href={editHref} className="text-sm font-semibold text-gold-200 hover:text-gold-100">
              Edit
            </Link>
          </div>
          <div className="mt-3 grid gap-2 text-sm">
            {selectedOptions.map((item) => (
              <div key={item.label} className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-ivory-300">
                <span className="text-ivory-500">{item.label}</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {orderedRecommended.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {orderedRecommended.map((product) => {
            if (!product) return null;
            const recommendation = recommendationById.get(product.id);
            return (
              <article key={product.id} className="relative">
                {recommendation ? (
                  <div className="mb-3 border border-gold-500/14 bg-[#120907]/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gold-300">
                      <CheckCircle2 className="h-4 w-4" />
                      {recommendation.badge}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ivory-400">{recommendation.reason}.</p>
                  </div>
                ) : null}
                <ProductCard product={product} />
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-8">
          <ProductGrid products={[]} />
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link href="/shop" className="border border-gold-500/14 bg-ink-800/72 p-5 text-ivory-200 transition hover:border-gold-300/45">
          <Filter className="h-5 w-5 text-gold-300" />
          <strong className="mt-4 block text-lg text-ivory-50">Browse more dolls</strong>
          <span className="mt-2 block text-sm leading-6 text-ivory-400">Use catalog filters for brand, body type, material, price, height, and availability.</span>
        </Link>
        <Link href="/compare" className="border border-gold-500/14 bg-ink-800/72 p-5 text-ivory-200 transition hover:border-gold-300/45">
          <Scale className="h-5 w-5 text-gold-300" />
          <strong className="mt-4 block text-lg text-ivory-50">Found it cheaper?</strong>
          <span className="mt-2 block text-sm leading-6 text-ivory-400">Send the competitor link, quoted total, and cart screenshot. We will review it.</span>
        </Link>
        <Link href="/support" className="border border-gold-500/14 bg-ink-800/72 p-5 text-ivory-200 transition hover:border-gold-300/45">
          <MessageCircle className="h-5 w-5 text-gold-300" />
          <strong className="mt-4 block text-lg text-ivory-50">Ask our team</strong>
          <span className="mt-2 block text-sm leading-6 text-ivory-400">Not sure about size, weight, options, shipping, or privacy? Ask before buying.</span>
        </Link>
      </div>

      <div className="mt-8">
        <HumanHelpCTA source="quiz" />
      </div>
      <div className="mt-6">
        <Link href="/help-me-choose" className="inline-flex items-center gap-2 text-sm font-semibold text-gold-300 hover:text-gold-200">
          Start over
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
