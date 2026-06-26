import Link from "next/link";

const footerGroups = [
  {
    title: "Shop",
    links: [
      ["All dolls", "/shop"],
      ["Ready to ship", "/warehouse"],
      ["Customize", "/customize"],
      ["Price match", "/compare"]
    ]
  },
  {
    title: "Guidance",
    links: [
      ["Help me choose", "/help-me-choose"],
      ["FAQ", "/faq"],
      ["Why DollWow", "/why-dollwow"],
      ["Support", "/support"],
      ["For brands", "/supplier"]
    ]
  },
  {
    title: "Policies",
    links: [
      ["Buyer protection", "/buyer-protection"],
      ["Shipping protection", "/shipping-protection"],
      ["Best price guarantee", "/best-price-guarantee"],
      ["How ordering works", "/how-ordering-works"],
      ["Shipping", "/shipping"],
      ["Returns", "/returns"],
      ["Scam alert", "/scam-alert"],
      ["Privacy policy", "/privacy-policy"],
      ["Adult-only policy", "/adult-only"]
    ]
  }
] as const;

export function Footer() {
  return (
    <footer className="border-t border-gold-500/12 bg-[linear-gradient(180deg,#120907,#090505)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 border-b border-gold-500/12 pb-8 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
          <div>
            <p className="text-2xl font-bold text-ivory-50">
              Doll<span className="text-gold-400">Wow</span>
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-ivory-400">
              A premium storefront for comparing, customizing, and ordering with discreet checkout, clear timelines, and support that stays useful.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/shop" className="rounded-[14px] border border-gold-500/18 px-3 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">
                Browse catalog
              </Link>
              <Link href="/support" className="rounded-[14px] border border-gold-500/18 px-3 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">
                Ask our team
              </Link>
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">{group.title}</p>
              <div className="mt-4 grid gap-3 text-sm text-ivory-400">
                {group.links.map(([label, href]) => (
                  <Link key={href} href={href} className="transition hover:text-gold-300">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-6 text-sm text-ivory-500 md:flex-row md:items-center md:justify-between">
          <p>Adults only. Product details, prices, and availability are reviewed before checkout.</p>
          <p>Discreet billing and plain packaging by default.</p>
        </div>
      </div>
    </footer>
  );
}
