export type SpiderRect = { left: number; top: number; right: number; bottom: number };
export type SpiderPoint = { x: number; y: number };

// Bounds are for the spider's centre; content is no longer an obstacle.
export function advanceSpider(point: SpiderPoint, angle: number, distance: number, bounds: SpiderRect) {
  let x = point.x + Math.cos(angle) * distance, y = point.y + Math.sin(angle) * distance;
  if (x < bounds.left || x > bounds.right) { angle = Math.PI - angle; x = Math.max(bounds.left, Math.min(bounds.right, x)); }
  if (y < bounds.top || y > bounds.bottom) { angle = -angle; y = Math.max(bounds.top, Math.min(bounds.bottom, y)); }
  return { x, y, angle };
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
