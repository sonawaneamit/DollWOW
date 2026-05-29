import { Mail, MessageCircle } from "lucide-react";
import { GoldButton } from "./GoldButton";

export function HumanHelpCTA({ source = "site" }: { source?: string }) {
  return (
    <section className="rounded-[20px] border border-gold-500/18 bg-ink-800/78 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold-300">Specialist support</p>
          <h2 className="mt-2 text-2xl font-semibold text-ivory-50">Private help before you buy</h2>
          <p className="mt-2 max-w-2xl text-sm text-ivory-400">
            Ask about size, weight, delivery, options, or a listing you found somewhere else.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <GoldButton href={`/support?source=${source}`} variant="secondary">
            <MessageCircle className="h-4 w-4" /> Ask a question
          </GoldButton>
          <GoldButton href="mailto:support@dollwow.com">
            <Mail className="h-4 w-4" /> Email support
          </GoldButton>
        </div>
      </div>
    </section>
  );
}
