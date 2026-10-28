type Row = { id: string; handle: string; brand: string; sku: string; before: number; after: number; variantIds: string[] };
type Product = { id: string; handle: string; status: string; brand: { value: string } | null; variants: { pageInfo: { hasNextPage: boolean }; nodes: { id: string; sku: string; price: string; compareAtPrice: string | null }[] } };
export function validateTopfirePriceScope(manifest: { rows: Row[] }, products: Product[]): { row: Row; product: Product }[];
export function topfirePriceMutationVariables(row: Row): { productId: string; variants: { id: string; price: string }[] };
