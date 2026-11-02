import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DollVue } from '@/components/dollvue/DollVue';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'DollVue Layout Review',
  robots: { index: false, follow: false },
};

export default function DollVueLayoutReview() {
  if (process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') notFound();
  return <>
    <nav aria-label="Layout review" style={{ padding: '8px 16px' }}>
      <Link href="/">Home</Link>{' | '}
      <Link href="/review/dollvue-layout">Neutral layout fixture</Link>
    </nav>
    <DollVue
      product={{
        handle: 'dol328-neutral-layout-fixture',
        name: 'Neutral layout fixture',
        brand: 'QA fixture',
        photos: [
          { position: 0, url: '/option-swatches/care-kit.svg', alt: 'Neutral care kit fixture A' },
          { position: 1, url: '/option-swatches/care-kit.svg', alt: 'Neutral care kit fixture B' },
        ],
      }}
      groups={Array.from({ length: 8 }, (_, index) => ({
        id: `layout-group-${index + 1}`,
        label: `Appearance ${index + 1}`,
        options: ['A', 'B'].map(choice => ({
          id: choice,
          label: `Choice ${index + 1} ${choice}`,
          swatch: { kind: 'image' as const, value: '/option-swatches/care-kit.svg' },
        })),
      }))}
      freePreviews={0}
      initialRemaining={0}
      verifiedEmail="QA fixture"
      live={false}
    />
  </>;
}
