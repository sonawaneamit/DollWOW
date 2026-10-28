import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const [directory] = process.argv.slice(2);
assert(directory, 'Provide the reviewed official source directory');
const saved = JSON.parse(await fs.readFile('data/draft-previews/gynoid-oct28.json'));
const original = saved.find(p => p.handle.endsWith('model-11'));
const product = structuredClone(original);
product.id = 'preview:gynoid:laura-m11-official';
product.handle = 'gynoid-laura-162cm-silicone-companion-doll-model-11';
assert(!saved.some(p => p.handle === product.handle));
product.title = 'Gynoid Laura 162cm Silicone Companion Doll';
product.description = "Laura pairs Gynoid's standard 162cm Model 11 silicone body with the Laura head. The official photographs show different wigs and outfits; clothing and scene props are not confirmed inclusions. This is a made-to-order build.";
product.variants[0].id = 'preview:variant:gynoid:laura-m11-official';
product.seo = { title: 'Gynoid Laura 162cm Silicone Doll | DollWOW', description: 'Laura with the standard Gynoid Model 11 body. Compare original factory photos, measurements and the model-specific configuration.' };
product.extended.displayName = 'Laura';
product.extended.headModel = 'Laura';
product.extended.bodyCode = 'M11';
product.extended.measurements = {
  Height: '162cm', 'Cup size': 'E-Cup', Bust: '85cm', Waist: '60cm', Hip: '88cm',
  'Feet Length': '22cm', 'Shoulders Width': '37.5cm', Underbust: '67cm',
  'Factory body weight': '29kg (body only; +/-3kg)'
};
product.extended.editorialIntro = {
  eyebrow: 'Between One Thing and the Next', heading: 'A Pause in the Kitchen',
  paragraph: "The kettle is ready; the conversation is not quite finished. Laura stands beside the counter, her short silver-grey wig catching the light from the window. The room is ordinary, and that is its appeal: a quiet corner, a familiar routine, a moment with nowhere else to be."
};
// Unlike the photographed closed-eye parent, Laura's default head has open eyes.
const eyes = product.extended.customizationGroups.find(g => g.id === 'eye-color');
eyes.visibleWhen.push([{ groupId: 'head', optionId: 'no-change' }]);
const sourceNames = ['1601', '1606', '1116', '1638'];
await fs.mkdir('public/images/products/gynoid-oct28/laura-m11', { recursive: true });
const evidence = [];
product.images = [];
for (const code of sourceNames) {
  const file = `laura-m11-${code}.jpg`, bytes = await fs.readFile(path.join(directory, file));
  await fs.copyFile(path.join(directory, file), `public/images/products/gynoid-oct28/laura-m11/${file}`);
  product.images.push({ url: `/images/products/gynoid-oct28/laura-m11/${file}`, altText: `Gynoid Laura with standard Model 11 body - original factory photo ${code}` });
  evidence.push({ file, sha256: createHash('sha256').update(bytes).digest('hex') });
}
product.featuredImage = product.images[0];
const rules = JSON.parse(await fs.readFile('data/draft-previews/gynoid-oct28-rules.json'));
rules[product.id] = structuredClone(rules[original.id]);
await fs.writeFile('data/draft-previews/gynoid-oct28-additions.json', JSON.stringify([product], null, 2) + '\n');
await fs.writeFile('data/draft-previews/gynoid-oct28-rules.json', JSON.stringify(rules, null, 2) + '\n');
await fs.writeFile(path.join(directory, 'laura-m11-preview-source.json'), JSON.stringify({
  checkedAt: new Date().toISOString(), status: 'PREVIEW_CANDIDATE_NOT_RELEASED',
  officialFolder: '1VJixc0KHgltLAO_NhhHNj9xKUE-MYLPn',
  officialListing: 'https://www.gynoiddolls.com/Laura-Gynoid-Silicone-Sex-Doll-Model-11-162cm-5-4-p19758436.html',
  price: { amount: 4799, currency: 'USD', basis: 'Exact current official Laura M11 listing; shipping not established' },
  facts: 'Official PO Purchasing Order A38/B38; body weight excludes head; existing reviewed E-Cup classification retained, not inferred from bust',
  originalsReviewed: ['0928','1071','1075','1092','1116','1117','1601','1606','1625','1638'],
  retained: evidence, omitted: 'Other campaign views, exposed-detail views and photographer-in-frame images not selected for this four-image preview',
  templateParent: original.handle, exception: 'Open-eye photographed default adds eye-color visibility on head=no-change; Laura remains incompatible with movable jaw',
  pending: ['Dolly visual/menu/source review', 'Current option-price reconciliation', 'Exact named-charge release binding', 'Shipping/lead-time confirmation', 'Martin exact live approval'],
  shopifyWrites: 0, existingDraftsChanged: 0
}, null, 2));
console.log(JSON.stringify({ candidate: product.handle, retainedOriginals: evidence.length, existingDraftsChanged: 0 }));
