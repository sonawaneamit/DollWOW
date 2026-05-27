"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { GoldButton } from "./GoldButton";

export function SupportLeadForm({ defaultSource = "support" }: { defaultSource?: string }) {
  const searchParams = useSearchParams();
  const source = searchParams.get("source") ?? defaultSource;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/support/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFlow: source,
        name: name || undefined,
        email,
        question
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error ?? "We could not send your request.");
      return;
    }

    setStatus("success");
    setMessage("Thanks. We saved your request and will follow up privately.");
    setName("");
    setEmail("");
    setQuestion("");
  }

  return (
    <form onSubmit={submit} className="rounded-[24px] border border-gold-500/16 bg-ink-800/72 p-6 sm:p-8">
      <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Private request</p>
      <h2 className="mt-2 text-3xl font-semibold text-ivory-50">Ask before you buy</h2>
      <p className="mt-3 text-sm text-ivory-400">
        Tell us what you are comparing, customizing, or unsure about. Keep it practical and we will help.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ivory-200">Name, optional</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-[14px] border-gold-500/20 bg-ink-950/70 px-4 py-3 text-ivory-50 placeholder:text-ivory-600 focus:border-gold-300 focus:ring-gold-300"
            placeholder="Your name"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ivory-200">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-[14px] border-gold-500/20 bg-ink-950/70 px-4 py-3 text-ivory-50 placeholder:text-ivory-600 focus:border-gold-300 focus:ring-gold-300"
            placeholder="you@example.com"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-medium text-ivory-200">Question</span>
        <textarea
          required
          rows={5}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="w-full rounded-[14px] border-gold-500/20 bg-ink-950/70 px-4 py-3 text-ivory-50 placeholder:text-ivory-600 focus:border-gold-300 focus:ring-gold-300"
          placeholder="I found this listing and want to compare delivery, options, or price..."
        />
      </label>

      {message && (
        <p className={`mt-4 text-sm ${status === "success" ? "text-stock" : "text-danger"}`}>{message}</p>
      )}

      <GoldButton className="mt-5 w-full sm:w-auto" disabled={status === "loading"}>
        {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Send request
      </GoldButton>
    </form>
  );
}
