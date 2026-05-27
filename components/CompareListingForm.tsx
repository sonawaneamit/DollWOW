"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LinkIcon, Loader2 } from "lucide-react";
import { GoldButton } from "./GoldButton";

export function CompareListingForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [inputUrl, setInputUrl] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/compare/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ inputUrl, email: email || undefined })
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
      {!compact && (
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ivory-200">Email for follow-up, optional</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-[14px] border-gold-500/20 bg-ink-950/70 px-4 py-3 text-ivory-50 placeholder:text-ivory-600 focus:border-gold-300 focus:ring-gold-300"
          />
        </label>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <GoldButton className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Compare now
      </GoldButton>
      <p className="text-xs text-ivory-600">Prices may change. We verify before checkout.</p>
    </form>
  );
}
