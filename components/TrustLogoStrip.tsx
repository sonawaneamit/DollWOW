import { Camera, Lock, Package, Scale, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";

const trustSignals = [
  { label: "Buyer protection", icon: ShieldCheck },
  { label: "Plain box shipping", icon: Package },
  { label: "Factory photo approval", icon: Camera },
  { label: "Price match review", icon: Scale },
  { label: "Secure checkout", icon: Lock }
] as const;

export function TrustLogoStrip({ compact = false }: { compact?: boolean; eager?: boolean }) {
  return (
    <div className={clsx("overflow-hidden rounded-md border border-border bg-border shadow-card", compact && "max-w-3xl")} role="group" aria-label="DollWow shopping protections">
      <ul className="grid grid-cols-2 gap-px sm:grid-cols-5">
        {trustSignals.map(({ label, icon: Icon }, index) => (
          <li key={label} className={clsx("flex min-h-20 items-center gap-2.5 bg-surface p-3 text-left sm:min-h-24 sm:flex-col sm:justify-center sm:text-center", index === trustSignals.length - 1 && "col-span-2 sm:col-span-1")}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-tint text-accent" aria-hidden="true">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[13px] font-semibold leading-4 text-text sm:max-w-28">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
