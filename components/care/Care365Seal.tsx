import Image from "next/image";
import Link from "next/link";
import { CARE_FOR_LIFE_HREF, careForLife } from "@/lib/care/careForLife";

export function Care365Seal({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <div className={`care-365-lockup ${compact ? "is-compact" : ""} ${className}`} aria-label={careForLife.care365.accessibleLabel}>
      <div className="care-365-seal" aria-hidden="true">
        <Image
          src="/images/brand/dollwow-black-gold-lockup.png"
          alt=""
          width={650}
          height={235}
          className="care-365-seal-logo"
        />
        <span>{careForLife.care365.seal}</span>
        <small>{careForLife.care365.ring}</small>
      </div>
      <div className="care-365-copy">
        <strong>Care 365 included</strong>
        {!compact ? <p>{careForLife.care365.summary}</p> : null}
        <Link href={CARE_FOR_LIFE_HREF}>{careForLife.care365.detailsLabel}</Link>
      </div>
    </div>
  );
}
