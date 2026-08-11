import type { Metadata } from "next";
import Link from "next/link";
import { Care365Seal } from "@/components/care/Care365Seal";
import { careForLife } from "@/lib/care/careForLife";

export const metadata: Metadata = { title: "DollWOW Care for Life", description: "Explore DollWOW's build review, factory approval, Care 365 ownership support, arrival protection, repair kits, and lifetime repair assistance." };

export default function CareForLifePage() {
  const stages = [
    {
      eyebrow: "Before it ships",
      title: "Human Build Check",
      body: "We review supported choices and the build path before production. Eligible custom builds receive factory photos or video for approval before shipment."
    },
    {
      eyebrow: "Your first 365 days",
      title: "Care 365 included",
      body: "You receive one year of ownership support, including help with care questions and an eligible accidental-damage rescue."
    },
    {
      eyebrow: "For as long as you own it",
      title: "Repair help that does not disappear",
      body: "Request basic repair kits for life and pay only shipping. Our Repair Concierge can help identify the issue, find the right parts or instructions, and coordinate the next practical step."
    }
  ];

  const supporting = careForLife.commitments.filter(({ name }) =>
    ["Doll Passport", "30-Day Price Lock", "Arrival-Right Guarantee"].includes(name)
  );

  return (
    <main className="care-policy-page">
      <header className="care-policy-hero">
        <p className="alive-eyebrow"><span /> Ownership support</p>
        <h1>DollWOW Care for Life</h1>
        <h2>Support that stays with your doll.</h2>
        <p>{careForLife.promise}</p>
        <div className="care-policy-actions">
          <Link href="/shop/sex-dolls">Shop dolls</Link>
          <a href="#included">See what is included</a>
        </div>
        <Care365Seal />
      </header>

      <section id="included" aria-labelledby="care-ownership-story" className="care-policy-story">
        <p className="alive-eyebrow"><span /> The ownership journey</p>
        <h2 id="care-ownership-story">Help before delivery—and after it.</h2>
        <div className="care-stage-list">
          {stages.map((stage, index) => (
            <article key={stage.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <p>{stage.eyebrow}</p>
                <h3>{stage.title}</h3>
                <p>{stage.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="care-more" className="care-policy-supporting">
        <p className="alive-eyebrow"><span /> More ways we help</p>
        <h2 id="care-more">Practical reassurance, kept in one place.</h2>
        <div className="care-policy-grid">
          {supporting.map((item) => <article key={item.name}><h3>{item.name}</h3><p>{item.summary}</p></article>)}
        </div>
      </section>

      <aside className="care-policy-closing">
        <div>
          <p>Buying a doll should not mean figuring out ownership alone.</p>
          <h2>Every DollWOW doll includes Care 365.</h2>
        </div>
        <Link href="/shop/sex-dolls">Find your doll</Link>
      </aside>

      <nav className="care-policy-details" aria-label="Care and ownership details">
        <Link href="/buyer-protection">Buyer protection</Link>
        <Link href="/best-price-guarantee">Price protection</Link>
        <Link href="/account/my-dolls">Open My Dolls</Link>
        <Link href="/support">Ask our team</Link>
      </nav>
    </main>
  );
}
