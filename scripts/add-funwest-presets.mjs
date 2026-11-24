#!/usr/bin/env node
/**
 * Add FunWest preset recipes to template-release.json
 * DOL-399: FunWest pricing packages
 */

import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

const templateReleasePath = './lib/customization/evidence/template-release.json';
const release = JSON.parse(readFileSync(templateReleasePath, 'utf8'));

// FunWest Silicone recipe (using accessories: insert $50, blanket $100, holder $50)
const funwestSiliconeRecipe = {
  "tag": "options:funwest-silicone-full-body-v1",
  "signature": "sha256:PLACEHOLDER_WILL_UPDATE",
  "tiers": [
    {
      "id": "starter",
      "description": "Essential care kit and head stand for safe storage.",
      "add": [
        {
          "groupId": "accessories",
          "optionId": "head-stand-holder"
        }
      ],
      "remove": []
    },
    {
      "id": "enthusiast",
      "description": "Replaceable insert with heating comfort.",
      "add": [
        {
          "groupId": "accessories",
          "optionId": "replaceable-vagina-insert"
        },
        {
          "groupId": "accessories",
          "optionId": "heating-blanket"
        }
      ],
      "remove": []
    },
    {
      "id": "collector",
      "description": "Complete care system with all comfort upgrades.",
      "add": [
        {
          "groupId": "accessories",
          "optionId": "replaceable-vagina-insert"
        },
        {
          "groupId": "accessories",
          "optionId": "heating-blanket"
        },
        {
          "groupId": "accessories",
          "optionId": "head-stand-holder"
        }
      ],
      "remove": []
    }
  ]
};

// FunWest TPE recipe (same structure, different tag)
const funwestTpeRecipe = {
  ...funwestSiliconeRecipe,
  "tag": "options:funwest-tpe-full-body-v1"
};

// Generate binding keys (hash of recipes)
function recipeHash(recipe) {
  return createHash('sha256').update(JSON.stringify(recipe)).digest('hex');
}

const siliconeBindingKey = recipeHash(funwestSiliconeRecipe);
const tpeBindingKey = recipeHash(funwestTpeRecipe);

console.log('FunWest Silicone binding:', siliconeBindingKey);
console.log('FunWest TPE binding:', tpeBindingKey);

// Add bindings to payload
release.payload.bindings[siliconeBindingKey] = funwestSiliconeRecipe;
release.payload.bindings[tpeBindingKey] = funwestTpeRecipe;

// Update all FunWest entries to use new bindings
let updatedSilicone = 0;
let updatedTpe = 0;

release.payload.entries.forEach(entry => {
  if (entry.tag === 'options:funwest-silicone-full-body-v1') {
    entry.bindingKey = siliconeBindingKey;
    updatedSilicone++;
  } else if (entry.tag === 'options:funwest-tpe-full-body-v1') {
    entry.bindingKey = tpeBindingKey;
    updatedTpe++;
  }
});

console.log(`Updated ${updatedSilicone} silicone products`);
console.log(`Updated ${updatedTpe} TPE products`);
console.log(`Total FunWest products: ${updatedSilicone + updatedTpe}`);

// Write updated release
writeFileSync(templateReleasePath, JSON.stringify(release, null, 2) + '\n');
console.log('✓ Updated template-release.json');
