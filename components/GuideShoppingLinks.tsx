"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics/client";

const routes = [
  { id: "chooser", label: "Help me choose", href: "/help-me-choose" },
  { id: "lightweight", label: "Compare lightweight dolls", href: "/shop/lightweight-sex-dolls" },
  { id: "ready_to_ship", label: "Browse ready-to-ship dolls", href: "/shop/ready-to-ship" },
  { id: "brands", label: "Explore the brands", href: "/brands" }
] as const;

export function GuideShoppingLinks() {
  return (
    <nav aria-label="Find your next step" className="my-8 border-y border-border py-5">
      <p className="font-semibold text-text">Find a doll that fits</p>
      <div className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {routes.map((route) => (
            <Link key={route.id} href={route.href} className="flex min-h-11 items-center justify-between gap-3 py-2 text-base text-accent underline underline-offset-4"
              onClick={() => trackEvent("guide_shopping_click", { guide: "sex-doll-guide", route_id: route.id })}>
              <span>{route.label}</span><ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
            </Link>
        ))}
      </div>
    </nav>
  );
}
