"use client";

import Image from "next/image";
import { useState, type MouseEvent } from "react";
import styles from "./DollVueBadge.module.css";

const DEFAULT_TOOLTIP = "DollVue lets you preview supported appearance choices on a real product photo before ordering.";

export function DollVueBadge({
  size = "standard",
  className = "",
  tooltip = DEFAULT_TOOLTIP,
  tooltipAlign = "end"
}: {
  size?: "compact" | "standard";
  className?: string;
  tooltip?: string;
  tooltipAlign?: "start" | "center" | "end";
}) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  function toggleTooltip(event: MouseEvent<HTMLSpanElement>) {
    event.preventDefault();
    event.stopPropagation();
    setTooltipOpen((open) => !open);
  }

  return (
    <span
      className={`${styles.badge} ${styles[`align${tooltipAlign[0].toUpperCase()}${tooltipAlign.slice(1)}`]} ${size === "compact" ? styles.compact : ""} ${tooltipOpen ? styles.open : ""} ${className}`.trim()}
      role="button"
      aria-label={`DollVue enabled. ${tooltip}`}
      aria-expanded={tooltipOpen}
      tabIndex={0}
      data-open={tooltipOpen ? "true" : "false"}
      onClick={toggleTooltip}
      onBlur={() => setTooltipOpen(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") setTooltipOpen(false);
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setTooltipOpen((open) => !open);
        }
      }}
    >
      <Image
        src="/images/dollvue/landing/dollvue-verified-check-transparent.png"
        alt=""
        width={24}
        height={24}
        aria-hidden="true"
      />
      <span
        className={styles.tooltip}
        role="tooltip"
        style={tooltipOpen ? {
          opacity: 1,
          visibility: "visible",
          transform: tooltipAlign === "center" ? "translate(-50%, 0)" : "translateY(0)"
        } : undefined}
      >
        {tooltip}
      </span>
    </span>
  );
}
