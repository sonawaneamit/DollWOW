import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const [directory] = process.argv.slice(2);
assert(directory, 'Provide the reviewed Laura M10 source directory');
const additionsFile = 'data/draft-previews/gynoid-oct28-additions.json';
const rulesFile = 'data/draft-previews/gynoid-oct28-rules.json';
const saved = JSON.parse(await fs.readFile('data/draft-previews/gynoid-oct28.json'));
const additions = JSON.parse(await fs.readFile(additionsFile));
const original = saved.find(p => p.handle === 'gynoid-kelly-eveline-172cm-silicone-companion-doll-model-10');
assert(original && original.priceRange.minVariantPrice.amount === '5299.00');
const product = structuredClone(original);
product.id = 'preview:gynoid:laura-m10-official';
product.handle = 'gynoid-laura-172cm-silicone-companion-doll-model-10';
assert(![...saved, ...additions].some(p => p.handle === product.handle), 'Candidate already exists; do not append a duplicate');
product.title = 'Gynoid Laura 172cm Silicone Companion Doll';
product.description = "Laura pairs the photographed Laura head with Gynoid's standard 172cm Model 10 silicone body. The official photographs show different wigs; clothing, jewelry, shoes and scene props are not confirmed inclusions. This is a made-to-order build.";
product.variants[0].id = 'preview:variant:gynoid:laura-m10-official';
product.seo = { title: 'Gynoid Laura 172cm Silicone Doll | DollWOW', description: 'Laura with the standard Model 10 body. Compare original factory photographs, body-only weight and model-specific configuration.' };
Object.assign(product.extended, {
  displayName: 'Laura', headModel: 'Laura', bodyCode: 'M10', sourceTitle: product.title,
  heightCm: 172,
  measurements: {
    Height: '172cm', 'Cup size': original.extended.cupSize,
    Bust: '85cm', Waist: '60cm', Hip: '88cm', 'Feet Length': '22cm',
    'Shoulders Width': '37.5cm', Underbust: '67cm',
    'Factory body weight': '33kg (body only; +/-3kg)'
  },
  editorialIntro: {
    eyebrow: 'A Change of Scene', heading: 'Laura beside the window',
    paragraph: 'A pink velvet chair, a pale dress and light from the window set the scene for Laura. The factory photographs pair her defined features with a short brown wig, while a second set shows silver-grey hair against a white and gold bench. These are two photographed looks for the same Laura and Model 10 pairing, not two dolls or a promise of included styling accessories. The 172 cm silicone body is distinct from the smaller Model 11 version, with its own body measurements and handling weight.'
  }
});
delete product.extended.weightLb;
delete product.extended.deliveryEstimate;
const eyes = product.extended.customizationGroups.find(g => g.id === 'eye-color');
assert(eyes.visibleWhen.some(branch => branch.some(condition => condition.groupId === 'head' && condition.optionId === 'no-change')));
const sourceNames = ['_MG_0646.jpg', '_MG_0663.jpg', '_MG_0801.jpg', '_MG_0805.jpg'];
const destination = 'public/images/products/gynoid-oct28/laura-m10';
await fs.mkdir(destination, { recursive: true });
product.images = [];
const retained = [];
for (const name of sourceNames) {
  const bytes = await fs.readFile(path.join(directory, name));
  await fs.copyFile(path.join(directory, name), `${destination}/${name}`);
  retained.push({ file: name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  product.images.push({ url: `/images/products/gynoid-oct28/laura-m10/${name}`, altText: `Gynoid Laura with standard Model 10 body - original factory photograph ${name}` });
}
product.featuredImage = product.images[0];
const rules = JSON.parse(await fs.readFile(rulesFile));
rules[product.id] = structuredClone(rules[original.id]);
assert(rules[product.id].some(rule => rule.id === 'gynoid-jaw-head-no-change'));
await fs.writeFile(additionsFile, JSON.stringify([...additions, product], null, 2) + '\n');
await fs.writeFile(rulesFile, JSON.stringify(rules, null, 2) + '\n');
await fs.writeFile(path.join(directory, 'preview-source.json'), JSON.stringify({
  checkedAt: new Date().toISOString(), status: 'PRIVATE_CANDIDATE_NOT_RELEASED',
  officialFolder: '1ISQRQaVt5vmHRyTTScRyCboOqi9UgrWP', sourcePhotoCount: 13,
  galleryReview: 'All 13 contact-reviewed; four retained originals inspected full size. Consistent adult presentation in selected photographs. Two-doll composition not selected for single-product clarity.',
  facts: 'Official PO Purchasing Order A26/B26: 172cm, 33kg body-only +/-3kg, 85/60/88cm, feet22cm, shoulder37.5cm, underbust67cm. F-Cup is retained M10 classification, not inferred from measurements.',
  price: { amount: 5299, basis: 'Retained M10 family price per Martin28Oct16:06 decision, not factory EXW guide cost or new production price approval' },
  retained, templateParent: original.handle,
  controls: 'Inherits exact reviewed M10 menu/recipe/rules; alternate heads held unavailable by the existing private projection; no Shopify record created',
  pending: ['Dolly visual/source/menu review', 'Current option reconciliation and head entitlement', 'Actual freight and lead time', 'Named-charge preflight', 'Martin exact final release yes'],
  existingDraftsChanged: 0, shopifyWrites: 0
}, null, 2) + '\n');
console.log(JSON.stringify({ candidate: product.handle, retainedOriginals: retained.length, existingDraftsChanged: 0 }));
