import type { CustomizationOption } from "@/types/customization";

export type VisualizerGroup = {
  id: string;
  label: string;
  options: Array<Pick<CustomizationOption, "id" | "label" | "swatch">>;
};

export function visualizerDraftKey(handle: string) {
  return `dollwow-visualizer-draft-v1:${handle}`;
}

export function visualizerSelectionKey(handle: string) {
  return `dollwow-visualizer-selections-v1:${handle}`;
}
