import { SinglesDayAnnouncement } from "@/components/promotions/SinglesDayAnnouncement";
import { isHalloweenPreview, isHalloweenVisible } from "@/lib/promotions/halloween2026";
import { HalloweenAnnouncement } from "@/components/promotions/HalloweenAnnouncement";
import { isBlackFridayPreview, isBlackFridayVisible } from "@/lib/promotions/blackFriday2026";
import { BlackFridayAnnouncement } from "@/components/promotions/BlackFridayAnnouncement";

export function AnnouncementBar() {
  const blackFriday = isBlackFridayVisible();
  if (blackFriday) return <BlackFridayAnnouncement preview={isBlackFridayPreview()} />;
  const halloween = isHalloweenVisible();
  if (halloween) return <HalloweenAnnouncement preview={isHalloweenPreview()} />;
  return <SinglesDayAnnouncement />;
}
