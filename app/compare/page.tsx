import { ComparisonPageClient } from "@/components/compare/ComparisonPageClient";

export const metadata = {
  title: "Compare Dolls Side by Side",
  description: "Compare up to four DollWow products by photo, price, material, measurements, weight, availability, and customization."
};

export default function CompareDollsPage() {
  return <ComparisonPageClient />;
}
