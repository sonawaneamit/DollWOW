"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { HALLOWEEN_2026, isHalloweenSpiderPath } from "@/lib/promotions/halloween2026";
import { HalloweenCode } from "./HalloweenCode";
import { trackEvent } from "@/lib/analytics/client";
import "./halloween.css";

type Position = { x: number; y: number; smooth: boolean };
const protectedSelector = "a,button,input,select,textarea,img,video,canvas,iframe,[role=button],[role=dialog]";

export function HalloweenSpiders() {
  const path = usePathname();
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [openAt, setOpenAt] = useState<string | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const paused = useRef(false);
  const lastPositions = useRef<Position[]>([]);
  const eligible = isHalloweenSpiderPath(path);
  const open = openAt === path;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setHidden(localStorage.getItem(HALLOWEEN_2026.dismissalKey) === "1"); } catch { setHidden(false); }
      setReady(true);
    }, 5000);
    const onStorage = (event: StorageEvent) => { if (event.key === HALLOWEEN_2026.dismissalKey && event.newValue === "1") setHidden(true); };
    window.addEventListener("storage", onStorage);
    return () => { clearTimeout(timer); window.removeEventListener("storage", onStorage); };
  }, []);

  useEffect(() => {
    function check() {
      const modal = [...document.querySelectorAll<HTMLElement>('[aria-modal="true"],#mobile-menu,#chatra.chatra--expanded')]
        .some(el => !el.closest("[data-halloween-card]") && el.getClientRects().length > 0);
      const chat = document.querySelector("#chatra")?.getBoundingClientRect();
      setBlocked(modal || Boolean(chat && chat.width > 180 && chat.height > 180) || document.hidden);
    }
    const observer = new MutationObserver(records => {
      if (records.every(record => record.target instanceof Element && record.target.closest("[data-halloween-spiders],[data-halloween-card]"))) return;
      check();
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-modal", "hidden", "class", "style"] });
    document.addEventListener("visibilitychange", check); check();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", check); };
  }, []);

  useEffect(() => {
    if (!ready || hidden || !eligible || blocked) return;
    let frame = 0;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function update() {
      if (paused.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const top = Math.max(155, document.querySelector(".site-header")?.getBoundingClientRect().bottom || 0) + 12;
        const safe: Position[] = [];
        const edges = innerWidth >= 1024 ? [2, innerWidth - 46] : [2];
        for (const [index, x] of edges.entries()) {
          const previous = lastPositions.current.find(position => position.x === x);
          const height = index === 0 ? 102 : 58;
          const preferred = motion.matches ? top : previous ? previous.y + 4 : top + 48;
          const candidates = [preferred, ...Array.from({ length: Math.max(0, Math.floor((innerHeight - top - height - 56) / 24)) }, (_, i) => top + i * 24)];
          const isSafe = (y: number) => y >= top && y + height < innerHeight - 56 && [x + 1, x + 22, x + 43].every(px => [y + 1, y + 29, y + height - 1].every(py =>
            !document.elementsFromPoint(px, py).some(el => !el.closest("[data-halloween-spiders]") && el.closest(protectedSelector))
          ));
          const y = candidates.find(isSafe);
          if (y !== undefined) safe.push({ x, y, smooth: !motion.matches && Boolean(previous && y >= previous.y && y - previous.y <= 8 && isSafe(previous.y)) });
        }
        lastPositions.current = safe;
        setPositions(safe);
      });
    }
    update();
    const timer = window.setInterval(update, motion.matches ? 1500 : 700);
    window.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update); motion.addEventListener("change", update);
    return () => { cancelAnimationFrame(frame); clearInterval(timer); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); motion.removeEventListener("change", update); };
  }, [ready, hidden, eligible, blocked, path]);

  function retire(action: "reveal" | "dismiss") {
    setHidden(true);
    try { localStorage.setItem(HALLOWEEN_2026.dismissalKey, "1"); } catch { /* Current visit still stays dismissed. */ }
    trackEvent(`halloween_${action}`, { campaign: HALLOWEEN_2026.id });
  }
  function reveal(button: HTMLButtonElement) {
    previousFocus.current = button;
    retire("reveal"); setOpenAt(path);
  }
  useEffect(() => {
    if (!open || !eligible || blocked) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); setOpenAt(null); }
      if (event.key !== "Tab") return;
      const items = panel.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])");
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key); document.body.style.overflow = overflow;
      const target = previousFocus.current?.isConnected ? previousFocus.current : document.querySelector<HTMLElement>('.announcement-bar a');
      target?.focus({ preventScroll: true });
    };
  }, [open, eligible, blocked]);

  useEffect(() => {
    if (!ready || hidden || !eligible || blocked) return;
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") retire("dismiss"); };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  }, [ready, hidden, eligible, blocked]);

  if (!eligible || blocked) return null;
  return <>
    {ready && !hidden && positions.length > 0 ? <div data-halloween-spiders>
      {positions.map((position, index) => <button key={index} type="button" className="halloween-spider" style={{ left: position.x, top: position.y, transitionDuration: position.smooth ? "700ms" : "0ms" }} aria-label="Halloween offer: reveal $299 discount" onPointerEnter={() => { paused.current = true; }} onPointerLeave={() => { paused.current = false; }} onFocus={() => { paused.current = true; }} onBlur={() => { paused.current = false; }} onClick={e => reveal(e.currentTarget)}>
        <Image src="/promo/halloween-2026/spider.svg" alt="" width={24} height={28} style={{ width: 24, height: "auto" }} unoptimized draggable={false} />
      </button>)}
      <button type="button" className="halloween-hide" style={{ left: positions[0].x, top: positions[0].y + 58 }} title="Hide spiders" aria-label="Hide spiders" onClick={() => retire("dismiss")}><X size={14} aria-hidden="true" /></button>
    </div> : null}
    {open ? <div className="halloween-backdrop" data-halloween-card onClick={event => { if (event.target === event.currentTarget) setOpenAt(null); }}>
      <div ref={panel} className="halloween-card" role="dialog" aria-modal="true" aria-labelledby="halloween-heading" aria-describedby="halloween-details">
        <button ref={closeButton} type="button" onClick={() => setOpenAt(null)} className="halloween-close" aria-label="Close Halloween offer"><X size={21} /></button>
        <p className="text-sm font-semibold text-accent">Happy Halloween</p>
        <h2 id="halloween-heading" className="mt-3 font-display text-2xl font-semibold text-text">You caught the deal.</h2>
        <p className="mt-4 font-display text-4xl font-semibold text-accent">$299 off</p>
        <p className="mt-1 text-lg font-medium text-text">your full-size doll.</p>
        <p id="halloween-details" className="mt-4 text-sm leading-6 text-text-dim">Ready-to-ship or custom-made. Plus the eligible factory bonuses.</p>
        <div className="mt-5"><HalloweenCode /></div>
        <Link href="/promo#halloween-2026" onClick={() => setOpenAt(null)} className="mt-5 inline-flex min-h-11 items-center font-semibold text-accent underline underline-offset-4">Offer details</Link>
        <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-text-dim">One $299 USD discount per order, on the doll’s base price. Excludes torsos, hips, minis and add-ons.</p>
        <p className="mt-2 text-xs text-text-faint">Preview only. Not active at checkout.</p>
      </div>
    </div> : null}
  </>;
}
