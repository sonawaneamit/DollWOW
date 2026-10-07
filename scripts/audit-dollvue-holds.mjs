import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const arg = name => process.argv.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const adminModule = arg('admin-module');
const output = arg('output');
assert(adminModule && output, 'Supply --admin-module and a private --output path');
const { api } = await import(pathToFileURL(adminModule).href);
const rows = [];
let after = null;
do {
  const data = await api(`query($after:String){products(first:100,after:$after,query:"status:active OR status:draft"){
    nodes{id handle status updatedAt tags hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value}}
    pageInfo{hasNextPage endCursor}}}`, { after });
  assert(data?.products?.nodes, 'Missing product page');
  rows.push(...data.products.nodes);
  after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
} while (after);
const held = rows.filter(row => row.hold?.value?.trim() || row.tags.some(tag => /age.*hold|safety.*hold|content.*hold/i.test(tag)));
await fs.writeFile(output, JSON.stringify({ checkedAt: new Date().toISOString(), count: rows.length, held, rows }, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ count: rows.length, held: held.length, activeHeld: held.filter(row => row.status === 'ACTIVE').length }));
