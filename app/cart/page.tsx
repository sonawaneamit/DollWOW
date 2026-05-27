import { GoldButton } from "@/components/GoldButton";

export const metadata = { title: "Cart" };

export default function CartPage({ searchParams }: { searchParams: Promise<{ mockCheckout?: string }> }) {
  void searchParams;
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6 lg:px-8">
      <div className="rounded-[24px] border border-gold-500/16 bg-ink-800/72 p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Cart</p>
        <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Checkout opens in Shopify</h1>
        <p className="mt-4 text-ivory-400">When Shopify credentials are configured, Add to Cart creates a Shopify cart and sends buyers to the secure checkout URL.</p>
        <div className="mt-6">
          <GoldButton href="/shop">Continue shopping</GoldButton>
        </div>
      </div>
    </section>
  );
}
