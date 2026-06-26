import Link from "next/link";
import { AlertTriangle, BadgeCheck, Clock, MailCheck, ShieldCheck, Truck } from "lucide-react";
import { formatMoney } from "@/lib/utils/currency";
import { productPublicTitle } from "@/lib/catalog/naming";
import type { ComparisonRequest } from "@/types/comparison";
import type { Product } from "@/types/product";
import { GoldButton } from "./GoldButton";

export function ComparisonResult({ request, product }: { request: ComparisonRequest; product?: Product | null }) {
  const allowed = request.priceMatch.allowed;
  const showSuggestedMatch = allowed && Boolean(product);
  const showRequestedProduct = !allowed && Boolean(product);
  const displayTitle = showSuggestedMatch && product ? productPublicTitle(product) : "";
  const competitorPrice = request.parsed?.price ?? request.parsed?.salePrice ?? null;
  const currency = request.parsed?.currency ?? request.quotedCurrency ?? "USD";
  const quotedPrice = request.quotedPrice ?? null;
  const sourceDomain = request.parsed?.sourceDomain ?? new URL(request.inputUrl).hostname;
  const hasScreenshot = Boolean(request.screenshotUrl);
  const reviewState = request.customerReplyKind === "approval" || request.adminStatus === "sent_code" ? "approved" : allowed ? "ready" : "review";
  const promoSignals = [
    request.parsed?.couponCode ? `Code ${request.parsed.couponCode}` : null,
    request.parsed?.couponPercent ? `${request.parsed.couponPercent}% off` : null,
    request.parsed?.couponFixedAmount ? `${formatMoney(request.parsed.couponFixedAmount, currency)} off` : null,
    request.parsed?.freeShipping ? "Free shipping" : null,
    ...(request.parsed?.freebies ?? [])
  ].filter(Boolean) as string[];
  const nextStepTitle =
    reviewState === "approved" ? "Approved and emailed" : allowed ? "Looks matchable" : request.customerEmail ? "Under review" : "Needs a team review";
  const nextStepCopy =
    reviewState === "approved"
      ? "Your approved result has been emailed. If a code was issued, use it on the matched DollWow product at checkout."
      : allowed
        ? "This listing looks close enough to move forward. Review the DollWow match and continue when ready."
        : request.customerEmail
          ? "Your request is in the review queue. We’ll check the real total, any add-ons, and promo details before replying."
          : "This request needs a team review before we can promise a match. Leave an email next time so we can send the result back.";
  const heroTone =
    reviewState === "approved"
      ? "border-stock/30 bg-stock/10 text-stock"
      : allowed
        ? "border-gold-300/30 bg-gold-500/10 text-gold-200"
        : "border-warn/30 bg-warn/10 text-warn";
  const statusBadge =
    reviewState === "approved"
      ? { label: "Approved", detail: "Email sent", icon: MailCheck }
      : allowed
        ? { label: "Looks good", detail: "Ready for next step", icon: BadgeCheck }
        : { label: "Needs review", detail: "Team check", icon: AlertTriangle };
  const StatusIcon = statusBadge.icon;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="rounded-[20px] border border-gold-500/16 bg-ink-800/72 p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold-300">PRICE MATCH REQUEST</p>
        <h1 className="mt-3 text-3xl font-semibold text-ivory-50">Your review result</h1>
        <p className="mt-2 text-sm text-ivory-400">We check the live listing, the final quoted total, and any screenshot you shared.</p>

        <div className={`mt-6 flex items-center justify-between gap-4 rounded-[18px] border p-4 ${heroTone}`}>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-black/15 p-2">
              <StatusIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{statusBadge.label}</p>
              <p className="text-xs opacity-90">{statusBadge.detail}</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium text-ivory-50">{quotedPrice ? formatMoney(quotedPrice, currency) : "No price entered"}</p>
            <p className="text-xs opacity-90">{hasScreenshot ? "Screenshot included" : "No screenshot uploaded"}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Seller site" value={sourceDomain} />
          <SummaryCard label="Your quoted total" value={quotedPrice ? formatMoney(quotedPrice, currency) : "Not provided"} />
          <SummaryCard label="Price on product page" value={competitorPrice ? formatMoney(competitorPrice, currency) : "Could not confirm"} />
          <SummaryCard label="Availability" value={humanizeStock(request.parsed?.stockStatus)} />
          <SummaryCard label="Shipping" value={request.parsed?.deliveryClaim ?? "No clear shipping info found"} />
        </div>

        {promoSignals.length ? (
          <div className="mt-4 rounded-[18px] border border-gold-500/14 bg-ink-950/45 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gold-300">Promos we noticed</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {promoSignals.map((signal) => (
                <span key={signal} className="rounded-full border border-gold-500/14 bg-ink-900/70 px-3 py-1 text-xs text-ivory-200">
                  {signal}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Row label="Seller site" value={sourceDomain} />
          <Row label="Listing" value={request.parsed?.title ?? "We could not read the listing title."} />
          <Row label="Your quoted total" value={quotedPrice ? formatMoney(quotedPrice, currency) : "Not provided"} />
          <Row label="Price on product page" value={competitorPrice ? formatMoney(competitorPrice, currency) : "Could not confirm"} />
          <Row label="Screenshot" value={request.screenshotUrl ? "Included" : "Not included"} />
          <Row label="Checked at" value={request.parsed ? new Date(request.parsed.lastCheckedAt).toLocaleString() : "Needs review"} />
          <Row label="Review confidence" value={request.confidence} />
        </div>

        {request.screenshotUrl ? (
          <div className="mt-4 rounded-[18px] border border-gold-500/14 bg-ink-950/45 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gold-300">Your screenshot</p>
            <p className="mt-2 text-sm text-ivory-400">We use your screenshot to review the exact setup, add-ons, and final total instead of guessing from the base product page.</p>
            <a href={request.screenshotUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-gold-300 hover:text-gold-200">
              Open competitor cart screenshot
            </a>
          </div>
        ) : null}
      </section>

      <aside className="rounded-[20px] border border-gold-500/16 bg-gradient-to-br from-rose-950/25 via-ink-900/82 to-ink-950/95 p-6">
        <div className="flex items-center gap-3">
          {reviewState === "approved" ? <MailCheck className="h-6 w-6 text-stock" /> : allowed ? <BadgeCheck className="h-6 w-6 text-stock" /> : <AlertTriangle className="h-6 w-6 text-warn" />}
          <h2 className="text-2xl font-semibold text-ivory-50">{reviewState === "approved" ? "Approved" : allowed ? "Looks good so far" : "Team review in progress"}</h2>
        </div>

        <div className="mt-4 rounded-[18px] border border-gold-500/14 bg-ink-950/45 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-gold-300">What happens next</p>
          <h3 className="mt-2 text-lg font-semibold text-ivory-50">{nextStepTitle}</h3>
          <p className="mt-2 text-sm text-ivory-400">{nextStepCopy}</p>
          {request.customerEmail ? <p className="mt-2 text-xs text-ivory-500">Follow-up email: {request.customerEmail}</p> : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MiniTrustCard
            icon={ShieldCheck}
            title="30-day price protection"
            body="If you already bought the same setup from DollWow and find it cheaper within 30 days, we can review it and refund the difference when it qualifies."
          />
          <MiniTrustCard
            icon={Truck}
            title="Real total review"
            body="We look at add-ons, shipping, and promos too, so the review tracks the real delivered deal, not just the base page."
          />
        </div>

        {showSuggestedMatch && product ? (
          <div className="mt-5 rounded-[16px] border border-stock/20 bg-stock/10 p-4">
            <p className="text-sm text-stock">Closest DollWow match</p>
            <Link href={`/products/${product.handle}`} className="mt-1 block text-lg font-semibold text-gold-300">
              {displayTitle}
            </Link>
          </div>
        ) : null}

        {showRequestedProduct && product ? (
          <div className="mt-5 rounded-[16px] border border-gold-500/18 bg-ink-950/50 p-4">
            <p className="text-sm text-ivory-500">Your DollWow product</p>
            <Link href={`/products/${product.handle}`} className="mt-1 block text-lg font-semibold text-gold-300">
              {productPublicTitle(product)}
            </Link>
          </div>
        ) : null}

        {(allowed && request.priceMatch.discountPercent) || request.approvedDiscountCode ? (
          <div className="mt-5 rounded-[16px] border border-stock/25 bg-stock/10 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-stock">{request.approvedDiscountCode ? "Discount code ready" : "Approved match"}</p>
            <p className="mt-2 text-2xl font-semibold text-ivory-50">
              {request.approvedDiscountCode
                ? request.approvedDiscountCode
                : `Up to ${request.priceMatch.discountPercent}% off`}
            </p>
            <p className="mt-2 text-sm text-ivory-400">
              {request.approvedDiscountCode
                ? `Use this code at checkout on the matched DollWow product.${typeof request.approvedDiscountAmount === "number" ? ` Discount value: ${formatMoney(request.approvedDiscountAmount, request.approvedDiscountCurrency || currency)}.` : ""}`
                : request.priceMatch.expiresAt
                  ? `If you use this offer, the current review holds until ${new Date(request.priceMatch.expiresAt).toLocaleString()}.`
                  : "This request cleared the current review rules."}
            </p>
          </div>
        ) : null}

        <ul className="mt-5 space-y-2 text-sm text-ivory-400">
          {request.priceMatch.reasons.length ? (
            dedupeReasons(request.priceMatch.reasons).map((reason) => (
              <li key={reason} className="flex gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                {reason}
              </li>
            ))
          ) : (
            <li>This request passed the current review checks.</li>
          )}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          {showSuggestedMatch && product ? <GoldButton href={`/products/${product.handle}`}>Open DollWow match</GoldButton> : null}
          <GoldButton href="/support?source=compare" variant="secondary">Ask our team</GoldButton>
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-gold-500/14 bg-ink-950/45 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-gold-300">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-ivory-100">{value}</p>
    </div>
  );
}

function MiniTrustCard({
  icon: Icon,
  title,
  body
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[18px] border border-gold-500/14 bg-ink-950/45 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gold-300" />
        <p className="text-sm font-semibold text-ivory-100">{title}</p>
      </div>
      <p className="mt-2 text-sm text-ivory-400">{body}</p>
    </div>
  );
}

function humanizeStock(stockStatus?: string) {
  if (!stockStatus) return "Not clearly stated";
  return stockStatus
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function dedupeReasons(reasons: string[]) {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const reason of reasons) {
    const normalized = reason.replace(/\s+/g, " ").trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    cleaned.push(simplifyReason(reason));
  }

  return cleaned;
}

function simplifyReason(reason: string) {
  const normalized = reason.toLowerCase();
  if (normalized.includes("configured-cart screenshot")) return "You included a cart screenshot, so the team needs to review the final total.";
  if (normalized.includes("quoted price was") && normalized.includes("could not be verified")) return "We could not confirm that exact price from the page alone.";
  if (normalized.includes("page scrape found") && normalized.includes("does not closely match")) return "The price we found on the page does not line up with the total you entered.";
  if (normalized.includes("vendor is not approved")) return "This seller still needs a manual review.";
  if (normalized.includes("competitor total price is not clear")) return "The final competitor total is not fully clear yet.";
  if (normalized.includes("product is not available for checkout")) return "The matching DollWow product is not currently available for checkout.";
  if (normalized.includes("match needs a team check")) return "A team member needs to review this request.";
  return reason;
}
