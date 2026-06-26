import Image from "next/image";

export function TrustLogoStrip({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "trust-logo-strip trust-logo-strip--compact" : "trust-logo-strip"}>
      <Image
        src="/images/trust/dollwow-trust-badge-strip-v1.png"
        alt="DollWow buyer protection, plain box shipping, factory photo approval, price match review, and secure checkout trust badges"
        width={2048}
        height={768}
        sizes={compact ? "(min-width: 768px) 520px, 100vw" : "(min-width: 1024px) 900px, 100vw"}
        className="trust-logo-strip__image"
      />
    </div>
  );
}
