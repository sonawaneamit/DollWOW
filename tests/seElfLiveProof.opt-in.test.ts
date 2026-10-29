import {readFile, writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {expect, it} from 'vitest';

it.skipIf(process.env.DOL275_LIVE_QA !== '1')('checks actual published products and all twelve server-priced preset carts without orders', async () => {
  Object.assign(process.env, parseEnv(await readFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local', 'utf8')));
  const {getProductByHandle} = await import('@/lib/shopify/storefront');
  const {getProductAdminMetafieldsByHandle} = await import('@/lib/shopify/admin');
  const {getCustomizationConfig} = await import('@/lib/customization/configs');
  const {templateRuntimeHash, selectReleasedTemplateRecipe} = await import('@/lib/customization/template-release-registry');
  const {storefrontAuthHeaders} = await import('@/lib/shopify/auth');
  const {env} = await import('@/lib/utils/env');
  const directory = 'data/exports/dol-275-2026-10-29';
  const stage = JSON.parse(await readFile(`${directory}/binding-stage-proof.json`, 'utf8'));
  const registry = JSON.parse(await readFile('lib/customization/evidence/template-release.json', 'utf8'));
  const results: unknown[] = [];
  for (const row of stage.rows) {
    const product = await getProductByHandle(row.product.handle, {strict: true, cache: 'no-store'});
    expect(product).not.toBeNull();
    const admin = await getProductAdminMetafieldsByHandle(row.product.handle);
    if (admin) product!.extended = {...product!.extended,
      measurements: admin.measurements || product!.extended.measurements,
      headModel: admin.headModel || product!.extended.headModel,
      bodyCode: admin.bodyCode || product!.extended.bodyCode,
      editorialIntro: admin.editorialIntro || product!.extended.editorialIntro};
    const config = getCustomizationConfig(product!);
    expect(templateRuntimeHash(product!, config)).toBe(row.runtimeHash);
    expect(selectReleasedTemplateRecipe(registry, product!, config)).not.toBeNull();
    const response = await fetch(`https://dollwow.com/products/${row.product.handle}`);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain(`href="https://dollwow.com/products/${row.product.handle}"`);
    expect(html).toContain('application/ld+json');
    expect(html).toContain('data-se-halloween');
    const carts: unknown[] = [];
    for (const preset of row.presets) {
      const response = await fetch('https://dollwow.com/api/cart/create', {method: 'POST',
        headers: {'Content-Type': 'application/json', Origin: 'https://dollwow.com'},
        body: JSON.stringify({merchandiseId: product!.variants[0].id, quantity: 1, selections: preset.selections})});
      const created = await response.json();
      expect(created.error).toBeUndefined();
      expect(response.status).toBe(200);
      expect(created.id).toBeTruthy();
      await writeFile(`${directory}/last-qa-cart-private.json`, JSON.stringify({sku: row.sku, tier: preset.id, cart: created}, null, 2));
      const checked = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`, {method: 'POST',
        headers: {'Content-Type': 'application/json', ...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},
        body: JSON.stringify({query: `query($id:ID!){
          cart(id:$id){
            lines(first:100){pageInfo{hasNextPage}nodes{
              id quantity attributes{key value}
              ... on CartLine{parentRelationship{parent{id}}}
              merchandise{... on ProductVariant{id price{amount currencyCode} requiresShipping product{title}}}
            }}
          }
        }`,
          variables: {id: created.id}})});
      const payload = await checked.json();
      expect(payload.errors).toBeUndefined();
      const cart = payload.data.cart;
      expect(cart.lines.pageInfo.hasNextPage).toBe(false);
      const lines = cart.lines.nodes as Array<{id: string; quantity: number; attributes: Array<{key: string; value: string}>;
        parentRelationship: {parent: {id: string}} | null; merchandise: {id: string; price: {amount: string; currencyCode: string}; requiresShipping: boolean; product: {title: string}}}>;
      const parents = lines.filter(line => !line.parentRelationship);
      expect(parents).toHaveLength(1);
      expect(parents[0].merchandise.id).toBe(product!.variants[0].id);
      expect(Number(parents[0].merchandise.price.amount)).toBe(Number(product!.priceRange.minVariantPrice.amount));
      const total = lines.reduce((sum, line) => sum + Number(line.merchandise.price.amount) * line.quantity, 0);
      expect(total).toBe(preset.totalPrice);
      expect(lines.every(line => line.merchandise.price.currencyCode === 'USD')).toBe(true);
      expect(lines.filter(line => line.parentRelationship).every(line => line.parentRelationship!.parent.id === parents[0].id && !line.merchandise.requiresShipping)).toBe(true);
      carts.push({tier: preset.id, totalBeforeDiscounts: total, lines: lines.map(line => ({title: line.merchandise.product.title,
        quantity: line.quantity, amount: line.merchandise.price.amount, attachedToParent: Boolean(line.parentRelationship)}))});
    }
    results.push({sku: row.sku, url: response.url, runtimeHash: row.runtimeHash, carts});
    await writeFile(`${directory}/live-api-proof.json`, JSON.stringify({at: new Date().toISOString(), results, ordersPlaced: 0}, null, 2));
  }
}, 240_000);
