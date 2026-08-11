"use client";
import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";

export function PassportAccessForm({ next = "/account/my-dolls" }: { next?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setState("sending");
    await fetch("/api/account/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, next }) });
    setState("sent");
  }
  if (state === "sent") return <div className="passport-access-confirm"><Mail /><strong>Check your email</strong><p>If that address has a Doll Passport, a private 15-minute access link is on its way.</p></div>;
  return <form onSubmit={submit} className="passport-access-form"><label htmlFor="passport-email">Email used at checkout</label><input id="passport-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" /><button disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Email my secure link"}</button><p>We never reveal whether an address has an order. Product details stay out of the email.</p></form>;
}
