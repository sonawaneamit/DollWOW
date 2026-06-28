"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LinkIcon, Loader2, Upload } from "lucide-react";
import { GoldButton } from "./GoldButton";

export function CompareListingForm({
  compact = false,
  targetProductHandle,
  targetProductTitle
}: {
  compact?: boolean;
  targetProductHandle?: string;
  targetProductTitle?: string;
}) {
  const router = useRouter();
  const [inputUrl, setInputUrl] = useState("");
  const [quotedPrice, setQuotedPrice] = useState("");
  const [quotedCurrency, setQuotedCurrency] = useState("USD");
  const [requestedDiscountAmount, setRequestedDiscountAmount] = useState("");
  const [email, setEmail] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileSummary = useMemo(() => {
    if (!screenshotFile) return "";
    const sizeMb = (screenshotFile.size / (1024 * 1024)).toFixed(1);
    return `${screenshotFile.name} • ${sizeMb} MB`;
  }, [screenshotFile]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.set("inputUrl", inputUrl);
    if (quotedPrice) formData.set("quotedPrice", quotedPrice);
    if (quotedCurrency) formData.set("quotedCurrency", quotedCurrency);
    if (requestedDiscountAmount) formData.set("requestedDiscountAmount", requestedDiscountAmount);
    if (email) formData.set("email", email);
    if (targetProductHandle) formData.set("targetProductHandle", targetProductHandle);
    if (targetProductTitle) formData.set("targetProductTitle", targetProductTitle);
    if (screenshotFile) formData.set("screenshotFile", screenshotFile);

    const response = await fetch("/api/compare/submit", {
      method: "POST",
      body: formData
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "We could not check that listing.");
      return;
    }

    router.push(`/compare/${payload.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ivory-200">Product link</span>
        <div className="flex rounded-[14px] border border-gold-500/20 bg-ink-950/70 focus-within:border-gold-300">
          <span className="flex items-center px-3 text-gold-300">
            <LinkIcon className="h-4 w-4" />
          </span>
          <input
            required
            type="url"
            value={inputUrl}
            onChange={(event) => setInputUrl(event.target.value)}
            placeholder="https://example.com/product"
            className="min-w-0 flex-1 border-0 bg-transparent px-2 py-3 text-ivory-50 placeholder:text-ivory-600 focus:ring-0"
          />
        </div>
      </label>
      {targetProductHandle ? (
        <div className="rounded-[14px] border border-gold-500/16 bg-ink-950/45 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-gold-300">Matching against</p>
          <p className="mt-1 text-sm font-medium text-ivory-100">{targetProductTitle ?? targetProductHandle}</p>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ivory-200">Quoted price on that page</span>
          <input
            required
            inputMode="decimal"
            value={quotedPrice}
            onChange={(event) => setQuotedPrice(event.target.value)}
            placeholder="2000"
            className="w-full rounded-[14px] border-gold-500/20 bg-ink-950/70 px-4 py-3 text-ivory-50 placeholder:text-ivory-600 focus:border-gold-300 focus:ring-gold-300"
          />
          <p className="mt-2 text-xs text-ivory-500">Enter the final total you were shown, including selected options and add-ons.</p>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ivory-200">Currency</span>
          <select
            value={quotedCurrency}
            onChange={(event) => setQuotedCurrency(event.target.value)}
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
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ivory-200">Discount you want from us</span>
        <input
          inputMode="decimal"
          value={requestedDiscountAmount}
          onChange={(event) => setRequestedDiscountAmount(event.target.value)}
          placeholder="153"
          className="w-full rounded-[14px] border-gold-500/20 bg-ink-950/70 px-4 py-3 text-ivory-50 placeholder:text-ivory-600 focus:border-gold-300 focus:ring-gold-300"
        />
        <p className="mt-2 text-xs text-ivory-500">Optional. If you already did the math, tell us the discount amount you think would match the offer.</p>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ivory-200">Screenshot of the configured cart or summary</span>
        <div className="rounded-[14px] border border-dashed border-gold-500/25 bg-ink-950/55 p-4">
          <div className="flex items-center gap-2 text-sm text-ivory-300">
            <Upload className="h-4 w-4 text-gold-300" />
            Show the chosen options, extras, and final price.
          </div>
          <input
            required
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setScreenshotFile(event.target.files?.[0] || null)}
            className="mt-3 block w-full text-sm text-ivory-200 file:mr-4 file:rounded-full file:border-0 file:bg-gold-500/15 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gold-100 hover:file:bg-gold-500/25"
          />
          <p className="mt-2 text-xs text-ivory-500">JPG, PNG, or WebP. This lets the team verify the configured quote instead of guessing from the product page.</p>
          {fileSummary ? <p className="mt-2 text-sm text-ivory-300">{fileSummary}</p> : null}
        </div>
      </label>
      {!compact && (
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ivory-200">Email for follow-up</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-[14px] border-gold-500/20 bg-ink-950/70 px-4 py-3 text-ivory-50 placeholder:text-ivory-600 focus:border-gold-300 focus:ring-gold-300"
          />
          <p className="mt-2 text-xs text-ivory-500">We use this to send the reviewed result and any approved price-match code.</p>
        </label>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="grid gap-2 text-xs text-ivory-500 sm:grid-cols-3">
        <p className="rounded-[14px] border border-gold-500/14 bg-ink-950/40 px-3 py-2">We compare the real final deal, including add-ons, shipping, and the base price on the page.</p>
        <p className="rounded-[14px] border border-gold-500/14 bg-ink-950/40 px-3 py-2">Your screenshot shows the chosen options, extras, and total we need to match.</p>
        <p className="rounded-[14px] border border-gold-500/14 bg-ink-950/40 px-3 py-2">If anything is unclear, the request goes to a team review instead of a guess.</p>
      </div>
      <GoldButton className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Send for review
      </GoldButton>
      <p className="text-xs text-ivory-600">Prices and promos change. We confirm the real final deal before we approve anything.</p>
    </form>
  );
}
