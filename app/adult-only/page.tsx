export const metadata = { title: "Adult-Only Policy" };

export default function AdultOnlyPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Adult-only policy</p>
      <h1 className="mt-2 text-4xl font-semibold text-ivory-50">DollWow is for adults only</h1>
      <p className="mt-4 text-ivory-400">This site is intended only for adults who are legally permitted to buy adult products in their location.</p>
      <div className="mt-8 space-y-3">
        {["No underage-coded categories, language, imagery, themes, or styling are allowed.", "We avoid school themes, teen language, and misleading product claims.", "Customers are responsible for following local laws.", "Support may refuse requests that do not fit these standards."].map((item) => (
          <div key={item} className="rounded-[16px] border border-gold-500/14 bg-ink-800/72 p-4 text-ivory-300">{item}</div>
        ))}
      </div>
    </section>
  );
}
