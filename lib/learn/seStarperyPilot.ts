export const seStarperyPilot = {
  slug: 'se-doll-vs-starpery-build-comparison',
  title: 'SE Doll vs Starpery: Alba A or Amy?',
  description: 'Alba A is the lighter, lower-priced choice. Amy is the pick for a fuller figure and naturalistic styling. Here is what you gain, and give up, with each.',
  models: [
    {
      handle: 'sedoll-alba-a-161cm-f-cup-tpe-companion-doll-11id7',
      name: 'Alba A', brand: 'SE Doll', pick: 'Our pick for a lighter build',
      height: 161, weight: 35, bust: 83, waist: 50, hips: 89,
      construction: 'TPE body; original head in the base build',
      advantage: 'A narrower figure and less to move than Amy. The stronger starting point when handling and storage matter.',
      tradeoff: 'You give up Amy\'s fuller silhouette and standard silicone head. Adding a silicone head changes the price.',
      verdict: 'Choose Alba A if you want the smaller footprint of these two bodies and more room in your starting budget.'
    },
    {
      handle: 'starpery-amy-161cm-h-cup-silicone-head-companion-doll-1l9j0',
      name: 'Amy', brand: 'Starpery', pick: 'Our pick for a fuller figure',
      height: 161, weight: 52.5, bust: 109,
      construction: 'TPE body with a hard silicone head as standard',
      advantage: 'A much fuller figure at the same height, with the silicone head already part of the starting build.',
      tradeoff: 'Moving and storing her is a bigger commitment. Her fuller body also needs more space.',
      verdict: 'Choose Amy if a generous silhouette and the included silicone face matter more than lower weight.'
    }
  ]
} as const;

export const seStarperyPicks = [
  {need:'Keep the starting budget lower',modelIndex:0,reason:'Alba A leaves more of your budget for the finish and accessories you actually want.'},
  {need:'Move or restyle her more often',modelIndex:0,reason:'The lower listed weight makes Alba A our choice for more frequent moving and outfit changes.'},
  {need:'Choose a silicone face from the start',modelIndex:1,reason:'Amy includes that head construction in her base build.'},
  {need:'Go for a fuller silhouette',modelIndex:1,reason:'Amy is our pick when a generous figure is the whole point of the purchase.'}
] as const;

export const seStarperyTradeoffs = [
  {pros:['Lower starting price of this pair.','Less listed weight to move.','A slimmer figure for fitted styling.','Regular TPE and STPE material choices in her customizer.'],cons:['The original head is the base choice; a silicone head costs extra.','Not our pick for a plus-size silhouette.','Her full-size TPE build still needs careful drying and storage.']},
  {pros:['Naturalistic facial styling with a defined brow and softer expression.','The fuller figure we would choose for a curvy display.','TPE, S-TPE and silicone body choices in her customizer.','Wig styles and eye colors give this face room for different looks.'],cons:['Higher starting price of this pair.','More weight and volume to plan around when moving or storing her.','Her default body is TPE; full silicone is a separate selection.']}
] as const;

export const amyDollVueLooks = [
  {image:'/images/dollvue/se-starpery-pilot/amy-blonde-green.webp',title:'Hairstyle #4 and Green eyes',selections:[{groupId:'hairstyle',optionId:'hairstyle-4'},{groupId:'eye-color',optionId:'green'}]},
  {image:'/images/dollvue/se-starpery-pilot/amy-black-blue.webp',title:'Hairstyle #1 and Blue eyes',selections:[{groupId:'hairstyle',optionId:'hairstyle-1'},{groupId:'eye-color',optionId:'blue'}]}
] as const;

export function seStarperyPilotEnabled(environment: string | undefined) {
  return environment === 'preview';
}

export function seStarperyPriceGap(alba: string, amy: string) {
  const gap = Number(amy) - Number(alba);
  return Number.isFinite(gap) && gap > 0 ? gap : null;
}
