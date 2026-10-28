import { notFound } from 'next/navigation';
import { AnalyticsProbe } from './probe';

export const metadata = { title: 'Analytics QA', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default function AnalyticsReview() {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.DOL212_LOCAL_REVIEW !== '1') notFound();
  return <AnalyticsProbe />;
}
