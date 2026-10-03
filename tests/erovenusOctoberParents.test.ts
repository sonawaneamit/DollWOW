import {expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import release from '@/lib/cart/evidence/named-upgrades-release.json';
import {releasedNamedBindings} from '@/lib/cart/named-upgrade-release';
import charges from './fixtures/ivyNamedCharges.json';

for(const [name,id] of Object.entries({Cinna:'54235923906744',Jody:'54235924168888',Cassie:'54235924431032',Bela:'54235924627640'})){
 it(`${name} reuses all nine reviewed Erovenus torso charges`,()=>{
  const parent=`gid://shopify/ProductVariant/${id}`;
  const bindings=releasedNamedBindings(release,[parent]);
  const donor=releasedNamedBindings(release,[charges.parentVariantId]);
  expect(bindings).toHaveLength(9);
  expect(bindings).toEqual(donor.map(b=>({...b,parentVariantId:parent})));
 });
}
