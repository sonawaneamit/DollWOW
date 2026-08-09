export const CATALOG_PAGE_SIZE = 36;

export function catalogPageFromValue(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function paginateCatalog<T>(items: T[], requestedPage: number, pageSize = CATALOG_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    totalPages,
    totalItems: items.length,
    startItem: items.length ? start + 1 : 0,
    endItem: Math.min(start + pageSize, items.length)
  };
}
