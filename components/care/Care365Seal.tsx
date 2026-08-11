import Image from "next/image";
import Link from "next/link";
import { CARE_FOR_LIFE_HREF, careForLife } from "@/lib/care/careForLife";

export function Care365Seal({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <div className={`care-365-lockup ${compact ? "is-compact" : ""} ${className}`} aria-label={careForLife.care365.accessibleLabel}>
      <div className="care-365-seal" aria-hidden="true">
        <Image
          src="/images/care/care-365-yuan-portrait.webp"
          alt=""
          width={530}
          height={714}
          className="care-365-seal-portrait"
        />
        <div className="care-365-seal-type">
          <span>CARE <em>365</em></span>
          <i />
          <small>{careForLife.care365.ring}</small>
        </div>
      </div>
      <div className="care-365-copy">
        <strong>Care 365 is included</strong>
        {!compact ? <p>{careForLife.care365.summary}</p> : null}
        <Link href={CARE_FOR_LIFE_HREF}>{careForLife.care365.detailsLabel}</Link>
      </div>
    </div>
  );
}
