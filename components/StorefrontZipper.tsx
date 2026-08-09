"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";

const CHAPTERS = ["Discover", "Compare", "Customize", "Confirm"];

export function StorefrontZipper() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const excluded = pathname?.startsWith("/admin") || pathname?.startsWith("/ops") || pathname === "/adult-only";

  useEffect(() => {
    if (excluded) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const available = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setProgress(Math.min(1, Math.max(0, window.scrollY / available)));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.documentElement);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [excluded, pathname]);

  if (excluded) return null;
  const percentage = progress * 100;
  const chapter = CHAPTERS[Math.min(CHAPTERS.length - 1, Math.floor(progress * CHAPTERS.length))];

  return (
    <div className="storefront-zipper" aria-hidden="true" style={{ "--zip-progress": `${percentage}%` } as CSSProperties}>
      <span className="storefront-zipper__caption">DollWow journey</span>
      <div className="storefront-zipper__opened" style={{ height: `${percentage}%` }}>
        <svg viewBox="0 0 72 100" preserveAspectRatio="none">
          <path className="storefront-zipper__tape" d="M10 0 C11 54 26 82 34 100" />
          <path className="storefront-zipper__teeth-open" d="M16 0 C16 54 28 82 35 100" />
          <path className="storefront-zipper__tape" d="M62 0 C61 54 46 82 38 100" />
          <path className="storefront-zipper__teeth-open" d="M56 0 C56 54 44 82 37 100" />
        </svg>
      </div>
      <div className="storefront-zipper__closed" style={{ top: `${percentage}%` }}>
        <span className="storefront-zipper__closed-tape storefront-zipper__closed-tape--left" />
        <span className="storefront-zipper__closed-teeth" />
        <span className="storefront-zipper__closed-tape storefront-zipper__closed-tape--right" />
      </div>
      <div className="storefront-zipper__pull" style={{ top: `${percentage}%` }}>
        <span className="storefront-zipper__chapter">{chapter}</span>
        <svg viewBox="0 0 42 62">
          <path d="M12 5h18l-2 17H14L12 5Z" />
          <rect x="9" y="19" width="24" height="35" rx="11" />
          <rect className="storefront-zipper__pull-hole" x="15" y="27" width="12" height="18" rx="6" />
        </svg>
      </div>
    </div>
  );
}
