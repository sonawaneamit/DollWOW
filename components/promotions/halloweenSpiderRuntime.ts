import { advanceSpider, spiderLegPose } from "@/lib/promotions/halloweenSpiderMotion";

type Walker = { x: number; y: number; angle: number; phase: number; walking: boolean; nextChange: number; turn: number };
const own = "[data-halloween-spiders],[data-halloween-card]";

// Decorative walkers may cross content; the entire layer is click-through.
export function startHalloweenWalkers(elements: HTMLElement[]) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const walkers: Walker[] = elements.map((_, i) => ({ x: 0, y: 0, angle: i * 2.4 + .6, phase: i * .7, walking: true, nextChange: 1.8 + i * .2, turn: i % 2 ? .18 : -.2 }));
  const parts = elements.map(el => ({ heading: el.querySelector<SVGGElement>("[data-spider-heading]")!, body: el.querySelector<SVGGElement>("[data-spider-body]")!, legs: [...el.querySelectorAll<SVGGElement>("[data-spider-leg]")].map(group => ({ side: Number(group.dataset.spiderLeg!.split(":")[0]), leg: Number(group.dataset.spiderLeg!.split(":")[1]), thick: group.querySelector("[data-leg-part=thick]")!, thin: group.querySelector("[data-leg-part=thin]")!, shine: group.querySelector("[data-leg-part=shine]")! })) }));
  let frame = 0, before = 0, clock = 0, dirty = true;
  const markDirty = () => { dirty = true; };
  window.addEventListener("resize", markDirty);
  reduced.addEventListener("change", markDirty);
  function tick(time: number) {
    const dt = before ? Math.min((time - before) / 1000, .04) : 0; before = time; clock += dt;
    const dialog = [...document.querySelectorAll<HTMLElement>('[role="dialog"],[aria-modal="true"]')].some(el => !el.closest(own) && el.getClientRects().length > 0);
    if (dialog) { elements.forEach(el => { el.style.visibility = "hidden"; }); frame = requestAnimationFrame(tick); return; }
    const mobile = innerWidth < 1024, size = mobile ? 64 : innerWidth >= 1440 ? 88 : 72, count = mobile ? 4 : 6;
    const top = Math.max(36, document.querySelector(".site-header")?.getBoundingClientRect().bottom || 0) + size / 2 + 6;
    const bottom = Math.max(top, innerHeight - size / 2 - 12);
    const left = size / 2 + 6, right = Math.max(left, innerWidth - size / 2 - 6);
    walkers.forEach((s, i) => {
      const el = elements[i]; el.style.width = `${size}px`; el.style.height = `${size}px`;
      if (i >= count) { el.style.visibility = "hidden"; return; }
      if (dirty) {
        // Distribute across the content, not just the edge gutters.
        s.x = left + (right - left) * ([.22, .75, .4, .88, .12, .6][i]);
        s.y = top + (bottom - top) * ([.18, .38, .68, .86, .5, .12][i]);
      }
      if (!reduced.matches) {
        if (clock >= s.nextChange) { s.walking = !s.walking; s.nextChange = clock + (s.walking ? 2.5 + i % 3 * .5 : .65 + i % 3 * .3); s.turn = Math.sin(clock * .6 + i) * .4; }
        if (s.walking) {
          s.angle += s.turn * dt;
          const speed = mobile ? 36 : 52;
          Object.assign(s, advanceSpider(s, s.angle, speed * dt, { left, right, top, bottom }));
          s.phase += dt * Math.PI * 2 / .4;
        }
      }
      const stride = reduced.matches ? 0 : s.walking ? 1 : Math.sin(clock * 2.2 + i) > .99 ? .1 : 0;
      const glyph = parts[i];
      glyph.heading.setAttribute("transform", `rotate(${s.angle * 180 / Math.PI + 90} 60 60)`);
      glyph.body.setAttribute("transform", `translate(0 ${Math.sin(s.phase * 2) * .65 * stride})`);
      for (const leg of glyph.legs) { const pose = spiderLegPose(leg.side, leg.leg, s.phase, stride); leg.thick.setAttribute("d", pose.thick); leg.thin.setAttribute("d", pose.thin); leg.shine.setAttribute("d", pose.shine); }
      el.style.transform = `translate3d(${s.x - size / 2}px,${s.y - size / 2}px,0)`;
      el.dataset.surface = document.elementFromPoint(s.x, s.y)?.closest("[data-halloween-art]") ? "dark" : "light";
      el.style.visibility = "visible"; el.dataset.walking = String(Boolean(stride));
    });
    dirty = false;
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", markDirty); reduced.removeEventListener("change", markDirty); };
}
