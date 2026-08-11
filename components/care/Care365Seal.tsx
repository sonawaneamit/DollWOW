import Image from "next/image";
import Link from "next/link";
import { CARE_FOR_LIFE_HREF, careForLife } from "@/lib/care/careForLife";

export function Care365Seal({ compact = false, purchase = false, disclosure = false, className = "" }: { compact?: boolean; purchase?: boolean; disclosure?: boolean; className?: string }) {
  if (disclosure) {
    return (
      <details className={`care-365-disclosure ${className}`}>
        <summary aria-label="Care 365 included. Open details.">
          <Image src="/images/care/care-365-yuan-portrait.webp" alt="" width={400} height={539} />
          <span><strong>Care 365 included</strong><small>Ownership support with this doll</small></span>
          <b>Details</b>
        </summary>
        <div>
          <p>{careForLife.care365.summary}</p>
          <Link href={CARE_FOR_LIFE_HREF}>{careForLife.care365.detailsLabel} →</Link>
        </div>
      </details>
    );
  }

  if (purchase) {
    return (
      <Link
        href={CARE_FOR_LIFE_HREF}
        className={`care-365-purchase-assurance ${className}`}
        aria-label={`${careForLife.care365.accessibleLabel}. See Care 365 details.`}
      >
        <Image src="/images/care/care-365-yuan-portrait.webp" alt="" width={400} height={539} />
        <span>
          <strong>Care 365 included with this doll</strong>
          <small>First-year ownership support and an eligible damage rescue</small>
        </span>
        <b aria-hidden="true">→</b>
      </Link>
    );
  }

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
