import type { Product } from '@/types/product';
import snapshots from '@/data/draft-previews/se-elf-pdps.json';
import { isSeHalloweenPreview } from '@/lib/promotions/seHalloween2026';

export const seElfEditorial: Record<string, NonNullable<Product['extended']['editorialIntro']>> = {
  SED338: {
    eyebrow: 'Red, copper and a little theatre',
    heading: 'Samantha.L makes her entrance',
    paragraph: 'Samantha.L gives the Elf collection a striking red portrait. Copper-blonde hair frames dark lips and graphic eye makeup in the supplier photographs, while pointed ears make the fantasy character unmistakable. The photographed W022 head sits on a 153 cm A-cup TPE body, giving this build a different silhouette from the taller Samantha.K. Red skin and the softly layered bob carry the look without an elaborate setting. It is a character-led composition: a vivid finish, a defined face and just enough contrast to hold the eye.'
  },
  SED339: {
    eyebrow: 'A copper-haired crimson portrait',
    heading: 'Luis.G, in a bolder silhouette',
    paragraph: 'Long copper hair and a straight fringe set off Luis.G in the original supplier portraits. Pointed ears, dark lips and red skin give the Elf styling a clear identity against the black background. This photographed build pairs the W021 head with a 157 cm H-cup TPE body. The fuller silhouette distinguishes her from the smaller Samantha.L without changing the red collection palette. There is no scenery to compete with the character; the face, hair and proportions do the work. Luis.G brings a more dramatic scale to the same fantasy theme.'
  },
  SED340: {
    eyebrow: 'Dark hair, silver accents',
    heading: 'Samantha.K changes the mood',
    paragraph: 'Samantha.K takes the Elf collection in a darker direction. The supplier photographs frame her face with a dark fringe and pale strands through the hair, while pointed ears keep the character distinct. The Black Elf styling is paired with the W022 head and a 161 cm F-cup TPE body. A plain, light backdrop makes the contrast easy to see without adding a costume or imagined setting. She shares a photographed head code with Samantha.L, but the body, palette and hairstyle give this build its own presence.'
  },
  SED341: {
    eyebrow: 'Silver-blonde hair, a darker palette',
    heading: 'Luis.H in a different light',
    paragraph: 'Luis.H pairs long silver-blonde hair with the darker Black Elf styling in the supplier photographs. A straight fringe, pointed ears and contrasting lips bring the face into focus against the light background. This build uses the W021 head on a 163 cm E-cup TPE body, a different set of proportions from the red Luis.G. The pale hair gives the portrait a clear visual counterpoint rather than an elaborate costume. It is another interpretation of the Elf character, with its own height, silhouette and photographed styling.'
  }
};

export function isSeElfPreviewProduct(product: Pick<Product, 'id' | 'handle'>) {
  return snapshots.some(p => p.id === product.id && p.handle === product.handle);
}

export function seElfPreviewProduct(handle: string): Product | null {
  if (!isSeHalloweenPreview()) return null;
  const product = snapshots.find(p => p.handle === handle);
  if (!product) return null;
  const result = structuredClone(product) as unknown as Product;
  result.extended.editorialIntro = seElfEditorial[result.id.split(':').at(-1)!];
  return result;
}

export function seElfLocalImagePath(product: Product, url: string) {
  if (!isSeHalloweenPreview() || !isSeElfPreviewProduct(product)) return null;
  const snapshot = snapshots.find(p => p.id === product.id)!;
  return snapshot.images.some(image => image.url === url) ? `public${url}` : null;
}
