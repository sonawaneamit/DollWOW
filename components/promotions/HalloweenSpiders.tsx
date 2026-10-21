"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { HALLOWEEN_2026, isHalloweenSpiderPath } from "@/lib/promotions/halloween2026";
import { HalloweenCode } from "./HalloweenCode";
import { trackEvent } from "@/lib/analytics/client";
import { HalloweenSpiderGlyph } from "./HalloweenSpiderGlyph";
import { startHalloweenWalkers } from "./halloweenSpiderRuntime";
import { HalloweenCampaignArtwork } from "./HalloweenCampaignBanner";
import { claimHalloweenReveal, halloweenFallbackDeadline, isSpiderBodyHit } from "@/lib/promotions/halloweenVisitor";
import "./halloween.css";
import "./halloween-campaign.css";

export function HalloweenSpiders() {
  const path = usePathname();
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [openAt, setOpenAt] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const spiderElements = useRef<(HTMLSpanElement | null)[]>([]);
  const shown = useRef(false);
  const deadline = useRef<number | null>(null);
  const scurryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eligible = isHalloweenSpiderPath(path);
  const open = openAt === path;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { shown.current = localStorage.getItem(HALLOWEEN_2026.dismissalKey) === "1"; setHidden(shown.current); } catch { setHidden(false); }
      setReady(true);
    }, 1500);
    const onStorage = (event: StorageEvent) => { if (event.key === HALLOWEEN_2026.dismissalKey && event.newValue === "1") { shown.current = true; setHidden(true); } };
    window.addEventListener("storage", onStorage);
    return () => { clearTimeout(timer); window.removeEventListener("storage", onStorage); };
  }, []);

  useEffect(() => {
    if (!eligible || deadline.current !== null) return;
    try { deadline.current = halloweenFallbackDeadline(localStorage, Date.now()); }
    catch { deadline.current = Date.now() + HALLOWEEN_2026.fallbackDelayMs; }
  }, [eligible]);

  useEffect(() => {
    function check() {
      const modal = [...document.querySelectorAll<HTMLElement>('[role="dialog"],[aria-modal="true"],#mobile-menu,#chatra.chatra--expanded')]
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
    return startHalloweenWalkers(spiderElements.current.filter((el): el is HTMLSpanElement => Boolean(el)));
  }, [ready, hidden, eligible, blocked, path]);

  function retire(action: "reveal" | "dismiss") {
    shown.current = true;
    setHidden(true);
    try { localStorage.setItem(HALLOWEEN_2026.dismissalKey, "1"); } catch { /* Current visit still stays dismissed. */ }
    trackEvent(`halloween_${action}`, { campaign: HALLOWEEN_2026.id });
  }
  const reveal = useCallback((source: "spider" | "fallback" | "manual") => {
    if (!eligible || blocked || document.hidden) return;
    const focus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const claim = () => {
      if (document.hidden || window.location.pathname !== path) return;
      if ([...document.querySelectorAll<HTMLElement>('[role="dialog"],[aria-modal="true"],#mobile-menu')].some(el => !el.closest("[data-halloween-card]") && el.getClientRects().length > 0)) return;
      if (source !== "manual" && shown.current) return;
      try { if (!claimHalloweenReveal(localStorage, source === "manual")) { shown.current = true; setHidden(true); return; } }
      catch { /* Storage denial can only preserve once-per-visit behavior. */ }
      shown.current = true;
      previousFocus.current = focus;
      setHidden(true); setOpenAt(path);
      trackEvent("halloween_reveal", { campaign: HALLOWEEN_2026.id, source });
    };
    if (navigator.locks) void navigator.locks.request(HALLOWEEN_2026.id, claim).catch(() => claim());
    else claim();
  }, [eligible, blocked, path]);

  useEffect(() => {
    const manual = () => reveal("manual");
    window.addEventListener("dollwow:halloween-reveal", manual);
    return () => window.removeEventListener("dollwow:halloween-reveal", manual);
  }, [reveal]);

  useEffect(() => {
    if (!ready || hidden || !eligible || blocked || deadline.current === null) return;
    const timer = setTimeout(() => { if (scurryTimer.current === null) reveal("fallback"); }, Math.max(0, deadline.current - Date.now()));
    return () => clearTimeout(timer);
  }, [ready, hidden, eligible, blocked, path, reveal]);

  useEffect(() => {
    if (!ready || hidden || !eligible || blocked) return;
    function tap(event: MouseEvent) {
      // Observe ordinary clicks without preventing them. Shopping controls always
      // win, even when the spider's body is directly above one.
      if (event.defaultPrevented || !(event.target instanceof Element) || event.target.closest('a,button,input,select,textarea,label,summary,[role="button"],[role="link"],[contenteditable="true"],[tabindex]:not([tabindex="-1"])') || scurryTimer.current !== null) return;
      const spider = spiderElements.current.find(el => {
        if (!el || getComputedStyle(el).visibility !== "visible") return false;
        const body = el.querySelector("ellipse")?.getBoundingClientRect();
        return body && isSpiderBodyHit(event.clientX, event.clientY, body);
      });
      if (!spider) return;
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) { reveal("spider"); return; }
      spider.dataset.scurry = String(performance.now());
      scurryTimer.current = setTimeout(() => { scurryTimer.current = null; reveal("spider"); }, 420);
    }
    document.addEventListener("click", tap);
    return () => {
      document.removeEventListener("click", tap);
      if (scurryTimer.current !== null) clearTimeout(scurryTimer.current);
      scurryTimer.current = null;
    };
  }, [ready, hidden, eligible, blocked, path, reveal]);
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
    {ready && !hidden ? <div data-halloween-spiders aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map(index => <span key={index} ref={el => { spiderElements.current[index] = el; }} className="halloween-spider">
        <HalloweenSpiderGlyph index={index} />
      </span>)}
    </div> : null}
    {open ? <div className="halloween-backdrop" data-halloween-card onClick={event => { if (event.target === event.currentTarget) setOpenAt(null); }}>
      <div ref={panel} className="halloween-card" role="dialog" aria-modal="true" aria-labelledby="halloween-heading" aria-describedby="halloween-details">
        <button ref={closeButton} type="button" onClick={() => setOpenAt(null)} className="halloween-close" aria-label="Close Halloween offer"><X size={21} /></button>
        <HalloweenCampaignArtwork card />
        <div className="halloween-card-copy">
          <p className="halloween-eyebrow">A little Halloween magic</p>
          <h2 id="halloween-heading" className="font-display text-2xl font-semibold">You caught the deal.</h2>
          <p id="halloween-details" className="mt-3 text-sm leading-6">Save $299 on your full-size doll, ready-to-ship or custom-made. Your eligible factory bonuses stay included.</p>
          <div className="mt-4"><HalloweenCode campaign /></div>
          <Link href="/shop" onClick={() => setOpenAt(null)} className="halloween-shop">Find your doll</Link>
          <Link href="/promo#halloween-2026" onClick={() => setOpenAt(null)} className="halloween-card-details">Offer details</Link>
          <p className="mt-4 border-t border-[#e7b17744] pt-3 text-xs leading-5 text-[#e7cbb1]">One $299 USD discount per order, on the doll’s base price. Excludes torsos, hips, minis and add-ons.</p>
          <p className="mt-2 text-xs text-[#e7cbb1]">Preview only. Not active at checkout.</p>
        </div>
      </div>
    </div> : null}
  </>;
}
