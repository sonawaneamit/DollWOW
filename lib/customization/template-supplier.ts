const suppliers: Record<string, string> = {
  '6ye': '6YE Dolls', hr: 'HR Dolls', irontech: 'Irontech Dolls', jarliet: 'Jarliet Dolls',
  'real-lady': 'Real Lady', 'dolls-castle': 'Dolls Castle', climax: 'Climax Doll', il: 'IL Doll',
  angelkiss: 'Angelkiss', avant: 'Avant Doll', 'ai-tech': 'Ai-Tech', wm: 'WM Dolls',
  se: 'SE Doll', lusandy: 'Lusandy', moonvale: 'Moonvale', piper: 'Piper Dolls',
  starpery: 'Starpery', sy: 'SY Dolls', yl: 'YL Dolls'
};

/** Only a single, matching reviewed tag can supply the checkout batch namespace. */
export function templateSupplier(expectedTag: string, actualTags: string[]) {
  const tags = actualTags.filter(tag => tag.startsWith('options:'));
  if (tags.length !== 1 || tags[0] !== expectedTag) return null;
  const key = /^options:(.+)-(?:female|male)-/.exec(expectedTag)?.[1];
  return key && suppliers[key] ? { key, label: suppliers[key] } : null;
}
