import {describe,expect,it} from 'vitest';
import records from '@/data/preview-editorial/dol177-approved-oct22.json';
import {withPreviewEditorialFixture} from '@/lib/catalog/previewEditorialFixture';
import {sampleProducts} from '@/lib/data/sample-products';

describe('Reviewed 42-page editorial preview mirror',()=>{
 it('has exactly42 records containing only the existing public editorial fields',()=>{
  expect(Object.keys(records)).toHaveLength(42);
  for(const content of Object.values(records)){
   expect(Object.keys(content).sort()).toEqual(['eyebrow','heading','paragraph']);
   expect(Object.values(content).every(value=>typeof value==='string'&&value.trim().length>0)).toBe(true);
  }
 });
 it('fills every reviewed preview without altering the copied text',()=>{
  for(const [handle,content] of Object.entries(records)){
   const p={...sampleProducts[0],handle,extended:{...sampleProducts[0].extended,editorialIntro:undefined}};
   expect(withPreviewEditorialFixture(p,'preview').extended.editorialIntro).toEqual(content);
   expect(p.extended.editorialIntro).toBeUndefined();
  }
 });
 it('leaves production and existing source editorial untouched',()=>{
  for(const handle of Object.keys(records)){
   const p={...sampleProducts[0],handle,extended:{...sampleProducts[0].extended,editorialIntro:undefined}};
   expect(withPreviewEditorialFixture(p,'production')).toBe(p);
   const current={...p,extended:{...p.extended,editorialIntro:{eyebrow:'Current',heading:'Source heading',paragraph:'Existing source editorial.'}}};
   expect(withPreviewEditorialFixture(current,'preview')).toBe(current);
  }
 });
 it('does not add editorial to an unrelated preview handle',()=>{
  const p={...sampleProducts[0],handle:'unrelated-unreviewed-handle',extended:{...sampleProducts[0].extended,editorialIntro:undefined}};
  expect(withPreviewEditorialFixture(p,'preview')).toBe(p);
 });
});
