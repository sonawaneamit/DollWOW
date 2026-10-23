import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ContextualLink } from '@/lib/catalog/contextualLinks';

export function ContextualCatalogLinks({ links, label = 'Explore more dolls' }: { links: ContextualLink[]; label?: string }) {
  if (!links.length) return null;
  return (
    <nav aria-label={label} data-contextual-catalog-links className="my-6 border-y border-gold-500/15 py-4">
      <p className="mb-3 text-sm font-semibold text-ivory-200">{label}</p>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {links.map(link => <Link key={link.href} href={link.href} className="inline-flex min-h-11 max-w-full items-center gap-2 text-sm font-semibold text-gold-300 underline underline-offset-4">
          <span>{link.label}</span><ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
        </Link>)}
      </div>
    </nav>
  );
}
