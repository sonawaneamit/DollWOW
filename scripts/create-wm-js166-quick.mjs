#!/usr/bin/env node
/**
 * Quick product creation for WM Jade Sterling 164cm G-Cup JS166
 * Based on WM Christophe template (handle: wm-christophe-164cm-f-cup-silicone-companion-doll-1hyqg)
 * Price: $2,159 (Rosemary competitor pricing)
 * Photos: 21 from Drive folder (manual upload required)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-10";

await loadLocalEnv();

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

if (!SHOPIFY_STORE || !SHOPIFY_ADMIN_TOKEN) {
  console.error("Missing SHOPIFY_STORE or SHOPIFY_ADMIN_API_TOKEN");
  process.exit(1);
}

async function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env.local");
  try {
    const text = await fs.readFile(envPath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index === -1) continue;
      const key = line.slice(0, index).trim();
      let value = line.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] ||= value;
    }
  } catch {
    // Local env is optional
  }
}

// Same customization groups as Christophe (copied from GraphQL response)
const customizationGroups = [
  {
    "id": "skin-tone",
    "label": "Skin Tone",
    "display": "swatches",
    "selectionMode": "single",
    "options": [
      {"id": "no-change", "label": "Factory default", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/04/default-300x300.jpg", "label": "No Change"}, "productionNote": "Default supplier selection."},
      {"id": "fair-skin", "label": "Fair Skin", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/1-300x201.jpg", "label": "Fair Skin"}},
      {"id": "light-tan-skin", "label": "Light Tan Skin", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/2-300x202.jpg", "label": "Light Tan Skin"}},
      {"id": "dark-tan-skin", "label": "Dark Tan Skin", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/3-300x207.jpg", "label": "Dark Tan Skin"}}
    ]
  },
  {
    "id": "hairstyle",
    "label": "Hairstyle",
    "display": "swatches",
    "selectionMode": "single",
    "options": [
      {"id": "no-change", "label": "Factory default", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/04/default-300x300.jpg", "label": "No Change"}, "productionNote": "Default supplier selection."},
      {"id": "hairstyle-1", "label": "Hairstyle #1", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/1-1-300x184.jpg", "label": "Hairstyle #1"}},
      {"id": "hairstyle-2", "label": "Hairstyle #2", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/2-1-300x182.jpg", "label": "Hairstyle #2"}},
      {"id": "hairstyle-3", "label": "Hairstyle #3", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/3-1-300x181.jpg", "label": "Hairstyle #3"}},
      {"id": "hairstyle-4", "label": "Hairstyle #4", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/4-1-300x184.jpg", "label": "Hairstyle #4"}},
      {"id": "hairstyle-5", "label": "Hairstyle #5", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/5-300x176.jpg", "label": "Hairstyle #5"}},
      {"id": "hairstyle-6", "label": "Hairstyle #6", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/6-300x183.jpg", "label": "Hairstyle #6"}},
      {"id": "hairstyle-7", "label": "Hairstyle #7", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/7-300x181.jpg", "label": "Hairstyle #7"}}
    ]
  },
  {
    "id": "eye-color",
    "label": "Eye Color",
    "display": "swatches",
    "selectionMode": "single",
    "options": [
      {"id": "no-change", "label": "Factory default", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/04/default-300x300.jpg", "label": "No Change"}, "productionNote": "Default supplier selection."},
      {"id": "no-1", "label": "No.1", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/1-2.jpg", "label": "No.1"}},
      {"id": "no-2", "label": "No.2", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/2-2.jpg", "label": "No.2"}},
      {"id": "no-3", "label": "No.3", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/3-2.jpg", "label": "No.3"}},
      {"id": "no-4", "label": "No.4", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/4-2.jpg", "label": "No.4"}},
      {"id": "no-5", "label": "No.5", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/5-1.jpg", "label": "No.5"}},
      {"id": "no-6", "label": "No.6", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/6-1.jpg", "label": "No.6"}},
      {"id": "no-7", "label": "No.7", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/7-1.jpg", "label": "No.7"}}
    ]
  },
  {
    "id": "lipstick-color",
    "label": "Lipstick Color",
    "display": "swatches",
    "selectionMode": "single",
    "options": [
      {"id": "no-change", "label": "Factory default", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/04/default-300x300.jpg", "label": "No Change"}, "productionNote": "Default supplier selection."},
      {"id": "no-1", "label": "No.1", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/1-8-300x300.jpg", "label": "No.1"}},
      {"id": "no-2", "label": "No.2", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/2-8-300x298.jpg", "label": "No.2"}},
      {"id": "no-3", "label": "No.3", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/3-7-300x293.jpg", "label": "No.3"}},
      {"id": "no-4", "label": "No.4", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/4-6-300x293.jpg", "label": "No.4"}}
    ]
  },
  {
    "id": "nail-color",
    "label": "Nail Color",
    "display": "swatches",
    "selectionMode": "single",
    "options": [
      {"id": "no-change", "label": "Factory default", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/04/default-300x300.jpg", "label": "No Change"}, "productionNote": "Default supplier selection."},
      {"id": "no-1", "label": "No.1", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/1-3-300x300.jpg", "label": "No.1"}},
      {"id": "no-2", "label": "No.2", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/2-3-300x300.jpg", "label": "No.2"}},
      {"id": "no-3", "label": "No.3", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/3-3-300x286.jpg", "label": "No.3"}},
      {"id": "no-4", "label": "No.4", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/4-3-300x289.jpg", "label": "No.4"}},
      {"id": "no-5", "label": "No.5", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/5-2-300x290.jpg", "label": "No.5"}},
      {"id": "no-6", "label": "No.6", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/6-2-297x300.jpg", "label": "No.6"}},
      {"id": "no-7", "label": "No.7", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/7-2-297x300.jpg", "label": "No.7"}},
      {"id": "no-8", "label": "No.8", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/8-300x289.jpg", "label": "No.8"}}
    ]
  },
  {
    "id": "toe-nail-color",
    "label": "Toe Nail Color",
    "display": "swatches",
    "selectionMode": "single",
    "options": [
      {"id": "no-change", "label": "Factory default", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/04/default-300x300.jpg", "label": "No Change"}, "productionNote": "Default supplier selection."},
      {"id": "no-1", "label": "No.1", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/1-4-300x297.jpg", "label": "No.1"}},
      {"id": "no-2", "label": "No.2", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/2-4-300x292.jpg", "label": "No.2"}},
      {"id": "no-3", "label": "No.3", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/3-4-300x289.jpg", "label": "No.3"}},
      {"id": "no-4", "label": "No.4", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/4-4-300x293.jpg", "label": "No.4"}},
      {"id": "no-5", "label": "No.5", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/5-3-300x288.jpg", "label": "No.5"}}
    ]
  },
  {
    "id": "nipple-color",
    "label": "Nipple Color",
    "display": "swatches",
    "selectionMode": "single",
    "options": [
      {"id": "no-change", "label": "Factory default", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/04/default-300x300.jpg", "label": "No Change"}, "productionNote": "Default supplier selection."},
      {"id": "pink", "label": "Pink", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/2-5-300x294.jpg", "label": "Pink"}},
      {"id": "light-tan", "label": "Light Tan", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/1-5-296x300.jpg", "label": "Light Tan"}},
      {"id": "dark-tan", "label": "Dark Tan", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/3-5-300x294.jpg", "label": "Dark Tan"}}
    ]
  },
  {
    "id": "areola-size",
    "label": "Areola Size",
    "display": "swatches",
    "selectionMode": "single",
    "options": [
      {"id": "no-change", "label": "Factory default", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/04/default-300x300.jpg", "label": "No Change"}, "productionNote": "Default supplier selection."},
      {"id": "3cm", "label": "3cm", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/07/3cm.jpg", "label": "3cm"}},
      {"id": "4cm", "label": "4cm", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/07/4cm.jpg", "label": "4cm"}},
      {"id": "5cm", "label": "5cm", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/07/5cm.jpg", "label": "5cm"}}
    ]
  },
  {
    "id": "vagina-color",
    "label": "Vagina Color",
    "display": "swatches",
    "selectionMode": "single",
    "options": [
      {"id": "no-change", "label": "Factory default", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/04/default-300x300.jpg", "label": "No Change"}, "productionNote": "Default supplier selection."},
      {"id": "no-1", "label": "No.1", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/1-6-248x300.jpg", "label": "No.1"}},
      {"id": "no-2", "label": "No.2", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/2-6-261x300.jpg", "label": "No.2"}},
      {"id": "no-3", "label": "No.3", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/3-6-254x300.jpg", "label": "No.3"}},
      {"id": "no-4", "label": "No.4", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/4-5-265x300.jpg", "label": "No.4"}}
    ]
  },
  {
    "id": "vagina-hair-type",
    "label": "Vagina Hair Type",
    "display": "swatches",
    "selectionMode": "single",
    "options": [
      {"id": "none", "label": "None", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/06/option-no-pubic-hair.png", "label": "None"}, "productionNote": "Default supplier selection."},
      {"id": "no-1", "label": "No.1", "priceDelta": 70, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/1-7-300x300.jpg", "label": "No.1"}},
      {"id": "no-2", "label": "No.2", "priceDelta": 70, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/2-7-300x300.jpg", "label": "No.2"}}
    ]
  },
  {
    "id": "vagina",
    "label": "Vagina",
    "display": "swatches",
    "selectionMode": "single",
    "options": [
      {"id": "fixed", "label": "Fixed", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/06/fixed.jpg", "label": "Fixed"}, "productionNote": "Default supplier selection."},
      {"id": "removable-free", "label": "Removable (FREE)", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/06/Insert-1.jpg", "label": "Removable (FREE)"}}
    ]
  },
  {
    "id": "standing-add-on",
    "label": "Standing Add-On",
    "display": "swatches",
    "selectionMode": "single",
    "options": [
      {"id": "non-standing", "label": "Non Standing", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/1-Non-Standing.jpg", "label": "Non Standing"}, "productionNote": "Default supplier selection."},
      {"id": "standing-free", "label": "Standing (FREE)", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/2-StandingWith-Bolts.jpg", "label": "Standing (FREE)"}},
      {"id": "standing-without-bolts-hard-feet", "label": "Standing Without Bolts (Hard Feet)", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/3-StandingWithout-Bolts.jpg", "label": "Standing Without Bolts (Hard Feet)"}}
    ]
  },
  {
    "id": "skeleton-type",
    "label": "Skeleton Type",
    "display": "swatches",
    "selectionMode": "single",
    "options": [
      {"id": "evo-free", "label": "EVO (FREE)", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/04/Enhanced-Shoulders.jpg", "label": "EVO (FREE)"}},
      {"id": "standard", "label": "Standard", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/04/shrug.jpg", "label": "Standard"}, "productionNote": "Default supplier selection."}
    ]
  },
  {
    "id": "insertable-penis-add-on",
    "label": "Insertable Penis Add-On",
    "display": "swatches",
    "selectionMode": "single",
    "options": [
      {"id": "no-change", "label": "Factory default", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/04/default-300x300.jpg", "label": "No Change"}, "productionNote": "Default supplier selection."},
      {"id": "15cm-6", "label": "15cm / 6\"", "priceDelta": 70, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/06/penis_option.jpg", "label": "15cm / 6\""}},
      {"id": "19cm-7-5", "label": "19cm / 7.5\"", "priceDelta": 70, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/06/penis_option.jpg", "label": "19cm / 7.5\""}}
    ]
  },
  {
    "id": "premium-head-body-options",
    "label": "Premium Head & Body Options",
    "display": "swatches",
    "selectionMode": "multiple",
    "options": [
      {"id": "hyper-realism-body-painting-free", "label": "Hyper-realism Body Painting (FREE)", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/10/RS-Makeup.jpg", "label": "Hyper-realism Body Painting (FREE)"}, "productionNote": "Default supplier selection."},
      {"id": "articulated-fingers-free", "label": "Articulated Fingers (FREE)", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/06/Articulated-Fingers.jpg", "label": "Articulated Fingers (FREE)"}, "productionNote": "Default supplier selection."},
      {"id": "hyper-realism-body-painting-freckles-free", "label": "Hyper-realism Body Painting & Freckles (FREE)", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/10/RS-Makeup.jpg", "label": "Hyper-realism Body Painting & Freckles (FREE)"}},
      {"id": "body-heating", "label": "Body Heating", "priceDelta": 150, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/10/3-12.jpg", "label": "Body Heating"}},
      {"id": "head-moaning", "label": "Head Moaning", "priceDelta": 150, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/12/head-moaning.jpg", "label": "Head Moaning"}},
      {"id": "ultra-soft-boobs-free", "label": "Ultra Soft Boobs (FREE)", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2023/09/Ultra-Soft-Gel-Breast.jpg", "label": "Ultra Soft Boobs (FREE)"}},
      {"id": "ultra-soft-butt-free", "label": "Ultra Soft Butt (FREE)", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2022/09/Ultra-Soft-Butt.jpg", "label": "Ultra Soft Butt (FREE)"}},
      {"id": "ultra-soft-thigh-free", "label": "Ultra Soft Thigh (FREE)", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/12/Ultra-Soft-Thigh.jpg", "label": "Ultra Soft Thigh (FREE)"}},
      {"id": "ultra-soft-vagina-free", "label": "Ultra Soft Vagina (FREE)", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/04/Ultra-Soft-Vagina.png", "label": "Ultra Soft Vagina (FREE)"}},
      {"id": "vine-talk-ai-box", "label": "Vine Talk AI Box", "priceDelta": 99, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/05/Sex-Doll-AI-Box-Choice.jpg", "label": "Vine Talk AI Box"}}
    ]
  },
  {
    "id": "sexy-lingerie-add-on",
    "label": "Sexy Lingerie Add-On",
    "display": "swatches",
    "selectionMode": "multiple",
    "options": [
      {"id": "no-1", "label": "No.1", "priceDelta": 30, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2023/06/1-7.jpg", "label": "No.1"}},
      {"id": "no-2", "label": "No.2", "priceDelta": 30, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/10/04-1.jpg", "label": "No.2"}},
      {"id": "no-3", "label": "No.3", "priceDelta": 30, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/10/06-1.jpg", "label": "No.3"}},
      {"id": "no-4", "label": "No.4", "priceDelta": 40, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2023/06/4-7.jpg", "label": "No.4"}},
      {"id": "no-5", "label": "No.5", "priceDelta": 30, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2023/06/5-6.jpg", "label": "No.5"}},
      {"id": "no-6", "label": "No.6", "priceDelta": 50, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2023/06/6-5.jpg", "label": "No.6"}},
      {"id": "no-7", "label": "No.7", "priceDelta": 40, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2023/06/7-3.jpg", "label": "No.7"}},
      {"id": "no-8", "label": "No.8", "priceDelta": 100, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2022/01/outfit-8.jpg", "label": "No.8"}},
      {"id": "no-9", "label": "No.9", "priceDelta": 60, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/04/sexy-lingiries.jpg", "label": "No.9"}},
      {"id": "no-10", "label": "No.10", "priceDelta": 50, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2022/01/outfit-10.jpg", "label": "No.10"}},
      {"id": "no-11", "label": "No.11", "priceDelta": 50, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2023/06/11-2.jpg", "label": "No.11"}},
      {"id": "no-12", "label": "No.12", "priceDelta": 30, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/01/1-4.jpg", "label": "No.12"}},
      {"id": "no-13", "label": "No.13", "priceDelta": 30, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2023/06/13-1.jpg", "label": "No.13"}},
      {"id": "no-14", "label": "No.14", "priceDelta": 40, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/01/1-2.jpg", "label": "No.14"}},
      {"id": "no-15", "label": "No.15", "priceDelta": 40, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/01/1-1.jpg", "label": "No.15"}},
      {"id": "no-16", "label": "No.16", "priceDelta": 30, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/11/4-1.jpg", "label": "No.16"}}
    ]
  },
  {
    "id": "accessories",
    "label": "Accessories",
    "display": "swatches",
    "selectionMode": "multiple",
    "options": [
      {"id": "vaginal-irrigator", "label": "Vaginal Irrigator", "priceDelta": 35, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/01/Irrigator.jpg", "label": "Vaginal Irrigator"}},
      {"id": "reusable-drying-rod", "label": "Reusable Drying Rod", "priceDelta": 25, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/01/Reusable-Drying-Rod.png", "label": "Reusable Drying Rod"}},
      {"id": "replaceable-vagina-insert", "label": "Replaceable Vagina Insert", "priceDelta": 50, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/08/ia_100000134-1.jpg", "label": "Replaceable Vagina Insert"}},
      {"id": "premium-cleaning-set-orig-550", "label": "Premium Cleaning Set (Orig. $550)", "priceDelta": 99, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2025/03/Premium-Cleaning-Set-2.0.png", "label": "Premium Cleaning Set (Orig. $550)"}},
      {"id": "care-kit-orig-199", "label": "Care Kit (Orig. $199)", "priceDelta": 99, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/12/RosemaryDoll-Silicone-Care-Kit-300x300.jpg", "label": "Care Kit (Orig. $199)"}},
      {"id": "deluxe-care-kit-orig-299", "label": "Deluxe Care Kit (Orig. $299)", "priceDelta": 199, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/12/RosemaryDoll-Silicone-Deluxe-Care-Kit-300x300.jpg", "label": "Deluxe Care Kit (Orig. $299)"}},
      {"id": "sex-doll-body-hanging-bracket", "label": "Sex Doll Body Hanging Bracket", "priceDelta": 399, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2022/06/Sex-Doll-Body-Hanging-Bracket.jpg", "label": "Sex Doll Body Hanging Bracket"}},
      {"id": "head-stand-holder", "label": "Head Stand Holder", "priceDelta": 50, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2021/04/Head-Stand-Holder-2.jpg", "label": "Head Stand Holder"}},
      {"id": "belly-piercing", "label": "Belly Piercing", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2022/06/Belly-Button-Rings.jpg", "label": "Belly Piercing"}}
    ]
  },
  {
    "id": "upgraded-flight-case-add-on",
    "label": "Upgraded Flight Case Add On",
    "display": "swatches",
    "selectionMode": "single",
    "options": [
      {"id": "no-thanks", "label": "No Thanks", "priceDelta": 0, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/04/No_thanks-300x300.jpg", "label": "No Thanks"}, "productionNote": "Default supplier selection."},
      {"id": "flight-case-doll-weight-40kg", "label": "Flight Case (Doll Weight < 40kg)", "priceDelta": 699, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/04/flight-case.jpg", "label": "Flight Case (Doll Weight < 40kg)"}},
      {"id": "flight-case-doll-weight-40kg-plus", "label": "Flight Case (Doll Weight ≥ 40kg)", "priceDelta": 899, "priceVerified": true, "purchasable": true, "swatch": {"kind": "image", "value": "https://www.rosemarydoll.com/wp-content/uploads/2020/04/flight-case.jpg", "label": "Flight Case (Doll Weight ≥ 40kg)"}}
    ]
  }
];

const measurements = {
  "Height": "5 ft 5 in / 164 cm",
  "Weight": "83.8 lbs / 38 kg",
  "Cup size": "G-Cup",
  "Feet Length": "N/A",
  "Bust": "2 ft 9 in / 83 cm",
  "Legs Length": "2 ft 10 in / 86 cm",
  "Waist": "2 ft / 61 cm",
  "Arms Length": "2 ft / 61 cm",
  "Hip": "2 ft 12 in / 91 cm",
  "Shoulders Width": "1 ft 1 in / 34 cm",
  "Vagina Depth": "7 in / 18 cm",
  "Anus Depth": "6 in / 15 cm",
  "Oral Depth": "N/A"
};

const editorial_intro = {
  "eyebrow": "REFINED ALLURE",
  "heading": "Jade Sterling Commands Attention",
  "paragraph": "Jade Sterling knows exactly what she wants. She settles into the pristine white surroundings, her G-cup silhouette drawing your gaze as naturally as breathing. At 164 cm (5 ft 5 in) with a head sculpt featuring the refined JS166 design, she embodies both elegance and desire. Her silicone construction catches the light, emphasizing every deliberate curve. This is presence refined into art, and Jade Sterling is ready to captivate.",
  "promptVersion": "pdp-editorial-fantasy-v5",
  "generatedAt": new Date().toISOString()
};

const mutation = `
mutation CreateProduct($input: ProductInput!) {
  productCreate(input: $input) {
    product {
      id
      handle
      title
      status
    }
    userErrors {
      field
      message
    }
  }
}
`;

const productInput = {
  title: "WM Jade Sterling 164cm G-Cup Silicone Customizable Companion Doll",
  handle: "wm-jade-sterling-164cm-g-cup-silicone-companion-doll-js166",
  descriptionHtml: `<p>WM Jade Sterling 164cm G-Cup Silicone Customizable Companion Doll from WM Dolls with Head JS166.</p><p>Review the full measurements, materials, and available options before checkout. This build is listed with 164 cm G-Cup silicone specs.</p><p><strong>Note:</strong> Cup size verified as G-Cup per factory photos. Some third-party retailers list JS166 on a 164cm D-Cup body; WM Doll is confirming final specifications.</p><p>Custom build timing and compatibility are confirmed before production begins. DollWow keeps checkout private and confirms the final order details with you before fulfillment.</p>`,
  vendor: "DollWow",
  productType: "Custom Silicone doll",
  tags: ["custom", "customizable", "female-doll", "height-160-164", "options:wm-female-silicone-softness", "silicone", "weight-75-89", "wm", "wm-dolls"],
  status: "ACTIVE",
  variants: [{
    price: "2159.00",
    inventoryPolicy: "CONTINUE",
    inventoryManagement: null,
    sku: "DW-WM-JADE-STERLING-164CM-G-CUP-SILICONE-JS166"
  }],
  metafields: [
    { namespace: "custom", key: "brand", value: "WM Dolls", type: "single_line_text_field" },
    { namespace: "custom", key: "material", value: "Silicone", type: "single_line_text_field" },
    { namespace: "custom", key: "height_cm", value: "164", type: "number_integer" },
    { namespace: "custom", key: "weight_lb", value: "83.8", type: "number_decimal" },
    { namespace: "custom", key: "cup_size", value: "G-Cup", type: "single_line_text_field" },
    { namespace: "custom", key: "warehouse_country", value: "Factory order", type: "single_line_text_field" },
    { namespace: "custom", key: "stock_status", value: "custom", type: "single_line_text_field" },
    { namespace: "custom", key: "stock_last_checked_at", value: new Date().toISOString(), type: "date_time" },
    { namespace: "custom", key: "custom_available", value: "true", type: "boolean" },
    { namespace: "custom", key: "customization_groups", value: JSON.stringify(customizationGroups), type: "json" },
    { namespace: "custom", key: "qc_note", value: "Final details are confirmed before checkout or production.", type: "multi_line_text_field" },
    { namespace: "custom", key: "display_name", value: "Jade Sterling", type: "single_line_text_field" },
    { namespace: "custom", key: "body_type", value: "female", type: "single_line_text_field" },
    { namespace: "custom", key: "head_designation", value: "JS166", type: "single_line_text_field" },
    { namespace: "custom", key: "measurements", value: JSON.stringify(measurements), type: "json" },
    { namespace: "custom", key: "editorial_intro", value: JSON.stringify(editorial_intro), type: "json" },
    { namespace: "custom", key: "has_insertable_penis_add_on", value: "true", type: "boolean" },
    { namespace: "global", key: "description_tag", value: "WM Jade Sterling 164cm G-Cup Silicone Customizable Companion Doll with JS166 head, detailed measurements, custom order review, and private checkout at DollWow.", type: "string" },
    { namespace: "custom", key: "catalog_identity_key", value: "wm__jade-sterling__164cm__g-cup__silicone__js166", type: "single_line_text_field" },
    { namespace: "custom", key: "source_note", value: "WM factory photos via WeChat 24 Nov 2026. Drive folder: https://drive.google.com/drive/folders/1XEH_yRIudY_JhEzxGf2gS0xVimcuxElH", type: "single_line_text_field" },
    { namespace: "custom", key: "cup_verification_note", value: "Factory photos show G-Cup. Rosemary/YourDoll list JS166 on 164cm D-Cup body. Using G-Cup pending WM confirmation.", type: "single_line_text_field" }
  ]
};

async function createProduct() {
  const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
    },
    body: JSON.stringify({
      query: mutation,
      variables: { input: productInput }
    })
  });

  const result = await response.json();
  
  if (result.errors) {
    console.error("GraphQL Errors:", JSON.stringify(result.errors, null, 2));
    process.exit(1);
  }

  if (result.data?.productCreate?.userErrors?.length) {
    console.error("User Errors:", JSON.stringify(result.data.productCreate.userErrors, null, 2));
    process.exit(1);
  }

  const product = result.data?.productCreate?.product;
  if (!product) {
    console.error("No product returned");
    process.exit(1);
  }

  console.log("SUCCESS! Product created:");
  console.log(`- Product ID: ${product.id}`);
  console.log(`- Handle: ${product.handle}`);
  console.log(`- Title: ${product.title}`);
  console.log(`- Status: ${product.status}`);
  console.log(`- Live URL: https://www.dollwow.com/products/${product.handle}`);
  console.log(`\nNEXT STEPS:`);
  console.log(`1. Upload 21 photos from https://drive.google.com/drive/folders/1XEH_yRIudY_JhEzxGf2gS0xVimcuxElH`);
  console.log(`2. Verify product is accessible at storefront`);
  console.log(`3. Update template-release.json if needed`);
  
  return product;
}

createProduct().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
