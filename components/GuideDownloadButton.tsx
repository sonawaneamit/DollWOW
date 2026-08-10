"use client";

import { Download } from "lucide-react";
import { analyticsEvents, trackEvent } from "@/lib/analytics/client";

export function GuideDownloadButton() {
  return (
    <a
      href="/guides/dollwow-complete-sex-doll-guide-2026.pdf"
      download
      onClick={() => trackEvent(analyticsEvents.downloadGuide, { guide_name: "complete_sex_doll_guide_2026" })}
      className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-gold-300/55 bg-gold-300 px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
    >
      <Download aria-hidden="true" className="h-4 w-4" />
      Download the PDF guide
    </a>
  );
}
