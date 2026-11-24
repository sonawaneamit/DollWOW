#!/usr/bin/env node
/**
 * DOL-389: Upload Eva and Kerekes photos to Shopify and update products
 * 
 * Usage: 
 *   SHOPIFY_STORE_DOMAIN=xxx.myshopify.com \
 *   SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxx \
 *   node scripts/dol389-upload-photos.mjs
 * 
 * This script:
 * 1. Uploads 11 Eva photos from /cursor/stores/bot/dol389-climax-plus/eva/
 * 2. Uploads 12 Kerekes photos from /cursor/stores/bot/dol389-climax-plus/kerekes/
 * 3. Attaches photos to respective products
 * 4. Updates products with full descriptions and tier variants
 */

import { readFileSync, createReadStream, existsSync } from 'fs';
import { basename } from 'path';

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

const EVA_PRODUCT_ID = 'gid://shopify/Product/10761282715832';
const KEREKES_PRODUCT_ID = 'gid://shopify/Product/10761283010744';

const EVA_PHOTOS_PATH = '/cursor/stores/bot/dol389-climax-plus/eva/';
const KEREKES_PHOTOS_PATH = '/cursor/stores/bot/dol389-climax-plus/kerekes/';

if (!SHOPIFY_DOMAIN || !ACCESS_TOKEN) {
  console.error('Error: Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN');
  console.error('Usage: SHOPIFY_STORE_DOMAIN=xxx.myshopify.com SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxx node scripts/dol389-upload-photos.mjs');
  process.exit(1);
}

async function graphql(query, variables = {}) {
  const response = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  if (result.errors) {
    console.error('GraphQL errors:', JSON.stringify(result.errors, null, 2));
    throw new Error('GraphQL query failed');
  }
  return result;
}

async function stageUpload(filename, mimeType = 'image/jpeg') {
  const query = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const result = await graphql(query, {
    input: [{
      resource: 'PRODUCT_IMAGE',
      filename,
      mimeType,
      httpMethod: 'POST'
    }]
  });
  
  if (result.data.stagedUploadsCreate.userErrors.length > 0) {
    throw new Error(`Stage upload failed: ${JSON.stringify(result.data.stagedUploadsCreate.userErrors)}`);
  }
  
  return result.data.stagedUploadsCreate.stagedTargets[0];
}

async function uploadFile(filePath, target) {
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  
  // Add parameters from staged upload
  target.parameters.forEach(({ name, value }) => {
    form.append(name, value);
  });
  
  // Add file
  form.append('file', createReadStream(filePath));
  
  const response = await fetch(target.url, {
    method: 'POST',
    body: form
  });
  
  if (!response.ok) {
    throw new Error(`File upload failed: ${response.statusText}`);
  }
  
  return target.resourceUrl;
}

async function uploadPhotos(photosPath, namePrefix, count) {
  const urls = [];
  
  for (let i = 1; i <= count; i++) {
    const filename = `jpg-100cmPlus+ ${namePrefix}(Black)${i}.jpg`;
    const filePath = `${photosPath}${filename}`;
    
    if (!existsSync(filePath)) {
      console.warn(`Warning: File not found: ${filePath}`);
      continue;
    }
    
    console.log(`Uploading ${namePrefix} photo ${i}/${count}...`);
    
    try {
      const target = await stageUpload(`climax-${namePrefix.toLowerCase()}-${String(i).padStart(2, '0')}.jpg`);
      const url = await uploadFile(filePath, target);
      urls.push(url);
      console.log(`  ✓ Uploaded: ${url}`);
    } catch (error) {
      console.error(`  ✗ Failed to upload ${filename}:`, error.message);
    }
  }
  
  return urls;
}

async function updateProductWithImages(productId, imageUrls, fullDescription, productName) {
  console.log(`\nUpdating ${productName} with ${imageUrls.length} images...`);
  
  const query = `
    mutation updateProduct($input: ProductInput!, $media: [CreateMediaInput!]) {
      productUpdate(input: $input, media: $media) {
        product {
          id
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const media = imageUrls.map((url, index) => ({
    originalSource: url,
    alt: `Climax ${productName} photo ${index + 1}`,
    mediaContentType: 'IMAGE'
  }));
  
  const result = await graphql(query, {
    input: {
      id: productId,
      descriptionHtml: fullDescription
    },
    media
  });
  
  if (result.data.productUpdate.userErrors.length > 0) {
    console.error('Update errors:', result.data.productUpdate.userErrors);
    throw new Error('Product update failed');
  }
  
  console.log(`✓ ${productName} updated successfully`);
}

async function main() {
  console.log('=== DOL-389: Uploading Climax 100cm Plus+ Photos ===\n');
  
  // Upload Eva photos
  console.log('Uploading Eva photos...');
  const evaUrls = await uploadPhotos(EVA_PHOTOS_PATH, 'Eva', 11);
  console.log(`Eva: Uploaded ${evaUrls.length}/11 photos\n`);
  
  // Upload Kerekes photos
  console.log('Uploading Kerekes photos...');
  const kerekesUrls = await uploadPhotos(KEREKES_PHOTOS_PATH, 'Kerekes', 12);
  console.log(`Kerekes: Uploaded ${kerekesUrls.length}/12 photos\n`);
  
  // Eva full description
  const evaDescription = `<p>Ebony elegance in a size that fits your life: Eva brings full Q-cup drama at 100cm—bold curves, deep black skin, and silicone-soft features, yet compact enough to move, pose, and store with ease. She ships in Climax's standard TPE finish with a matching silicone head, articulated fingers, and the EVO skeleton. Upgrade to their advanced STPE body for even softer touch, or go full Collector with implanted hair top to bottom.</p><h2>Measurements and build</h2><dl><dt>Height</dt><dd>3 ft 3 in / 100 cm</dd><dt>Height Without Head</dt><dd>3 ft 0 in / 92 cm</dd><dt>Weight</dt><dd>70.5 lbs / 32 kg</dd><dt>Cup size</dt><dd>Q-Cup</dd><dt>Legs Length</dt><dd>2 ft 0 in / 60 cm</dd><dt>Arms Length</dt><dd>1 ft 6 in / 45 cm</dd><dt>Sole Length</dt><dd>6 in / 16 cm</dd></dl><h2>What can I customize?</h2><p>Make her your own with Starter, Enthusiast, or Collector. Starter gives you Eva as shown—TPE body with silicone head. Enthusiast upgrades the body to softer STPE for a premium feel. Collector adds implanted head and pubic hair for the ultimate finish. All tiers include Climax's articulated fingers, EVO skeleton, and matching Black skin.</p><h2>Is this the doll in the photos?</h2><p>Yes. The gallery shows Climax's official 100cm Plus+ Eva in Black skin with her standard silicone head. Choose Starter to keep this exact look, or upgrade to Enthusiast or Collector for enhanced materials and features.</p><h2>Shipping and care</h2><p>Free US shipping is included. See our <a href="/shipping">shipping policy</a> for destination details and browse <a href="/brands/climax">Climax Doll</a> dolls to compare the range.</p>`;
  
  // Kerekes full description
  const kerekesDescription = `<p>Generous Q-cup style at a compact 100cm: Kerekes is Black beauty scaled down—full Q-cup proportions, a soft silicone head, and confident features, all in a size that is easy to handle and store. She arrives in Climax's TPE body with articulated fingers and the EVO skeleton. Step up to Enthusiast for the softer STPE body upgrade, or choose Collector with implanted head and pubic hair for the premium experience.</p><h2>Measurements and build</h2><dl><dt>Height</dt><dd>3 ft 3 in / 100 cm</dd><dt>Height Without Head</dt><dd>3 ft 0 in / 92 cm</dd><dt>Weight</dt><dd>70.5 lbs / 32 kg</dd><dt>Cup size</dt><dd>Q-Cup</dd><dt>Legs Length</dt><dd>2 ft 0 in / 60 cm</dd><dt>Arms Length</dt><dd>1 ft 6 in / 45 cm</dd><dt>Sole Length</dt><dd>6 in / 16 cm</dd></dl><h2>What can I customize?</h2><p>Pick Starter, Enthusiast, or Collector. Starter is Kerekes as shown—TPE body plus silicone head. Enthusiast upgrades to the softer STPE body for enhanced feel. Collector adds implanted hair on her head and body for complete realism. Every tier includes articulated fingers, EVO skeleton, and her signature Black skin.</p><h2>Is this the doll in the photos?</h2><p>Yes. The gallery shows Climax's official 100cm Plus+ Kerekes in Black skin with her standard silicone head. Starter keeps this exact appearance, while Enthusiast and Collector add premium materials and implanted hair options.</p><h2>Shipping and care</h2><p>Free US shipping is included. See our <a href="/shipping">shipping policy</a> for destination details and browse <a href="/brands/climax">Climax Doll</a> dolls to compare the range.</p>`;
  
  // Update products
  if (evaUrls.length > 0) {
    await updateProductWithImages(EVA_PRODUCT_ID, evaUrls, evaDescription, 'Eva');
  }
  
  if (kerekesUrls.length > 0) {
    await updateProductWithImages(KEREKES_PRODUCT_ID, kerekesUrls, kerekesDescription, 'Kerekes');
  }
  
  console.log('\n=== Upload Complete ===');
  console.log('\nNext steps:');
  console.log('1. Configure tier variants in Shopify Admin');
  console.log('2. Add product metafields for customization options');
  console.log('3. Test on preview deployment');
  console.log('4. Remove dollwow-test tag and publish');
}

main().catch(error => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
