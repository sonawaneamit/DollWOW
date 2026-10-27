import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [proposalFile, adminModule, outputDirectory] = process.argv.slice(2);
if (!proposalFile || !adminModule || !outputDirectory) throw new Error('Expected proposal JSON, existing admin helper, output directory.');
const { admin } = await import(pathToFileURL(path.resolve(adminModule)).href);
const proposal = JSON.parse(await fs.readFile(proposalFile, 'utf8'));
const products = [];
let after = null;
do {
  const data = await admin(`query($after:String){ products(first:100,after:$after,query:"handle:funwest-*") {
    pageInfo { hasNextPage endCursor }
    nodes { id handle title vendor status brand:metafield(namespace:"custom",key:"brand"){value} variants(first:100) { pageInfo {hasNextPage} nodes {id title price compareAtPrice} } }
  } }`, { after });
  products.push(...data.products.nodes);
  after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
} while (after);
const receipts = proposal.map(row => {
  const matches = products.filter(product => product.handle === row.handle);
  if (matches.length !== 1) throw new Error(`Expected one product for ${row.handle}, got ${matches.length}`);
  const product = matches[0];
  if (product.brand?.value !== 'FunWest Dolls' || product.status !== 'ACTIVE' || product.variants.pageInfo.hasNextPage) throw new Error(`Unapproved brand/status or incomplete variants: ${row.handle}`);
  if (!product.variants.nodes.length || product.variants.nodes.some(variant => Number(variant.price) !== row.before)) throw new Error(`Current variant price differs from approved sheet: ${row.handle}`);
  return { ...row, id: product.id, variants: product.variants.nodes };
});
const manifest = receipts.map(({id, handle, title, before, after, variants}) => ({id, handle, title, before, after, variantIds: variants.map(variant => variant.id)}));
await fs.mkdir(outputDirectory, {recursive:true});
await fs.writeFile(path.join(outputDirectory, 'live-audit.json'), JSON.stringify({readAt:new Date().toISOString(), productCount:products.length, receipts}, null, 2)+'\n');
await fs.mkdir('data/pricing', {recursive:true});
await fs.writeFile('data/pricing/dol276-funwest-preview.json', JSON.stringify(manifest, null, 2)+'\n');
await fs.mkdir('docs/pricing', {recursive:true});
await fs.writeFile('docs/pricing/dol-276-before-after.md', '# DOL-276 FunWest Price Preview\n\nPreview only. No live price writes. Source: Greenback v4, 27 October 2026.\n\n| Product | Current USD | Proposed USD | Increase USD |\n| --- | ---: | ---: | ---: |\n'+receipts.map(row => `| [${row.title}](/products/${row.handle}) | ${row.before} | ${row.after} | ${row.after-row.before} |`).join('\n')+'\n');
console.log(JSON.stringify({matched:receipts.length, variants:receipts.reduce((sum,row)=>sum+row.variants.length,0), otherProducts:products.length-receipts.length, liveWrites:0}));
