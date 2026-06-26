"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { clsx } from "clsx";
import { GoldButton } from "./GoldButton";

const faqs = [
  {
    question: "Will the packaging be discreet?",
    answer: "Yes. Orders ship in plain outer packaging with no product wording on the box. We also keep confirmation copy plain and practical."
  },
  {
    question: "What will appear on my billing statement?",
    answer: "Checkout runs through Shopify with discreet wording. We keep billing and order messages plain before purchase."
  },
  {
    question: "What happens after I order a custom build?",
    answer: "Our team reviews the selected options, checks compatibility, confirms timing, and follows up if anything needs clarification before production begins."
  },
  {
    question: "Do I approve factory photos before shipment?",
    answer: "For custom builds, we send detailed factory photos and videos before shipment. If something needs a second pass, we request revisions before the order is approved to ship."
  },
  {
    question: "What if the package arrives damaged?",
    answer: "Contact us quickly with photos of the packaging and item condition. We will review the issue and help with repair, replacement, or the right next step."
  },
  {
    question: "Can I ask questions before buying?",
    answer: "Absolutely. Send the product link, budget, timing needs, or competitor listing, and our team can help you choose without pressure."
  }
];

export function ProductFAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="rounded-[28px] border border-gold-500/18 bg-ink-800/68 p-5 shadow-soft sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold-300">Private Questions</p>
          <h2 className="mt-2 text-2xl font-semibold text-ivory-50">Before you ask</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ivory-400">The things people usually want to know before placing a private, high-consideration order.</p>
        </div>
        <GoldButton href="/support" variant="secondary" className="shrink-0">
          <MessageCircle className="h-4 w-4" />
          Ask our team
        </GoldButton>
      </div>
      <div className="mt-6 divide-y divide-gold-500/12 overflow-hidden rounded-[20px] border border-gold-500/14 bg-ink-950/45">
        {faqs.map((item, index) => {
          const isOpen = index === openIndex;
          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-ivory-50 transition hover:bg-ivory-50/[0.035] sm:px-5"
              >
                {item.question}
                <ChevronDown className={clsx("h-4 w-4 shrink-0 text-gold-300 transition", isOpen && "rotate-180")} />
              </button>
              <div className={clsx("grid transition-all duration-300", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <p className="px-4 pb-5 text-sm leading-6 text-ivory-400 sm:px-5">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
