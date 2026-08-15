import type { CustomizationOption } from "@/types/customization";

export type DollVueGroup = {
  id: string;
  label: string;
  options: Array<Pick<CustomizationOption, "id" | "label" | "swatch">>;
};

export function dollVueDraftKey(handle: string) {
  return `dollwow-dollvue-draft-v1:${handle}`;
}

export function dollVueSelectionKey(handle: string) {
  return `dollwow-dollvue-selections-v1:${handle}`;
}
