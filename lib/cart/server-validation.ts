import type { z } from "zod";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { isNeutralDefaultOption, isOptionAvailableForCheckout, resolveCustomization, selectionIds } from "@/lib/customization/resolve";
import type { cartLineSchema } from "@/lib/cart/input";
import { getProductsByVariantIds } from "@/lib/shopify/storefront";
import type { Product } from "@/types/product";
import type { CustomizationSelections } from "@/types/customization";

const SAFE_ATTRIBUTE_KEYS = new Map([
  ["gift note", "Gift note"]
]);

type ParsedCartLine = z.infer<typeof cartLineSchema>;

export type ServerValidatedCartLine = {
  merchandiseId: string;
  quantity: number;
  attributes: Array<{ key: string; value: string }>;
  customizationCharge?: {
    amount: number;
    currencyCode: string;
    title: string;
    items: Array<{ group: string; label: string; amount: number }>;
  };
};

/**
 * The sole server trust boundary for cart lines. Both checkout routes call this
 * before Shopify input is constructed; browser prices, titles and DollWow
 * properties are intentionally ignored.
 */
export async function serverValidateAndRepriceLine(input: ParsedCartLine): Promise<ServerValidatedCartLine> {
  const products = await getProductsByVariantIds([input.merchandiseId]);
  return validateAndRepriceLine(input, products.get(input.merchandiseId));
}

export async function serverValidateAndRepriceLines(inputs: ParsedCartLine[]): Promise<ServerValidatedCartLine[]> {
  const variantIds = [...new Set(inputs.map((line) => line.merchandiseId))];
  const products = await getProductsByVariantIds(variantIds);
  return inputs.map((input) => validateAndRepriceLine(input, products.get(input.merchandiseId)));
}

function validateAndRepriceLine(input: ParsedCartLine, product?: Product): ServerValidatedCartLine {
  if (!product) throw new Error("This product option is not available for checkout.");

  const variant = product.variants.find((item) => item.id === input.merchandiseId);
  if (!variant?.availableForSale) throw new Error("This product option is not available for checkout.");

  const basePrice = Number(variant.price.amount);
  const currencyCode = variant.price.currencyCode.toUpperCase();
  if (!Number.isFinite(basePrice) || basePrice < 0 || !/^[A-Z]{3}$/.test(currencyCode)) {
    throw new Error("This product option does not have valid checkout pricing.");
  }

  const displayName = product.extended.displayName?.trim();
  const title = displayName || product.title;
  const safeAttributes = allowlistedSafeAttributes(input.attributes);
  const referenceAttribute = [{ key: "DollWow Reference Name", value: title }];

  if (!input.selections) {
    return {
      merchandiseId: input.merchandiseId,
      quantity: input.quantity,
      attributes: [...safeAttributes, ...referenceAttribute, { key: "Selected configuration", value: "As shown" }],
      customizationCharge: undefined
    };
  }

  const config = getCustomizationConfig(product);
  validateStructuredSelections(config, input.selections);
  const resolved = resolveCustomization(config, input.selections, basePrice);
  if (resolved.issues.length || resolved.requiresPriceConfirmation) {
    throw new Error(resolved.issues[0]?.message ?? "These customization selections cannot be checked out online.");
  }

  const paidOptions = resolved.selectedOptions.filter((option) => option.priceDelta > 0);
  const optionAmount = money(resolved.optionPriceDelta * input.quantity);
  return {
    merchandiseId: input.merchandiseId,
    quantity: input.quantity,
    attributes: [
      ...safeAttributes,
      ...referenceAttribute,
      ...resolved.cartAttributes
    ],
    customizationCharge: optionAmount > 0 ? {
      amount: optionAmount,
      currencyCode,
      title,
      items: paidOptions.map((option) => ({
        group: option.groupLabel,
        label: option.optionLabel,
        amount: money(option.priceDelta * input.quantity)
      }))
    } : undefined
  };
}

function validateStructuredSelections(
  config: ReturnType<typeof getCustomizationConfig>,
  selections: CustomizationSelections
) {
  if (!Object.keys(selections).length) {
    throw new Error("These customization selections are not available for checkout.");
  }

  for (const [groupId, value] of Object.entries(selections)) {
    const group = config.groups.find((item) => item.id === groupId);
    if (!group) throw new Error("These customization selections are not available for checkout.");

    const optionIds = selectionIds(value);
    const isMultiple = group.selectionMode === "multiple";
    const hasContradictoryNeutralSelection = isMultiple && optionIds.length > 1 && optionIds.some((optionId) => {
      const option = group.options.find((item) => item.id === optionId);
      return Boolean(option && isNeutralDefaultOption(option.id, option.label, option.productionNote));
    });
    if (
      !optionIds.length ||
      new Set(optionIds).size !== optionIds.length ||
      (isMultiple ? !Array.isArray(value) : Array.isArray(value) || optionIds.length !== 1) ||
      hasContradictoryNeutralSelection ||
      optionIds.some((optionId) => !isOptionAvailableForCheckout(config, groupId, optionId))
    ) {
      throw new Error("These customization selections are not available for checkout.");
    }
  }
}

function allowlistedSafeAttributes(attributes: Array<{ key: string; value: string }> = []) {
  return attributes.flatMap((attribute) => {
    const canonicalKey = SAFE_ATTRIBUTE_KEYS.get(attribute.key.toLowerCase());
    return canonicalKey ? [{ key: canonicalKey, value: attribute.value }] : [];
  });
}

function money(amount: number) {
  return Math.round(amount * 100) / 100;
}
