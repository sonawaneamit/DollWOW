import { SinglesDayAnnouncement } from "@/components/promotions/SinglesDayAnnouncement";
import { isHalloweenPreview, isHalloweenVisible } from "@/lib/promotions/halloween2026";
import { HalloweenAnnouncement } from "@/components/promotions/HalloweenAnnouncement";

export function AnnouncementBar() {
  const halloween = isHalloweenVisible();
  if (halloween) return <HalloweenAnnouncement preview={isHalloweenPreview()} />;
  return <SinglesDayAnnouncement />;
}
