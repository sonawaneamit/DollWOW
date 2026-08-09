import { Suspense } from "react";
import { Mail, Phone } from "lucide-react";
import { GoldButton } from "@/components/GoldButton";
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
          cta={{ label: "Browse catalog", href: "/shop" }}
          compact
        />
      </div>
      <div className="mt-8">
        <Suspense fallback={<div className="rounded-[24px] border border-gold-500/16 bg-ink-800/72 p-8 text-ivory-400">Loading support form...</div>}>
          <SupportLeadForm />
        </Suspense>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[20px] border border-gold-500/16 bg-ink-800/72 p-6">
          <Mail className="h-6 w-6 text-gold-400" />
          <h2 className="mt-4 text-xl font-semibold text-ivory-50">Email</h2>
          <p className="mt-2 text-sm text-ivory-400">Use this for product questions, quotes, and private recommendations.</p>
          <div className="mt-4">
            <GoldButton href="mailto:hello@dollwow.com">hello@dollwow.com</GoldButton>
          </div>
        </div>
        <div className="rounded-[20px] border border-gold-500/16 bg-ink-800/72 p-6">
          <Phone className="h-6 w-6 text-gold-400" />
          <h2 className="mt-4 text-xl font-semibold text-ivory-50">Prefer a call?</h2>
          <p className="mt-2 text-sm text-ivory-400">Send us a note with your question and the best way to reach you. We can arrange a private follow-up when needed.</p>
          <div className="mt-4">
            <GoldButton href="mailto:hello@dollwow.com?subject=DollWow%20call%20request" variant="secondary">Email to schedule</GoldButton>
          </div>
        </div>
      </div>
    </section>
  );
}
