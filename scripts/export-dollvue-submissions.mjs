import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const output = process.argv[process.argv.indexOf('--output') + 1];
if (!process.argv.includes('--output') || !path.isAbsolute(output)) throw new Error('An absolute private --output path is required');
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Server reporting credentials are required');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const records = [];
for (let offset = 0; ; offset += 500) {
  const { data, error } = await db.from('dollvue_submissions').select('*').order('submitted_at').order('id').range(offset, offset + 499);
  if (error) throw new Error('Private submissions export failed');
  records.push(...data);
  if (data.length < 500) break;
  if (offset >= 49_500) throw new Error('Export exceeded bounded report size; do not truncate');
}
const safe = value => String(value ?? '').replace(/^[=+@-]/, "'$&");
const rows = records.map(row => [
  // Numeric Sheets serial in Lisbon local wall time, formatted by the destination.
  Date.parse(new Date(row.submitted_at).toLocaleString('sv-SE', {timeZone:'Europe/Lisbon'}).replace(' ', 'T')+'Z') / 86400000 + 25569,
  safe(row.email), safe(row.product_name), safe(row.product_handle),
  safe([row.head_code && `Head ${row.head_code}`, row.body_code && `Body ${row.body_code}`].filter(Boolean).join('; ')),
  safe(row.brand), `https://dollwow.com/products/${encodeURIComponent(row.product_handle)}`,
  row.verified_at ? 'Yes' : 'No', row.generated_at ? 'Yes' : 'No',
  safe(Array.isArray(row.selected_options) ? row.selected_options.map(x => `${x.group}: ${x.option}`).join('; ') : ''),
  safe(row.delivery_status), safe(row.id),
]);
await fs.mkdir(path.dirname(output), {recursive:true});
await fs.writeFile(output, JSON.stringify({ exportedAt: new Date().toISOString(), rowCount: rows.length, rows }), {mode:0o600});
console.log(JSON.stringify({rowCount:rows.length, output, containsPrivateCustomerData:true}));
