import type { BrandCustomizationConfig } from '../types/customization';
import type { prepareSukiChargeMappings } from '../lib/customization/irontech-suki';

export type SukiChargeSpec = {
  group: string;
  label: string;
  unitAmount: number;
  choiceLabels: string[];
  choices: Array<{ groupId: string; optionId: string }>;
  productTitle: string;
  descriptionHtml: string;
  handle: string;
  currencyCode: string;
  tags: string[];
};

export const SUKI_CHARGE_TAGS: string[];

export function buildSukiChargeSpecs(packet: {
  productId: string;
  variantId: string;
  config: BrandCustomizationConfig;
  chargeMappings: ReturnType<typeof prepareSukiChargeMappings>;
}): SukiChargeSpec[];
