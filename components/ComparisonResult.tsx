import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Check,
  ExternalLink,
  FileCheck2,
  MailCheck,
  ShieldCheck
} from "lucide-react";
import { formatMoney } from "@/lib/utils/currency";
import { productPublicTitle } from "@/lib/catalog/naming";
import type { ComparisonRequest } from "@/types/comparison";
import type { Product } from "@/types/product";
import { GoldButton } from "./GoldButton";

export function ComparisonResult({ request, product }: { request: ComparisonRequest; product?: Product | null }) {
  const allowed = request.priceMatch.allowed;
  const approved = request.customerReplyKind === "approval" || request.adminStatus === "sent_code";
  const showSuggestedMatch = allowed && Boolean(product);
  const showRequestedProduct = !allowed && Boolean(product);
  const currency = request.parsed?.currency ?? request.quotedCurrency ?? "USD";
  const quotedPrice = request.quotedPrice ?? null;
  const pagePrice = request.parsed?.price ?? request.parsed?.salePrice ?? null;
  const sourceDomain = request.parsed?.sourceDomain ?? safeDomain(request.inputUrl);
  const promos = cleanPromoSignals(request, currency);
  const reasons = dedupeReasons(request.priceMatch.reasons).slice(0, 3);
  const state = approved
    ? {
        eyebrow: "PRICE MATCH COMPLETE",
        title: "Your match is ready",
        summary: "We finished the review and sent the result by email.",
        badge: "Approved",
        badgeDetail: "Result emailed",
        icon: MailCheck,
        tone: "border-stock/25 bg-stock-tint text-stock"
      }
    : allowed
      ? {
          eyebrow: "PRICE MATCH REVIEW",
          title: "This looks matchable",
          summary: "We found a close match. Review the DollWow product before continuing.",
          badge: "Match found",
          badgeDetail: "Ready for your review",
          icon: BadgeCheck,
          tone: "border-stock/25 bg-stock-tint text-stock"
        }
      : {
          eyebrow: "REQUEST RECEIVED",
          title: "We’re checking your price match",
          summary: request.customerEmail
            ? "A specialist will compare the complete deal and email you with the result."
            : "We have your request. Add an email through support if you want the result sent to you.",
          badge: "In review",
          badgeDetail: request.customerEmail ? "We’ll reply by email" : "Contact details needed",
          icon: AlertTriangle,
          tone: "border-accent/25 bg-accent-tint text-accent"
        };
  const StateIcon = state.icon;

  return (
    <article className="overflow-hidden rounded-lg bg-surface shadow-card">
      <header className="border-b border-border px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold tracking-[0.14em] text-accent">{state.eyebrow}</p>
            <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.02] text-text">{state.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-dim sm:text-[17px]">{state.summary}</p>
          </div>
          <div className={`flex min-w-[240px] items-center gap-3 rounded-md border px-4 py-3 ${state.tone}`}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface shadow-soft">
              <StateIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{state.badge}</span>
              <span className="mt-0.5 block text-sm text-text-dim">{state.badgeDetail}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="px-5 py-7 sm:px-8 lg:px-10 lg:py-9" aria-labelledby="submitted-deal-heading">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div>
              <p className="text-sm font-semibold text-accent">SUBMITTED DEAL</p>
              <h2 id="submitted-deal-heading" className="mt-1 font-display text-2xl font-semibold text-text">What we’re comparing</h2>
            </div>
            {request.screenshotUrl ? (
              <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-surface-tint px-3 text-sm font-semibold text-text-dim">
                <FileCheck2 className="h-4 w-4 text-stock" aria-hidden="true" /> Evidence included
              </span>
            ) : null}
          </div>

          <dl className="mt-6 divide-y divide-border rounded-md border border-border">
            <DealRow label="Seller" value={sourceDomain} />
            <DealRow label="Your quoted total" value={quotedPrice ? formatMoney(quotedPrice, currency) : "Not provided"} strong />
            <DealRow label="Price visible on page" value={pagePrice ? formatMoney(pagePrice, currency) : "Needs manual review"} />
            <DealRow label="Availability" value={humanizeStock(request.parsed?.stockStatus)} />
            <DealRow label="Shipping shown" value={request.parsed?.deliveryClaim || "Not clearly stated"} />
          </dl>

          {promos.length ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm font-semibold text-text-dim">Promotions found</span>
              {promos.map((promo) => (
                <span key={promo} className="inline-flex min-h-9 items-center rounded-full bg-accent-tint px-3 text-sm font-semibold text-accent">
                  {promo}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-3 border-t border-border pt-6">
            <a href={request.inputUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-button border border-border-strong px-4 text-sm font-semibold text-text hover:bg-surface-tint">
              View submitted listing <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            {request.screenshotUrl ? (
              <a href={request.screenshotUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-button border border-border-strong px-4 text-sm font-semibold text-text hover:bg-surface-tint">
                View screenshot <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </section>

        <aside className="border-t border-border bg-surface-tint px-5 py-7 sm:px-8 lg:border-l lg:border-t-0 lg:px-8 lg:py-9">
          <p className="text-sm font-semibold text-accent">NEXT STEP</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-text">
            {approved ? "Use your emailed result" : allowed ? "Review your DollWow match" : "Nothing else needed right now"}
          </h2>
          <p className="mt-3 text-base leading-7 text-text-dim">
            {approved
              ? "Open the matched product and use the code from your email when you’re ready."
              : allowed
                ? "Check the matched model, configuration, and delivery details before checkout."
                : "We’ll verify the exact configuration, add-ons, shipping, and active promotions before replying."}
          </p>

          {(showSuggestedMatch || showRequestedProduct) && product ? (
            <Link href={`/products/${product.handle}`} className="mt-6 block rounded-md border border-border bg-surface p-4 shadow-soft transition hover:border-accent">
              <span className="text-sm font-semibold text-text-dim">{showSuggestedMatch ? "Closest DollWow match" : "Related DollWow product"}</span>
              <span className="mt-1 block text-lg font-semibold leading-6 text-text">{productPublicTitle(product)}</span>
              <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accent">View product <ArrowRight className="h-4 w-4" /></span>
            </Link>
          ) : null}

          {(allowed && request.priceMatch.discountPercent) || request.approvedDiscountCode ? (
            <div className="mt-5 rounded-md border border-stock/25 bg-stock-tint p-4">
              <p className="text-sm font-semibold text-stock">{request.approvedDiscountCode ? "Your checkout code" : "Potential match"}</p>
              <p className="mt-1 text-2xl font-semibold text-text">{request.approvedDiscountCode || `Up to ${request.priceMatch.discountPercent}% off`}</p>
            </div>
          ) : null}

          {!allowed && reasons.length ? (
            <div className="mt-6">
              <p className="text-sm font-semibold text-text">Why a person is reviewing it</p>
              <ul className="mt-3 space-y-3">
                {reasons.map((reason) => (
                  <li key={reason} className="flex gap-2.5 text-sm leading-6 text-text-dim">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-3">
            {showSuggestedMatch && product ? <GoldButton href={`/products/${product.handle}`}>Open match</GoldButton> : null}
            <GoldButton href="/support?source=compare" variant={showSuggestedMatch ? "secondary" : "primary"}>Ask our team</GoldButton>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-sm text-text-dim">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-stock" /> 30-day price protection</span>
            <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-stock" /> Full-deal review</span>
          </div>
        </aside>
      </div>
    </article>
  );
}

function DealRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="grid gap-1 px-4 py-3.5 sm:grid-cols-[minmax(140px,0.7fr)_minmax(0,1.3fr)] sm:items-center sm:gap-5 sm:px-5">
      <dt className="text-sm text-text-dim">{label}</dt>
      <dd className={`min-w-0 break-words text-[15px] text-text sm:text-right ${strong ? "text-lg font-semibold" : "font-medium"}`}>{value}</dd>
    </div>
  );
}

function humanizeStock(stockStatus?: string) {
  if (!stockStatus) return "Not clearly stated";
  return stockStatus.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function cleanPromoSignals(request: ComparisonRequest, currency: string) {
  const raw = [
    request.parsed?.couponCode ? `Code ${request.parsed.couponCode}` : null,
    request.parsed?.couponPercent ? `${request.parsed.couponPercent}% off` : null,
    request.parsed?.couponFixedAmount ? `${formatMoney(request.parsed.couponFixedAmount, currency)} off` : null,
    request.parsed?.freeShipping ? "Free shipping" : null,
    ...(request.parsed?.freebies ?? [])
  ];
  return [...new Set(raw.filter((value): value is string => Boolean(value)).map(cleanPromo).filter((value): value is string => Boolean(value)))].slice(0, 4);
}

function cleanPromo(value: string) {
  const clean = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!clean || clean.length > 48 || /https?:|src=|cdn-|data:/i.test(clean)) return null;
  return clean;
}

function safeDomain(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Submitted seller";
  }
}

function dedupeReasons(reasons: string[]) {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const reason of reasons) {
    const simplified = simplifyReason(reason);
    const normalized = simplified.replace(/\s+/g, " ").trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    cleaned.push(simplified);
  }
  return cleaned;
}

function simplifyReason(reason: string) {
  const normalized = reason.toLowerCase();
  if (normalized.includes("configured-cart screenshot")) return "Your screenshot includes configuration details that need to be checked.";
  if (normalized.includes("quoted price was") && normalized.includes("could not be verified")) return "The exact quoted total could not be confirmed from the page alone.";
  if (normalized.includes("page scrape found") && normalized.includes("does not closely match")) return "The visible page price differs from the submitted total.";
  if (normalized.includes("vendor is not approved")) return "The seller needs to be verified before we confirm a match.";
  if (normalized.includes("competitor total price is not clear")) return "The competitor’s final delivered total is not fully clear.";
  if (normalized.includes("product is not available for checkout")) return "The related DollWow product is not currently available for checkout.";
  if (normalized.includes("match needs a team check")) return "A specialist needs to confirm the exact match.";
  return reason;
}
