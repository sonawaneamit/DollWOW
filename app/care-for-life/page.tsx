import type { Metadata } from "next";
import Link from "next/link";
import { Care365Seal } from "@/components/care/Care365Seal";
import { careForLife } from "@/lib/care/careForLife";

export const metadata: Metadata = {
  title: "DollWOW Care for Life",
  description: "See how DollWOW supports your purchase from comparison and build review through factory approval, delivery, Care 365, and long-term repair guidance."
};

const stages = [
  {
    eyebrow: "Before you choose",
    title: "Compare with clearer answers",
    body: "Review the exact material, size, weight, options, delivery path, and care needs before you commit. When a listing leaves something unclear, our team checks the build details with you.",
    program: "Human Build Check",
    href: "/how-ordering-works"
  },
  {
    eyebrow: "When you order",
    title: "Your choices stay connected to the order",
    body: "Your confirmed doll, selected options, and order details form one build record that follows the order from checkout into aftercare.",
    program: "Recorded build details"
  },
  {
    eyebrow: "Before production",
    title: "A human reviews the build",
    body: "We review the selected configuration for missing choices, visible conflicts, and details that need supplier confirmation before production begins.",
    program: "Human Build Check",
    href: "/how-ordering-works"
  },
  {
    eyebrow: "During production",
    title: "One record, fewer crossed wires",
    body: "Confirmed build details remain attached to the order while the manufacturer completes the doll. If a material question or configuration issue needs attention, support has the same record you approved.",
    program: "Order continuity"
  },
  {
    eyebrow: "Before shipment",
    title: "See the finished build before it travels",
    body: "When factory photos or video are available for an eligible custom build, you can review the finished configuration before shipment and raise a visible concern.",
    program: "Approve Before Shipping",
    href: "/buyer-protection"
  },
  {
    eyebrow: "Shipment and arrival",
    title: "The handoff is still supported",
    body: "Your order record, approved build details, and support path stay together through delivery, so the next step is clear if the package or doll arrives with a covered problem.",
    program: "Arrival-Right",
    href: "/shipping-protection"
  },
  {
    eyebrow: "As soon as it arrives",
    title: "Inspect first, then settle in",
    body: "Check the packaging, doll, selected configuration, and any visible transit damage promptly after delivery. Keep the packaging and contact us through the published arrival process if something is not right.",
    program: "Arrival-Right",
    href: "/returns"
  },
  {
    eyebrow: "Your first days",
    title: "Start with the right care routine",
    body: "Use the care guidance for the exact material and model, and ask before trying an unfamiliar cleaner, powder, lubricant, storage method, or repair product.",
    program: "Care 365",
    href: "/support"
  },
  {
    eyebrow: "Your first 365 days",
    title: "Ownership support is included",
    body: "For the first 365 days, Care 365 gives you a clear place to ask about care, setup, storage, troubleshooting, and the next step when a problem appears.",
    program: "Care 365",
    href: "/support"
  },
  {
    eyebrow: "For as long as you own it",
    title: "You do not have to diagnose it alone",
    body: "Send photos and a description when a cut, stain, joint concern, or care question appears. We will help identify a practical next step and coordinate compatible repair guidance or parts where available.",
    program: "Repair Concierge",
    href: "/support"
  }
];

const programs = [
  { name: "Human Build Check", summary: "A person reviews the supported configuration and the questions that need supplier confirmation before production." },
  { name: "Care 365", summary: "A clear support path for care, setup, storage, troubleshooting, and eligible ownership issues during the first year." },
  { name: "Repair Concierge", summary: "Practical guidance and help coordinating compatible instructions or parts where available throughout ownership." }
];

export default function CareForLifePage() {
  return (
    <main className="care-policy-page">
      <header className="care-policy-hero">
        <p className="alive-eyebrow"><span /> Ownership support</p>
        <h1>DollWOW Care for Life</h1>
        <h2>Support before the build, at arrival, and through ownership.</h2>
        <p>{careForLife.promise}</p>
        <div className="care-policy-actions">
          <Link href="/shop/sex-dolls">Shop dolls</Link>
          <a href="#care-365-details">See what is included</a>
        </div>
        <Care365Seal />
      </header>

      <section id="care-365-details" aria-labelledby="care-365-title" className="care-365-details-section">
        <div className="care-365-details-heading">
          <p className="alive-eyebrow"><span /> Included with every DollWOW doll</p>
          <h2 id="care-365-title">Your first year has a support path.</h2>
          <p>Care 365 gives you one place to ask about setup, everyday care, storage, troubleshooting, and the next practical step when something is not right.</p>
        </div>
        <div className="care-365-details-grid">
          <article>
            <span>01</span>
            <h3>Care questions, answered</h3>
            <p>Ask before using an unfamiliar cleaner, powder, lubricant, storage method, or repair product. We help you work from the material and model you actually own.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Help when a problem appears</h3>
            <p>Share clear photos and a description. We help identify a sensible next step and coordinate compatible guidance or parts where available.</p>
          </article>
          <article>
            <span>03</span>
            <h3>An eligible damage rescue</h3>
            <p>Care 365 includes an eligible accidental-damage rescue during the first year. Eligibility and the available resolution are reviewed under the published terms.</p>
          </article>
        </div>
        <div className="care-365-details-footer">
          <p><strong>After day 365:</strong> Repair Concierge continues to help you find the next practical route for as long as you own the doll.</p>
          <Link href="/support">Ask a Care 365 question</Link>
        </div>
      </section>

      <section id="included" aria-labelledby="care-ownership-story" className="care-policy-story">
        <p className="alive-eyebrow"><span /> Your ownership timeline</p>
        <h2 id="care-ownership-story">What happens—and when we step in.</h2>
        <p className="care-policy-intro">From the first comparison to long-term care, each stage has a clear record, a practical check, or a person to ask.</p>
        <div className="care-stage-list">
          {stages.map((stage, index) => (
            <article key={stage.title}>
              <div className="care-stage-time">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{stage.eyebrow}</p>
              </div>
              <span className="care-stage-node" aria-hidden="true" />
              <div className="care-stage-card">
                <h3>{stage.title}</h3>
                <p>{stage.body}</p>
                {stage.href ? <Link href={stage.href}>{stage.program}</Link> : <span>{stage.program}</span>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="care-more" className="care-policy-supporting">
        <p className="alive-eyebrow"><span /> The support behind the timeline</p>
        <h2 id="care-more">Three programs. One continuous handoff.</h2>
        <div className="care-policy-grid">
          {programs.map((item) => <article key={item.name}><h3>{item.name}</h3><p>{item.summary}</p></article>)}
        </div>
      </section>

      <aside className="care-price-lock">
        <div>
          <p>For 30 days after purchase</p>
          <h2>Your price stays protected</h2>
          <span>If the same legitimate configuration is offered for less under the published terms, submit it for review.</span>
        </div>
        <Link href="/best-price-guarantee">30-Day Price Lock</Link>
      </aside>

      <aside className="care-policy-closing">
        <div>
          <p>Support is already part of the experience.</p>
          <h2>Choose with support already built in.</h2>
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
