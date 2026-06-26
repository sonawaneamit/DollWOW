import { AdminPriceMatchQueue } from "@/components/AdminPriceMatchQueue";
import { listComparisonRequests } from "@/lib/supabase/repositories";

export const metadata = { title: "Admin Price Match Queue" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPriceMatchPage() {
  const requests = await listComparisonRequests(100);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Admin</p>
        <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Price match queue</h1>
        <p className="mt-3 max-w-3xl text-ivory-400">Review new requests, open the competitor evidence, leave notes, and update each request.</p>
      </div>
      <AdminPriceMatchQueue requests={requests} />
    </section>
  );
}
