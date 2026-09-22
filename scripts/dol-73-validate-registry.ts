import fs from 'node:fs';
import { templateReleaseIssues } from '../lib/customization/template-release-registry';
const registry = JSON.parse(fs.readFileSync('lib/customization/evidence/template-release.json','utf8'));
const issues = templateReleaseIssues(registry);
console.log(JSON.stringify({ issues, status: registry.releaseStatus, count: registry.payload.entries.length }));
if (issues.length) process.exit(3);
