import { redirect } from "next/navigation";

export default async function LegacyPriceMatchResult({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/price-match/${id}`);
}
