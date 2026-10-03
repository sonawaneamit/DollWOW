import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const packet=JSON.parse(await fs.readFile('/Volumes/Extreme Pro/Projects/DollWOW/data/exports/se-october-packet.json','utf8'));
const [charge]=JSON.parse(await fs.readFile('/Volumes/Extreme Pro/Projects/DollWOW/data/exports/se-silicone-head-charge.json','utf8'));
const library=JSON.parse(await fs.readFile('data/promotions/se-silicone-head-library.json','utf8'));
const path='lib/cart/evidence/named-upgrades-release.json';
const registry=JSON.parse(await fs.readFile(path,'utf8'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(registry.approval.payloadHash,hash(registry.payload));
assert.equal(charge.unitAmount,100);assert.equal(charge.productTitle,'SE Doll Silicone Head Upgrade');
const choiceLabels=library.heads.map(h=>`${h.label} (${h.ros?'ROS':'Non-ROS'})`);
let count=0;
for(const p of packet.lightweight){
 const old=registry.payload.groups[registry.payload.parents[p.parent]];
 assert(old?.length,`Missing named charges: ${p.handle}`);
 assert(!old.some(b=>b.group===charge.group),`Upgrade already released: ${p.handle}`);
 const next=[...old,{...charge,choiceLabels}];
 const key=`se-head-${hash(next).slice(0,16)}`;
 registry.payload.groups[key]=next;registry.payload.parents[p.parent]=key;count++;
}
assert.equal(count,115);
registry.payload.releaseId='named-upgrades-2026-10-03-se-silicone-head';
registry.approval={payloadHash:hash(registry.payload),reviewedAt:new Date().toISOString(),evidenceRef:'docs/catalog/se-silicone-head-release-2026-10-03.md'};
await fs.writeFile(path,JSON.stringify(registry)+'\n');
console.log(JSON.stringify({parents:count,heads:choiceLabels.length,charge:charge.merchandiseId}));
