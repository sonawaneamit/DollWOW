import type { LucideIcon } from "lucide-react";

export function TrustBadge({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-gold-500/20 bg-ink-800/70 px-4 py-2 text-sm text-ivory-200">
      <Icon className="h-4 w-4 text-gold-400" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
