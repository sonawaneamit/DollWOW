import fs from 'node:fs/promises';
import path from 'node:path';
import { productionOrderSummary } from '../lib/orders/production-summary.ts';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node scripts/export-production-order.mjs <authenticated-admin-snapshot.json> <private-summary.json>');
const snapshot = JSON.parse(await fs.readFile(input, 'utf8'));
const summary = productionOrderSummary(snapshot.order, snapshot.capturedAt);
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(summary, null, 2), { mode: 0o600 });
console.log(JSON.stringify({ status: summary.status, products: summary.builds.length, reviewHolds: summary.holds.length, reconciled: true }));
