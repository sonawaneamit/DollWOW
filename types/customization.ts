export type CustomizationSwatch =
  | { kind: "color"; value: string; label?: string }
  | { kind: "text"; value: string; label?: string }
  | { kind: "image"; value: string; label?: string };

export type CustomizationOption = {
  id: string;
  label: string;
  description?: string;
  priceDelta?: number;
  productionNote?: string;
  swatch?: CustomizationSwatch;
};

export type CustomizationGroup = {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  selectionMode?: "single" | "multiple";
  display: "cards" | "swatches" | "compact";
  options: CustomizationOption[];
};

export type CustomizationRule = {
  id: string;
  type: "incompatible";
  when: { groupId: string; optionId: string };
  conflictsWith: { groupId: string; optionId: string };
  message: string;
};

export type BrandCustomizationConfig = {
  id: string;
  brandLabel: string;
  leadTimeNote: string;
  groups: CustomizationGroup[];
  rules: CustomizationRule[];
};

export type CustomizationSelectionValue = string | string[];

export type CustomizationSelections = Record<string, CustomizationSelectionValue>;

export type CustomizationIssue = {
  ruleId?: string;
  groupId?: string;
  optionId?: string;
  message: string;
};

export type SelectedCustomizationOption = {
  groupId: string;
  groupLabel: string;
  optionId: string;
  optionLabel: string;
  priceDelta: number;
  productionNote?: string;
};

export type ResolvedCustomization = {
  selections: CustomizationSelections;
  selectedOptions: SelectedCustomizationOption[];
  optionPriceDelta: number;
  totalPrice: number;
  issues: CustomizationIssue[];
  cartAttributes: Array<{ key: string; value: string }>;
};
