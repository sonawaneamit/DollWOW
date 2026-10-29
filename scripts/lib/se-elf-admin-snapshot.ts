import { adminFetch } from '@/lib/shopify/admin';
import { mapShopifyProduct } from '@/lib/shopify/mappers';

type Image = {url: string; altText: string | null; width: number; height: number};
type AdminProduct = {
  id: string; handle: string; title: string; description: string; vendor: string; productType: string; tags: string[]; status: string;
  priceRangeV2: {minVariantPrice: {amount: string; currencyCode: string}; maxVariantPrice: {amount: string; currencyCode: string}};
  metafields: {nodes: Array<{key: string; value: string; definition: {access: {storefront: string}} | null}>; pageInfo: {hasNextPage: boolean}};
  media: {nodes: Array<{status: string; image?: Image}>; pageInfo: {hasNextPage: boolean}};
  variants: {nodes: Array<{id: string; title: string; price: string; selectedOptions: Array<{name: string; value: string}>;
    inventoryPolicy: string; inventoryItem: {tracked: boolean; sku: string}}>;
    pageInfo: {hasNextPage: boolean}};
};
const aliases: Record<string, string> = {
  catalogIdentityKey: 'catalog_identity_key', catalogBodyIdentityKey: 'catalog_body_identity_key',
  headModel: 'head_model', displayName: 'display_name', bodyType: 'body_type', lookTags: 'look_tags',
  brand: 'brand', sourceTitle: 'source_title', sourceHandle: 'source_handle', sourceReleaseRank: 'source_release_rank',
  material: 'material', heightCm: 'height_cm', weightLb: 'weight_lb', cupSize: 'cup_size', measurements: 'measurements',
  warehouseCountry: 'warehouse_country', warehouseRegions: 'warehouse_regions', stockStatus: 'stock_status',
  deliveryEstimate: 'delivery_estimate', stockLastCheckedAt: 'stock_last_checked_at', customAvailable: 'custom_available',
  penisAddOnAvailable: 'has_insertable_penis_add_on', irontechUlwEligibility: 'irontech_ulw_eligibility',
  customizationGroups: 'customization_groups', qcNote: 'qc_note'
};

/** Single-variant custom-order projection; its publication assumption must be checked after launch. */
export async function readSeElfAdminSnapshot(id: string) {
  const {product: raw} = await adminFetch<{product: AdminProduct}>(`query($id:ID!){product(id:$id){
    id handle title description vendor productType tags status
    priceRangeV2{minVariantPrice{amount currencyCode}maxVariantPrice{amount currencyCode}}
    metafields(first:100,namespace:"custom"){pageInfo{hasNextPage}nodes{key value definition{access{storefront}}}}
    media(first:100){pageInfo{hasNextPage}nodes{status ... on MediaImage{image{url altText width height}}}}
    variants(first:10){pageInfo{hasNextPage}nodes{id title price selectedOptions{name value}
      inventoryPolicy inventoryItem{tracked sku}}}
  }}`, {id});
  if (!raw || raw.id !== id || raw.metafields.pageInfo.hasNextPage || raw.media.pageInfo.hasNextPage ||
    raw.variants.pageInfo.hasNextPage || raw.variants.nodes.length !== 1) throw new Error('Incomplete exact product snapshot');
  const variant = raw.variants.nodes[0];
  const money = raw.priceRangeV2.minVariantPrice;
  if (variant.inventoryPolicy !== 'CONTINUE' || variant.inventoryItem.tracked || money.currencyCode !== 'USD' ||
    Number(money.amount) !== Number(variant.price) || Number(raw.priceRangeV2.maxVariantPrice.amount) !== Number(variant.price)) {
    throw new Error('Single-variant custom-order availability or price assumption failed');
  }
  const fields = new Map(raw.metafields.nodes.map(field => [field.key, field.value]));
  const publicFields = new Map(raw.metafields.nodes.filter(field => field.definition?.access.storefront === 'PUBLIC_READ')
    .map(field => [field.key, field.value]));
  if (fields.get('stock_status') !== 'custom') throw new Error('Not a reviewed custom factory order');
  const images = raw.media.nodes.filter(media => media.status === 'READY' && media.image).map(media => media.image!);
  const product = mapShopifyProduct({
    ...Object.fromEntries(Object.entries(aliases).filter(([, key]) => publicFields.has(key))
      .map(([alias, key]) => [alias, {value: publicFields.get(key)!}])),
    id: raw.id, handle: raw.handle, title: raw.title, description: raw.description,
    vendor: raw.vendor, productType: raw.productType, tags: raw.tags,
    featuredImage: images[0] ?? null, images: {edges: images.map(node => ({node}))},
    variants: {edges: [{node: {id: variant.id, title: variant.title, availableForSale: true,
      price: money, selectedOptions: variant.selectedOptions}}]}, priceRange: raw.priceRangeV2
  });
  product.extended.bodyCode = fields.get('body_code');
  const editorial = fields.get('editorial_intro');
  if (editorial) product.extended.editorialIntro = JSON.parse(editorial);
  return {raw, product, publicationAssumption: 'ACTIVE and published to the current Storefront channel'};
}
