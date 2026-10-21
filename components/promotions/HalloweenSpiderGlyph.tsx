import { spiderLegPose } from "@/lib/promotions/halloweenSpiderMotion";

export function HalloweenSpiderGlyph({ index }: { index: number }) {
  const gradient = `halloween-spider-body-${index}`;
  return <svg viewBox="-12 -12 144 144" aria-hidden="true" focusable="false">
    <defs><radialGradient id={gradient} cx=".34" cy=".23" r=".75"><stop offset="0" stopColor="#393a3c" /><stop offset=".35" stopColor="#1e2022" /><stop offset="1" stopColor="#08090a" /></radialGradient></defs>
    <g data-spider-heading><g data-spider-body className="halloween-spider-anatomy">
      {[-1, 1].flatMap(side => [0, 1, 2, 3].map(leg => {
        const pose = spiderLegPose(side, leg, 0, 0);
        return <g key={`${side}:${leg}`} data-spider-leg={`${side}:${leg}`} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path data-leg-part="thick" d={pose.thick} stroke="#111214" strokeWidth="3.3" />
          <path data-leg-part="thin" d={pose.thin} stroke="#141517" strokeWidth="1.65" />
          <path data-leg-part="shine" d={pose.shine} stroke="#505152" strokeWidth=".45" opacity=".65" />
        </g>;
      }))}
      <ellipse cx="60" cy="75" rx="14" ry="20" fill={`url(#${gradient})`} transform="rotate(-3 60 75)" />
      <ellipse cx="60" cy="52" rx="10" ry="13" fill={`url(#${gradient})`} />
      <path d="M54 41Q50 33 53 30M66 41Q70 33 67 30" fill="none" stroke="#161719" strokeWidth="3" />
      <path d="M57 41L57 36M63 41L63 36" stroke="#0a0b0c" strokeWidth="2.5" />
      <path d="M53 65Q50 74 53 83" stroke="#6b6d70" strokeWidth=".65" opacity=".4" fill="none" />
      {[0, 1, 2, 3, 4, 5, 6].map(j => <path key={j} d={`M${48 + j % 2} ${67 + j * 3}l-2 -1M${72 - j % 2} ${67 + j * 3}l2 -1`} stroke="#191a1b" strokeWidth=".6" />)}
    </g></g>
  </svg>;
}
