import {describe,it,expect} from 'vitest';
import {s40CardLabel,s40DollVueLooks,s40DollVueReference,s40FeaturedLooks,s40PilotEnabled,s40PilotHandles,s40ReaderHandles,s40SoftStyledHandles} from '@/lib/learn/s40Pilot';

describe('single S40 reference pilot',()=>{
 it('restores all fourteen source candidates including the Outdoor card',()=>{
  expect(s40PilotHandles).toHaveLength(14);
  expect(s40ReaderHandles).toHaveLength(14);
  expect(s40ReaderHandles).toContain('irontech-eileen-164cm-f-cup-silicone-head-companion-doll-1abea');
  expect(s40PilotHandles).toContain('irontech-eileen-164cm-f-cup-silicone-head-companion-doll-1abea');
  for(const look of s40FeaturedLooks)expect(s40ReaderHandles).toContain(look.handle);
 });
 it('identifies the three softer-styled S40 cards for the head explanation',()=>{
  expect(s40SoftStyledHandles).toEqual([s40PilotHandles[8],s40PilotHandles[9],s40PilotHandles[10]]);
 });
 it('keeps three approved looks pinned to the same confirmed factory identity',()=>{
  expect(s40DollVueLooks).toHaveLength(3);
  expect(s40DollVueLooks.every(l=>l.sourcePosition===s40DollVueReference.sourcePosition)).toBe(true);
  expect(s40DollVueReference.handle).toBe(s40PilotHandles[1]);
  expect(s40DollVueReference.productId).toBe('gid://shopify/Product/10518046507192');
  expect(s40DollVueLooks[0].selections).toEqual([{groupId:'hair-color',optionId:'4-medium-blonde'},{groupId:'eye-color',optionId:'blue-green'}]);
  expect(s40DollVueLooks[1].selections).toEqual([{groupId:'hair-color',optionId:'3-jet-black'},{groupId:'eye-color',optionId:'green'}]);
  expect(s40DollVueLooks[2].selections).toEqual([{groupId:'hair-color',optionId:'2-chestnut'},{groupId:'eye-color',optionId:'amber'}]);
  expect(s40DollVueLooks.every(l=>!l.title.includes('skin'))).toBe(true);
  for(const look of s40DollVueLooks)expect(look.image).toMatch(/^\/images\/dollvue\/s40-reference-pilot\//);
 });
 it('distinguishes all fourteen cards without changing catalog titles',()=>{
  const labels=s40PilotHandles.map(s40CardLabel);
  expect(new Set(labels).size).toBe(14);expect(labels[0]).toBe('Eileen - Cozy Muse - 164LN');
 });
 it('keeps all fourteen reviewed handles distinct',()=>{
  expect(s40PilotHandles).toHaveLength(14);
  expect(new Set(s40PilotHandles).size).toBe(14);
  expect(s40PilotHandles.every(h=>h.startsWith('irontech-eileen-'))).toBe(true);
 });
 it('features five real listed looks without replacing the full listing set',()=>{
  expect(s40FeaturedLooks).toHaveLength(5);
  expect(new Set(s40FeaturedLooks.map(l=>l.handle)).size).toBe(5);
  for(const look of s40FeaturedLooks)expect(s40PilotHandles).toContain(look.handle);
 });
 it('does not open production or development reference routes',()=>{
  expect(s40PilotEnabled('preview')).toBe(true);
  for(const mode of ['production','development',undefined])expect(s40PilotEnabled(mode)).toBe(false);
 });
});
