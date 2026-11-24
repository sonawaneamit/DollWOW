import playwright from 'playwright';

const SHARE_TOKEN = 'fJX3QC34ZR1ArthgcxfchSNNfJaQF0Or';
const BASE_URL = 'https://doll-9brtfiazy-sonawaneamits-projects.vercel.app';

const products = [
  { brand: 'WM', name: 'WM Abbie', handle: 'wm-abbie-171cm-h-cup-tpe-companion-doll-493ex' },
  { brand: 'SE', name: 'SE Annika', handle: 'sedoll-annika-a-160cm-c-cup-silicone-companion-doll-gt6si' },
  { brand: 'Starpery', name: 'Starpery Amy 156cm', handle: 'starpery-amy-156cm-e-cup-silicone-head-companion-doll-1gwx9' },
  { brand: 'Irontech', name: 'Irontech Angelka', handle: 'irontech-angelka-160cm-i-cup-silicone-companion-doll-q2so9' },
  { brand: 'Lusandy', name: 'Lusandy Anais', handle: 'lusandy-anais-167cm-b-cup-silicone-companion-doll' },
  { brand: 'Fanreal', name: 'Fanreal Maria 166cm', handle: 'fanreal-maria-166cm-j-cup-silicone-companion-doll' },
  { brand: 'Fanreal', name: 'Fanreal Nora', handle: 'fanreal-nora-166cm-j-cup-silicone-companion-doll' },
  { brand: 'FunWest', name: 'FunWest Thalia', handle: 'funwest-dolls-thalia-152cm-d-cup-silicone-companion-doll-fsd054' },
  { brand: 'FunWest', name: 'FunWest Amy (fsd027)', handle: 'funwest-dolls-amy-159cm-a-cup-silicone-companion-doll-fsd027' }
];

console.log('=' + '='.repeat(79));
console.log('FINAL TEST - FIXED TIER STRUCTURE (Starter = Base)');
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
    await page.waitForTimeout(2500);
    
    // Check for 404
    const bodyText = await page.textContent('body');
    if (bodyText.includes('404') && bodyText.includes('not found')) {
      console.log('✗ 404 ERROR\n');
      await context.close();
      continue;
    }
    
    // Check for packages
    const hasSetup = bodyText.includes('Choose your setup');
    const hasStarter = bodyText.includes('Starter');
    const hasEnthusiast = bodyText.includes('Enthusiast');
    const hasCollector = bodyText.includes('Collector');
    
    if (hasSetup && hasStarter && hasEnthusiast && hasCollector) {
      console.log('✓ PACKAGES FOUND');
      
      // Extract tier info
      const tierText = await page.$$eval('*', els =>
        els.map(el => el.textContent)
          .filter(text => text && text.length < 400 && 
            (text.includes('Starter') || text.includes('Enthusiast') || text.includes('Collector')) &&
            text.match(/\$[\d,]+/))
          .slice(0, 5)
      );
      
      console.log('\nTier structure:');
      tierText.forEach((text, i) => {
        const clean = text.replace(/\s+/g, ' ').trim();
        if (clean.match(/(Starter|Enthusiast|Collector)/)) {
          console.log(`  ${clean.substring(0, 150)}`);
        }
      });
      
      // Count unique prices
      const prices = bodyText.match(/\$[\d,]+/g);
      const uniquePrices = [...new Set(prices)].filter(p => !p.includes('$0') && !p.includes('$299'));
      console.log(`\nUnique prices: ${uniquePrices.length} (${uniquePrices.slice(0, 5).join(', ')})`);
      
      // Check add-to-cart
      const addToCart = await page.$('button:has-text("Add to"), button:has-text("Add to cart")');
      console.log(`Add-to-cart: ${addToCart ? '✓ Present' : '✗ Missing'}`);
      
    } else {
      console.log('✗ NO PACKAGES');
      console.log(`  Has setup: ${hasSetup}, Starter: ${hasStarter}, Enthusiast: ${hasEnthusiast}, Collector: ${hasCollector}`);
    }
    
    console.log('');
    
  } catch (error) {
    console.log(`✗ ERROR: ${error.message}\n`);
  }
  
  await context.close();
}

await browser.close();

console.log('=' + '='.repeat(79));
console.log('TESTING COMPLETE');
console.log('=' + '='.repeat(79));
