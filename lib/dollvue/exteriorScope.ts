import type {CustomizationGroup,CustomizationOption} from '@/types/customization';
import {classifyAppearance} from './appearance';

/** Scope inventory only. Never enables an option or asserts factory availability.
 * Keep visible potential separate from the narrower reviewed runtime allowlist.
 */
export function assessExteriorOption(group: Pick<CustomizationGroup,'label'>,
  option: Pick<CustomizationOption,'label'|'displayable'|'factoryExists'>) {
  const text=`${group.label} ${option.label}`.toLowerCase();
  const runtime=classifyAppearance(group,option);
  const sourcing=option.factoryExists===false||option.displayable===false?'held-or-unavailable':'requires-exact-source-review';
  if(runtime.status==='candidate') return {visibility:'external',feature:runtime.attribute,runtime:'candidate',sourcing} as const;
  if(/areola|nipple|labia|pubic|genital|penis|vagina|anal|anus/.test(text))return {visibility:'separate-intimate-scope',feature:'intimate-appearance',runtime:'not-enabled',sourcing} as const;
  if(/extra.*head|additional head|for.*(?:extra|second).*head/.test(text))return {visibility:'external',feature:'additional-head-product',runtime:'dedicated-product-and-identity-review',sourcing} as const;
  if(/choose.*head|head (?:model|selection|number|type)|face (?:model|swap)/.test(text))return {visibility:'external',feature:'head-sculpt',runtime:'dedicated-compatibility-and-identity-review',sourcing} as const;
  if(/heating|moaning|breathing|sucking|soft (?:breast|butt)|gel breast|weight reduction|skeleton|movable jaw|depth|texture.*(?:vagina|internal)/.test(text))return {visibility:'not-a-still-image-change',feature:'internal-function-or-feel',runtime:'not-enabled',sourcing} as const;
  if(/standing|bolts|feet|toes|finger joints/.test(text))return {visibility:'external-if-hardware-is-visible',feature:'external-hardware',runtime:'exact-hardware-reference-review',sourcing} as const;
  const features:[RegExp,string][]=[[/freckle|mole|beauty mark/,'beauty-marks'],[/pierc|navel ring|earring/,'piercing'],[/eyebrow/,'eyebrows'],[/eyelash/,'eyelashes'],[/chest hair|armpit hair/,'body-hair'],[/body paint|vein|vascular|skin texture/,'external-finish'],[/makeup|lipstick|lip colou?r|eyeliner/,'makeup'],[/hair|wig/,'hair-appearance'],[/lingerie|outfit|clothing/,'outfit'],[/jewel|necklace|accessor/,'external-accessory']];
  const feature=features.find(([pattern])=>pattern.test(text))?.[1];
  if(feature)return {visibility:'external',feature,runtime:'requires-style-reference-and-fidelity-review',sourcing} as const;
  return {visibility:runtime.status==='excluded'&&runtime.reason==='no-specific-change'?'baseline-no-change':'needs-classification',feature:'unspecified',runtime:'not-enabled',sourcing} as const;
}
