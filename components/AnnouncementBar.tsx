import Link from "next/link";
import { HALLOWEEN_2026, isHalloweenPreview } from "@/lib/promotions/halloween2026";
import { HalloweenOfferButton } from "@/components/promotions/HalloweenOfferButton";

export function AnnouncementBar() {
  const halloween = isHalloweenPreview();
  return (
    <div className={`announcement-bar sticky top-0 z-[81] h-[36px] flex items-center justify-center border-b px-2 ${halloween ? "bg-[#641e29] text-[#fff3df] border-[#8e3946]" : "bg-surface text-text border-border"}`}>
      <p className={`text-[13px] text-center ${halloween ? "font-semibold" : "text-text-dim"}`} style={{ lineHeight: "16px" }}>
        {halloween ? <Link href="/promo" className="underline-offset-4 hover:underline">{HALLOWEEN_2026.headline}</Link> : "10% off Eligible Dolls! Hurry Offer Ends Soon!"}
      </p>
      {halloween ? <HalloweenOfferButton /> : null}
    </div>
  );
}
