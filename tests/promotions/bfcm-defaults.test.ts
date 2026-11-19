import {test,expect} from 'vitest';
import {getDefaultSelections} from '@/lib/customization/resolve';
test('included preview upgrade replaces a neutral factory default, preserving other free upgrades',()=>{
 const config:any={id:'preview',groups:[{id:'standing-add-on',selectionMode:'multiple',options:[{id:'non-standing',label:'Non Standing',priceDelta:0,sourceProductionNoteSignals:{defaultSupplierSelection:true}},{id:'standing-no-bolts-hard-feet-free',label:'Standing No Bolts/Hard Feet',priceDelta:0,bfcmIncluded:true,purchasable:true}]}],rules:[]};
 expect(getDefaultSelections(config)['standing-add-on']).toEqual(['standing-no-bolts-hard-feet-free']);
 delete config.groups[0].options[1].bfcmIncluded;
 expect(getDefaultSelections(config)['standing-add-on']).toEqual(['non-standing']);
});
