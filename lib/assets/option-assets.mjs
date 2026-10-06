import manifest from '../../data/owned-option-assets.json' with { type: 'json' };
const migratedAssets = new Set(Object.values(manifest).filter(Boolean));

export function isMigratedOptionAsset(value) { return migratedAssets.has(value); }

// Stable lookup keys keep supplier URLs out of the browser manifest. Provenance
// stays in the separate, server-side migration report on the external SSD.
export function optionAssetKey(value) {
  let hash = 14695981039346656037n;
  for (const byte of new TextEncoder().encode(value)) {
    hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 1099511628211n);
  }
  return hash.toString(16).padStart(16, '0');
}

export function isOwnedOptionAsset(value) {
  if (typeof value !== 'string' || !value) return false;
  if (/^\/(?!\/)/.test(value)) {
    try {
      const decoded = decodeURIComponent(value);
      return /^\/(?:product-media|option-assets|images|option-swatches)\//.test(decoded)
        && !/[\\?#\r\n]/.test(decoded) && !decoded.includes('..');
    } catch { return false; }
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
    if (['dollwow.com', 'www.dollwow.com'].includes(url.hostname)) {
      return /^\/(?:product-media|option-assets|images|option-swatches)\//.test(url.pathname) && !url.search;
    }
    return url.hostname === 'cdn.shopify.com' && url.pathname.startsWith('/s/files/1/0960/7531/7432/')
      && [...url.searchParams.keys()].every(key => ['v', 'width', 'height', 'crop', 'format'].includes(key));
  } catch { return false; }
}

export function ownedOptionAsset(value) {
  if (isOwnedOptionAsset(value)) return value;
  const replacement = manifest[optionAssetKey(value ?? '')];
  return isOwnedOptionAsset(replacement) ? replacement : undefined;
}

export function catalogOptionAsset(namespace, path) {
  const value = manifest[optionAssetKey(`${namespace}:${path}`)];
  return isOwnedOptionAsset(value) ? value : '';
}

export function ownedOptionGroups(groups) {
  return groups?.map(group => ({...group, options: group.options.map(option => {
    if (option.swatch?.kind !== 'image') return option;
    const value = ownedOptionAsset(option.swatch.value);
    // Missing imagery never changes the customer's option, ID, or price. The
    // release gate separately blocks missing assets; text is the safe UI fallback.
    return {...option, ...(value ? {} : {dollVueEnabled: false}), swatch: value ? {...option.swatch, value} : undefined};
  })}));
}

export function optionAssetViolations(groups) {
  return (groups ?? []).flatMap(group => (group.options ?? []).flatMap(option => {
    if (option.swatch?.kind !== 'image') return [];
    const source = option.swatch.value;
    const key = optionAssetKey(source ?? '');
    if (isOwnedOptionAsset(source) || ownedOptionAsset(source) || manifest[key] === null) return [];
    return [{groupId: group.id, optionId: option.id, source}];
  }));
}
