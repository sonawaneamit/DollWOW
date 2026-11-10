import {expect,it} from 'vitest';
import {assessExteriorOption} from '@/lib/dollvue/exteriorScope';
it.each([['Choose a Head','Mirella','head-sculpt'],['More Features','Navel ring','piercing'],['Finish','Body painting','external-finish'],['Lingerie','Black outfit','outfit']])('records visible scope independently of runtime support: %s/%s',(group,label,feature)=>{
 const result=assessExteriorOption({label:group},{label});expect(result.visibility).toBe('external');expect(result.feature).toBe(feature);
});
it('does not release held visible cosmetics',()=>{
 const result=assessExteriorOption({label:'More Features'},{label:'Freckle',displayable:false});
 expect(result.visibility).toBe('external');expect(result.sourcing).toBe('held-or-unavailable');expect(result.runtime).not.toBe('candidate');
});
it('separates intimate appearance from internal functions',()=>{
 expect(assessExteriorOption({label:'Areola'},{label:'Pink'}).visibility).toBe('separate-intimate-scope');
 expect(assessExteriorOption({label:'Upgrade'},{label:'Body heating'}).visibility).toBe('not-a-still-image-change');
});
