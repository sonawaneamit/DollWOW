"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, BadgeCheck, MailCheck, SearchX, TimerReset } from "lucide-react";
import { GoldButton } from "./GoldButton";
import { formatMoney } from "@/lib/utils/currency";
import type { ComparisonRequest } from "@/types/comparison";

export function AdminPriceMatchQueue({ requests }: { requests: ComparisonRequest[] }) {
  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <AdminPriceMatchCard key={request.id} request={request} />
      ))}
    </div>
  );
}

function AdminPriceMatchCard({ request }: { request: ComparisonRequest }) {
  const [currentRequest, setCurrentRequest] = useState(request);
  const [adminStatus, setAdminStatus] = useState<NonNullable<ComparisonRequest["adminStatus"]>>(request.adminStatus ?? "new");
  const [adminNotes, setAdminNotes] = useState(request.adminNotes ?? "");
  const [approvedDiscountAmount, setApprovedDiscountAmount] = useState(
    typeof request.approvedDiscountAmount === "number"
      ? String(request.approvedDiscountAmount)
      : typeof request.requestedDiscountAmount === "number"
        ? String(request.requestedDiscountAmount)
        : ""
  );
  const [approvedDiscountCurrency, setApprovedDiscountCurrency] = useState(
    request.approvedDiscountCurrency || request.quotedCurrency || request.parsed?.currency || "USD"
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  async function save(sendReply = false) {
    setSaving(true);
    setSaved("");
    setError("");
    const response = await fetch("/api/admin/price-match/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: request.id,
        adminStatus,
        adminNotes,
        reviewedBy: "admin",
        approvedDiscountAmount: approvedDiscountAmount ? Number(approvedDiscountAmount) : undefined,
        approvedDiscountCurrency,
        sendReply
      })
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not save.");
      return;
    }
    if (payload.request) {
      setCurrentRequest(payload.request as ComparisonRequest);
      setAdminStatus((payload.request.adminStatus as NonNullable<ComparisonRequest["adminStatus"]>) ?? adminStatus);
      setAdminNotes(payload.request.adminNotes ?? "");
      setApprovedDiscountAmount(
        typeof payload.request.approvedDiscountAmount === "number" ? String(payload.request.approvedDiscountAmount) : approvedDiscountAmount
      );
      setApprovedDiscountCurrency(payload.request.approvedDiscountCurrency ?? approvedDiscountCurrency);
    }
    setSaved(sendReply ? "Saved and sent" : "Saved");
  }

  const quotedCurrency = currentRequest.quotedCurrency || currentRequest.parsed?.currency || "USD";
  const detectedPrice = currentRequest.parsed?.price ?? currentRequest.parsed?.salePrice;
  const statusLabel = humanizeStatus(currentRequest.adminStatus ?? "new");
  const canSendApproval = Boolean(currentRequest.customerEmail) && adminStatus === "approved";
  const canSendDecline = Boolean(currentRequest.customerEmail) && adminStatus === "declined";
  const replyState =
    currentRequest.customerReplyKind === "approval"
      ? "Approval email already sent."
      : currentRequest.customerReplyKind === "decline"
        ? "Decline email already sent."
        : adminStatus === "approved"
          ? "This request is marked approved, but no customer email has been sent yet."
          : adminStatus === "declined"
            ? "This request is marked declined, but no customer email has been sent yet."
            : "";
  const tone = getStatusTone(currentRequest.adminStatus ?? "new");
  const ToneIcon = tone.icon;

  return (
    <article className="rounded-[20px] border border-gold-500/16 bg-ink-800/72 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${tone.className}`}>
            <ToneIcon className="h-3.5 w-3.5" />
            {statusLabel}
          </div>
          <h2 className="text-xl font-semibold text-ivory-50">{currentRequest.targetProductTitle || currentRequest.parsed?.title || "Price match request"}</h2>
          <p className="text-sm text-ivory-400">{currentRequest.customerEmail || "No customer email"} • {new Date(currentRequest.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <GoldButton href={`/compare/${currentRequest.id}`} variant="secondary">Open result</GoldButton>
          <GoldButton href={currentRequest.inputUrl} variant="secondary">Open competitor URL</GoldButton>
          {currentRequest.screenshotUrl ? <GoldButton href={currentRequest.screenshotUrl} variant="secondary">Open screenshot</GoldButton> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4 rounded-[16px] bg-ink-950/45 p-4 text-sm text-ivory-300">
          <div className="grid gap-3 md:grid-cols-2">
            <AdminMetric label="Quoted total" value={currentRequest.quotedPrice ? formatMoney(currentRequest.quotedPrice, quotedCurrency) : "n/a"} />
            <AdminMetric
              label="Requested discount"
              value={typeof currentRequest.requestedDiscountAmount === "number" ? formatMoney(currentRequest.requestedDiscountAmount, quotedCurrency) : "n/a"}
            />
            <AdminMetric
              label="Price found on page"
              value={typeof detectedPrice === "number" ? formatMoney(detectedPrice, currentRequest.parsed?.currency || quotedCurrency) : "n/a"}
            />
            <AdminMetric label="Seller site" value={currentRequest.parsed?.sourceDomain ?? "n/a"} />
          </div>

          <div className="rounded-[14px] border border-gold-500/12 bg-ink-900/50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gold-300">What needs attention</p>
            <ul className="mt-3 space-y-2 text-sm text-ivory-300">
              {currentRequest.priceMatch.reasons.length ? currentRequest.priceMatch.reasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                  <span>{simplifyAdminReason(reason)}</span>
                </li>
              )) : <li className="text-ivory-400">No blockers recorded.</li>}
            </ul>
          </div>

          {currentRequest.approvedDiscountCode ? (
            <div className="rounded-[14px] border border-stock/20 bg-stock/10 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-stock">Issued code</p>
              <p className="mt-2 text-lg font-semibold text-ivory-50">{currentRequest.approvedDiscountCode}</p>
            </div>
          ) : null}
          {currentRequest.customerReplySentAt ? <p><span className="text-ivory-500">Reply sent:</span> {new Date(currentRequest.customerReplySentAt).toLocaleString()}</p> : null}
          <Link href={currentRequest.inputUrl} className="text-gold-300 underline-offset-4 hover:underline">
            {currentRequest.inputUrl}
          </Link>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ivory-200">Status</span>
            <select
              value={adminStatus}
              onChange={(event) => setAdminStatus(event.target.value as NonNullable<ComparisonRequest["adminStatus"]>)}
              className="w-full rounded-[14px] border-gold-500/20 bg-ink-950/70 px-4 py-3 text-ivory-50 focus:border-gold-300 focus:ring-gold-300"
            >
              <option value="new">New</option>
              <option value="in_review">In review</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="sent_code">Code sent</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ivory-200">Notes</span>
            <textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              rows={6}
              className="w-full rounded-[14px] border-gold-500/20 bg-ink-950/70 px-4 py-3 text-ivory-50 focus:border-gold-300 focus:ring-gold-300"
            />
          </label>
          {adminStatus === "approved" ? (
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px]">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ivory-200">Discount amount</span>
                <input
                  inputMode="decimal"
                  value={approvedDiscountAmount}
                  onChange={(event) => setApprovedDiscountAmount(event.target.value)}
                  placeholder="Defaults to requested discount if customer gave one"
                  className="w-full rounded-[14px] border-gold-500/20 bg-ink-950/70 px-4 py-3 text-ivory-50 focus:border-gold-300 focus:ring-gold-300"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ivory-200">Currency</span>
                <select
                  value={approvedDiscountCurrency}
                  onChange={(event) => setApprovedDiscountCurrency(event.target.value)}
                  className="w-full rounded-[14px] border-gold-500/20 bg-ink-950/70 px-4 py-3 text-ivory-50 focus:border-gold-300 focus:ring-gold-300"
                >
                  {["USD", "CAD", "GBP", "EUR"].map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {saved ? <p className="rounded-[12px] border border-stock/20 bg-stock/10 px-3 py-2 text-sm text-stock">{saved}</p> : null}
          {replyState ? <p className="rounded-[12px] border border-gold-500/14 bg-ink-950/40 px-3 py-2 text-sm text-ivory-400">{replyState}</p> : null}
          <div className="flex flex-wrap gap-2">
            <GoldButton onClick={() => save(false)} disabled={saving}>{saving ? "Saving..." : "Save notes"}</GoldButton>
            {canSendApproval ? (
              <GoldButton onClick={() => save(true)} disabled={saving} variant="secondary">
                Approve + email code
              </GoldButton>
            ) : null}
            {canSendDecline ? (
              <GoldButton onClick={() => save(true)} disabled={saving} variant="secondary">
                Decline + email reply
              </GoldButton>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function AdminMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-gold-500/12 bg-ink-900/45 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-gold-300">{label}</p>
      <p className="mt-2 text-base font-medium text-ivory-100">{value}</p>
    </div>
  );
}

function humanizeStatus(status: NonNullable<ComparisonRequest["adminStatus"]>) {
  switch (status) {
    case "in_review":
      return "In review";
    case "approved":
      return "Approved";
    case "declined":
      return "Declined";
    case "sent_code":
      return "Code sent";
    default:
      return "New";
  }
}

function getStatusTone(status: NonNullable<ComparisonRequest["adminStatus"]>) {
  switch (status) {
    case "sent_code":
      return { className: "border-stock/30 bg-stock/10 text-stock", icon: MailCheck };
    case "approved":
      return { className: "border-sky-400/30 bg-sky-400/10 text-sky-200", icon: BadgeCheck };
    case "declined":
      return { className: "border-danger/30 bg-danger/10 text-danger", icon: SearchX };
    case "in_review":
      return { className: "border-gold-400/30 bg-gold-500/10 text-gold-200", icon: TimerReset };
    default:
      return { className: "border-ivory-300/20 bg-ivory-50/5 text-ivory-200", icon: AlertTriangle };
  }
}

function simplifyAdminReason(reason: string) {
  const normalized = reason.toLowerCase();
  if (normalized.includes("configured-cart screenshot")) return "Customer included a screenshot, so this should be reviewed against the final configured total.";
  if (normalized.includes("quoted price was") && normalized.includes("could not be verified")) return "The entered total could not be confirmed directly from the product page.";
  if (normalized.includes("page scrape found") && normalized.includes("does not closely match")) return "The page price and the customer total do not line up yet.";
  if (normalized.includes("promo or freebie")) return "Promo codes, gifts, or bundled extras are affecting the final price.";
  if (normalized.includes("vendor is not approved")) return "This seller is not yet on the auto-approve vendor list.";
  if (normalized.includes("product is not available for checkout")) return "The linked DollWow product is not currently checkout-ready.";
  return reason;
}
