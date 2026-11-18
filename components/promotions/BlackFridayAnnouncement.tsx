"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isBlackFridayInWindow, BLACK_FRIDAY_2026 } from "@/lib/promotions/blackFriday2026";

export function useBlackFridayWindow(preview = false) {
  const [active, setActive] = useState(preview);
  useEffect(() => {
    if (preview) return;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      const now = Date.now();
      setActive(isBlackFridayInWindow(now));
      const boundary = [BLACK_FRIDAY_2026.startsAt, BLACK_FRIDAY_2026.endsAt]
        .map(Date.parse).find(time => time > now);
      if (boundary) timer = setTimeout(refresh, Math.min(boundary - now + 10, 2_147_000_000));
    };
    refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [preview]);
  return active;
}

export function BlackFridayAnnouncement({ preview }: { preview: boolean }) {
  const active = useBlackFridayWindow(preview);
  return (
    <div className={`announcement-bar sticky top-0 z-[81] h-[36px] flex items-center justify-center border-b px-2 ${active ? "bg-[#641e29] text-[#fff3df] border-[#8e3946]" : "bg-surface text-text border-border"}`}>
      <p className={`text-[13px] text-center leading-[16px] ${active ? "font-semibold" : "text-text-dim"}`}>
        <Link href={active ? "/black-friday-sex-doll-deals" : "/promo"} data-black-friday-announcement={active || undefined}>
          {active ? (
            <>
              <span className="hidden sm:inline">Black Friday: <span className="text-[#ffd700]">$299 OFF</span> · Code BLACKFRIDAYWOW26 · Shop the deals →</span>
              <span className="sm:hidden">Black Friday: <span className="text-[#ffd700]">$299 OFF</span> · Code BLACKFRIDAYWOW26 →</span>
            </>
          ) : (
            "Explore our latest offers and factory bonuses"
          )}
        </Link>
      </p>
    </div>
  );
}
