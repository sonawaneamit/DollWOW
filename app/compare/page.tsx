import type { Metadata } from "next";
import { ComparisonPageClient } from "@/components/compare/ComparisonPageClient";

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const query = await searchParams;
  return {
    title: "Compare Dolls Side by Side",
    description: "Compare up to four DollWow products by photo, price, material, measurements, weight, availability, and customization.",
    alternates: { canonical: "/compare" },
    robots: query.product !== undefined ? { index: false, follow: true } : { index: true, follow: true }
  };
}

export default function CompareDollsPage() {
  return <ComparisonPageClient />;
}
