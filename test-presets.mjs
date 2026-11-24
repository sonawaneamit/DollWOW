import { chromium } from '@playwright/test';

const PREVIEW_URL = 'https://doll-ighoxlkq4-sonawaneamits-projects.vercel.app';

const products = [
  { handle: 'wm-abbie-171cm-h-cup-tpe-companion-doll-493ex', name: 'WM Abbie', brand: 'WM' },
  { handle: 'sedoll-adela-168cm-b-cup-silicone-companion-doll-172tb', name: 'SE Adela', brand: 'SE' },
  { handle: 'starpery-yvonne-156cm-g-cup-silicone-companion-doll-1nxhr', name: 'Starpery Yvonne', brand: 'Starpery' },
  { handle: 'irontech-zia-bunny-s42-168cm-g-cup-silicone-companion-doll-16gkq', name: 'Irontech Zia Bunny', brand: 'Irontech' },
  { handle: 'lusandy-chloe-163cm-c-cup-silicone-companion-doll-1kmka', name: 'Lusandy Chloe', brand: 'Lusandy' },
  { handle: 'fanreal-nora-158cm-g-cup-silicone-companion-doll-1qfxy', name: 'Fanreal Nora', brand: 'Fanreal' },
  { handle: 'funwest-dolls-amy-159cm-a-cup-silicone-companion-doll-fsd027', name: 'FunWest Amy', brand: 'FunWest' },
  { handle: 'funwest-dolls-thalia-159cm-a-cup-silicone-companion-doll-fsd054', name: 'FunWest Thalia', brand: 'FunWest' },
];

async function testProduct(browser, product) {
  const page = await browser.newPage();
  const url = `${PREVIEW_URL}/products/${product.handle}`;
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${product.name} (${product.brand})`);
  console.log(`Handle: ${product.handle}`);
  console.log(`URL: ${url}`);
  console.log('='.repeat(80));
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Check for packages section
    const hasSetup = await page.locator('text=Choose your setup').count() > 0;
    
    if (hasSetup) {
      console.log('✓ PACKAGES FOUND');
      
      // Get tier information
      const tiers = await page.locator('[data-configuration-presets] .product-builder-preset-tile, [data-configuration-presets] > div > div').all();
      
      for (const tier of tiers) {
        const title = await tier.locator('.product-builder-preset-title, [class*="title"]').textContent().catch(() => null);
        const description = await tier.locator('.product-builder-preset-description, [class*="description"]').textContent().catch(() => null);
        const price = await tier.locator('.product-builder-preset-price, [class*="price"], strong').textContent().catch(() => null);
        
        if (title) {
          console.log(`\n  Tier: ${title.trim()}`);
          if (description) console.log(`    Description: ${description.trim().substring(0, 100)}...`);
          if (price) console.log(`    Price: ${price.trim()}`);
          
          // Get included items
          const items = await tier.locator('details li, ul li').allTextContents();
          if (items.length > 0) {
            console.log(`    Includes (${items.length} items):`);
            items.forEach(item => console.log(`      - ${item.trim()}`));
          }
        }
      }
      
      // Test add to cart
      console.log('\n  Testing add-to-cart...');
      const addToCartButton = page.locator('button:has-text("Add to Cart"), button:has-text("Add to Bag")').first();
      const isVisible = await addToCartButton.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log('  ✓ Add to cart button visible');
        
        // Check if button is enabled
        const isEnabled = await addToCartButton.isEnabled().catch(() => false);
        console.log(`  ${isEnabled ? '✓' : '✗'} Add to cart button ${isEnabled ? 'enabled' : 'disabled'}`);
      } else {
        console.log('  ✗ Add to cart button NOT visible');
      }
      
    } else {
      console.log('✗ NO PACKAGES FOUND');
      
      // Check what IS on the page
      const hasCustomize = await page.locator('text=Customize').count() > 0;
      const hasBuyAsShown = await page.locator('text=Buy As Shown').count() > 0;
      
      if (hasCustomize) console.log('  Found: "Customize" option');
      if (hasBuyAsShown) console.log('  Found: "Buy As Shown" option');
    }
    
  } catch (error) {
    console.log(`✗ ERROR: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  for (const product of products) {
    await testProduct(browser, product);
  }
  
  await browser.close();
  console.log('\n' + '='.repeat(80));
  console.log('Testing complete');
}

main().catch(console.error);
