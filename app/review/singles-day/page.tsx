import { notFound } from 'next/navigation';
import { SinglesDayHero } from '@/components/promotions/SinglesDayHero';
export const metadata = { title: 'Singles Day layout preview', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default function SinglesDayPreview() {
  if (process.env.VERCEL_ENV === 'production') notFound();
  return <SinglesDayHero />;
}
