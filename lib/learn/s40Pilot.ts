export const s40PilotHandles = [
  'irontech-eileen-cozy-muse-164ln-s40-natural-silicone-companion-doll',
  'irontech-eileen-165cm-g-cup-hybrid-companion-doll-8fs16',
  'irontech-eileen-167cm-d-cup-hybrid-companion-doll-f58by',
  'irontech-eileen-162cm-a-cup-hybrid-companion-doll-fb15e',
  'irontech-eileen-164cm-f-cup-silicone-head-companion-doll-qa1in',
  'irontech-eileen-164cm-f-cup-silicone-head-companion-doll-5wkx7-2',
  'irontech-eileen-164cm-f-cup-silicone-head-companion-doll-5wkx7',
  'irontech-eileen-164cm-f-cup-silicone-head-companion-doll-nidst',
  'irontech-eileen-164cm-f-cup-silicone-companion-doll-5wkx7',
  'irontech-eileen-158cm-f-cup-silicone-companion-doll-12ele',
  'irontech-eileen-161cm-g-cup-silicone-head-companion-doll-17r5h',
  'irontech-eileen-164cm-f-cup-silicone-head-companion-doll-1abea',
  'irontech-eileen-164cm-g-cup-silicone-head-companion-doll-3tlag',
  'irontech-eileen-159cm-g-cup-silicone-head-companion-doll-7c8by'
] as const;

export const s40ReaderHandles = s40PilotHandles.filter(handle=>handle!=='irontech-eileen-164cm-f-cup-silicone-head-companion-doll-1abea');

export const s40FeaturedLooks = [
  {handle:s40PilotHandles[0],title:'Soft waves, warm glamour',description:'Long brunette waves give Eileen a relaxed, romantic feel.'},
  {handle:s40PilotHandles[5],title:'Blonde and softly polished',description:'A lighter hairstyle brings a softer contrast to the same full lips and shaped brows.'},
  {handle:s40PilotHandles[12],title:'Silver hair, a different mood',description:'Silver hair makes those dark eyes and defined lips the focus.'},
  {handle:s40PilotHandles[3],title:'The easygoing bob',description:'A short bob and casual styling give her a completely different energy.'},
  {handle:s40PilotHandles[4],title:'Glasses and a bolder look',description:'Blonde hair, glasses and stronger styling bring out her playful side.'}
] as const;

export function s40PilotEnabled(environment:string|undefined){return environment==='preview';}

const s40Styles = ['Cozy Muse - 164LN','Midnight Tee','Gothic Black','Easygoing Overalls','Blonde and Glasses','White Bustier','Brunette Glamour','Gold Halter','Soft White','White V-neck','Corset Portrait','Outdoor White Bikini','Silver-haired Lace','Sunshine Yellow'] as const;
export function s40CardLabel(handle:string){
  const index=s40PilotHandles.findIndex(h=>h===handle);
  return index<0?'Eileen S40':`Eileen - ${s40Styles[index]}`;
}

export const s40DollVueLooks = [
  {image:'/images/dollvue/s40-reference-pilot/golden-brown-blue-green.webp',title:'Golden Brown hair, Blue Green eyes',sourcePosition:1,selections:[{groupId:'hair-color',optionId:'1-golden-brown'},{groupId:'eye-color',optionId:'blue-green'}]},
  {image:'/images/dollvue/s40-reference-pilot/dark-tan-jet-black.webp',title:'Jet Black hair',sourcePosition:3,selections:[{groupId:'skin-tone',optionId:'dark-tan-skin'},{groupId:'hair-color',optionId:'3-jet-black'}]},
  {image:'/images/dollvue/s40-reference-pilot/glow-chestnut.webp',title:'Deep brown hair',sourcePosition:2,selections:[{groupId:'skin-tone',optionId:'glow-skin'},{groupId:'hair-color',optionId:'2-chestnut'}]}
] as const;
