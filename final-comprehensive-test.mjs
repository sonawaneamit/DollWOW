import playwright from 'playwright';

const SHARE_TOKEN = 'muhOnOlFxlCDE5tZ6RmtBJvNpfV8oCcZ';
const BASE_URL = 'https://doll-8c9jauj4y-sonawaneamits-projects.vercel.app';

const products = [
  { brand: 'WM', name: 'WM Abbie', handle: 'wm-abbie-171cm-h-cup-tpe-companion-doll-493ex' },
  { brand: 'SE', name: 'SE Annika', handle: 'sedoll-annika-a-160cm-c-cup-silicone-companion-doll-gt6si' },
  { brand: 'Starpery', name: 'Starpery Amy', handle: 'starpery-amy-175cm-k-cup-silicone-companion-doll-17fyp' },
  { brand: 'Irontech', name: 'Irontech Angelka', handle: 'irontech-angelka-160cm-i-cup-silicone-companion-doll-q2so9' },
  { brand: 'Lusandy', name: 'Lusandy Anais', handle: 'lusandy-anais-167cm-b-cup-silicone-companion-doll' },
  { brand: 'Fanreal', name: 'Fanreal Nora', handle: 'fanreal-nora-167cm-k-cup-silicone-companion-doll-6ew6i' },
  { brand: 'FunWest', name: 'FunWest Amy', handle: 'funwest-dolls-amy-159cm-a-cup-silicone-companion-doll-fsd027' },
  { brand: 'FunWest', name: 'FunWest Thalia', handle: 'funwest-dolls-thalia-152cm-d-cup-silicone-companion-doll-fsd054' },
  { brand: 'Fanreal', name: 'Fanreal Maria', handle: 'fanreal-maria-170cm-h-cup-silicone-companion-doll-72klp' }
];

console.log('=' + '='.repeat(79));
console.log('DOLLWOW FINAL COMPREHENSIVE TEST - WITH VALIDATION PASSING');
console.log('=' + '='.repeat(79));
console.log(`URL: ${BASE_URL}`);
console.log(`Share link: ${BASE_URL}/?_vercel_share=${SHARE_TOKEN}\n\n`);

const browser = await playwright.chromium.launch({ headless: true });

for (const product of products) {
  console.log('=' + '='.repeat(79));
  console.log(`${product.brand}: ${product.name}`);
  console.log(`Handle: ${product.handle}`);
  console.log('=' + '='.repeat(79));
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    const url = `${BASE_URL}/products/${product.handle}?_vercel_share=${SHARE_TOKEN}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Check for 404
    const is404 = await page.$('text=/404|not found/i');
    if (is404) {
      console.log('✗ PAGE ERROR: 404\n');
      await context.close();
      continue;
    }
    
    // Check for packages heading
    const packagesHeading = await page.$('text="Choose your setup"');
    
    if (packagesHeading) {
      console.log('✓ PACKAGES FOUND\n');
      
      // Get tier buttons
      const tierButtons = await page.$$('[role="radiogroup"] button, [data-tier]');
      const tiers = [];
      
      for (const button of tierButtons) {
        const text = await button.textContent();
        const tierMatch = text.match(/(Starter|Enthusiast|Collector|Popular|Premium)/i);
        if (tierMatch) {
          tiers.push({ name: tierMatch[1], fullText: text.replace(/\s+/g, ' ').trim() });
        }
      }
      
      if (tiers.length > 0) {
        console.log('Tiers found:');
        tiers.forEach(tier => console.log(`  - ${tier.fullText}`));
      }
      
      // Try to get detailed tier info
      const tierDetails = await page.$$eval('[data-tier], .preset-card, [role="radiogroup"] > *', els =>
        els.map(el => ({
          text: el.textContent?.replace(/\s+/g, ' ').trim(),
          price: el.querySelector('[data-price]')?.textContent || null
        })).filter(t => t.text && t.text.length < 500)
      );
      
      if (tierDetails.length > 0) {
        console.log('\nDetailed tier information:');
        tierDetails.forEach(detail => {
          if (detail.text.match(/(Starter|Enthusiast|Collector|Popular|Premium)/i)) {
            console.log(`  ${detail.text.substring(0, 200)}`);
          }
        });
      }
      
      // Check add-to-cart
      const addToCartButton = await page.$('button:has-text("Add to"), button:has-text("Add to cart")');
      console.log(`\nAdd-to-cart button: ${addToCartButton ? '✓ Present' : '✗ Not found'}`);
      
    } else {
      console.log('✗ NO PACKAGES FOUND');
      console.log('  Standard customization UI present\n');
    }
    
  } catch (error) {
    console.log(`✗ ERROR: ${error.message}\n`);
  }
  
  await context.close();
}

await browser.close();

console.log('=' + '='.repeat(79));
console.log('TESTING COMPLETE');
console.log('=' + '='.repeat(79));
