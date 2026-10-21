"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { HALLOWEEN_2026 } from "@/lib/promotions/halloween2026";

export function HalloweenCode() {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(HALLOWEEN_2026.code);
      setCopied(true); setFailed(false);
    } catch { setFailed(true); }
  }
  return <div>
    <div className="flex flex-wrap items-center gap-3">
      <code className="rounded-md border border-border bg-surface-tint px-4 py-3 text-lg font-semibold tracking-normal text-text select-all">{HALLOWEEN_2026.code}</code>
      <button type="button" onClick={copy} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-text hover:bg-surface-tint">
        {copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}{copied ? "Copied" : "Copy code"}
      </button>
    </div>
    <p role="status" className="mt-2 text-sm text-text-dim">{failed ? "Select the code above to copy it." : copied ? "Code copied." : "Use at checkout."}</p>
  </div>;
}
