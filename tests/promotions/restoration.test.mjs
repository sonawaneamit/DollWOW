import test from 'node:test';
import assert from 'node:assert/strict';
import {restorationDecision} from '../../scripts/promotions/plan-restoration.mjs';
const row = {id:'variant',restoreAt:'2026-12-11T04:59:00Z',original:{price:'2349.00',compareAtPrice:null},promotional:{price:'2199.00',compareAtPrice:'2349.00'}};
test('deadline, exact restore, retries and intervening edits',()=>{
 assert.equal(restorationDecision(row,row.promotional,new Date('2026-12-11T04:58:59Z')).action,'WAIT');
 assert.deepEqual(restorationDecision(row,row.promotional,new Date(row.restoreAt)).value,row.original);
 assert.equal(restorationDecision(row,row.original,new Date(row.restoreAt)).action,'ALREADY_RESTORED');
 assert.equal(restorationDecision(row,{price:'2250.00',compareAtPrice:null},new Date(row.restoreAt)).action,'CONFLICT');
});
test('metafield restore preserves exact original bytes',()=>{
 const m={...row,original:'[{"id":"head","priceDelta":459}]',promotional:'[{"id":"head","priceDelta":0}]'};
 assert.equal(restorationDecision(m,m.promotional,new Date(m.restoreAt)).value,m.original);
});
