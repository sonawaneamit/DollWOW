type PassportOrderLine = { title: string; product?: { id: string; tags?: string[] } | null };

export function isPassportDollLine(item: PassportOrderLine) {
  if (!item.product?.id) return false;
  const tags = new Set((item.product.tags ?? []).map(tag => tag.toLowerCase()));
  if (['dollwow-system', 'custom-option-charge', 'exact-upgrade-pilot'].some(tag => tags.has(tag))) return false;
  return !/selected customization|custom option charge|accessor(?:y|ies)|care kit|repair kit/i.test(item.title);
}
