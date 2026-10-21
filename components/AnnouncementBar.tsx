import Link from "next/link";
import { HALLOWEEN_2026, isHalloweenPreview } from "@/lib/promotions/halloween2026";

export function AnnouncementBar() {
  const halloween = isHalloweenPreview();
  return (
    <div className="announcement-bar sticky top-0 z-[81] h-[36px] flex items-center justify-center bg-surface text-text border-b border-border px-2">
      <p className="text-[13px] text-text-dim text-center" style={{ lineHeight: "16px" }}>
        {halloween ? <Link href="/promo" className="underline-offset-4 hover:underline">{HALLOWEEN_2026.headline}</Link> : "10% off Eligible Dolls! Hurry Offer Ends Soon!"}
      </p>
    </div>
  );
}
