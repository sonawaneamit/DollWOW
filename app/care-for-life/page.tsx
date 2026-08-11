import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Care365Seal } from "@/components/care/Care365Seal";
import { careForLife } from "@/lib/care/careForLife";

export const metadata: Metadata = { title: "DollWOW Care for Life", description: "Explore DollWOW's build review, factory approval, Care 365 ownership support, arrival protection, repair kits, and lifetime repair assistance." };

export default function CareForLifePage() {
  return <main className="care-policy-page"><header><p className="alive-eyebrow"><span /> Ownership support</p><h1>DollWOW Care for Life</h1><p>{careForLife.promise}</p><Care365Seal /></header><section aria-labelledby="care-commitments"><p className="alive-eyebrow"><span /> Included with every doll</p><h2 id="care-commitments">Before production. Before shipping. Throughout ownership.</h2><div className="care-policy-grid">{careForLife.commitments.map((item) => <article key={item.name}><CheckCircle2 /><h3>{item.name}</h3><p>{item.summary}</p></article>)}</div></section><aside><h2>Clear terms, private support</h2><p>Eligibility and resolution details are reviewed against the published terms and your documented order. We do not describe support as a warranty or promise that every issue can be repaired at home.</p><div><Link href="/buyer-protection">Buyer protection</Link><Link href="/best-price-guarantee">Price protection</Link><Link href="/account/my-dolls">Open My Dolls</Link><Link href="/support">Ask our team</Link></div></aside></main>;
}
