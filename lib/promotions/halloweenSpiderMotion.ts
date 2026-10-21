export type SpiderRect = { left: number; top: number; right: number; bottom: number };
export type SpiderPoint = { x: number; y: number };

export function spiderFootprint(point: SpiderPoint, size: number): SpiderRect {
  return { left: point.x - size / 2, top: point.y - size / 2, right: point.x + size / 2, bottom: point.y + size / 2 };
}

export function spiderRectsOverlap(a: SpiderRect, b: SpiderRect, gap = 5) {
  return a.left < b.right + gap && a.right > b.left - gap && a.top < b.bottom + gap && a.bottom > b.top - gap;
}

// A swept bounding box protects the whole step, not only its destination.
export function isSpiderStepSafe(from: SpiderPoint, to: SpiderPoint, size: number, bounds: SpiderRect, obstacles: SpiderRect[]) {
  const a = spiderFootprint(from, size), b = spiderFootprint(to, size);
  const swept = { left: Math.min(a.left, b.left), right: Math.max(a.right, b.right), top: Math.min(a.top, b.top), bottom: Math.max(a.bottom, b.bottom) };
  return swept.left >= bounds.left && swept.right <= bounds.right && swept.top >= bounds.top && swept.bottom <= bounds.bottom && !obstacles.some(rect => spiderRectsOverlap(swept, rect));
}

export function spiderLegPose(side: number, leg: number, phase: number, stride: number) {
  const step = phase + (leg % 2 ? Math.PI : 0) + (side === 1 ? Math.PI : 0);
  const shift = Math.sin(step) * 7 * stride, lift = Math.max(0, Math.cos(step)) * 3.2 * stride;
  const hx = 60 + side * (leg === 0 ? 7 : 9), hy = [45, 49, 56, 62][leg];
  const kx = 60 + side * ([22, 28, 28, 24][leg] + lift), ky = [30, 43, 66, 80][leg] + shift * .5;
  const ax = 60 + side * ([38, 45, 44, 36][leg] + lift), ay = [18, 35, 80, 99][leg] + shift;
  const tx = ax + side * (leg < 2 ? 5 : 6), ty = ay + (leg < 2 ? -8 : 9) + shift * .12;
  return { thick: `M${hx} ${hy} Q${hx + side * 9} ${hy - 3} ${kx} ${ky}`, thin: `M${kx} ${ky} Q${ax - side * 2} ${ay} ${ax} ${ay} L${tx} ${ty}`, shine: `M${hx} ${hy - 1} L${kx} ${ky - 1} L${ax} ${ay - 1}` };
}
