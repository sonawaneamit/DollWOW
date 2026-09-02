import type { Metadata } from "next";
import { ComparisonPageClient } from "@/components/compare/ComparisonPageClient";

export const metadata: Metadata = {
  title: "Compare Dolls Side by Side",
  description: "Compare up to four DollWow products by photo, price, material, measurements, weight, availability, and customization.",
  alternates: { canonical: "/compare" }
};

export default function CompareDollsPage() {
  return <ComparisonPageClient />;
}
