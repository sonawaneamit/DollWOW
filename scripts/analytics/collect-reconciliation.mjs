import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const output = resolve(process.argv[2] || 'data/exports/dol-212-reconciliation-2026-10-28');
mkdirSync(output, { recursive: true });
const base = {
  dateRanges: [{ startDate: '2026-09-28', endDate: '2026-10-27' }],
  dimensionFilter: { filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: 'dollwow.com' } } },
  limit: 100000,
  returnPropertyQuota: true
};
for (const [name, dimensions, metrics] of [
  ['daily', ['date'], ['screenPageViews', 'sessions']],
  ['devices', ['deviceCategory'], ['screenPageViews', 'sessions', 'totalUsers']],
  ['pages', ['pagePath'], ['screenPageViews']],
  ['sources', ['sessionSource', 'sessionMedium'], ['screenPageViews', 'sessions']],
  ['hostnames', ['hostName'], ['screenPageViews', 'sessions', 'totalUsers']]
]) {
  const request = { ...base, dimensions: dimensions.map(name => ({ name })), metrics: metrics.map(name => ({ name })) };
  if (name === 'hostnames') delete request.dimensionFilter;
  const response = JSON.parse(execFileSync('seo', ['analytics', 'google', 'report', '--property', '549359657', '--body', JSON.stringify(request), '--json', '--refresh'], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }));
  const receipt = { capturedAt: new Date().toISOString(), property: '549359657', request, response,
    caveat: 'Observed GA Data API values, not consent coverage or delivery proof. Users and sessions must not be summed across dimensions.' };
  writeFileSync(resolve(output, `${name}.json`), JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify({ report: name, rows: response.rowCount || 0, timeZone: response.metadata?.timeZone, path: resolve(output, `${name}.json`) }));
}
