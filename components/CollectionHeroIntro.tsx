"use client";

import { useId, useState } from "react";

export function CollectionHeroIntro({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const introductionId = useId();

  return (
    <div className={`collection-hero-intro${expanded ? " collection-hero-intro--expanded" : ""}`}>
      <p id={introductionId} className="collection-hero-intro__copy mt-3 max-w-3xl text-ivory-400">
        {children}
      </p>
      <button
        type="button"
        className="collection-hero-intro__toggle"
        aria-expanded={expanded}
        aria-controls={introductionId}
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? "Show less" : "Read more"}
        <span aria-hidden="true">{expanded ? "\u2191" : "\u2193"}</span>
      </button>
    </div>
  );
}
