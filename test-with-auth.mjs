import { chromium } from '@playwright/test';

const PREVIEW_URL = 'https://doll-ighoxlkq4-sonawaneamits-projects.vercel.app';
const SHARE_TOKEN = '_vercel_share=efv0zKVBhHMKbegfBo69uhNGabBWsK1c';

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
  const url = `${PREVIEW_URL}/products/${product.handle}?${SHARE_TOKEN}`;
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${product.name} (${product.brand})`);
  console.log(`Handle: ${product.handle}`);
  console.log('='.repeat(80));
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Check page title to ensure we're not on login page
    const title = await page.title();
    if (title.includes('Login') || title.includes('Vercel')) {
      console.log('✗ AUTHENTICATION FAILED - still on login page');
      await page.close();
      return;
    }
    
    console.log(`Page loaded: ${title.substring(0, 60)}...`);
    
    // Check for packages section
    const hasSetup = await page.locator('text=Choose your setup').count() > 0;
    
    if (hasSetup) {
      console.log('✓ PACKAGES FOUND');
      
      // Find all tier cards
      const tiers = await page.locator('[data-configuration-presets] > div > div').all();
      
      console.log(`\nFound ${tiers.length} tiers:`);
      
      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        
        // Try multiple selectors for tier info
        const titleEl = await tier.locator('label span:first-child, [class*="title"]').first();
        const title = await titleEl.textContent().catch(() => null);
        
        const priceEl = await tier.locator('strong, [class*="price"]').last();
        const price = await priceEl.textContent().catch(() => null);
        
        const descEl = await tier.locator('label span:nth-child(2), [class*="description"]').first();
        const desc = await descEl.textContent().catch(() => null);
        
        if (title) {
          console.log(`\n  ${i + 1}. ${title.trim()}`);
          if (desc && desc.trim() !== title.trim()) {
            console.log(`     "${desc.trim().substring(0, 80)}${desc.length > 80 ? '...' : ''}"`);
          }
          if (price) {
            console.log(`     Price: ${price.trim()}`);
          }
          
          // Get included items
          const detailsEl = await tier.locator('details');
          const hasDetails = await detailsEl.count() > 0;
          
          if (hasDetails) {
            await detailsEl.click().catch(() => {});
            await page.waitForTimeout(500);
            
            const items = await tier.locator('details li').allTextContents();
            if (items.length > 0) {
              console.log(`     Includes ${items.length} items:`);
              items.slice(0, 5).forEach(item => console.log(`       - ${item.trim()}`));
              if (items.length > 5) console.log(`       ... and ${items.length - 5} more`);
            }
          }
        }
      }
      
      // Test add to cart
      console.log('\n  Add-to-cart check:');
      const addButton = await page.locator('button:has-text("Add to"), button:has-text("Buy")').first();
      const isVisible = await addButton.isVisible().catch(() => false);
      
      if (isVisible) {
        const isEnabled = await addButton.isEnabled();
        const buttonText = await addButton.textContent();
        console.log(`    ✓ Button visible: "${buttonText.trim()}"`);
        console.log(`    ${isEnabled ? '✓' : '✗'} Button ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
      } else {
        console.log('    ✗ No add-to-cart button found');
      }
      
    } else {
      console.log('✗ NO PACKAGES FOUND');
      
      // Check alternatives
      const hasCustomize = await page.locator('h2:has-text("Customize")').count() > 0;
      const hasBuyAsShown = await page.locator('text=Buy As Shown').count() > 0;
      
      if (hasCustomize) console.log('  Found: Customization UI');
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
