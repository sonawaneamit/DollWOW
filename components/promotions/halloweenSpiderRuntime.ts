import { isSpiderStepSafe, spiderFootprint, spiderLegPose, type SpiderRect } from "@/lib/promotions/halloweenSpiderMotion";

type Walker = { x: number; y: number; angle: number; phase: number; walking: boolean; nextChange: number; turn: number; placed: boolean };
const own = "[data-halloween-spiders],[data-halloween-card]";

export function collectHalloweenObstacles() {
  const obstacles: SpiderRect[] = [];
  const visible = (r: DOMRect) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  for (const el of document.querySelectorAll<HTMLElement>("a,button,input,select,textarea,img,video,canvas,iframe,[role=button],[role=dialog],[data-halloween-protected]")) {
    if (el.closest(own) || getComputedStyle(el).visibility === "hidden") continue;
    if (el instanceof HTMLImageElement && el.dataset.halloweenArt === "2026-gpt25") {
      const rect = el.getBoundingClientRect();
      // Reviewed bounds for these exact composed assets: typography and portrait.
      const zones = innerWidth <= 767 ? [[.04, .02, .96, .445], [.22, .45, .78, 1]] : [[.04, .06, .59, .91], [.59, .04, .99, 1]];
      for (const [left, top, right, bottom] of zones) obstacles.push({ left: rect.left + rect.width * left, right: rect.left + rect.width * right, top: rect.top + rect.height * top, bottom: rect.top + rect.height * bottom });
      continue;
    }
    for (const rect of el.getClientRects()) if (visible(rect)) obstacles.push(rect);
  }
  const texts = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const styles = new Map<Element, boolean>();
  while (texts.nextNode()) {
    const node = texts.currentNode, parent = node.parentElement;
    if (!parent || !node.textContent?.trim() || parent.closest(`${own},script,style,noscript,[aria-hidden=true]`)) continue;
    if (!styles.has(parent)) { const css = getComputedStyle(parent); styles.set(parent, css.visibility !== "hidden" && css.display !== "none" && visible(parent.getBoundingClientRect())); }
    if (!styles.get(parent)) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    for (const rect of range.getClientRects()) if (visible(rect)) obstacles.push(rect);
  }
  return obstacles;
}

export function startHalloweenWalkers(buttons: HTMLButtonElement[], isPaused: (index: number) => boolean) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const walkers: Walker[] = buttons.map((_, i) => ({ x: 0, y: 0, angle: i % 2 ? -Math.PI / 2 : Math.PI / 2, phase: i * .7, walking: true, nextChange: 1.1 + i * .2, turn: i % 2 ? .35 : -.4, placed: false }));
  const parts = buttons.map(button => ({ heading: button.querySelector<SVGGElement>("[data-spider-heading]")!, body: button.querySelector<SVGGElement>("[data-spider-body]")!, legs: [...button.querySelectorAll<SVGGElement>("[data-spider-leg]")].map(group => ({ side: Number(group.dataset.spiderLeg!.split(":")[0]), leg: Number(group.dataset.spiderLeg!.split(":")[1]), thick: group.querySelector("[data-leg-part=thick]")!, thin: group.querySelector("[data-leg-part=thin]")!, shine: group.querySelector("[data-leg-part=shine]")! })) }));
  let dirty = true, obstacles: SpiderRect[] = [], frame = 0, before = 0, clock = 0, lastRefresh = 0;
  const markDirty = () => { dirty = true; };
  const observer = new MutationObserver(records => { if (records.some(r => !(r.target instanceof Element && r.target.closest(own)))) dirty = true; });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "style", "hidden", "open", "src"] });
  const resize = new ResizeObserver(markDirty); resize.observe(document.body);
  document.fonts.ready.then(markDirty);
  window.addEventListener("scroll", markDirty, { passive: true, capture: true }); window.addEventListener("resize", markDirty); reduced.addEventListener("change", markDirty);
  function tick(time: number) {
    const dt = before ? Math.min((time - before) / 1000, .04) : 0; before = time; clock += dt;
    const dialog = [...document.querySelectorAll<HTMLElement>('[role="dialog"],[aria-modal="true"]')].some(el => !el.closest(own) && el.getClientRects().length > 0);
    if (dialog) { buttons.forEach(button => { button.style.visibility = "hidden"; button.tabIndex = -1; }); frame = requestAnimationFrame(tick); return; }
    if (dirty || time - lastRefresh > 1200) { obstacles = collectHalloweenObstacles(); dirty = false; lastRefresh = time; }
    const mobile = innerWidth < 1024, size = mobile ? 64 : innerWidth >= 1440 ? 88 : 72, count = mobile ? 4 : 6;
    const top = Math.max(110, document.querySelector(".site-header")?.getBoundingClientRect().bottom || 0) + 10;
    const bounds = { left: 4, right: innerWidth - 4, top, bottom: innerHeight - 20 };
    const occupied: SpiderRect[] = [];
    walkers.forEach((s, i) => {
      const button = buttons[i]; button.style.width = `${size}px`; button.style.height = `${size}px`;
      if (i >= count) { button.style.visibility = "hidden"; button.tabIndex = -1; s.placed = false; return; }
      const avoid = [...obstacles, ...occupied, ...walkers.filter((other, j) => j !== i && j < count && other.placed).map(other => spiderFootprint(other, size + 8))];
      const safe = (from: { x: number; y: number }, to = from) => isSpiderStepSafe(from, to, size, bounds, avoid);
      if (!s.placed || !safe(s)) {
        s.placed = false;
        const edges = [size / 2 + 5, innerWidth - size / 2 - 5];
        const candidates: {x:number;y:number}[] = [];
        for (let y = top + size / 2 + 5; y < bounds.bottom - size / 2; y += 12) edges.forEach(x => candidates.push({ x, y }));
        const candidate = candidates.find(p => safe(p));
        if (candidate) { s.x = candidate.x; s.y = candidate.y; s.placed = true; }
      }
      if (!s.placed) { button.style.visibility = "hidden"; button.tabIndex = -1; return; }
      if (!reduced.matches && !isPaused(i)) {
        if (clock >= s.nextChange) { s.walking = !s.walking; s.nextChange = clock + (s.walking ? 1.1 + i % 3 * .3 : 1.1 + i % 3 * .45); s.turn = Math.sin(clock * 1.2 + i) * .55; }
        if (s.walking) {
          s.angle += s.turn * dt;
          const speed = mobile ? 24 : 35;
          const next = { x: s.x + Math.cos(s.angle) * speed * dt, y: s.y + Math.sin(s.angle) * speed * dt };
          if (safe(s, next)) { s.x = next.x; s.y = next.y; }
          else { s.angle += dt * (i % 2 ? 2.5 : -2.5); s.turn = i % 2 ? .5 : -.5; }
          s.phase += dt * Math.PI * 2 / .4;
        }
      }
      const stride = reduced.matches || isPaused(i) ? 0 : s.walking ? 1 : Math.sin(clock * 2.2 + i) > .99 ? .1 : 0;
      const glyph = parts[i];
      glyph.heading.setAttribute("transform", `rotate(${s.angle * 180 / Math.PI + 90} 60 60)`);
      glyph.body.setAttribute("transform", `translate(0 ${Math.sin(s.phase * 2) * .65 * stride})`);
      for (const leg of glyph.legs) { const pose = spiderLegPose(leg.side, leg.leg, s.phase, stride); leg.thick.setAttribute("d", pose.thick); leg.thin.setAttribute("d", pose.thin); leg.shine.setAttribute("d", pose.shine); }
      button.style.transform = `translate3d(${s.x - size / 2}px,${s.y - size / 2}px,0)`;
      const under = document.elementsFromPoint(s.x, s.y).find(el => !el.closest(own));
      button.dataset.surface = under?.closest("[data-halloween-art]") ? "dark" : "light";
      button.style.visibility = "visible"; button.tabIndex = 0; button.dataset.walking = String(Boolean(stride));
      occupied.push(spiderFootprint(s, size + 8));
    });
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect(); window.removeEventListener("scroll", markDirty, true); window.removeEventListener("resize", markDirty); reduced.removeEventListener("change", markDirty); };
}
