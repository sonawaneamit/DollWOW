export const seStarperyPilot = {
  slug: 'se-doll-vs-starpery-build-comparison',
  title: 'SE Doll vs Starpery: Alba A or Amy?',
  description: 'Alba A is the lighter, lower-priced choice. Amy is the pick for a fuller figure and a silicone face. Here is what you gain, and give up, with each.',
  models: [
    {
      handle: 'sedoll-alba-a-161cm-f-cup-tpe-companion-doll-11id7',
      name: 'Alba A', brand: 'SE Doll', pick: 'Our pick for a lighter build',
      height: 161, weight: 35, bust: 83, waist: 50, hips: 89,
      construction: 'TPE body; original head in the base build',
      advantage: 'A narrower figure and 17.5 kg less to move than Amy. The stronger starting point when handling and storage matter.',
      tradeoff: 'You give up Amy\'s fuller silhouette and standard silicone head. Adding a silicone head changes the price.',
      verdict: 'Choose Alba A if you want the smaller footprint of these two bodies and more room in your starting budget.'
    },
    {
      handle: 'starpery-amy-161cm-h-cup-silicone-head-companion-doll-1l9j0',
      name: 'Amy', brand: 'Starpery', pick: 'Our pick for a fuller figure',
      height: 161, weight: 52.5, bust: 109, waist: 102, hips: 125,
      construction: 'TPE body with a hard silicone head as standard',
      advantage: 'A much fuller figure at the same height, with the silicone head already part of the starting build.',
      tradeoff: 'At 52.5 kg, moving and storing her is a bigger commitment. Her 125 cm hips also need substantially more space.',
      verdict: 'Choose Amy if a generous silhouette and the included silicone face matter more than lower weight.'
    }
  ]
} as const;

export function seStarperyPilotEnabled(environment: string | undefined) {
  return environment === 'preview';
}

export function seStarperyPriceGap(alba: string, amy: string) {
  const gap = Number(amy) - Number(alba);
  return Number.isFinite(gap) && gap > 0 ? gap : null;
}
