export const metadata = { title: "Returns and Replacements" };

export default function ReturnsPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Policy</p>
      <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Returns and replacements</h1>
      <p className="mt-3 text-ivory-400">High-ticket custom products need clear expectations. We verify product details before checkout and help with documented delivery or quality issues.</p>
      <div className="mt-8 space-y-3">
        {["Custom items may not be returnable once production begins.", "Damage or missing-item claims need photos and order details quickly after delivery.", "Replacement decisions depend on supplier policy, order status, and product condition.", "We do not use fake reviews or invented buyer photos."].map((item) => (
          <div key={item} className="rounded-[16px] border border-gold-500/14 bg-ink-800/72 p-4 text-ivory-300">{item}</div>
        ))}
      </div>
    </section>
  );
}
