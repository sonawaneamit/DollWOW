import { notFound } from "next/navigation";
import { ComparisonResult } from "@/components/ComparisonResult";
import { getComparisonRequest } from "@/lib/supabase/repositories";
import { getProducts } from "@/lib/shopify/storefront";

export default async function CompareResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [request, products] = await Promise.all([getComparisonRequest(id), getProducts()]);
  if (!request) notFound();
  const product = request.matchProductId ? products.find((item) => item.id === request.matchProductId) : null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ComparisonResult request={request} product={product} />
    </section>
  );
}
