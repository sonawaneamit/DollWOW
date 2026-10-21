import Link from "next/link";
import { isHalloweenPreview, isHalloweenVisible } from "@/lib/promotions/halloween2026";
import { HalloweenAnnouncement } from "@/components/promotions/HalloweenAnnouncement";

export function AnnouncementBar() {
  const halloween = isHalloweenVisible();
  if (halloween) return <HalloweenAnnouncement preview={isHalloweenPreview()} />;
  return (
    <div className={`announcement-bar sticky top-0 z-[81] h-[36px] flex items-center justify-center border-b px-2 ${halloween ? "bg-[#641e29] text-[#fff3df] border-[#8e3946]" : "bg-surface text-text border-border"}`}>
      <p className={`text-[13px] text-center ${halloween ? "font-semibold" : "text-text-dim"}`} style={{ lineHeight: "16px" }}>
        <Link href="/promo">Explore our latest offers and factory bonuses</Link>
      </p>
    </div>
  );
}
