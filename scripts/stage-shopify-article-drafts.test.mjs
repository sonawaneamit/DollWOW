import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateRecord, buildArticleInput, assertDraft, assertOwnedReconciliation } from './stage-shopify-article-drafts.mjs';
const sample = () => ({calendarId:'NEW-09',slug:'test-guide',title:'A full useful title',description:'An honest description.',category:'Buying Guides',body:`<h2>Details</h2><p>${'Useful information. '.repeat(240)}</p><a href="https://dollwow.com/shop/custom">Shop</a>`});
test('draft input cannot carry scheduled or published state', () => {
  const input=buildArticleInput({...sample(),isPublished:true,publishDate:'2026-12-01'},'gid://shopify/Blog/1');
  assert.equal(input.isPublished,false);
  assert.equal(input.publishDate,undefined);
  assert.equal(input.title,sample().title);
});
test('reject unsafe markup, external images and private references', () => {
  for(const body of ['<script>alert(1)</script>','<img src="https://other.com/a.jpg">','<p>https://drive.google.com/file</p>','<a href="javascript:alert(1)">Bad</a>','<p style="font-size:2px">Bad</p>']) {
    assert.throws(()=>validateRecord({...sample(),body:sample().body+body}));
  }
});
test('readback requires identical body and unscheduled draft', () => {
  const r=sample(),a={title:r.title,handle:r.slug,body:r.body,isPublished:false,publishedAt:null};
  assert.doesNotThrow(()=>assertDraft(a,r));
  assert.throws(()=>assertDraft({...a,isPublished:true},r));
  assert.throws(()=>assertDraft({...a,publishedAt:'2026-12-01'},r));
  assert.throws(()=>assertDraft({...a,body:'Owner edits'},r));
});
test('readback tolerates Shopify formatting, not lost links or content', () => {
  const r=sample();
  r.body='<p>A&#39;s &quot;example&quot;</p>\n<p><a href="https://dollwow.com">Read</a></p>';
  const a={title:r.title,handle:r.slug,body:'<p>A\'s "example"</p>\n\n<p> <a href="https://dollwow.com">Read</a> </p>',isPublished:false,publishedAt:null};
  assert.doesNotThrow(()=>assertDraft(a,r));
  assert.throws(()=>assertDraft({...a,body:a.body.replace('https://dollwow.com','https://example.com')},r));
});
test('a correction must match the recorded ID, title, handle, body hash and draft state', () => {
  const r=sample(),a={id:'gid://shopify/Article/1',title:r.title,handle:r.slug,body:r.body,isPublished:false,publishedAt:null};
  const receipt={articleId:a.id,slug:a.handle,title:a.title,sha256:createHash('sha256').update(a.body).digest('hex')};
  assert.doesNotThrow(()=>assertOwnedReconciliation(a,receipt));
  for(const changed of [{...a,title:'Owner edit'},{...a,body:'Owner edit'},{...a,isPublished:true}])assert.throws(()=>assertOwnedReconciliation(changed,receipt));
  assert.throws(()=>assertOwnedReconciliation(a,null));
});
