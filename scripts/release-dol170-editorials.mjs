import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const directory = 'data/exports/dol-170-2026-10-29';
const mode = process.argv[2];
assert(['backup', 'execute', 'recover', 'verify'].includes(mode), 'Choose backup, execute, recover or verify');
const approved = JSON.parse(await fs.readFile(`${directory}/approved-payload.json`, 'utf8'));
const handles = Object.keys(approved);
assert.equal(handles.length, 237);
assert.equal(handles.filter(h => h.startsWith('funwest-')).length, 164);
assert.equal(handles.filter(h => h.startsWith('top-fire-')).length, 73);
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const payloadHash = hash(approved);
const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
assert(domain && !domain.includes('/'), 'Shop domain required');
let token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
if (!token) {
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({grant_type: 'client_credentials', client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET})});
  const body = await response.json();
  assert(response.ok && body.access_token, 'Admin authentication failed');
  token = body.access_token;
}
async function admin(query, variables = {}) {
  const readOnly = query.trimStart().startsWith('query');
  for (let attempt = 0; attempt < (readOnly ? 3 : 1); attempt++) {
    const response = await fetch(`https://${domain}/admin/api/2026-04/graphql.json`, {
      method: 'POST', headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': token},
      body: JSON.stringify({query, variables})});
    if (readOnly && response.status >= 500 && attempt < 2) {
      await response.arrayBuffer();
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      continue;
    }
    const raw = await response.text();
    let body;
    try { body = JSON.parse(raw); } catch { throw new Error(`Admin non-JSON HTTP${response.status}; mutation is never retried automatically`); }
    assert(response.ok && !body.errors?.length, JSON.stringify(body.errors ?? response.status));
    const throttle = body.extensions?.cost?.throttleStatus;
    if (throttle && throttle.currentlyAvailable < 150 && throttle.restoreRate > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.ceil((150 - throttle.currentlyAvailable) / throttle.restoreRate * 1000)));
    }
    return body.data;
  }
}
async function readProducts() {
  const products = [];
  for (let offset = 0; offset < handles.length; offset += 15) {
    const batch = handles.slice(offset, offset + 15);
    const data = await admin(`query {${batch.map((handle, i) => `p${i}: productByHandle(handle:${JSON.stringify(handle)}) {
      id handle title vendor status updatedAt
      editorial: metafield(namespace:"custom",key:"editorial_intro") {id type value compareDigest}
      media(first:3) {nodes { ... on MediaImage {image {url altText width height}}}}
    }`).join('\n')}}`);
    for (let i = 0; i < batch.length; i++) {
      const p = data[`p${i}`];
      assert(p && p.handle === batch[i], `Missing exact handle ${batch[i]}`);
      assert.equal(p.status, 'ACTIVE', `Product not ACTIVE: ${p.handle}`);
      assert.match(p.title, /Fun\s?West|Top\s?Fire/i, `Unexpected product title ${p.handle}`);
      assert.match(p.vendor, /Fun\s?West|Top\s?Fire|DollWow/i);
      assert(!p.editorial || p.editorial.type === 'json', `Unexpected field type ${p.handle}`);
      products.push(p);
    }
  }
  return products;
}
if (mode === 'backup') {
  const products = await readProducts();
  await fs.writeFile(`${directory}/before.json`, JSON.stringify({at: new Date().toISOString(), payloadHash, products}, null, 2), {flag:'wx'});
  console.log(JSON.stringify({backedUp:products.length, missingPrior:products.filter(p => !p.editorial).length,
    payloadHash, flagged:products.filter(p => p.handle.includes('fwd057') || p.handle.includes('ai-suction-head-hip-rotation')).map(p => ({handle:p.handle,photos:p.media.nodes}))}));
} else {
  const before = JSON.parse(await fs.readFile(`${directory}/before.json`, 'utf8'));
  assert.equal(before.payloadHash, payloadHash, 'Payload changed after backup');
  assert.equal(before.products.length, 237);
  if (mode === 'execute' || mode === 'recover') {
    assert.equal(process.env.DOL170_APPROVAL, '93579e6f-6389-49f6-81ec-62975118a586');
    const review = JSON.parse(await fs.readFile(`${directory}/flagged-review.json`, 'utf8'));
    assert.equal(review.payloadHash, payloadHash);
    assert.equal(review.ready, true);
    const existing = mode === 'recover' ? JSON.parse(await fs.readFile(`${directory}/write-journal.json`, 'utf8')) : null;
    if (existing) assert.equal(existing.payloadHash, payloadHash);
    const fresh = await readProducts();
    for (let i = 0; i < fresh.length; i++) {
      assert.equal(fresh[i].id, before.products[i].id);
      if (existing?.acknowledged.some(x => x.id === fresh[i].id)) {
        assert.equal(hash(JSON.parse(fresh[i].editorial.value)), hash(approved[fresh[i].handle]));
      } else {
        assert.equal(fresh[i].editorial?.compareDigest ?? null, before.products[i].editorial?.compareDigest ?? null,
          `Unacknowledged editorial changed after backup: ${fresh[i].handle}; inspect before any retry`);
      }
    }
    const journal = existing ?? {at:new Date().toISOString(), state:'STARTED', payloadHash, acknowledged:[], pending:null};
    if (!existing) await fs.writeFile(`${directory}/write-journal.json`, JSON.stringify(journal,null,2), {flag:'wx'});
    const remaining = before.products.filter(p => !journal.acknowledged.some(x => x.id === p.id));
    if (existing) assert.deepEqual(remaining.map(p => p.id), existing.pending.map(p => p.id), 'Recovery limited to exact pending batch');
    for (let offset = 0; offset < remaining.length; offset += 25) {
      const batch = remaining.slice(offset,offset+25);
      journal.pending = batch.map(p => ({id:p.id,handle:p.handle}));
      await fs.writeFile(`${directory}/write-journal.json`, JSON.stringify(journal,null,2));
      const metafields = batch.map(p => ({ownerId:p.id,namespace:'custom',key:'editorial_intro',type:'json',
        value:JSON.stringify(approved[p.handle]),compareDigest:p.editorial?.compareDigest ?? null}));
      const data = await admin(`mutation($metafields:[MetafieldsSetInput!]!){metafieldsSet(metafields:$metafields){
        metafields {owner { ... on Product {id handle}} value compareDigest} userErrors {field message code}}}`,{metafields});
      assert.equal(data.metafieldsSet.userErrors.length,0,JSON.stringify(data.metafieldsSet.userErrors));
      assert.equal(data.metafieldsSet.metafields.length,batch.length);
      for (const row of data.metafieldsSet.metafields) {
        assert.equal(hash(JSON.parse(row.value)),hash(approved[row.owner.handle]));
        journal.acknowledged.push({id:row.owner.id,handle:row.owner.handle,compareDigest:row.compareDigest});
      }
      journal.pending = null;
      await fs.writeFile(`${directory}/write-journal.json`, JSON.stringify(journal,null,2));
      console.log(`Acknowledged ${journal.acknowledged.length}/237`);
    }
    journal.state = 'ALL_237_ACKNOWLEDGED_PENDING_INDEPENDENT_READBACK';
    await fs.writeFile(`${directory}/write-journal.json`, JSON.stringify(journal,null,2));
  } else {
    const products = await readProducts();
    for (const p of products) {
      assert.equal(hash(JSON.parse(p.editorial.value)),hash(approved[p.handle]), `Readback mismatch ${p.handle}`);
      const old = before.products.find(x => x.id === p.id);
      assert(old && p.handle === old.handle && p.title === old.title && p.vendor === old.vendor);
    }
    await fs.writeFile(`${directory}/admin-readback.json`,JSON.stringify({at:new Date().toISOString(),verified:products.length,payloadHash,products},null,2));
    console.log('Independent Admin readback: all237 exactly match approved payload');
  }
}
