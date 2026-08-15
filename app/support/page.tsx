import { Suspense } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { GoldButton } from "@/components/GoldButton";
import { dollWowContactChannels } from "@/components/ContactChannels";
import { InfoVisualPanel } from "@/components/InfoVisualPanel";
import { SupportLeadForm } from "@/components/SupportLeadForm";
import { TrustLogoStrip } from "@/components/TrustLogoStrip";

export const metadata = {
  title: "Sex Doll Buying Help",
  description: "Get private, personal help with sex doll sizing, materials, customization, delivery, price matching, and product comparisons from DollWow."
};

export default function SupportPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm text-accent">Support</p>
        <h1 className="mt-2 text-4xl font-semibold text-text">Private help from our team</h1>
        <p className="mt-3 text-text-dim">Ask about delivery, size, weight, options, price match, or a custom order before checkout.</p>
        <div className="mt-6">
          <TrustLogoStrip compact eager />
        </div>
      </div>
      <div className="mt-8">
        <InfoVisualPanel
          seed="support"
          eyebrow="Before you buy"
          title="Send the product and your question."
          copy="Our team can check sizing, timing, options, or whether two listings are really the same doll."
          cta={{ label: "Browse catalog", href: "/shop/sex-dolls" }}
          compact
        />
      </div>
      <div className="mt-8">
        <Suspense fallback={<div className="rounded-[24px] border border-gold-500/16 bg-ink-800/72 p-8 text-ivory-400">Loading support form...</div>}>
          <SupportLeadForm />
        </Suspense>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="border border-border bg-surface p-6">
          <Mail className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-xl font-semibold text-text">Email</h2>
          <p className="mt-2 text-sm text-text-dim">Product questions, quotes, and private recommendations.</p>
          <div className="mt-4">
            <GoldButton href={dollWowContactChannels.email.href}>{dollWowContactChannels.email.label}</GoldButton>
          </div>
        </div>
        <div className="border border-border bg-surface p-6">
          <Phone className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-xl font-semibold text-text">Call or SMS</h2>
          <p className="mt-2 text-sm text-text-dim">Speak with our team or send a discreet text message.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <GoldButton href={dollWowContactChannels.phone.href}>Call {dollWowContactChannels.phone.label}</GoldButton>
            <GoldButton href={dollWowContactChannels.phone.smsHref} variant="secondary">Send SMS</GoldButton>
          </div>
        </div>
        <div className="border border-border bg-surface p-6">
          <MessageCircle className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-xl font-semibold text-text">WhatsApp</h2>
          <p className="mt-2 text-sm text-text-dim">Message us privately from your phone or computer.</p>
          <div className="mt-4">
            <GoldButton href={dollWowContactChannels.whatsapp.href}>{dollWowContactChannels.whatsapp.label}</GoldButton>
          </div>
        </div>
      </div>
    </section>
  );
}
