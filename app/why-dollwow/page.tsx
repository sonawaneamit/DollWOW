export const metadata = { title: "Why DollWow" };

export default function WhyPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Why DollWow</p>
      <h1 className="mt-2 text-4xl font-semibold text-ivory-50">A simpler way to buy the right doll</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[
          ["Plain choices", "Use simple filters, product details, and a short quiz instead of learning every brand first."],
          ["Comparison help", "Paste a listing and we help compare price, delivery, specs, and support."],
          ["Specialist support", "Ask our team private questions before you buy, especially for custom or high-ticket orders."],
          ["Clear records", "Each product gets a clear details card and care record without tech jargon."]
        ].map(([title, copy]) => (
          <div key={title} className="rounded-[20px] border border-gold-500/16 bg-ink-800/72 p-6">
            <h2 className="text-xl font-semibold text-ivory-50">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-ivory-400">{copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
