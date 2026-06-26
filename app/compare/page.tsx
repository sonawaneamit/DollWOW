import { CompareListingForm } from "@/components/CompareListingForm";
import { InfoVisualPanel } from "@/components/InfoVisualPanel";

export const metadata = { title: "Price Match Request" };

export default async function ComparePage({
  searchParams
}: {
  searchParams: Promise<{ product?: string; title?: string }>;
}) {
  const params = await searchParams;
  const targetProductHandle = params.product;
  const targetProductTitle = params.title;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <div className="rounded-[24px] border border-gold-500/16 bg-ink-800/78 p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-gold-300">LIVE Price Comparison</p>
          <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Request a price match</h1>
          <p className="mt-3 text-ivory-400">Share the competitor product link, the final quoted total, and a screenshot of the configured cart or summary. That gives us enough to review the real offer instead of only the base page.</p>
          <div className="mt-6 lg:hidden">
            <InfoVisualPanel
              seed="price-match-mobile"
              eyebrow="Price match"
              title="Show us the real offer."
              copy="Send the competitor link, final price, and cart screenshot. We check the same build, options, shipping, promos, and seller before approving a code."
              cta={{ label: "Read guarantee", href: "/best-price-guarantee" }}
              compact
            />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <QuickFact title="Final total" body="We review the total after options, extras, and promos." />
            <QuickFact title="Cart screenshot" body="A clear cart screenshot helps us verify the exact setup faster." />
            <QuickFact title="Manual review when needed" body="If something is unclear, a real person checks it before we promise anything." />
          </div>
          <div className="mt-7">
            <CompareListingForm targetProductHandle={targetProductHandle} targetProductTitle={targetProductTitle} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="hidden lg:block">
            <InfoVisualPanel
              seed="price-match"
              eyebrow="Price match"
              title="Show us the real offer."
              copy="Send the competitor link, final price, and cart screenshot. We check the same build, options, shipping, promos, and seller before approving a code."
              cta={{ label: "Read guarantee", href: "/best-price-guarantee" }}
            />
          </div>
          <div className="rounded-[24px] border border-gold-500/16 bg-gradient-to-br from-rose-950/35 via-ink-900/86 to-ink-950/95 p-6 sm:p-8">
            <p className="text-sm uppercase tracking-[0.18em] text-gold-300">WHAT TO SEND</p>
            <h2 className="mt-2 text-3xl font-semibold text-ivory-50">The quick checklist</h2>
            <div className="mt-6 grid gap-3 text-sm text-ivory-300">
              <QuickFact title="Product URL" body="Paste the listing you priced." />
              <QuickFact title="Final price" body="Use the total after options, add-ons, shipping, and discounts." />
              <QuickFact title="Screenshot" body="Upload the cart or checkout summary if the setup is customized." />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickFact({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[16px] border border-gold-500/14 bg-ink-950/40 p-4">
      <p className="text-sm font-semibold text-ivory-100">{title}</p>
      <p className="mt-2 text-sm text-ivory-400">{body}</p>
    </div>
  );
}
