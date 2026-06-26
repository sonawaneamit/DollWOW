import { Suspense } from "react";
import { Mail, Phone } from "lucide-react";
import { GoldButton } from "@/components/GoldButton";
import { InfoVisualPanel } from "@/components/InfoVisualPanel";
import { SupportLeadForm } from "@/components/SupportLeadForm";
import { TrustLogoStrip } from "@/components/TrustLogoStrip";

export const metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Support</p>
          <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Private help from our team</h1>
          <p className="mt-3 text-ivory-400">Ask about delivery, size, weight, options, price match, or a custom order before checkout.</p>
          <div className="mt-6">
            <TrustLogoStrip compact />
          </div>
        </div>
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
          <h2 className="mt-4 text-xl font-semibold text-ivory-50">Call request</h2>
          <p className="mt-2 text-sm text-ivory-400">Phone appointments can be added here once the launch number is ready.</p>
          <div className="mt-4">
            <GoldButton href="/compare" variant="secondary">Compare first</GoldButton>
          </div>
        </div>
      </div>
    </section>
  );
}
