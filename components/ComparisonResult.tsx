import Link from "next/link";
import { AlertTriangle, BadgeCheck, Clock } from "lucide-react";
import { formatMoney } from "@/lib/utils/currency";
import type { ComparisonRequest } from "@/types/comparison";
import type { Product } from "@/types/product";
import { GoldButton } from "./GoldButton";

export function ComparisonResult({ request, product }: { request: ComparisonRequest; product?: Product | null }) {
  const allowed = request.priceMatch.allowed;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="rounded-[20px] border border-gold-500/16 bg-ink-800/72 p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold-300">LIVE Price Comparison</p>
        <h1 className="mt-3 text-3xl font-semibold text-ivory-50">Comparison result</h1>
        <p className="mt-2 text-sm text-ivory-400">Prices may change. We verify before checkout.</p>
        <div className="mt-6 space-y-3">
          <Row label="Source" value={request.parsed?.sourceDomain ?? new URL(request.inputUrl).hostname} />
          <Row label="Listing" value={request.parsed?.title ?? "We could not read the listing title."} />
          <Row
            label="Competitor price"
            value={request.parsed?.price ? formatMoney(request.parsed.price, request.parsed.currency ?? "USD") : "Price unclear"}
          />
          <Row label="Last checked" value={request.parsed ? new Date(request.parsed.lastCheckedAt).toLocaleString() : "Needs review"} />
          <Row label="Match confidence" value={request.confidence} />
        </div>
      </section>

      <aside className="rounded-[20px] border border-gold-500/16 bg-ink-800/72 p-6">
        <div className="flex items-center gap-3">
          {allowed ? <BadgeCheck className="h-6 w-6 text-stock" /> : <AlertTriangle className="h-6 w-6 text-warn" />}
          <h2 className="text-2xl font-semibold text-ivory-50">{allowed ? "Price match ready" : "Human check needed"}</h2>
        </div>
        {product && (
          <div className="mt-5 rounded-[16px] bg-ink-950/50 p-4">
            <p className="text-sm text-ivory-500">Closest DollWow option</p>
            <Link href={`/products/${product.handle}`} className="mt-1 block text-lg font-semibold text-gold-300">
              {product.title}
            </Link>
          </div>
        )}
        <ul className="mt-5 space-y-2 text-sm text-ivory-400">
          {request.priceMatch.reasons.length ? (
            request.priceMatch.reasons.map((reason) => (
              <li key={reason} className="flex gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                {reason}
              </li>
            ))
          ) : (
            <li>Safe launch rules passed. Discount code creation can run when Shopify Admin credentials are configured.</li>
          )}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          {product && <GoldButton href={`/products/${product.handle}`}>View DollWow match</GoldButton>}
          <GoldButton href="/support?source=compare" variant="secondary">Ask human help</GoldButton>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[14px] bg-ink-950/50 p-4 text-sm">
      <span className="text-ivory-600">{label}</span>
      <span className="max-w-[70%] text-right font-medium text-ivory-100">{value}</span>
    </div>
  );
}
