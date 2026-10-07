import type { CustomizationOption } from "@/types/customization";

export type DollVueGroup = {
  id: string;
  label: string;
  options: Array<Pick<CustomizationOption, "id" | "label" | "swatch">>;
};

export function dollVuePhotoPosition(photos: Array<{ position: number }>, saved?: number) {
  return photos.some(photo => photo.position === saved) ? saved! : (photos[0]?.position ?? 0);
}

export function dollVueDraftKey(handle: string) {
  return `dollwow-dollvue-draft-v1:${handle}`;
}

export function dollVueSelectionKey(handle: string) {
  return `dollwow-dollvue-selections-v1:${handle}`;
}
