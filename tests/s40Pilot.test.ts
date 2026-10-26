import {describe,it,expect} from 'vitest';
import {s40CardLabel,s40DollVueLooks,s40FeaturedLooks,s40PilotEnabled,s40PilotHandles} from '@/lib/learn/s40Pilot';

describe('single S40 reference pilot',()=>{
 it('keeps three supported generated looks on distinct non-primary bases',()=>{
  expect(s40DollVueLooks).toHaveLength(3);
  expect(new Set(s40DollVueLooks.map(l=>l.sourcePosition)).size).toBe(3);
  expect(s40DollVueLooks.map(l=>l.sourcePosition)).not.toContain(0);
  expect(s40DollVueLooks[0].selections).toEqual([{groupId:'hair-color',optionId:'1-golden-brown'},{groupId:'eye-color',optionId:'blue-green'}]);
  expect(s40DollVueLooks[1].selections).toEqual([{groupId:'skin-tone',optionId:'dark-tan-skin'},{groupId:'hair-color',optionId:'3-jet-black'}]);
  expect(s40DollVueLooks[1].title).toBe('Jet Black hair');
  expect(s40DollVueLooks[2].title).toBe('Deep brown hair');
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
