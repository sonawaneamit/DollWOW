"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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
  return (
    <div className="storefront-zipper" aria-hidden="true">
      <span className="storefront-zipper__caption">Your DollWow journey</span>
      <div className="storefront-zipper__ribbon">
        <span className="storefront-zipper__progress" style={{ height: `${percentage}%` }} />
        <span className="storefront-zipper__marker" style={{ top: `${percentage}%` }} />
      </div>
    </div>
  );
}
