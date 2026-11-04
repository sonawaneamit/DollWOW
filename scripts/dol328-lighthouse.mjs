import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const phase = args[0];
const origin = args[1];
if (!['before', 'candidate'].includes(phase) || !origin ||
    !/^https:\/\/(?:dollwow\.com|doll-[a-z0-9]+-sonawaneamits-projects\.vercel\.app)$/.test(origin)) {
  throw new Error('Usage: node scripts/dol328-lighthouse.mjs before|candidate https://approved-host');
}
const output = path.resolve('data/exports/dol-328-2026-11-02');
fs.mkdirSync(output, { recursive: true });
const pages = [
  ['home', '/'],
  ['collection', '/shop/sex-dolls'],
  ['brand', '/brands/dolls-castle'],
  ['product', '/products/sedoll-samantha-k-161cm-f-cup-black-tpe-elf-sed340'],
  ['dollvue', '/dollvue']
];
const results = [];
// Serial lab runs avoid competing audits. Never call the exhausted PSI API.
for (const [page, pathname] of pages) {
  for (const device of ['mobile', 'desktop']) {
    const reportPath = path.join(output, `lighthouse-${phase}-${page}-${device}.json`);
    if (!fs.existsSync(reportPath)) {
      const run = spawnSync('npx', [
        '--yes', 'lighthouse@13.6.0', `${origin}${pathname}`,
        ...(device === 'desktop' ? ['--preset=desktop'] : []),
        '--chrome-flags=--headless --disable-gpu',
        '--only-categories=performance,accessibility,best-practices,seo',
        '--output=json', `--output-path=${reportPath}`, '--quiet'
      ], {
        env: { ...process.env, CHROME_PATH: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' },
        timeout: 180000, stdio: ['ignore', 'pipe', 'pipe']
      });
      if (run.status !== 0) {
        results.push({ page, device, status: 'failed', reason: run.error?.code ?? `exit-${run.status}` });
        fs.writeFileSync(path.join(output, `lighthouse-${phase}-summary.json`), JSON.stringify(results, null, 2));
        throw new Error(`Lighthouse failed for ${page}/${device}; no score claimed`);
      }
    }
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const actualUrl = report.finalDisplayedUrl ?? report.finalUrl;
    if (report.runtimeError || report.requestedUrl !== `${origin}${pathname}` ||
        !actualUrl || new URL(actualUrl).origin !== origin || new URL(actualUrl).pathname !== pathname) {
      results.push({ page, device, status: 'invalid-destination', reason: 'Report did not measure the requested storefront page; no score claimed' });
      fs.writeFileSync(path.join(output, `lighthouse-${phase}-summary.json`), JSON.stringify(results, null, 2));
      throw new Error(`Invalid Lighthouse report for ${page}/${device}`);
    }
    const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
    if (categories.some(category => typeof report.categories?.[category]?.score !== 'number')) {
      throw new Error(`Missing score for ${page}/${device}; not an all-clear`);
    }
    const result = {
      page, device, url: report.finalDisplayedUrl, at: report.fetchTime,
      lighthouse: report.lighthouseVersion, report: path.relative(process.cwd(), reportPath),
      status: 'measured', scores: Object.fromEntries(categories.map(category => [category, Math.round(report.categories[category].score * 100)])),
      metrics: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time',
        'cumulative-layout-shift', 'speed-index'].map(metric => [metric, report.audits[metric]?.numericValue ?? null])),
      warnings: report.runWarnings ?? []
    };
    results.push(result);
    fs.writeFileSync(path.join(output, `lighthouse-${phase}-summary.json`), JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ page, device, at: result.at, scores: result.scores }));
  }
}
