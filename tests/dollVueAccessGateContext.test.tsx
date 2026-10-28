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
 it('retains generic access copy when no product context is supplied',()=>{
  const html=renderToStaticMarkup(<DollVueAccessGate handle="example"/>);
  expect(html).toContain('Verify once. Preview anywhere.');expect(html).not.toContain('data-dollvue-head');
 });
});
