import { NextResponse } from "next/server";
import { z } from "zod";
import { productDisplayName, productPublicTitle } from "@/lib/catalog/naming";
import { protectedProductImageUrl } from "@/lib/catalog/productImage";
import { getCustomizationConfig } from "@/lib/customization/configs";
import {
  getDefaultSelections,
  isOptionAvailableForCheckout,
  nextMultipleSelection,
  resolveCustomization
} from "@/lib/customization/resolve";
import {
  isDollVueProduct,
  isDollVueCatalogProduct,
  resolveDollVueSelections,
  dollVueConfigForProduct
} from "@/lib/dollvue/config";
import { getProductByHandle } from "@/lib/shopify/storefront";
import { env } from "@/lib/utils/env";

export const runtime = "nodejs";

const schema = z.object({
  productHandle: z.string().min(1).max(180),
  selections: z.array(z.object({
    groupId: z.string().min(1).max(100),
    optionId: z.string().min(1).max(100)
  })).min(1).max(5)
});

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ error: "This request could not be verified." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isDollVueProduct(parsed.data.productHandle)) {
    return NextResponse.json({ error: "These preview choices cannot be added to the cart." }, { status: 400 });
  }

  const product = await getProductByHandle(parsed.data.productHandle, { cache: "force-cache", revalidate: 3600 });
  if (!product || !isDollVueCatalogProduct(product)) return NextResponse.json({ error: "This doll is not currently available in DollVue™." }, { status: 404 });
  const variant = product.variants.find((item) => item.availableForSale) ?? product.variants[0];
  if (!variant?.id || !variant.availableForSale) {
    return NextResponse.json({ error: "This doll is not currently available to add to the cart." }, { status: 409 });
  }

  const config = dollVueConfigForProduct(product, getCustomizationConfig(product));
  const visualSelections = resolveDollVueSelections(config, parsed.data.selections);
  if (visualSelections.length !== parsed.data.selections.length) {
    return NextResponse.json({ error: "One of these appearance choices is no longer available." }, { status: 409 });
  }

  const selections = getDefaultSelections(config);
  for (const { group, option } of visualSelections) {
    if (!isOptionAvailableForCheckout(config, group.id, option.id)) {
      return NextResponse.json({ error: `${group.label}: ${option.label} needs a confirmed price before it can be added to the cart.` }, { status: 409 });
    }
    const configGroup = config.groups.find((item) => item.id === group.id);
    selections[group.id] = configGroup?.selectionMode === "multiple"
      ? nextMultipleSelection("", selections[group.id], option.id)
      : option.id;
  }

  const basePrice = Number(variant.price.amount || product.priceRange.minVariantPrice.amount);
  const currencyCode = variant.price.currencyCode || product.priceRange.minVariantPrice.currencyCode;
  const resolved = resolveCustomization(config, selections, basePrice);
  if (resolved.issues.length) {
    return NextResponse.json({ error: resolved.issues[0]?.message || "That combination is not available for this doll." }, { status: 409 });
  }
  if (resolved.requiresPriceConfirmation) {
    return NextResponse.json({ error: "One of these choices needs a confirmed price before it can be added to the cart." }, { status: 409 });
  }

  const displayName = productDisplayName(product);
  const productTitle = productPublicTitle(product);
  const paidOptions = resolved.selectedOptions.filter((option) => option.priceDelta > 0);
  return NextResponse.json({
    item: {
      merchandiseId: variant.id,
      productHandle: product.handle,
      productTitle,
      productDisplayName: displayName || undefined,
      brand: product.extended.brand || product.vendor,
      imageUrl: protectedProductImageUrl(product.handle, 0, "card"),
      imageAlt: product.featuredImage?.altText || productTitle,
      unitPrice: resolved.totalPrice,
      currencyCode,
      readyToShip: product.extended.stockStatus === "ready_to_ship",
      attributes: [
        ...(displayName ? [{ key: "DollWow Reference Name", value: displayName }] : []),
        ...resolved.cartAttributes,
        { key: "DollVue", value: "Appearance choices added from DollVue™" }
      ],
      customizationCharge: resolved.optionPriceDelta > 0 ? {
        amount: resolved.optionPriceDelta,
        currencyCode,
        title: displayName || productTitle,
        items: paidOptions.map((option) => ({
          group: option.groupLabel,
          label: option.optionLabel,
          amount: option.priceDelta
        }))
      } : undefined
    }
  }, { headers: { "Cache-Control": "no-store" } });
}

function isTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const expected = new URL(env.NEXT_PUBLIC_SITE_URL).origin;
    const actual = new URL(origin).origin;
    if (actual === expected) return true;
    return process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(actual);
  } catch {
    return false;
  }
}
