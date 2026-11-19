#!/usr/bin/env node
// BFCM Restoration Dry-Run Demo
// Shows what would be restored for sample SKUs without executing mutations
import fs from 'node:fs';
import { generateDryRunReport } from '../../lib/promotions/restoration-executor.ts';

const FIXTURE_PATH = 'tests/fixtures/bfcm-restoration-journal.json';

console.log('='.repeat(80));
console.log('BFCM RESTORATION DRY-RUN DEMO');
console.log('='.repeat(80));
console.log('');

// Load test fixture
const journal = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));

console.log(`Loaded journal with ${journal.entries.length} entries`);
console.log(`Captured at: ${journal.capturedAt}`);
console.log('');

// Sample 3 SKUs per brand
const samples = [
  // Top Fire
  'top-fire-doll-venus-170cm-e-cup-silicone-companion-doll',
  'top-fire-doll-susan-170cm-e-cup-silicone-companion-doll',
  'top-fire-doll-ivy-170cm-e-cup-silicone-companion-doll',
  
  // Galatea
  'galatea-aurora-168cm-d-cup-silicone-companion-doll',
  'galatea-celeste-165cm-c-cup-silicone-companion-doll',
  'galatea-nova-172cm-f-cup-silicone-companion-doll',
  
  // Climax
  'climax-aria-158cm-b-cup-tpe-companion-doll',
  'climax-bella-163cm-d-cup-tpe-companion-doll',
  'climax-carmen-168cm-e-cup-silicone-companion-doll',
  
  // 6YE
  '6ye-diana-160cm-d-cup-tpe-companion-doll',
  '6ye-emma-158cm-c-cup-tpe-companion-doll',
  '6ye-fiona-165cm-f-cup-tpe-companion-doll',
];

// Simulate at deadline time (just after)
const simulateTime = new Date('2026-12-11T05:00:00Z');

console.log(`Simulating at: ${simulateTime.toISOString()} (1 minute after deadline)`);
console.log('');

const report = generateDryRunReport(journal, samples, simulateTime);

console.log(report);

console.log('');
console.log('='.repeat(80));
console.log('DRY-RUN COMPLETE');
console.log('='.repeat(80));
console.log('');
console.log('This was a DRY-RUN. No actual Shopify mutations were executed.');
console.log('');
console.log('To enable actual restoration:');
console.log('1. Set BFCM_RESTORE_ENABLED=true');
console.log('2. Configure SHOPIFY_ADMIN_API_TOKEN');
console.log('3. Configure SHOPIFY_STORE_DOMAIN');
console.log('4. Configure CRON_SECRET for API route protection');
console.log('');
console.log('The cron job will run automatically at:');
console.log('- December 11, 2026 at 04:59 UTC for most brands');
console.log('- December 1, 2026 at 00:00 UTC for IDO');
