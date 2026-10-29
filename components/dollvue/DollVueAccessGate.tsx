"use client";

import { useState, type FormEvent } from "react";
import { Mail, ShieldCheck } from "lucide-react";
import Image from 'next/image';
import styles from './DollVueAccessGate.module.css';

export function DollVueAccessGate({ handle, productName, headLabel, productImage, bodyLabel, specs = [] }: {
  handle: string; productName?: string; headLabel?: string; productImage?: string; bodyLabel?: string; specs?: string[];
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") || "");
    setState("sending");
    setError("");
    try {
      const response = await fetch("/dollvue/access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, handle })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true || payload?.status !== "sent") {
        setError(accessFailureMessage(payload));
        setState("idle");
        return;
      }
      setState("sent");
    } catch {
      setError("We could not connect to send your link. Check your connection and try again.");
      setState("idle");
    }
  }

  if (state === "sent") return (
    <section className="dollvue-access-card dollvue-access-sent" role="status">
      <Mail />
      <h1>Check your email</h1>
      <p>Open the private link we sent to verify your address and return to DollVue™. The link expires in 15 minutes.</p>
      <button type="button" onClick={() => setState("idle")}>Use another email or resend</button>
    </section>
  );

  return (
    <section className={`dollvue-access-card ${styles.card}`}>
      <ShieldCheck />
      <p className="alive-eyebrow"><span /> DollVue™</p>
      <h1>{productName ? `Preview ${productName}` : 'Verify once. Preview anywhere.'}</h1>
      {headLabel ? <p data-dollvue-head>Head {headLabel}</p> : null}
      <p>We’ll email you a private access link. Your five complimentary previews will stay connected across your phone and computer.</p>
      {productImage ? <div className={styles.product} data-dollvue-product>
        <div className={styles.photo}><Image src={productImage} alt={productName ? `${productName} reference photo` : 'Selected doll reference photo'} fill sizes="80px" /></div>
        <div className={styles.details}>
          <strong>{productName || 'Selected doll'}</strong>
          {headLabel || bodyLabel ? <p>{[headLabel && `Head ${headLabel}`, bodyLabel && `Body ${bodyLabel}`].filter(Boolean).join(' · ')}</p> : null}
          {specs.length ? <p>{specs.join(' · ')}</p> : null}
        </div>
      </div> : null}
      <form onSubmit={submit}>
        <label htmlFor="dollvue-access-email">Email address</label>
        <input id="dollvue-access-email" name="email" type="email" autoComplete="email" required maxLength={180} placeholder="you@example.com" aria-invalid={Boolean(error)} aria-describedby={error ? "dollvue-access-error" : undefined} />
        {error ? <p id="dollvue-access-error" role="alert">{error}</p> : null}
        <button disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Email my access link"}</button>
      </form>
      <small>No password needed. Your link expires in 15 minutes.</small>
    </section>
  );
}

export function accessFailureMessage(payload: { code?: string } | null) {
  switch (payload?.code) {
    case "rate_limited": return "Too many access-link requests. Please wait before trying again.";
    case "invalid_input": return "Enter a valid email address and try again.";
    case "product_unavailable":
    case "eligibility_unavailable": return "We could not check this doll right now. Please try again shortly.";
    default: return "We could not send your access link. Please try again shortly.";
  }
}
