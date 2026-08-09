import Image from "next/image";
import Link from "next/link";

const footerGroups = [
  {
    title: "Shop",
    links: [
      ["Shop all dolls", "/shop"],
      ["Ready to ship", "/warehouse"],
      ["Customize a doll", "/customize"],
      ["Price Match", "/compare"],
      ["Saved dolls", "/saved"]
    ]
  },
  {
    title: "Learn",
    links: [
      ["Learning Center", "/learn"],
      ["Help me choose", "/help-me-choose"],
      ["FAQ", "/faq"],
      ["How ordering works", "/how-ordering-works"]
    ]
  },
  {
    title: "Company",
    links: [
      ["About Us", "/why-dollwow"],
      ["Authorized vendors", "/authorized-vendors"],
      ["Brands", "/brands"],
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
      ["Shipping", "/shipping"],
      ["Returns", "/returns"],
      ["Privacy policy", "/privacy-policy"],
      ["Adult-only policy", "/adult-only"],
      ["Scam alert", "/scam-alert"]
    ]
  }
] as const;

export function Footer() {
  return (
    <footer className="mt-auto bg-surface-tint text-text">
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-10 border-b border-border pb-10 md:grid-cols-2 lg:grid-cols-[1.35fr_repeat(4,1fr)]">
          <div className="md:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex" aria-label="DollWow home">
              <Image
                src="/images/brand/dollwow-black-gold-lockup.png"
                alt="DollWow.com"
                width={650}
                height={235}
                sizes="220px"
                className="h-20 w-[220px] object-contain object-left"
              />
            </Link>
            <p className="mt-4 max-w-sm text-base leading-7 text-text-dim">
              Compare models, review custom options, and order with clear pricing, discreet delivery, and responsive support.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop" className="inline-flex min-h-11 items-center rounded-button bg-accent px-4 text-[15px] font-semibold text-white hover:bg-accent-hover">Browse catalog</Link>
              <Link href="/support" className="inline-flex min-h-11 items-center rounded-button border-2 border-accent px-4 text-[15px] font-semibold text-accent hover:bg-accent-tint">Ask our team</Link>
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-[17px] font-semibold text-text">{group.title}</h2>
              <div className="mt-3 grid">
                {group.links.map(([label, href]) => (
                  <Link key={href} href={href} className="flex min-h-11 items-center text-[15px] text-text-dim transition-colors hover:text-accent">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-6 text-sm leading-6 text-text-faint md:flex-row md:items-center md:justify-between">
          <p>Adults only. Product details, prices, and availability are reviewed before checkout.</p>
          <p>Discreet billing and plain packaging by default.</p>
        </div>
      </div>
    </footer>
  );
}
