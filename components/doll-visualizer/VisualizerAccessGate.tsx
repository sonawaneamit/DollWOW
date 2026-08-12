"use client";

import { useState, type FormEvent } from "react";
import { Mail, ShieldCheck } from "lucide-react";

export function VisualizerAccessGate({ handle }: { handle: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") || "");
    setState("sending");
    await fetch("/ops/doll-visualizer/access", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, handle })
    });
    setState("sent");
  }

  if (state === "sent") return (
    <section className="visualizer-access-card visualizer-access-sent" role="status">
      <Mail />
      <h1>Check your email</h1>
      <p>Open the private link we sent to verify your address and return to Doll Visualizer™. The link expires in 15 minutes.</p>
    </section>
  );

  return (
    <section className="visualizer-access-card">
      <ShieldCheck />
      <p className="alive-eyebrow"><span /> Doll Visualizer™</p>
      <h1>Verify once. Preview anywhere.</h1>
      <p>We’ll email you a private access link. Your five complimentary previews will stay connected across your phone and computer.</p>
      <form onSubmit={submit}>
        <label htmlFor="visualizer-access-email">Email address</label>
        <input id="visualizer-access-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        <button disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Email my access link"}</button>
      </form>
      <small>No password needed. Your link expires in 15 minutes.</small>
    </section>
  );
}
