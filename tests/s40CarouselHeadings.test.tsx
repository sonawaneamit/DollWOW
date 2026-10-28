import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {S40LookCarousel} from '@/components/reference/S40LookCarousel';
import {s40FeaturedLooks} from '@/lib/learn/s40Pilot';

describe('S40 carousel semantic headings',()=>{
 it('puts each visible factory-look title inside its heading',()=>{
  const html=renderToStaticMarkup(<S40LookCarousel looks={s40FeaturedLooks.map(look=>({...look,image:'/images/test.webp'}))}/>);
  const headings=[...html.matchAll(/<h3\b[^>]*>(.*?)<\/h3>/g)].map(match=>match[1].replace(/<[^>]+>/g,''));
  expect(headings).toEqual(s40FeaturedLooks.map(look=>look.title));
  expect(headings.every(Boolean)).toBe(true);
 });
});
