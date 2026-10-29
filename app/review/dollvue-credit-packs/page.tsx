import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CreditCard, Sparkles } from 'lucide-react';
import { DOLLVUE_CREDIT_PACKS } from '@/lib/dollvue/creditPacks';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'DollVue Credit Pack Review', robots: { index: false, follow: false } };

const proposals = DOLLVUE_CREDIT_PACKS.map(pack => ({ credits: pack.credits, price: pack.priceCents / 100,
  status: 'Approved quantity · Draft', label: `Get ${pack.credits} more for $${pack.priceCents / 100}` }));

export default function CreditPackReview() {
  if (process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') notFound();
  return <section style={{ maxWidth: 960, margin: '32px auto', padding: '0 20px' }}>
    <Image src="/images/brand/dollwow-black-gold-lockup.png" alt="DollWOW" width={195} height={71} />
    <p style={{ margin: '16px 0 8px', fontSize: 13 }}>DollVue · Draft review</p>
    <h1 style={{ fontSize: 28, lineHeight: 1.2 }}>More DollVue previews</h1>
    <p style={{ margin: '12px 0 24px' }}>0 complimentary previews remaining</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 16 }}>
      {proposals.map(pack => <article key={pack.price} style={{ minWidth: 0, padding: 20, border: '1px solid #c9d5cf', borderRadius: 8, background: '#fff', color: '#17251f' }}>
        <Sparkles size={22} aria-hidden="true" />
        <h2 style={{ fontSize: 20, margin: '16px 0 12px' }}>{pack.credits} extra previews</h2>
        <p style={{ fontSize: 28, fontWeight: 700 }}>${pack.price} <span style={{ fontSize: 13, fontWeight: 400 }}>USD</span></p>
        <p style={{ margin: '12px 0', fontSize: 13 }}>Digital · No shipping</p>
        <p style={{ margin: '12px 0 20px', fontSize: 12, color: '#596b61' }}>{pack.status}</p>
        <button disabled title="Checkout is not enabled" style={{ display: 'flex', width: '100%', minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, border: '1px solid #c9d5cf', borderRadius: 6, color: '#596b61', background: '#edf2ef', cursor: 'not-allowed', fontSize: 14 }}>
          <CreditCard size={18} aria-hidden="true" />{pack.label}
        </button>
      </article>)}
    </div>
  </section>;
}
