"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { GoldButton } from "./GoldButton";

export function SupportLeadForm({ defaultSource = "support" }: { defaultSource?: string }) {
  const searchParams = useSearchParams();
  const source = searchParams.get("source") ?? defaultSource;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    if (question.trim().length < 8) {
      setStatus("error");
      setMessage("Please add a little more detail so our team can help.");
      return;
    }

    let response: Response;
    try {
      response = await fetch("/api/support/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceFlow: source,
          name: name || undefined,
          email,
          question,
          website,
          startedAt: startedAt.current
        })
      });
    } catch {
      setStatus("error");
      setMessage("We could not send your request. Please try again or email hello@dollwow.com.");
      return;
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error ?? "We could not send your request.");
      return;
    }

    setStatus("success");
    setMessage(
      payload.emailDelivered === false
        ? "Your message is saved. Email delivery is taking longer than expected, so you can also reach us directly at hello@dollwow.com."
        : copy.success
    );
    setName("");
    setEmail("");
    setQuestion("");
    setWebsite("");
    startedAt.current = Date.now();
  }

  const isBrandPartnership = source === "brand-partnership" || source === "supplier";
  const copy = isBrandPartnership
    ? {
        kicker: "Brand contact",
        title: "Talk with DollWow",
        body: "Share brand authorization, MAP requirements, catalog files, market rules, or the right contact for partnership discussions.",
        nameLabel: "Name, optional",
        emailLabel: "Work email",
        questionLabel: "Message",
        placeholder: "Tell us about the brand, product line, MAP policy, or partnership question...",
        success: "Thanks. We saved your brand partnership request and will follow up privately.",
        button: "Send message"
      }
    : {
        kicker: "Private request",
        title: "How can we help?",
        body: "Send us your product question, comparison, or customization request. A DollWow specialist will reply privately.",
        nameLabel: "Name, optional",
        emailLabel: "Email",
        questionLabel: "Question",
        placeholder: "Tell us which doll you are considering and what you would like to know...",
        success: "Your message is on its way. We will reply by email as soon as possible.",
        button: "Send message"
      };

  return (
    <form onSubmit={submit} className="rounded-lg bg-surface p-6 text-text shadow-card sm:p-8">
      <input
        name="website"
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <p className="text-[15px] font-semibold text-text-dim">{copy.kicker}</p>
      <h2 className="mt-2 text-3xl font-semibold text-text">{copy.title}</h2>
      <p className="mt-3 text-base leading-7 text-text-dim">{copy.body}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-[15px] font-semibold text-text-dim">{copy.nameLabel}</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-14 w-full rounded-sm border border-border bg-surface px-4 text-base text-text placeholder:text-text-faint focus:border-accent focus:ring-accent"
            placeholder="Your name"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-[15px] font-semibold text-text-dim">{copy.emailLabel}</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-14 w-full rounded-sm border border-border bg-surface px-4 text-base text-text placeholder:text-text-faint focus:border-accent focus:ring-accent"
            placeholder="you@example.com"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-[15px] font-semibold text-text-dim">{copy.questionLabel}</span>
        <textarea
          required
          minLength={8}
          rows={5}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="w-full rounded-sm border border-border bg-surface px-4 py-3 text-base text-text placeholder:text-text-faint focus:border-accent focus:ring-accent"
          placeholder={copy.placeholder}
        />
      </label>

      {message && (
        <p className={`mt-4 text-sm ${status === "success" ? "text-stock" : "text-danger"}`}>{message}</p>
      )}

      <GoldButton className="mt-5 w-full sm:w-auto" disabled={status === "loading"}>
        {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {copy.button}
      </GoldButton>
    </form>
  );
}
