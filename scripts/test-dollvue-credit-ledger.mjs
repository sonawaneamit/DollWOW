import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';

const {PGlite} = await import(process.env.PGLITE_TEST_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const hash = 'a'.repeat(64), fingerprint = 'b'.repeat(64), other = 'c'.repeat(64);
let assertions = 0;
async function eq(sql, params, expected) {
  const result = await db.query(sql,params);
  assert.equal(Object.values(result.rows[0])[0],expected); assertions++;
}
try {
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  for (const file of ['0003_ai_foundation.sql','0007_dollvue_submissions.sql','0008_dollvue_credit_ledger.sql']) {
    await db.exec(await readFile(new URL(`../supabase/migrations/${file}`,import.meta.url),'utf8'));
  }
  await db.exec('set role service_role');
  const grant = `select public.dollvue_grant_paid_credits($1,$2,$3,$4,$5,$6)`;
  const args = ['fixture.myshopify.com','100',hash,'qa@example.invalid',5,fingerprint];
  await eq(grant,args,'granted');
  await eq(grant,args,'duplicate');
  await eq('select count(*)::int from dollvue_credit_receipts',[],1);
  await assert.rejects(db.query(grant,[...args.slice(0,4),12,fingerprint]),/Conflicting grant/); assertions++;
  await eq('select sum(credits)::int from dollvue_credit_orders',[],5);
  // Nine historical successes leave exactly one of five free + five paid.
  for(let i=0;i<9;i++) await db.query("insert into ai_usage_events(feature,provider,user_email_hash) values('dollvue-preview','fixture',$1)",[hash]);
  const first = randomUUID(), second = randomUUID();
  const reserve = 'select public.dollvue_reserve_preview($1,$2)';
  const results = await Promise.all([db.query(reserve,[hash,first]),db.query(reserve,[hash,second])]);
  assert.deepEqual(results.map(r=>r.rows[0].dollvue_reserve_preview).sort(),['exhausted','reserved']); assertions++;
  const winner = results[0].rows[0].dollvue_reserve_preview==='reserved'?first:second;
  const loser = winner===first?second:first;
  await eq(reserve,[hash,winner],'reserved');
  const finish = 'select public.dollvue_finish_preview($1,$2,$3,$4,$5)';
  await eq(finish,[hash,winner,false,'fixture',{}],'released');
  await eq(reserve,[hash,loser],'reserved');
  await assert.rejects(db.query(finish,[other,loser,true,'fixture',{}]),/Unknown reservation/); assertions++;
  await eq(finish,[hash,loser,true,'fixture',{}],'completed');
  await eq(finish,[hash,loser,true,'fixture',{}],'completed');
  await eq('select count(*)::int from ai_usage_events where user_email_hash=$1',[hash],10);
  await eq(reserve,[hash,randomUUID()],'exhausted');
  // Expired reservations cannot charge after their capacity is released.
  const expired = randomUUID();
  await eq(reserve,[other,expired],'reserved');
  await db.query("update dollvue_credit_reservations set expires_at=now()-interval '1 minute' where id=$1",[expired]);
  await eq(finish,[other,expired,true,'fixture',{}],'released');
  await eq('select count(*)::int from ai_usage_events where user_email_hash=$1',[other],0);
  await assert.rejects(db.query(finish,[null,loser,true,'fixture',{}]),/Invalid completion/); assertions++;
  // A refund arriving before paid delivery cannot be followed by a grant.
  await db.query("select public.dollvue_hold_credit_order($1,$2,'refund')",['fixture.myshopify.com','101']);
  await eq(grant,['fixture.myshopify.com','101',other,'qa@example.invalid',12,fingerprint],'review');
  await eq('select count(*)::int from dollvue_credit_orders where order_id=$1',['101'],0);
  // Cancellation freezes an already granted account and its queued receipt.
  await db.query("select public.dollvue_hold_credit_order($1,$2,'cancelled')",['fixture.myshopify.com','100']);
  await eq(reserve,[hash,randomUUID()],'review');
  await eq('select status from dollvue_credit_receipts where order_id=$1',['100'],'review');
  // A hold arriving after reservation must also prevent its completion.
  const held = randomUUID();
  await eq(grant,['fixture.myshopify.com','102',other,'qa@example.invalid',5,fingerprint],'granted');
  await eq(reserve,[other,held],'reserved');
  await db.query("select public.dollvue_hold_credit_order($1,$2,'refund')",['fixture.myshopify.com','102']);
  await eq(finish,[other,held,true,'fixture',{}],'review');
  await eq('select count(*)::int from ai_usage_events where user_email_hash=$1',[other],0);
  await db.exec('reset role; set role anon');
  await assert.rejects(db.query('select * from dollvue_credit_receipts'),/permission denied/); assertions++;
  await assert.rejects(db.query(grant,args),/permission denied/); assertions++;
  await db.exec('reset role; set role authenticated');
  await assert.rejects(db.query(reserve,[hash,randomUUID()]),/permission denied/); assertions++;
  console.log(JSON.stringify({status:'PASS',assertions,environment:'isolated PGlite; no live migration, order, email or grant'}));
} finally { await db.close(); }
