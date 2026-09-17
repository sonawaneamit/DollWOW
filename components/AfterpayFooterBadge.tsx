import Image from "next/image";

export function AfterpayFooterBadge() {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-6 text-sm text-text-dim">
      <span>Pay with Afterpay</span>
      <Image src="/images/payments/afterpay.svg" alt="Cash App Afterpay" width={34} height={24} className="h-6 w-auto" />
      <span className="text-text-faint">Subject to eligibility. Options shown at checkout.</span>
    </div>
  );
}
