import Link from "next/link";
import Image from "next/image";

const footerGroups = [
  {
    title: "Shop",
    links: [
      ["Sex dolls", "/shop/sex-dolls"],
      ["Realistic sex dolls", "/shop/realistic-sex-dolls"],
      ["Mini sex dolls", "/shop/mini-sex-dolls"],
      ["TPE dolls", "/shop/tpe"],
      ["Silicone dolls", "/shop/silicone"],
      ["Male dolls", "/shop/male-dolls"],
      ["Ready to ship", "/shop/ready-to-ship"],
      ["Custom dolls", "/shop/custom"],
      ["WM Dolls", "/brands/wm-dolls"],
      ["Irontech Dolls", "/brands/irontech-dolls"],
      ["Starpery Dolls", "/brands/starpery-dolls"],
      ["Price match", "/compare"]
    ]
  },
  {
    title: "Guidance",
    links: [
      ["Help me choose", "/help-me-choose"],
      ["Learning Center", "/learn"],
      ["Editorial policy", "/editorial-policy"],
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
            <Link href="/" className="inline-flex" aria-label="DollWow home">
              <Image
                src="/images/brand/dollwow-black-gold-lockup.png"
                alt="DollWow.com"
                width={650}
                height={235}
                sizes="280px"
                className="h-28 w-[280px] rounded-[10px] object-contain object-left"
              />
            </Link>
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
