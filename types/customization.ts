export type CustomizationSwatch =
  | { kind: "color"; value: string; label?: string }
  | { kind: "text"; value: string; label?: string }
  | { kind: "image"; value: string; label?: string };

export type CustomizationOption = {
  id: string;
  label: string;
  description?: string;
  priceDelta?: number;
  /** Supplier/manufacturer evidence says this option exists. Defaults to true for imported options. */
  factoryExists?: boolean;
  /** Safe to explain in customer-facing UI. This is independent of checkout eligibility. */
  displayable?: boolean;
  /** Has a usable visual reference for DollVue. */
  dollVueEnabled?: boolean;
  /** DollWOW has verified the current incremental price. */
  priceVerified?: boolean;
  /** Can be selected and paid for in the current online checkout. */
  purchasable?: boolean;
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
  resources?: Array<{ label: string; href: string; kind?: "document" | "video" | "web" }>;
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
  priceConfirmed: boolean;
  productionNote?: string;
};

export type ResolvedCustomization = {
  selections: CustomizationSelections;
  selectedOptions: SelectedCustomizationOption[];
  optionPriceDelta: number;
  totalPrice: number;
  requiresPriceConfirmation: boolean;
  issues: CustomizationIssue[];
  cartAttributes: Array<{ key: string; value: string }>;
};
