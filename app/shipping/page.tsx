export const metadata = { title: "Shipping" };

export default function ShippingPage() {
  return <PolicyPage title="Shipping" intro="Delivery time depends on warehouse location, custom work, and final stock confirmation." items={["Ready-to-ship products show a warehouse country and delivery estimate.", "Custom orders take longer and are confirmed before production.", "Packaging is discreet. Tracking details are shared after shipment.", "International buyers are responsible for local customs rules and import fees where they apply."]} />;
}

function PolicyPage({ title, intro, items }: { title: string; intro: string; items: string[] }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Policy</p>
      <h1 className="mt-2 text-4xl font-semibold text-ivory-50">{title}</h1>
      <p className="mt-3 text-ivory-400">{intro}</p>
      <ul className="mt-8 space-y-3">
        {items.map((item) => <li key={item} className="rounded-[16px] border border-gold-500/14 bg-ink-800/72 p-4 text-ivory-300">{item}</li>)}
      </ul>
    </section>
  );
}
