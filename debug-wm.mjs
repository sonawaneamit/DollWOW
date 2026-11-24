import { chromium } from '@playwright/test';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
      errors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
    errors.push(error.message);
  });
  
  const url = 'https://doll-q1f13u159-sonawaneamits-projects.vercel.app/products/wm-abbie-171cm-h-cup-tpe-companion-doll-493ex?_vercel_share=V94WkxiRwwilEkuMWBk2WgAK0dQZ3Xk9';
  console.log('Loading WM Abbie...\n');
  
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  
  const title = await page.title();
  console.log('Page title:', title);
  
  const hasSetup = await page.locator('text=Choose your setup').count();
  console.log('Has "Choose your setup":', hasSetup > 0);
  
  const hasPresets = await page.locator('[data-configuration-presets]').count();
  console.log('Has preset section:', hasPresets > 0);
  
  const hasCustomize = await page.locator('h2:has-text("Customize")').count();
  console.log('Has customize UI:', hasCustomize > 0);
  
  // Check for environment variable visibility
  const html = await page.content();
  console.log('\nEnvironment checks:');
  console.log('  TEMPLATE_RELEASE in HTML:', html.includes('TEMPLATE_RELEASE'));
  console.log('  "presets.length" in HTML:', html.includes('presets.length'));
  
  if (errors.length > 0) {
    console.log('\nErrors found:', errors.length);
  } else {
    console.log('\nNo JavaScript errors detected');
  }
  
  await browser.close();
}

debug().catch(console.error);
