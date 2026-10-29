import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {DollVueAccessGate} from '@/components/dollvue/DollVueAccessGate';
describe('DollVue verification product context',()=>{
 it('identifies the selected doll before verification without changing the gate',()=>{
  const html=renderToStaticMarkup(<DollVueAccessGate handle="irontech-eileen" productName="Eileen Cozy Muse" headLabel="S40"/>);
  expect(html).toContain('Preview Eileen Cozy Muse');expect(html).toContain('Head S40');
  expect(html).toContain('type="email"');expect(html).toContain('Email my access link');
 });
 it('reserves a compact protected photo and displays actual product context above the email field',()=>{
  const html=renderToStaticMarkup(<DollVueAccessGate handle="irontech-eileen" productName="Eileen" headLabel="S40" bodyLabel="B12" productImage="/product-media/v4/irontech-eileen/0?size=card" specs={['164 cm','Silicone']}/>);
  expect(html).toContain('Eileen reference photo');expect(html).toContain('Body B12');expect(html).toContain('164 cm');expect(html).toContain('Silicone');
  expect(html.indexOf('data-dollvue-product')).toBeLessThan(html.indexOf('type="email"'));
  expect(html).not.toContain('Selected skin');expect(html).toContain('Email my access link');
 });
 it('retains generic access copy when no product context is supplied',()=>{
  const html=renderToStaticMarkup(<DollVueAccessGate handle="example"/>);
  expect(html).toContain('Verify once. Preview anywhere.');expect(html).not.toContain('data-dollvue-head');
 });
});
