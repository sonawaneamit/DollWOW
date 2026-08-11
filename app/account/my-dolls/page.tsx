import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { PassportAccessForm } from "@/components/passport/PassportAccessForm";
import { getPassportSession } from "@/lib/passport/session";
import { lifecycleLabels } from "@/lib/passport/types";
import { listPassportsForOwner } from "@/lib/passport/repository";

export const dynamic = "force-dynamic";
export default async function MyDollsPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await getPassportSession();
  const query = await searchParams;
  if (!session) return <main className="account-shell"><section className="passport-login"><p className="alive-eyebrow"><span /> Private account</p><h1>My Dolls</h1><p>Use a one-time email link to open your private Doll Passports. No password to remember.</p><PassportAccessForm next={query.next} /></section></main>;
  const passports = await listPassportsForOwner(session.email);
  return <main className="account-shell"><header className="account-heading"><div><p className="alive-eyebrow"><span /> Private ownership records</p><h1>My Dolls</h1><p>Your build records, factory approvals, care documents, and support history.</p></div><form action="/api/account/logout" method="post"><button>Sign out</button></form></header>{passports.length ? <div className="passport-list">{passports.map((passport) => <Link key={passport.id} href={`/account/my-dolls/${passport.id}`} className="passport-card">{passport.product_image_url ? <Image src={passport.product_image_url} alt="" width={180} height={220} /> : <div className="passport-card-mark"><ShieldCheck /></div>}<div><span>{lifecycleLabels[passport.lifecycle_state]}</span><h2>{passport.product_title}</h2><p>{[passport.brand, passport.model, passport.order_number ? `Order ${passport.order_number}` : null].filter(Boolean).join(" · ")}</p><strong>View Doll Passport →</strong></div></Link>)}</div> : <section className="passport-empty"><ShieldCheck /><h2>Your first Passport is being prepared</h2><p>Qualifying paid orders create a private record automatically. If you recently ordered, our team may still be preparing yours.</p><Link href="/support">Ask our support team</Link></section>}</main>;
}
