import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertImageDraft,assertImageReview,stableArticleHash} from './stage-shopify-article-images.mjs';
test('image updates target only a recorded unscheduled draft',()=>{
 const r={articleId:'a',slug:'b'},a={id:'a',handle:'b',isPublished:false,publishedAt:null};
 assert.doesNotThrow(()=>assertImageDraft(a,r));
 for(const x of [{...a,id:'other'},{...a,handle:'other'},{...a,isPublished:true},{...a,publishedAt:'tomorrow'}])assert.throws(()=>assertImageDraft(x,r));
});
test('reviewed artwork needs reference provenance and bounded alt text',()=>{
 const a={id:'NEW-01',slug:'test',outputPath:'/asset.webp',altText:'Useful editorial description',parentApproved:true,sourceReferencePaths:['/source.jpg'],prompt:'A real prompt'};
 assert.doesNotThrow(()=>assertImageReview(a));
 assert.throws(()=>assertImageReview({...a,parentApproved:false}));
 assert.throws(()=>assertImageReview({...a,sourceReferencePaths:[]}));
 assert.doesNotThrow(()=>assertImageReview({...a,sourceReferencePaths:[],originalConcept:true}));
});
test('image-only edits must not affect article title, copy, tags or author',()=>{
 const a={title:'Title',handle:'slug',body:'Copy',summary:'Summary',tags:['tag'],author:{name:'DollWOW'}};
 assert.equal(stableArticleHash(a),stableArticleHash({...a,image:{url:'cdn'}}));
 for(const k of ['title','body','summary','handle'])assert.notEqual(stableArticleHash(a),stableArticleHash({...a,[k]:'Changed'}));
});
