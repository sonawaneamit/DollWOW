"use client";

import Link from "next/link";
import { HALLOWEEN_2026 } from "@/lib/promotions/halloween2026";
import { HalloweenOfferButton } from "./HalloweenOfferButton";
import { useHalloweenWindow } from "./HalloweenWindow";

export function HalloweenAnnouncement({ preview }: { preview: boolean }) {
  const active = useHalloweenWindow(preview);
  return <div className={`announcement-bar sticky top-0 z-[81] h-[36px] flex items-center justify-center border-b px-2 ${active ? "bg-[#641e29] text-[#fff3df] border-[#8e3946]" : "bg-surface text-text border-border"}`}>
    <p className="text-[13px] text-center font-semibold" style={{ lineHeight: "16px" }}>
      <Link href="/promo" className="underline-offset-4 hover:underline">{active ? HALLOWEEN_2026.headline : "Explore our latest offers and factory bonuses"}</Link>
    </p>
    {active ? <HalloweenOfferButton /> : null}
  </div>;
}
