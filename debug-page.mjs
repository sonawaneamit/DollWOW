import { chromium } from '@playwright/test';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Collect console logs
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  const url = 'https://doll-ighoxlkq4-sonawaneamits-projects.vercel.app/products/fanreal-nora-158cm-g-cup-silicone-companion-doll-1qfxy';
  console.log('Loading:', url);
  
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  
  // Check page title
  const title = await page.title();
  console.log('\nPage title:', title);
  
  // Check for product data
  const hasProduct = await page.locator('h1').count();
  console.log('Product heading count:', hasProduct);
  
  if (hasProduct > 0) {
    const heading = await page.locator('h1').first().textContent();
    console.log('Product name:', heading);
  }
  
  // Check for any preset-related elements
  const presetSection = await page.locator('[data-configuration-presets]').count();
  console.log('Preset sections found:', presetSection);
  
  // Check for customization UI
  const hasCustomize = await page.locator('text=Customize').count();
  console.log('Customize text found:', hasCustomize);
  
  // Get page HTML to check structure
  const html = await page.content();
  
  // Check for key elements in HTML
  console.log('\nHTML checks:');
  console.log('  Contains "Choose your setup":', html.includes('Choose your setup'));
  console.log('  Contains "Starter":', html.includes('Starter'));
  console.log('  Contains "Enthusiast":', html.includes('Enthusiast'));
  console.log('  Contains "Collector":', html.includes('Collector'));
  console.log('  Contains data-configuration-presets:', html.includes('data-configuration-presets'));
  console.log('  Contains "DOLLWOW_TEMPLATE_RELEASE":', html.includes('DOLLWOW_TEMPLATE_RELEASE'));
  
  // Check for environment info in page
  const bodyText = await page.locator('body').textContent();
  if (bodyText.includes('error') || bodyText.includes('Error')) {
    console.log('\n⚠️  Page contains error text');
  }
  
  await browser.close();
}

debug().catch(console.error);
