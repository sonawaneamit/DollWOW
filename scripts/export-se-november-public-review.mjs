import fs from 'node:fs/promises';

const directory = 'data/exports/dol-285-2026-10-29';
const source = JSON.parse(await fs.readFile(`${directory}/review-comparison-private.json`, 'utf8'));
const sampleHandles = [
  'sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o',
  'sedoll-jenny-163cm-c-cup-silicone-t163-ses115',
  'sedoll-jenny-o-set011-st4-111cm-g-cup-silicone-companion-doll'
];
// Explicit public allowlist: never export raw menus, unit costs, source dumps or held artwork.
const output = {
  sourceAt: source.sourceAt,
  counts: Object.fromEntries([...new Set(source.rows.map(row => row.cohort))].map(cohort => [cohort, source.rows.filter(row => row.cohort === cohort).length])),
  samples: sampleHandles.map(handle => {
    const row = source.rows.find(row => row.handle === handle);
    if (!row) throw Error(`Missing reviewed sample ${handle}`);
    return { handle, title: row.title, cohort: row.cohort, baseRetail: row.baseRetail, image: row.image,
      quotes: row.quotes.map(({ groupId, optionId, label, current, proposed, reductionPercent }) => ({ groupId, optionId, label, current, proposed, reductionPercent })) };
  }),
  stock: source.rows.filter(row => row.cohort === 'warehouse').map(({ handle, title, baseRetail, warehouseCountry }) => ({ handle, title, baseRetail, warehouseCountry }))
};
await fs.mkdir('data/promotion-previews', { recursive: true });
await fs.writeFile('data/promotion-previews/se-november-review.json', JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ samples: output.samples.length, warehouseRows: output.stock.length, privateFieldsExported: false }));
