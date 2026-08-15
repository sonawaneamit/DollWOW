import { Mail, MessageCircle, Phone } from "lucide-react";

export const dollWowContactChannels = {
  email: {
    label: "hello@dollwow.com",
    href: "mailto:hello@dollwow.com"
  },
  phone: {
    label: "+1-855-922-DOLL (3655)",
    href: "tel:+18559223655",
    smsHref: "sms:+18559223655"
  },
  whatsapp: {
    label: "+1-646-496-8408",
    href: "https://wa.me/16464968408"
  }
} as const;

export function HomeContactStrip() {
  return (
    <aside aria-label="Contact DollWow" className="border-b border-border bg-surface-tint text-text-dim">
      <div className="mx-auto flex min-h-9 max-w-[1440px] items-center gap-x-5 overflow-x-auto px-4 py-1 text-[12px] font-medium sm:justify-center sm:text-[13px] lg:px-8">
        <a className="inline-flex shrink-0 items-center gap-1.5 transition-colors hover:text-accent" href={dollWowContactChannels.email.href}>
          <Mail aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
          {dollWowContactChannels.email.label}
        </a>
        <span aria-hidden="true" className="h-3 w-px shrink-0 bg-border" />
        <a className="inline-flex shrink-0 items-center gap-1.5 transition-colors hover:text-accent" href={dollWowContactChannels.phone.href}>
          <Phone aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
          Call {dollWowContactChannels.phone.label}
        </a>
        <a className="shrink-0 font-semibold text-accent hover:text-accent-hover" href={dollWowContactChannels.phone.smsHref}>
          SMS
        </a>
        <span aria-hidden="true" className="h-3 w-px shrink-0 bg-border" />
        <a
          className="inline-flex shrink-0 items-center gap-1.5 transition-colors hover:text-accent"
          href={dollWowContactChannels.whatsapp.href}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
          WhatsApp {dollWowContactChannels.whatsapp.label}
        </a>
      </div>
    </aside>
  );
}

export function FooterContactLinks() {
  return (
    <div className="mt-6 grid gap-1 text-[14px] text-text-dim">
      <a className="flex min-h-9 items-center gap-2 transition-colors hover:text-accent" href={dollWowContactChannels.email.href}>
        <Mail aria-hidden="true" className="h-4 w-4 text-accent" />
        {dollWowContactChannels.email.label}
      </a>
      <div className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-1">
        <a className="flex items-center gap-2 transition-colors hover:text-accent" href={dollWowContactChannels.phone.href}>
          <Phone aria-hidden="true" className="h-4 w-4 text-accent" />
          {dollWowContactChannels.phone.label}
        </a>
        <a className="font-semibold text-accent hover:text-accent-hover" href={dollWowContactChannels.phone.smsHref}>
          SMS
        </a>
      </div>
      <a
        className="flex min-h-9 items-center gap-2 transition-colors hover:text-accent"
        href={dollWowContactChannels.whatsapp.href}
        target="_blank"
        rel="noreferrer"
      >
        <MessageCircle aria-hidden="true" className="h-4 w-4 text-accent" />
        WhatsApp {dollWowContactChannels.whatsapp.label}
      </a>
    </div>
  );
}
