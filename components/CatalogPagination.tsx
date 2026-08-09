import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SearchParams = Record<string, string | string[] | undefined>;

export function CatalogPagination({
  page,
  totalPages,
  totalItems,
  startItem,
  endItem,
  basePath,
  searchParams
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  startItem: number;
  endItem: number;
  basePath: string;
  searchParams: SearchParams;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Catalog pages" className="catalog-pagination">
      <p aria-live="polite">
        Showing {startItem}–{endItem} of {totalItems}
      </p>
      <div>
        {page > 1 ? (
          <Link href={pageHref(basePath, searchParams, page - 1)} rel="prev">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
          </Link>
        ) : (
          <span aria-disabled="true"><ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous</span>
        )}
        <strong>Page {page} of {totalPages}</strong>
        {page < totalPages ? (
          <Link href={pageHref(basePath, searchParams, page + 1)} rel="next">
            Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <span aria-disabled="true">Next <ChevronRight className="h-4 w-4" aria-hidden="true" /></span>
        )}
      </div>
    </nav>
  );
}

function pageHref(basePath: string, searchParams: SearchParams, page: number) {
  const params = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(searchParams)) {
    if (key === "page" || rawValue === undefined) continue;
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    values.forEach((value) => params.append(key, value));
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
