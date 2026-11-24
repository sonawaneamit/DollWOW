import { chromium } from '@playwright/test';

const PREVIEW_URL = 'https://doll-61u9t8kb7-sonawaneamits-projects.vercel.app';
const SHARE_TOKEN = '_vercel_share=8PQ6IcsHNuYUpw6cY72EoHe542Z8bFgs';

const products = [
  { handle: 'wm-abbie-171cm-h-cup-tpe-companion-doll-493ex', name: 'WM Abbie', brand: 'WM' },
  { handle: 'sedoll-annika-a-160cm-c-cup-silicone-companion-doll-gt6si', name: 'SE Annika', brand: 'SE' },
  { handle: 'starpery-amy-175cm-k-cup-silicone-companion-doll-17fyp', name: 'Starpery Amy', brand: 'Starpery' },
  { handle: 'irontech-angelka-160cm-i-cup-silicone-companion-doll-q2so9', name: 'Irontech Angelka', brand: 'Irontech' },
  { handle: 'lusandy-anais-167cm-b-cup-silicone-companion-doll', name: 'Lusandy Anais', brand: 'Lusandy' },
  { handle: 'fanreal-carlee-165cm-k-cup-silicone-companion-doll-1qsqk', name: 'Fanreal Carlee', brand: 'Fanreal' },
  { handle: 'funwest-dolls-amy-159cm-a-cup-silicone-companion-doll-fsd027', name: 'FunWest Amy', brand: 'FunWest' },
  { handle: 'funwest-dolls-thalia-152cm-d-cup-silicone-companion-doll-fsd054', name: 'FunWest Thalia', brand: 'FunWest' },
];

async function testProduct(browser, product) {
  const page = await browser.newPage();
  const url = `${PREVIEW_URL}/products/${product.handle}?${SHARE_TOKEN}`;
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${product.brand}: ${product.name}`);
  console.log(`Handle: ${product.handle}`);
  console.log('='.repeat(80));
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    const title = await page.title();
    if (title.includes('404') || title.includes('Login')) {
      console.log(`✗ PAGE ERROR: ${title}`);
      await page.close();
      return;
    }
    
    const hasSetup = await page.locator('text=Choose your setup').count() > 0;
    
    if (hasSetup) {
      console.log('✓ PACKAGES RENDERING\n');
      
      const tiers = await page.locator('[data-configuration-presets] > div > div').all();
      
      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        
        const title = await tier.locator('label span').first().textContent().catch(() => '');
        const price = await tier.locator('strong').textContent().catch(() => '');
        const desc = await tier.locator('label span').nth(1).textContent().catch(() => '');
        
        if (title.trim()) {
          console.log(`  ${i + 1}. ${title.trim()} - ${price.trim()}`);
          if (desc && desc !== title) {
            console.log(`     ${desc.trim().substring(0, 100)}`);
          }
          
          const detailsBtn = await tier.locator('summary').first();
          const hasDetails = await detailsBtn.count() > 0;
          
          if (hasDetails) {
            await detailsBtn.click().catch(() => {});
            await page.waitForTimeout(300);
            
            const items = await tier.locator('details li').allTextContents();
            if (items.length > 0) {
              console.log(`     Includes:`);
              items.forEach(item => console.log(`       • ${item.trim()}`));
            }
          }
        }
      }
      
      console.log('\n  Add-to-cart:');
      const addBtn = await page.locator('button:has-text("Add to"), button[type="submit"]').first();
      const btnVisible = await addBtn.isVisible().catch(() => false);
      
      if (btnVisible) {
        const enabled = await addBtn.isEnabled();
        const btnText = await addBtn.textContent();
        console.log(`    ✓ "${btnText.trim()}" button ${enabled ? 'ENABLED' : 'DISABLED'}`);
      } else {
        console.log('    ✗ No add-to-cart button');
      }
      
    } else {
      console.log('✗ NO PACKAGES FOUND');
      
      const hasCustomize = await page.locator('h2:has-text("Customize")').count() > 0;
      if (hasCustomize) {
        console.log('  Standard customization UI present');
      }
    }
    
  } catch (error) {
    console.log(`✗ ERROR: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('DOLLWOW PREVIEW DEPLOYMENT - FINAL TEST');
  console.log('='.repeat(80));
  console.log(`URL: ${PREVIEW_URL}`);
  console.log(`Share link: ${PREVIEW_URL}/?${SHARE_TOKEN}`);
  console.log('');
  
  const browser = await chromium.launch({ headless: true });
  
  for (const product of products) {
    await testProduct(browser, product);
  }
  
  await browser.close();
  console.log('\n' + '='.repeat(80));
  console.log('TESTING COMPLETE');
  console.log('='.repeat(80));
}

main().catch(console.error);
