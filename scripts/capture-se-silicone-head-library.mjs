import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {parse} from 'node-html-parser';

const source = 'https://www.sedoll.com/product/single-silicone-head/';
const response = await fetch(source);
assert(response.ok, `Factory catalogue returned ${response.status}`);
const html = await response.text();
const root = parse(html);
const heads = new Map();
for (const group of root.querySelectorAll('.cpf-element')) {
  const title = group.querySelector('.tc-epo-element-label-text')?.text.trim();
  if (!['Choose ROS Head', 'Choose Non-ROS Head'].includes(title)) continue;
  for (const choice of group.querySelectorAll('.tmcp-field-wrap')) {
    const label = choice.querySelector('.tc-label-text')?.text.trim();
    const image = choice.querySelector('input')?.getAttribute('data-image');
    if (!label?.match(/^#\d{3}S[OC](?:-\d+)?$/) || !image) continue;
    const id = label.slice(1).toLowerCase();
    if (!heads.has(id)) heads.set(id, {id, label, ros:title === 'Choose ROS Head', image:new URL(image, source).href});
  }
}
assert(heads.size > 40, `Incomplete factory head catalogue: ${heads.size}`);
const data = {source, reviewedAt:new Date().toISOString(), approval:'Owner confirmed all listed heads compatible, Light Tan only, 3 October 2026', heads:[...heads.values()]};
await fs.writeFile('data/promotions/se-silicone-head-library.json', JSON.stringify(data, null, 2) + '\n');
const backup = '/Volumes/Extreme Pro/Projects/DollWOW/data/supplier-assets/se-doll/2026-10-03';
await fs.mkdir(backup, {recursive:true});
await fs.writeFile(`${backup}/single-silicone-head.html`, html);
await fs.writeFile(`${backup}/silicone-head-library.json`, JSON.stringify(data, null, 2) + '\n');
console.log(JSON.stringify({heads:data.heads.length, ros:data.heads.filter(x=>x.ros).length, nonRos:data.heads.filter(x=>!x.ros).length}));
