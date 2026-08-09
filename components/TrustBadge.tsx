import type { LucideIcon } from "lucide-react";

export function TrustBadge({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text shadow-card">
      <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
