import Link from "next/link";
import Image from "next/image";
import { ImageIcon, Mail, SearchCheck, Sparkles } from "lucide-react";
import { productPublicTitle } from "@/lib/catalog/naming";
import type { Product } from "@/types/product";
import type { VisualSearchRequestRecord } from "@/types/visualSearch";
import { GoldButton } from "./GoldButton";

export function VisualSearchResult({
  request,
  productsById
}: {
  request: VisualSearchRequestRecord;
  productsById: Map<string, Product>;
}) {
  const suggestions = request.catalogSuggestions
    .map((suggestion) => ({
      ...suggestion,
      product: productsById.get(suggestion.productId) || null
    }))
    .filter((item) => item.product);
  const topConfidence = request.results[0]?.confidence ?? 0;
  const hasLocalCatalogMatch = request.results.some((result) => {
    const raw = result.rawResult as Record<string, unknown> | undefined;
    return raw?.provider === "dollwow_local_visual_index";
  });
  const statusLabel = humanizeVisualSearchStatus(request.status);
  const statusNote = buildStatusNote(request, suggestions.length, hasLocalCatalogMatch);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="rounded-[20px] border border-gold-500/16 bg-ink-800/72 p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold-300">Find this doll</p>
        <h1 className="mt-3 text-3xl font-semibold text-ivory-50">Image search result</h1>
        <p className="mt-2 text-sm text-ivory-400">We checked the photo against DollWow products and public image results.</p>

        <div className="mt-6 grid gap-4 rounded-[16px] bg-ink-950/50 p-4 sm:grid-cols-[148px_1fr]">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[14px] border border-gold-500/16 bg-black/20">
            <Image src={request.imageUrl} alt="Submitted search reference" fill sizes="148px" className="object-cover" unoptimized />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-gold-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold-200">
                {statusLabel}
              </span>
              {request.results.length ? (
                <span className="rounded-full border border-gold-500/20 px-3 py-1 text-xs font-semibold text-ivory-200">
                  Top public match {Math.round(topConfidence * 100)}%
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-ivory-300">{statusNote}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href={request.imageUrl} target="_blank" className="inline-flex items-center gap-2 text-sm font-medium text-gold-300 hover:text-gold-200">
                <ImageIcon className="h-4 w-4" />
                Open original image
              </Link>
              {request.customerEmail ? (
                <span className="inline-flex items-center gap-2 text-sm text-ivory-400">
                  <Mail className="h-4 w-4 text-gold-300" />
                  Follow-up can go to {request.customerEmail}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {request.results.length ? (
            request.results.slice(0, 8).map((result) => (
              <div key={`${result.rank}-${result.resultUrl}`} className="rounded-[14px] bg-ink-950/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.16em] text-gold-300">{result.resultDomain}</p>
                    <Link href={result.resultUrl} target="_blank" className="mt-1 block text-base font-semibold text-ivory-50 hover:text-gold-200">
                      {result.title || result.resultUrl}
                    </Link>
                    {result.snippet ? <p className="mt-2 text-sm text-ivory-400">{result.snippet}</p> : null}
                    {result.imageUrl ? (
                      <Link href={result.imageUrl} target="_blank" className="mt-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-gold-300 hover:text-gold-200">
                        <ImageIcon className="h-3.5 w-3.5" />
                        View match image
                      </Link>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-full border border-gold-500/18 px-3 py-1 text-xs font-semibold text-gold-200">
                    Match {Math.round((result.confidence || 0) * 100)}%
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[14px] bg-ink-950/50 p-4 text-sm text-ivory-400">
              We could not verify this photo automatically. Our team can still review it manually.
            </div>
          )}
        </div>
      </section>

      <aside className="rounded-[20px] border border-gold-500/16 bg-ink-800/72 p-6">
        <div className="flex items-center gap-3">
          <SearchCheck className="h-6 w-6 text-stock" />
          <h2 className="text-2xl font-semibold text-ivory-50">Closest DollWow matches</h2>
        </div>
        <p className="mt-2 text-sm text-ivory-400">When we find a clear match, it appears here. If not, our team can check it for you.</p>

        <div className="mt-5 space-y-3">
          {suggestions.length ? (
            suggestions.map(({ product, score }) =>
              product ? (
                <div key={product.id} className="rounded-[16px] bg-ink-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-gold-300">{product.extended.brand || product.vendor}</p>
                  <Link href={`/products/${product.handle}`} className="mt-1 block text-lg font-semibold text-ivory-50 hover:text-gold-200">
                    {productPublicTitle(product)}
                  </Link>
                  <p className="mt-2 text-sm text-ivory-400">
                    {product.extended.heightCm ? `${product.extended.heightCm} cm` : "Height TBD"}
                    {product.extended.material ? ` • ${product.extended.material}` : ""}
                    {product.extended.cupSize ? ` • ${product.extended.cupSize}` : ""}
                  </p>
                  <p className="mt-2 text-xs text-ivory-500">{score >= 90 ? "Matched to a DollWow visual asset." : "Possible fit. Worth a quick team check before you order."}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="rounded-full border border-gold-500/18 px-3 py-1 text-xs font-semibold text-gold-200">
                      Catalog score {score}
                    </span>
                    <GoldButton href={`/products/${product.handle}`} className="min-h-0 px-4 py-2 text-xs">
                      View doll
                    </GoldButton>
                  </div>
                </div>
              ) : null
            )
          ) : (
            <div className="rounded-[16px] bg-ink-950/50 p-4 text-sm text-ivory-400">
              No clear match yet. Leave us the image and we can check it manually.
            </div>
          )}
        </div>

        <div className="mt-6 rounded-[16px] border border-gold-500/16 bg-ink-950/40 p-4">
          <div className="flex items-center gap-2 text-gold-300">
            <Sparkles className="h-4 w-4" />
            <p className="text-sm font-semibold">Need our team to check?</p>
          </div>
          <p className="mt-2 text-sm text-ivory-400">
            If this is a doll we can source, our team can confirm the details and help you order it.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <GoldButton href="/support?source=visual-search">Ask our team</GoldButton>
            <GoldButton href="/compare" variant="secondary">Compare a listing instead</GoldButton>
          </div>
        </div>
      </aside>
    </div>
  );
}

function humanizeVisualSearchStatus(status: VisualSearchRequestRecord["status"]) {
  if (status === "processed") return "Matches found";
  if (status === "needs_review") return "Needs team review";
  if (status === "provider_unavailable") return "Needs team review";
  if (status === "error") return "Search incomplete";
  return "Processing";
}

function buildStatusNote(request: VisualSearchRequestRecord, suggestionCount: number, hasLocalCatalogMatch: boolean) {
  if (hasLocalCatalogMatch) {
    return "This image matched a DollWow catalog visual. Open the product below to compare the original gallery and specs.";
  }

  if (request.status === "processed" && request.results.length) {
    return suggestionCount
      ? "We found public matches and translated them into the closest live DollWow listings below."
      : "We found public matches, but none were strong enough to map cleanly into the live catalog yet.";
  }

  if (request.status === "provider_unavailable") {
    return "We could not verify this photo automatically. Our team can still check it for you.";
  }

  if (request.status === "needs_review") {
    return request.customerEmail
      ? "This image needs a team review. Your email is attached so we can follow up if we need to verify or import the closest match."
      : "This image needs a team review. Add your email in a follow-up if you want us to verify or import the closest match for you.";
  }

  return "We saved the photo so our team can review it if needed.";
}
