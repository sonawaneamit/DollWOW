#!/usr/bin/env node
/**
 * Validate that all tier recipes have distinct contents and don't rely solely on $0 options
 */
import fs from 'node:fs/promises';

const registry = JSON.parse(await fs.readFile('lib/customization/evidence/template-release.json', 'utf8'));

console.log('Validating tier recipes for price/content issues...\n');

const issues = [];

for (const [bindingKey, binding] of Object.entries(registry.payload.bindings)) {
  const { tag, tiers } = binding;
  
  if (!tiers || tiers.length !== 3) continue;
  
  // Check for empty tiers
  for (const tier of tiers) {
    if (tier.add.length === 0 && tier.remove.length === 0) {
      issues.push({
        type: 'empty_tier',
        tag,
        bindingKey: bindingKey.substring(0, 16) + '...',
        tier: tier.id,
        message: `Tier "${tier.id}" has no add/remove actions`
      });
    }
  }
  
  // Check for tiers that only add $0 options (ending in -free)
  for (const tier of tiers) {
    const allFree = tier.add.length > 0 && tier.add.every(opt => 
      opt.optionId.endsWith('-free') || opt.optionId.includes('free')
    );
    if (allFree) {
      issues.push({
        type: 'all_free_options',
        tag,
        bindingKey: bindingKey.substring(0, 16) + '...',
        tier: tier.id,
        options: tier.add.map(o => o.optionId),
        message: `Tier "${tier.id}" only adds free options (likely $0 price)`
      });
    }
  }
  
  // Check for duplicate options across tiers
  const allOptions = tiers.flatMap(t => t.add.map(o => `${o.groupId}:${o.optionId}`));
  const duplicates = allOptions.filter((opt, i) => allOptions.indexOf(opt) !== i);
  if (duplicates.length > 0) {
    issues.push({
      type: 'duplicate_options',
      tag,
      bindingKey: bindingKey.substring(0, 16) + '...',
      duplicates: [...new Set(duplicates)],
      message: 'Same option appears in multiple tiers'
    });
  }
}

// Group issues by type
const byType = {};
for (const issue of issues) {
  if (!byType[issue.type]) byType[issue.type] = [];
  byType[issue.type].push(issue);
}

console.log('='.repeat(80));
console.log('TIER VALIDATION SUMMARY');
console.log('='.repeat(80));
console.log(`Total bindings checked: ${Object.keys(registry.payload.bindings).length}`);
console.log(`Issues found: ${issues.length}\n`);

for (const [type, typeIssues] of Object.entries(byType)) {
  console.log(`\n${type.toUpperCase().replace(/_/g, ' ')}: ${typeIssues.length}`);
  typeIssues.slice(0, 10).forEach(issue => {
    console.log(`  ${issue.tag}`);
    console.log(`    ${issue.message}`);
    if (issue.options) {
      console.log(`    Options: ${issue.options.join(', ')}`);
    }
  });
  if (typeIssues.length > 10) {
    console.log(`  ... and ${typeIssues.length - 10} more`);
  }
}

await fs.writeFile('/tmp/tier-validation-issues.json', JSON.stringify(issues, null, 2));
console.log(`\n\nFull report: /tmp/tier-validation-issues.json`);

process.exit(issues.length > 0 ? 1 : 0);
