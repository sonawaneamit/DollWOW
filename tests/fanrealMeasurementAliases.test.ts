import {describe,it,expect} from 'vitest';
import {productMeasurementSpecs,primaryProductSpecs} from '@/lib/catalog/productSpecs';
import {sampleProducts} from '@/lib/data/sample-products';
describe('factory measurement label coverage',()=>{
 it('renders exact Fanreal hips, shoulder and foot dimensions instead of asking for facts already supplied',()=>{
  const product={...sampleProducts[0],description:'',extended:{...sampleProducts[0].extended,measurements:{Height:'175 cm',Weight:'34 kg',Hips:'93 cm',Shoulder:'40 cm',Foot:'27 cm','Arm Length':'49 cm','Vaginal Depth':'17 cm','Anal Depth':'12 cm'}}};
  const rows=productMeasurementSpecs(product);expect(rows.find(r=>r.label==='Hip')?.value).toContain('93 cm');expect(rows.find(r=>r.label==='Feet Length')?.value).toContain('27 cm');expect(rows.find(r=>r.label==='Shoulders Width')?.value).toContain('40 cm');expect(rows.find(r=>r.label==='Arms Length')?.value).toContain('49 cm');expect(rows.find(r=>r.label==='Vagina Depth')?.value).toContain('17 cm');expect(rows.find(r=>r.label==='Anus Depth')?.value).toContain('12 cm');
 });
 it('does not lose late factory fit dimensions when the chart has more than eighteen facts',()=>{
  const measurements={Height:'166 cm',Weight:'36 kg',...Object.fromEntries(Array.from({length:22},(_,i)=>['Factory detail '+i,'Confirm'])),Hipline:'104 cm',Foot:'23 cm','Upper Bust':'105 cm','Vaginal Depth':'17 cm'};
  const product={...sampleProducts[0],description:'',extended:{...sampleProducts[0].extended,measurements}};const rows=productMeasurementSpecs(product);
  expect(rows.find(r=>r.label==='Hip')?.value).toContain('104 cm');expect(rows.find(r=>r.label==='Feet Length')?.value).toContain('23 cm');expect(rows.find(r=>r.label==='Bust')?.value).toContain('105 cm');
 });
 it('preserves source ranges and body-only weight qualifications while resolving aliases',()=>{
  const product={...sampleProducts[0],description:'',extended:{...sampleProducts[0].extended,measurements:{Height:'156–160 cm (depends on head)',Weight:'32 kg (body only; head excluded)',Hips:'90–93 cm (depending on build)'}}};
  expect(primaryProductSpecs(product).find(r=>r.label==='Height')?.value).toContain('156–160 cm (depends on head)');expect(primaryProductSpecs(product).find(r=>r.label==='Weight')?.value).toContain('body only; head excluded');expect(productMeasurementSpecs(product).find(r=>r.label==='Hip')?.value).toContain('90–93 cm (depending on build)');
 });
});
