import {readFile, writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {expect, it} from 'vitest';

it.skipIf(process.env.DOL275_CHARGE_AUDIT !== '1')('reads existing SE charge candidates without writes', async () => {
  Object.assign(process.env, parseEnv(await readFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local', 'utf8')));
  const {adminFetch} = await import('@/lib/shopify/admin');
  const nodes: Array<{title: string}> = [];
  for (const term of ['Gel', 'EVO', 'Loose', 'Painting']) {
  let cursor: string | null = null;
  for (let page = 0; page < 20; page++) {
  const result: {products: {nodes: Array<{title: string}>; pageInfo: {hasNextPage: boolean; endCursor: string}}} = await adminFetch(`query($cursor:String,$query:String!) {
    products(first:100,after:$cursor,query:$query) {pageInfo{hasNextPage endCursor}nodes {
      id title handle status tags descriptionHtml
      resourcePublicationsV2(first:30){nodes{isPublished publication{id name}}}
      variants(first:5){nodes{id price taxable inventoryPolicy inventoryItem{requiresShipping tracked}}}
    }}
  }`, {cursor, query: `tag:dollwow-system AND title:${term}`});
  nodes.push(...result.products.nodes);
  if (!result.products.pageInfo.hasNextPage) break;
  expect(page).toBeLessThan(19);
  cursor = result.products.pageInfo.endCursor;
  }
  }
  await writeFile('data/exports/dol-275-2026-10-29/existing-charge-audit.json', JSON.stringify({products: {nodes: nodes.filter(node => /^SE Doll\b/.test(node.title))}, totalSystemRead: nodes.length}, null, 2));
}, 120_000);
